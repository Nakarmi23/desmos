import { Suspense } from "react";

import { NoAccess } from "@/components/no-access/no-access";
import { rolesTableConfig } from "@/components/roles/roles-table-config";
import {
  decodeTableView,
  toURLSearchParams,
  type PageSearchParams,
} from "@/components/table/table-url-state";
import { currentUserHolds } from "@/modules/permissions/current-permissions";
import { toRolesTableInput } from "@/modules/roles/role";
import { createServerCaller } from "@/trpc/server";

import { RolesPageTable } from "./roles-page-table";

// The first view is loaded here, in-process (ADR 0001), and rendered with
// the page; the Table fetches every later view from the client.
export default async function RolesPage({
  searchParams,
}: {
  searchParams: Promise<PageSearchParams>;
}) {
  if (!(await currentUserHolds("roles.view"))) return <NoAccess />;

  const view = decodeTableView(
    toURLSearchParams(await searchParams),
    rolesTableConfig,
  );
  const caller = await createServerCaller();
  const initialData = await caller.roles.table(
    toRolesTableInput(view.page, view.pageSize, view.sort, view.filters),
  );

  // The Table reads the URL on the client too, so it stays in a <Suspense>.
  return (
    <Suspense>
      <RolesPageTable initialData={initialData} />
    </Suspense>
  );
}
