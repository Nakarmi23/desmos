"use client";

import { Table, type TableBulkAction } from "@/components/table/table";
import {
  toFilterOptions,
  type TableColumn,
} from "@/components/table/table-column";
import type { TableFetcher } from "@/components/table/table-fetcher";
import type { UserListRow, UserStatus } from "@/modules/users/user";
import type { TableUrlConfig } from "@/components/table/table-url-state";
import { useTableUrlState } from "@/components/table/use-table-url-state";
import {
  DEFAULT_PAGE_SIZE,
  DEFAULT_PAGE_SIZE_OPTIONS,
} from "@/components/table/table-view";

// Record<..> makes the compiler flag a new status that has no label.
const STATUS_LABELS: Record<UserStatus, string> = {
  active: "Active",
  suspended: "Suspended",
};

// `users.list` doesn't do Advanced Search yet, so no column offers it.
const NO_FILTER = { filter: false } as const;

// Sorting and Basic Search (text columns) come from `type`.
export const USER_COLUMNS: TableColumn<UserListRow>[] = [
  {
    id: "name",
    header: "Name",
    type: "text",
    accessor: (user) => user.name,
    ...NO_FILTER,
  },
  {
    id: "username",
    header: "Username",
    type: "text",
    accessor: (user) => user.username,
    ...NO_FILTER,
  },
  {
    id: "email",
    header: "Email",
    type: "text",
    accessor: (user) => user.email,
    ...NO_FILTER,
  },
  {
    id: "status",
    header: "Status",
    type: "enum",
    options: toFilterOptions(STATUS_LABELS),
    accessor: (user) => user.status,
    ...NO_FILTER,
  },
  {
    id: "createdAt",
    header: "Created",
    type: "date",
    accessor: (user) => user.createdAt,
    ...NO_FILTER,
  },
];

// One source for both the Table and the URL, so they agree on columns, page
// sizes and (if one is added) the default sort.
const TABLE_CONFIG: TableUrlConfig<UserListRow> = {
  columns: USER_COLUMNS,
  defaultPageSize: DEFAULT_PAGE_SIZE,
  pageSizeOptions: DEFAULT_PAGE_SIZE_OPTIONS,
};

// Stub: there's no Suspend mutation yet. Wire to a tRPC mutation once one
// exists.
export const USER_BULK_ACTIONS: TableBulkAction[] = [
  { id: "suspend", label: "Suspend", onAction: () => {} },
];

export type UsersTableProps = {
  /** Adapter for the fetcher contract (ADR 0004): fixture- or tRPC-backed. */
  fetcher: TableFetcher<UserListRow>;
};

// The page is a Server Component and functions can't cross the server→client
// boundary, so callers bind the fetcher inside a client component.
// Reads the URL, so it must render inside a <Suspense> boundary.
export function UsersTable({ fetcher }: UsersTableProps) {
  const { key, initialView, onViewChange } = useTableUrlState(TABLE_CONFIG);
  return (
    <Table
      key={key}
      initialView={initialView}
      onViewChange={onViewChange}
      {...TABLE_CONFIG}
      fetcher={fetcher}
      getRowId={(u) => u.id}
      bulkActions={USER_BULK_ACTIONS}
    />
  );
}
