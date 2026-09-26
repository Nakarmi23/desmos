import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import {
  FIXTURE_ROLE_OPTIONS,
  fetchFixtureUsers,
} from "./users-fixture-adapter";
import { UsersTable } from "./users-table";

// Stand-in for the App Router: like Next, it re-renders `useSearchParams`
// readers on pushState/replaceState and on Back/Forward.
jest.mock("next/navigation", () => {
  const { useSyncExternalStore } = jest.requireActual("react");
  const CHANGE = "test:locationchange";
  for (const method of ["pushState", "replaceState"] as const) {
    const original = window.history[method].bind(window.history);
    window.history[method] = (...args: Parameters<History["pushState"]>) => {
      original(...args);
      window.dispatchEvent(new Event(CHANGE));
    };
  }
  const subscribe = (notify: () => void) => {
    window.addEventListener(CHANGE, notify);
    window.addEventListener("popstate", notify);
    return () => {
      window.removeEventListener(CHANGE, notify);
      window.removeEventListener("popstate", notify);
    };
  };
  return {
    useSearchParams: () =>
      new URLSearchParams(
        useSyncExternalStore(subscribe, () => window.location.search),
      ),
  };
});

beforeEach(() => window.history.replaceState(null, "", "/"));

// The fixture-backed adapter, injected through the same seam the page uses.
const FixtureUsersTable = () => (
  <UsersTable fetcher={fetchFixtureUsers} roleOptions={FIXTURE_ROLE_OPTIONS} />
);

const firstColumnTexts = () =>
  screen
    .getAllByRole("row")
    .slice(1)
    .map((row) => within(row).getAllByRole("gridcell")[1].textContent);

// Skeleton rows also render gridcells, just empty ones.
const loadedNames = () => {
  const names = firstColumnTexts();
  return names.length > 0 && names.every(Boolean);
};

describe("UsersTable", () => {
  it("searches the fixture by name, username or email", async () => {
    const user = userEvent.setup();
    render(<FixtureUsersTable />);
    await screen.findByText("Ava Thompson");

    await user.type(
      screen.getByRole("searchbox", { name: "Search" }),
      "ava.thompson@",
    );

    await waitFor(() => expect(firstColumnTexts()).toEqual(["Ava Thompson"]));

    await user.clear(screen.getByRole("searchbox", { name: "Search" }));
    await user.type(
      screen.getByRole("searchbox", { name: "Search" }),
      "LIAM.CHEN",
    );
    await waitFor(() => expect(firstColumnTexts()).toEqual(["Liam Chen"]));
  });

  it("sorts the fixture by a column, both directions", async () => {
    const user = userEvent.setup();
    render(<FixtureUsersTable />);
    await screen.findByText("Ava Thompson");
    const nameHeader = screen.getByRole("columnheader", { name: "Name" });

    await user.click(nameHeader);
    await waitFor(() =>
      expect(nameHeader).toHaveAttribute("aria-sort", "ascending"),
    );
    await waitFor(() => expect(loadedNames()).toBe(true));
    const ascending = firstColumnTexts();
    expect(ascending).toEqual(
      [...ascending].sort((a, b) => a!.localeCompare(b!)),
    );

    await user.click(nameHeader);
    await waitFor(() =>
      expect(nameHeader).toHaveAttribute("aria-sort", "descending"),
    );
    await waitFor(() => expect(loadedNames()).toBe(true));
    await waitFor(() => expect(firstColumnTexts()).not.toEqual(ascending));
    const descending = firstColumnTexts();
    expect(descending).toEqual(
      [...descending].sort((a, b) => b!.localeCompare(a!)),
    );
  });

  const COLUMN = { name: 1, roles: 4, status: 5, created: 6 } as const;
  const cellsOf = (column: number) =>
    screen
      .getAllByRole("row")
      .slice(1)
      .map((row) => within(row).getAllByRole("gridcell")[column]);
  const rolesOf = (cell: HTMLElement) =>
    within(cell)
      .queryAllByRole("listitem")
      .map((chip) => chip.textContent);
  const rowRoles = () => cellsOf(COLUMN.roles).map(rolesOf);

  async function addFilter(
    user: ReturnType<typeof userEvent.setup>,
    header: string,
  ) {
    await user.click(screen.getByRole("button", { name: "Add filter" }));
    await user.click(
      within(
        screen.getByRole("dialog", { name: "Add filter options" }),
      ).getByRole("button", { name: new RegExp(`^${header}`) }),
    );
    return screen.getByRole("dialog", { name: `${header} value` });
  }

  it("shows name, username, email, Roles as chips, Status and created", async () => {
    render(<FixtureUsersTable />);
    await screen.findByText("Ava Thompson");

    expect(
      screen.getAllByRole("columnheader").map((header) => header.textContent),
    ).toEqual(["", "Name", "Username", "Email", "Roles", "Status", "Created"]);
    const cellTexts = (name: string) =>
      within(screen.getByRole("gridcell", { name }).closest("tr")!)
        .getAllByRole("gridcell")
        .slice(1);
    expect(cellTexts("Ava Thompson").map((cell) => cell.textContent)).toEqual([
      "Ava Thompson",
      "ava.thompson",
      "ava.thompson@example.com",
      "Administrator",
      "Active",
      "2023-02-14",
    ]);
    expect(rolesOf(cellTexts("Noah Patel")[3])).toEqual(["Member", "Viewer"]);
    // A User with no Roles shows an empty cell.
    expect(rolesOf(cellTexts("Oliver Smith")[3])).toEqual([]);
    expect(
      screen.getByRole("columnheader", { name: "Roles" }),
    ).not.toHaveAttribute("aria-sort");
  });

  it("filters Roles by 'is any of' / 'is none of', Users without Roles only matching none-of", async () => {
    const user = userEvent.setup();
    render(<FixtureUsersTable />);
    await screen.findByText("Ava Thompson");

    const editor = await addFilter(user, "Roles");
    expect(
      within(editor)
        .getAllByRole("checkbox")
        .map((box) => box.closest("label")?.textContent ?? ""),
    ).toEqual(["Administrator", "Member", "Viewer"]);
    await user.click(
      within(editor).getByRole("checkbox", { name: "Administrator" }),
    );
    await waitFor(() => {
      expect(loadedNames()).toBe(true);
      expect(rowRoles().every((roles) => roles.includes("Administrator"))).toBe(
        true,
      );
    });
    expect(firstColumnTexts()).toContain("Ava Thompson");
    await user.keyboard("{Escape}");

    await user.click(
      within(screen.getByRole("group", { name: "Roles filter" })).getByRole(
        "button",
        { name: /^Roles operator/ },
      ),
    );
    await user.click(
      await screen.findByRole("menuitemradio", { name: "Is none of" }),
    );
    await waitFor(() => {
      expect(loadedNames()).toBe(true);
      expect(firstColumnTexts()).not.toContain("Ava Thompson");
      expect(
        rowRoles().every((roles) => !roles.includes("Administrator")),
      ).toBe(true);
    });
    expect(firstColumnTexts()).toContain("Oliver Smith");
  });

  it("offers only active / suspended in the Status filter, AND-ed with other filters and Basic Search", async () => {
    const user = userEvent.setup();
    render(<FixtureUsersTable />);
    await screen.findByText("Ava Thompson");

    const status = await addFilter(user, "Status");
    expect(
      within(status)
        .getAllByRole("checkbox")
        .map((box) => box.closest("label")?.textContent ?? ""),
    ).toEqual(["Active", "Suspended"]);
    await user.click(
      within(status).getByRole("checkbox", { name: "Suspended" }),
    );
    await user.keyboard("{Escape}");

    const created = await addFilter(user, "Created");
    await user.type(
      within(created).getByLabelText("Created from"),
      "2024-01-01",
    );
    await user.keyboard("{Escape}");
    await waitFor(() => {
      expect(loadedNames()).toBe(true);
      expect(
        cellsOf(COLUMN.status).every(
          (cell) => cell.textContent === "Suspended",
        ),
      ).toBe(true);
      expect(
        cellsOf(COLUMN.created).every(
          (cell) => cell.textContent! >= "2024-01-01",
        ),
      ).toBe(true);
    });

    // Noah Patel is suspended but created in 2023: excluded.
    await user.type(screen.getByRole("searchbox", { name: "Search" }), "noah");
    expect(await screen.findByText("No results found")).toBeInTheDocument();
  });

  it("selects users and offers Suspend", async () => {
    const user = userEvent.setup();
    render(<FixtureUsersTable />);
    await screen.findByText("Ava Thompson");

    await user.click(
      screen.getAllByRole("checkbox", { name: /^Select row / })[0],
    );

    expect(
      screen.getByRole("toolbar", { name: "Bulk actions" }),
    ).toHaveTextContent("1 selected");
    expect(screen.getByRole("button", { name: "Suspend" })).toBeEnabled();
  });

  describe("URL state", () => {
    const rowRolesInUrlTest = () =>
      screen
        .getAllByRole("row")
        .slice(1)
        .map((row) =>
          within(within(row).getAllByRole("gridcell")[4])
            .queryAllByRole("listitem")
            .map((chip) => chip.textContent),
        );
    const nameHeader = () => screen.getByRole("columnheader", { name: "Name" });

    it("opens on the view in the URL", async () => {
      window.history.replaceState(
        null,
        "",
        `/?sort=-name&q=ava&f.roles.in=${FIXTURE_ROLE_OPTIONS[0].value}`,
      );
      render(<FixtureUsersTable />);

      await waitFor(() => expect(loadedNames()).toBe(true));
      expect(nameHeader()).toHaveAttribute("aria-sort", "descending");
      expect(screen.getByRole("searchbox", { name: "Search" })).toHaveValue(
        "ava",
      );
      expect(
        screen.getByRole("group", { name: "Roles filter" }),
      ).toBeInTheDocument();
      expect(firstColumnTexts()).toContain("Ava Thompson");
      expect(
        rowRolesInUrlTest().every((roles) => roles.includes("Administrator")),
      ).toBe(true);
    });

    it("writes each new view to the URL, keeping params it doesn't own", async () => {
      const user = userEvent.setup();
      window.history.replaceState(null, "", "/?tab=all");
      render(<FixtureUsersTable />);
      await screen.findByText("Ava Thompson");

      await user.click(screen.getByRole("button", { name: "Page 2" }));
      await waitFor(() =>
        expect(window.location.search).toBe("?tab=all&page=2"),
      );

      await user.click(nameHeader());
      await waitFor(() =>
        expect(window.location.search).toBe("?tab=all&sort=name"),
      );

      await user.type(screen.getByRole("searchbox", { name: "Search" }), "ava");
      await waitFor(() =>
        expect(window.location.search).toBe("?tab=all&sort=name&q=ava"),
      );
    });

    it("tidies a URL it can't use into the view it opened on", async () => {
      window.history.replaceState(null, "", "/?page=abc&sort=nope&size=7");
      render(<FixtureUsersTable />);
      await screen.findByText("Ava Thompson");

      await waitFor(() => expect(window.location.search).toBe(""));
    });

    it("follows the URL when it changes from elsewhere, e.g. a nav link or Back", async () => {
      const user = userEvent.setup();
      render(<FixtureUsersTable />);
      await screen.findByText("Ava Thompson");
      await user.click(nameHeader());
      await waitFor(() => expect(window.location.search).toBe("?sort=name"));

      act(() => window.history.pushState(null, "", "/?sort=-email"));

      await waitFor(() =>
        expect(
          screen.getByRole("columnheader", { name: "Email" }),
        ).toHaveAttribute("aria-sort", "descending"),
      );
      expect(nameHeader()).toHaveAttribute("aria-sort", "none");
      expect(window.location.search).toBe("?sort=-email");
    });

    it("ignores changes to query params it doesn't own", async () => {
      const user = userEvent.setup();
      render(<FixtureUsersTable />);
      await screen.findByText("Ava Thompson");
      await user.click(
        screen.getAllByRole("checkbox", { name: /^Select row / })[0],
      );

      act(() => window.history.pushState(null, "", "/?tab=billing"));

      // Not remounted: the Selection survives.
      expect(
        screen.getByRole("toolbar", { name: "Bulk actions" }),
      ).toHaveTextContent("1 selected");
    });

    it("keeps the URL's #hash when writing the view", async () => {
      const user = userEvent.setup();
      window.history.replaceState(null, "", "/?page=2#top");
      render(<FixtureUsersTable />);
      await screen.findByRole("button", { name: "Page 1" });

      await user.click(screen.getByRole("button", { name: "Page 1" }));
      await waitFor(() => expect(window.location.search).toBe(""));
      expect(window.location.hash).toBe("#top");
    });
  });
});
