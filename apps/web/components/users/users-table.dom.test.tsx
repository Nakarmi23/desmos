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
  it("searches the fixture by name or email", async () => {
    const user = userEvent.setup();
    render(<FixtureUsersTable />);
    await screen.findByText("Ava Thompson");

    await user.type(
      screen.getByRole("searchbox", { name: "Search" }),
      "ava.thompson@",
    );

    await waitFor(() => expect(firstColumnTexts()).toEqual(["Ava Thompson"]));
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

  const cellsOf = (index: number) =>
    screen
      .getAllByRole("row")
      .slice(1)
      .map(
        (row) => within(row).getAllByRole("gridcell")[index + 1].textContent,
      );

  async function addFilter(
    user: ReturnType<typeof userEvent.setup>,
    header: RegExp,
    name: string,
  ) {
    await user.click(screen.getByRole("button", { name: "Add filter" }));
    await user.click(
      within(
        screen.getByRole("dialog", { name: "Add filter options" }),
      ).getByRole("button", { name: header }),
    );
    return screen.getByRole("dialog", { name: `${name} value` });
  }

  it("narrows by Advanced Search filters, AND-ed with each other and Basic Search", async () => {
    const user = userEvent.setup();
    render(<FixtureUsersTable />);
    await screen.findByText("Ava Thompson");

    const roleEditor = await addFilter(user, /^Role/, "Role");
    await user.click(
      within(roleEditor).getByRole("checkbox", { name: "Admin" }),
    );
    await user.click(
      within(roleEditor).getByRole("checkbox", { name: "Viewer" }),
    );
    await waitFor(() => {
      const roles = cellsOf(2);
      expect(loadedNames()).toBe(true);
      expect(roles.length).toBeGreaterThan(0);
      expect(roles.every((r) => r === "Admin" || r === "Viewer")).toBe(true);
    });
    await user.keyboard("{Escape}");

    const createdEditor = await addFilter(user, /^Created/, "Created");
    await user.type(
      within(createdEditor).getByLabelText("Created from"),
      "2024-01-01",
    );
    await waitFor(() => {
      const created = cellsOf(4);
      expect(loadedNames()).toBe(true);
      expect(created.length).toBeGreaterThan(0);
      expect(created.every((d) => d! >= "2024-01-01")).toBe(true);
      // The role filter still applies alongside the date range.
      expect(cellsOf(2).every((r) => r === "Admin" || r === "Viewer")).toBe(
        true,
      );
    });
    await user.keyboard("{Escape}");

    // Basic Search narrows further, on top of both filters.
    await user.type(
      screen.getByRole("searchbox", { name: "Search" }),
      "daniel.andersen@",
    );
    await waitFor(() => expect(cellsOf(0)).toEqual(["Daniel Andersen"]));
    expect(cellsOf(2)).toEqual(["Admin"]);

    // A Basic Search hit outside the filters (Ava, created in 2023) is excluded.
    await user.clear(screen.getByRole("searchbox", { name: "Search" }));
    await user.type(
      screen.getByRole("searchbox", { name: "Search" }),
      "ava.thompson@",
    );
    expect(await screen.findByText("No results found")).toBeInTheDocument();
  });

  it("filters by operator: 'is none of' for roles, 'before' for created date", async () => {
    const user = userEvent.setup();
    render(<FixtureUsersTable />);
    await screen.findByText("Ava Thompson");

    const roleEditor = await addFilter(user, /^Role/, "Role");
    await user.click(
      within(roleEditor).getByRole("checkbox", { name: "Admin" }),
    );
    await user.keyboard("{Escape}");
    await user.click(
      within(screen.getByRole("group", { name: "Role filter" })).getByRole(
        "button",
        { name: /^Role operator/ },
      ),
    );
    await user.click(
      await screen.findByRole("menuitemradio", { name: "Is none of" }),
    );
    await waitFor(() => {
      const roles = cellsOf(2);
      expect(loadedNames()).toBe(true);
      expect(roles.length).toBeGreaterThan(0);
      expect(roles).not.toContain("Admin");
    });

    await addFilter(user, /^Created/, "Created");
    await user.keyboard("{Escape}");
    await user.click(
      within(screen.getByRole("group", { name: "Created filter" })).getByRole(
        "button",
        { name: /^Created operator/ },
      ),
    );
    await user.click(
      await screen.findByRole("menuitemradio", { name: "Before" }),
    );
    await user.click(
      within(screen.getByRole("group", { name: "Created filter" })).getByRole(
        "button",
        { name: /^Created value/ },
      ),
    );
    await user.type(
      within(
        screen.getByRole("dialog", { name: "Created value" }),
      ).getByLabelText("Created"),
      "2023-12-31",
    );
    await waitFor(() => {
      const created = cellsOf(4);
      expect(loadedNames()).toBe(true);
      expect(created.length).toBeGreaterThan(0);
      expect(created.every((d) => d! < "2023-12-31")).toBe(true);
      expect(cellsOf(2)).not.toContain("Admin");
    });
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
    const nameHeader = () => screen.getByRole("columnheader", { name: "Name" });

    it("opens on the view in the URL", async () => {
      window.history.replaceState(
        null,
        "",
        "/?sort=-name&q=ava&f.role.in=admin",
      );
      render(<FixtureUsersTable />);

      await waitFor(() => expect(loadedNames()).toBe(true));
      expect(nameHeader()).toHaveAttribute("aria-sort", "descending");
      expect(screen.getByRole("searchbox", { name: "Search" })).toHaveValue(
        "ava",
      );
      expect(
        screen.getByRole("group", { name: "Role filter" }),
      ).toBeInTheDocument();
      expect(cellsOf(2).every((r) => r === "Admin")).toBe(true);
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
