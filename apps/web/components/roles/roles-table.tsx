"use client";

import { Table } from "@/components/table/table";
import type {
  TableFetcher,
  TableFetcherResult,
} from "@/components/table/table-fetcher";
import { useTableUrlState } from "@/components/table/use-table-url-state";
import type { RoleListRow } from "@/modules/roles/role";

import { rolesTableConfig } from "./roles-table-config";

export type RolesTableProps = {
  /** Adapter for the fetcher contract (ADR 0004). */
  fetcher: TableFetcher<RoleListRow>;
  /** `fetcher`'s result for the view in the URL on arrival, e.g. from the server. */
  initialData?: TableFetcherResult<RoleListRow>;
};

// The page is a Server Component and functions can't cross the server→client
// boundary, so callers bind the fetcher inside a client component.
// Reads the URL, so it must render inside a <Suspense> boundary.
export function RolesTable({ fetcher, initialData }: RolesTableProps) {
  const { key, initialView, onViewChange } = useTableUrlState(rolesTableConfig);
  return (
    <Table
      key={key}
      initialView={initialView}
      onViewChange={onViewChange}
      {...rolesTableConfig}
      fetcher={fetcher}
      // Only the first mount opens on the view `initialData` was loaded for;
      // a remount (Back/Forward) is on another view.
      initialData={key === 0 ? initialData : undefined}
      getRowId={(role) => role.id}
    />
  );
}
