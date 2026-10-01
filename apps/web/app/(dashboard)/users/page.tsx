import { Suspense } from "react";

import { NoAccess } from "@/components/no-access/no-access";
import {
  decodeTableView,
  toURLSearchParams,
  type PageSearchParams,
} from "@/components/table/table-url-state";
import {
  toRoleOptions,
  usersTableConfig,
} from "@/components/users/users-table-config";
import { currentUserHolds } from "@/modules/permissions/current-permissions";
import { toUsersListInput } from "@/modules/users/user";
import { createServerCaller } from "@/trpc/server";
import { UsersPageTable } from "./users-page-table";

// The first view is loaded here, in-process (ADR 0001), and rendered with
// the page; the Table fetches every later view from the client.
export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<PageSearchParams>;
}) {
  if (!(await currentUserHolds("users.view"))) return <NoAccess />;

  const caller = await createServerCaller();
  // The Roles filter's options come from the Roles that exist, so the URL is
  // read against them.
  const roleOptions = toRoleOptions(await caller.roles.list());
  const view = decodeTableView(
    toURLSearchParams(await searchParams),
    usersTableConfig(roleOptions),
  );
  const initialData = await caller.users.list(
    toUsersListInput(view.page, view.pageSize, view.sort, view.filters),
  );

  // The Table reads the URL on the client too, so it stays in a <Suspense>.
  return (
    <Suspense>
      <UsersPageTable initialData={initialData} roleOptions={roleOptions} />
    </Suspense>
  );
}
