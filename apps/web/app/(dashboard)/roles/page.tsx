import { NoAccess } from "@/components/no-access/no-access";
import { currentUserHolds } from "@/modules/permissions/current-permissions";

export default async function RolesPage() {
  if (!(await currentUserHolds("roles.view"))) return <NoAccess />;

  return <p className="text-sm text-text-subtle">Roles content goes here.</p>;
}
