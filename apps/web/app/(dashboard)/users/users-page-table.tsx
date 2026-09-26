"use client";

import { useCallback } from "react";

import type { TableFetcher } from "@/components/table/table-fetcher";
import { UsersTable } from "@/components/users/users-table";
import { toUserSort, type UserListRow } from "@/modules/users/user";
import { useTRPCClient } from "@/trpc/client";

// Binds a tRPC-backed adapter for the fetcher contract (ADR 0004) on the
// client side of the server→client boundary.
export function UsersPageTable() {
  const trpc = useTRPCClient();
  const fetchUsers = useCallback<TableFetcher<UserListRow>>(
    (page, pageSize, sort, filters) =>
      trpc.users.list.query({
        page,
        pageSize,
        sort: toUserSort(sort),
        filters: { search: filters.search },
      }),
    [trpc],
  );
  return <UsersTable fetcher={fetchUsers} />;
}
