"use client";

import { useMemo } from "react";

import { Table, type TableBulkAction } from "@/components/table/table";
import type {
  TableColumn,
  TableFilterOption,
} from "@/components/table/table-column";
import type { TableFetcher } from "@/components/table/table-fetcher";
import type { User, UserStatus } from "./users-fixture";
import type { TableUrlConfig } from "@/components/table/table-url-state";
import { useTableUrlState } from "@/components/table/use-table-url-state";
import {
  DEFAULT_PAGE_SIZE,
  DEFAULT_PAGE_SIZE_OPTIONS,
} from "@/components/table/table-view";

// Record<..> makes the compiler flag a new status that has no label.
const STATUS_LABELS: Record<UserStatus, string> = {
  active: "Active",
  invited: "Invited",
  suspended: "Suspended",
};

const STATUS_OPTIONS: TableFilterOption[] = Object.entries(STATUS_LABELS).map(
  ([value, label]) => ({ value, label }),
);

// Sorting, Basic Search (text columns) and Advanced Search all come from `type`.
// Roles are data, not a fixed set, so their options come from the caller.
export const userColumns = (
  roleOptions: readonly TableFilterOption[],
): TableColumn<User>[] => [
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
    options: roleOptions,
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

// Stub: no Users DAL yet, so Suspend has nothing to mutate. Wire to a tRPC
// mutation once one exists.
export const USER_BULK_ACTIONS: TableBulkAction[] = [
  { id: "suspend", label: "Suspend", onAction: () => {} },
];

export type UsersTableProps = {
  /** Adapter for the fetcher contract (ADR 0004): fixture- or tRPC-backed. */
  fetcher: TableFetcher<User>;
  /** Choices for the Role column's Advanced Search filter. */
  roleOptions: readonly TableFilterOption[];
};

// The page is a Server Component and functions can't cross the server→client
// boundary, so callers bind the fetcher inside a client component.
// Reads the URL, so it must render inside a <Suspense> boundary.
export function UsersTable({ fetcher, roleOptions }: UsersTableProps) {
  // One source for both the Table and the URL, so they agree on columns, page
  // sizes and (if one is added) the default sort.
  const config = useMemo<TableUrlConfig<User>>(
    () => ({
      columns: userColumns(roleOptions),
      defaultPageSize: DEFAULT_PAGE_SIZE,
      pageSizeOptions: DEFAULT_PAGE_SIZE_OPTIONS,
    }),
    [roleOptions],
  );
  const { key, initialView, onViewChange } = useTableUrlState(config);
  return (
    <Table
      key={key}
      initialView={initialView}
      onViewChange={onViewChange}
      {...config}
      fetcher={fetcher}
      getRowId={(u) => u.id}
      bulkActions={USER_BULK_ACTIONS}
    />
  );
}
