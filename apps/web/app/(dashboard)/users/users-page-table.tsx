"use client";

import { useCallback } from "react";

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
}: {
  initialData: TableFetcherResult<UserListRow>;
}) {
  const trpc = useTRPCClient();
  const fetchUsers = useCallback<TableFetcher<UserListRow>>(
    (...args) => trpc.users.list.query(toUsersListInput(...args)),
    [trpc],
  );
  return <UsersTable fetcher={fetchUsers} initialData={initialData} />;
}
