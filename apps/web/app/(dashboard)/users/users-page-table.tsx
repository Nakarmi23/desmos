"use client";

import { useCallback } from "react";

import type { TableFilterOption } from "@/components/table/table-column";
import type {
  TableFetcher,
  TableFetcherResult,
} from "@/components/table/table-fetcher";
import { UsersTable } from "@/components/users/users-table";
import { toUsersListInput, type UserListRow } from "@/modules/users/user";
import { useTRPCClient } from "@/trpc/client";

// Binds a tRPC-backed adapter for the fetcher contract (ADR 0004) on the
// client side of the server→client boundary. The first view arrives
// server-rendered as `initialData`; later views are fetched over HTTP.
export function UsersPageTable({
  initialData,
  roleOptions,
}: {
  initialData: TableFetcherResult<UserListRow>;
  roleOptions: readonly TableFilterOption[];
}) {
  const trpc = useTRPCClient();
  // async: a view `users.list` can't take rejects, showing the Table's error.
  const fetchUsers = useCallback<TableFetcher<UserListRow>>(
    async (...args) => trpc.users.list.query(toUsersListInput(...args)),
    [trpc],
  );
  return (
    <UsersTable
      fetcher={fetchUsers}
      initialData={initialData}
      roleOptions={roleOptions}
    />
  );
}
