"use client";

import { useCallback } from "react";

import { RolesTable } from "@/components/roles/roles-table";
import type {
  TableFetcher,
  TableFetcherResult,
} from "@/components/table/table-fetcher";
import { toRolesTableInput, type RoleListRow } from "@/modules/roles/role";
import { useTRPCClient } from "@/trpc/client";

// Binds a tRPC-backed adapter for the fetcher contract (ADR 0004) on the
// client side of the server→client boundary. The first view arrives
// server-rendered as `initialData`; later views are fetched over HTTP.
export function RolesPageTable({
  initialData,
}: {
  initialData: TableFetcherResult<RoleListRow>;
}) {
  const trpc = useTRPCClient();
  const fetchRoles = useCallback<TableFetcher<RoleListRow>>(
    async (...args) => trpc.roles.table.query(toRolesTableInput(...args)),
    [trpc],
  );
  return <RolesTable fetcher={fetchRoles} initialData={initialData} />;
}
