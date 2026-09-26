import { Suspense } from "react";

import { decodeTableView } from "@/components/table/table-url-state";
import { USERS_TABLE_CONFIG } from "@/components/users/users-table-config";
import { toUsersListInput } from "@/modules/users/user";
import { createCaller } from "@/trpc/caller";
import { createContextInner } from "@/trpc/context";
import { UsersPageTable } from "./users-page-table";

type SearchParams = Record<string, string | string[] | undefined>;

function toURLSearchParams(searchParams: SearchParams): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    for (const item of [value ?? []].flat()) params.append(key, item);
  }
  return params;
}

// The first view is loaded here, in-process (ADR 0001), and rendered with
// the page; the Table fetches every later view from the client.
export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const view = decodeTableView(
    toURLSearchParams(await searchParams),
    USERS_TABLE_CONFIG,
  );
  const caller = createCaller(await createContextInner());
  const initialData = await caller.users.list(
    toUsersListInput(view.page, view.pageSize, view.sort, view.filters),
  );

  // The Table reads the URL on the client too, so it stays in a <Suspense>.
  return (
    <Suspense>
      <UsersPageTable initialData={initialData} />
    </Suspense>
  );
}
