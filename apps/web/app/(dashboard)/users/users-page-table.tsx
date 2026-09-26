"use client";

import { useCallback } from "react";

import type { TableFetcher } from "@/components/table/table-fetcher";
import type { User } from "@/components/users/users-fixture";
import { UsersTable } from "@/components/users/users-table";
import type { UserSortColumn } from "@/modules/users/user";
import { useTRPCClient } from "@/trpc/client";

// Binds a tRPC-backed adapter for the fetcher contract (ADR 0004) on the
// client side of the server→client boundary.
export function UsersPageTable() {
  const trpc = useTRPCClient();
  const fetchUsers = useCallback<TableFetcher<User>>(
    (page, pageSize, sort, filters) =>
      trpc.users.list.query({
        page,
        pageSize,
        // The Table only sorts by its own sortable columns.
        sort: sort && { ...sort, columnId: sort.columnId as UserSortColumn },
        filters: { search: filters.search },
      }),
    [trpc],
  );
  return <UsersTable fetcher={fetchUsers} />;
}
