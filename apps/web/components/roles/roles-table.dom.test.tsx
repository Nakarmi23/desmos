import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { TableFetcher } from "@/components/table/table-fetcher";
import type { RoleListRow } from "@/modules/roles/role";

import { RolesTable } from "./roles-table";

// Stand-in for the App Router's `useSearchParams`, read from the jsdom URL.
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

beforeEach(() => window.history.replaceState(null, "", "/roles"));

const ROLES: RoleListRow[] = [
  {
    id: "administrator",
    name: "Administrator",
    description: "Can administer everything in the app.",
    isSystem: true,
    permissionCount: 8,
    holderCount: 1,
    createdAt: new Date("2026-09-26T00:00:00Z"),
  },
  {
    id: "auditor",
    name: "Auditor",
    description: null,
    isSystem: false,
    permissionCount: 2,
    holderCount: 3,
    createdAt: new Date("2026-09-30T00:00:00Z"),
  },
];

const fetchRoles = jest.fn<
  ReturnType<TableFetcher<RoleListRow>>,
  Parameters<TableFetcher<RoleListRow>>
>(async () => ({ rows: ROLES, total: ROLES.length }));

const cellTexts = (name: string) =>
  within(screen.getByRole("gridcell", { name }).closest("tr")!)
    .getAllByRole("gridcell")
    // After the checkbox and S.N.
    .slice(2)
    .map((cell) => cell.textContent);

describe("RolesTable", () => {
  it("shows each Role's name, type, description, Permission and holder counts and created date", async () => {
    render(<RolesTable fetcher={fetchRoles} />);
    await screen.findByText("Auditor");

    expect(
      screen.getAllByRole("columnheader").map((header) => header.textContent),
    ).toEqual([
      "",
      "S.N.",
      "Name",
      "Type",
      "Description",
      "Permissions",
      "Holders",
      "Created",
    ]);
    expect(cellTexts("Administrator")).toEqual([
      "Administrator",
      "System",
      "Can administer everything in the app.",
      "All",
      "1",
      "2026-09-26",
    ]);
    expect(cellTexts("Auditor")).toEqual([
      "Auditor",
      "—",
      "—",
      "2",
      "3",
      "2026-09-30",
    ]);
  });

  it("sorts by name, holders and created only", async () => {
    render(<RolesTable fetcher={fetchRoles} />);
    await screen.findByText("Auditor");

    const sortable = screen
      .getAllByRole("columnheader")
      .filter((header) => header.hasAttribute("aria-sort"))
      .map((header) => header.textContent);
    expect(sortable).toEqual(["Name", "Holders", "Created"]);
  });

  it("offers Basic Search over name and description, and no Advanced Search", async () => {
    const user = userEvent.setup();
    render(<RolesTable fetcher={fetchRoles} />);
    await screen.findByText("Auditor");

    expect(
      screen.queryByRole("button", { name: "Add filter" }),
    ).not.toBeInTheDocument();
    await user.type(screen.getByRole("searchbox", { name: "Search" }), "aud");

    await waitFor(() =>
      expect(fetchRoles).toHaveBeenLastCalledWith(1, expect.any(Number), null, {
        search: "aud",
      }),
    );
  });
});
