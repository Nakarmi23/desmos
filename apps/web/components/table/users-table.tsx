"use client";

import { Table, type TableBulkAction } from "./table";
import type { TableColumn, TableFilterOption } from "./table-column";
import type { TableFetcher } from "./table-fetcher";
import {
  USERS,
  type User,
  type UserRole,
  type UserStatus,
} from "./users-fixture";
import { useTableUrlState } from "./use-table-url-state";
import { DEFAULT_PAGE_SIZE, DEFAULT_PAGE_SIZE_OPTIONS } from "./table-view";
import { windowFixture } from "./window-fixture";

// Record<..> makes the compiler flag a new role/status that has no label.
const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin",
  member: "Member",
  viewer: "Viewer",
};

const STATUS_LABELS: Record<UserStatus, string> = {
  active: "Active",
  invited: "Invited",
  suspended: "Suspended",
};

const toOptions = (labels: Record<string, string>): TableFilterOption[] =>
  Object.entries(labels).map(([value, label]) => ({ value, label }));

const ROLE_OPTIONS = toOptions(ROLE_LABELS);
const STATUS_OPTIONS = toOptions(STATUS_LABELS);

// Sorting, Basic Search (text columns) and Advanced Search all come from `type`.
export const USER_COLUMNS: TableColumn<User>[] = [
  { id: "name", header: "Name", type: "text", accessor: (user) => user.name },
  {
    id: "email",
    header: "Email",
    type: "text",
    accessor: (user) => user.email,
  },
  {
    id: "role",
    header: "Role",
    type: "enum",
    options: ROLE_OPTIONS,
    accessor: (user) => user.role,
  },
  {
    id: "status",
    header: "Status",
    type: "enum",
    options: STATUS_OPTIONS,
    accessor: (user) => user.status,
  },
  {
    id: "createdAt",
    header: "Created",
    type: "date",
    accessor: (user) => user.createdAt,
  },
];

// Fixture-backed adapter for the fetcher contract (ADR 0004); swap for a
// tRPC-backed one once a real Users DAL exists.
const fetchUsers: TableFetcher<User> = async (page, pageSize, sort, filters) =>
  windowFixture(USERS, USER_COLUMNS, page, pageSize, sort, filters);

// Stub: no Users DAL yet, so Suspend has nothing to mutate. Wire to a tRPC
// mutation once one exists.
export const USER_BULK_ACTIONS: TableBulkAction[] = [
  { id: "suspend", label: "Suspend", onAction: () => {} },
];

// One source for both the Table and the URL, so they agree on page sizes.
const PAGE_SIZES = {
  defaultPageSize: DEFAULT_PAGE_SIZE,
  pageSizeOptions: DEFAULT_PAGE_SIZE_OPTIONS,
};
const URL_CONFIG = { columns: USER_COLUMNS, ...PAGE_SIZES };

// The page is a Server Component and functions can't cross the server→client
// boundary, so the columns + fetcher are bound here, inside the client.
// Reads the URL, so it must render inside a <Suspense> boundary.
export function UsersTable() {
  const { key, initialView, onViewChange } = useTableUrlState(URL_CONFIG);
  return (
    <Table
      key={key}
      initialView={initialView}
      onViewChange={onViewChange}
      columns={USER_COLUMNS}
      {...PAGE_SIZES}
      fetcher={fetchUsers}
      getRowId={(u) => u.id}
      bulkActions={USER_BULK_ACTIONS}
    />
  );
}
