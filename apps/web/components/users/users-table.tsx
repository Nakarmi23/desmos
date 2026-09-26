"use client";

import { useMemo } from "react";

import { Table, type TableBulkAction } from "@/components/table/table";
import type { TableFilterOption } from "@/components/table/table-column";
import type {
  TableFetcher,
  TableFetcherResult,
} from "@/components/table/table-fetcher";
import { useTableUrlState } from "@/components/table/use-table-url-state";
import type { UserListRow } from "@/modules/users/user";
import { usersTableConfig } from "./users-table-config";

// Stub: there's no Suspend mutation yet. Wire to a tRPC mutation once one
// exists.
export const USER_BULK_ACTIONS: TableBulkAction[] = [
  { id: "suspend", label: "Suspend", onAction: () => {} },
];

export type UsersTableProps = {
  /** Adapter for the fetcher contract (ADR 0004): fixture- or tRPC-backed. */
  fetcher: TableFetcher<UserListRow>;
  /** `fetcher`'s result for the view in the URL on arrival, e.g. from the server. */
  initialData?: TableFetcherResult<UserListRow>;
  /** Choices for the Roles column's filter (see `toRoleOptions`). */
  roleOptions: readonly TableFilterOption[];
};

// The page is a Server Component and functions can't cross the server→client
// boundary, so callers bind the fetcher inside a client component.
// Reads the URL, so it must render inside a <Suspense> boundary.
export function UsersTable({
  fetcher,
  initialData,
  roleOptions,
}: UsersTableProps) {
  const config = useMemo(() => usersTableConfig(roleOptions), [roleOptions]);
  const { key, initialView, onViewChange } = useTableUrlState(config);
  return (
    <Table
      key={key}
      initialView={initialView}
      onViewChange={onViewChange}
      {...config}
      fetcher={fetcher}
      // Only the first mount opens on the view `initialData` was loaded for;
      // a remount (Back/Forward) is on another view.
      initialData={key === 0 ? initialData : undefined}
      getRowId={(u) => u.id}
      bulkActions={USER_BULK_ACTIONS}
    />
  );
}
