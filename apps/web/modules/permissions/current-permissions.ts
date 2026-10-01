import { cache } from "react";

import { getCurrentUser } from "../auth/current-user";
import type { Permission } from "./catalog";
import { findPermissionsHeld } from "./service";

/**
 * The Permissions the signed-in User holds (none without one). Read once per
 * request, so a change to their Roles applies from their next request.
 */
export const getCurrentPermissions = cache(async (): Promise<Permission[]> => {
  const user = await getCurrentUser();
  return user ? findPermissionsHeld(user.id) : [];
});

/** Whether the signed-in User holds `permission`. */
export async function currentUserHolds(
  permission: Permission,
): Promise<boolean> {
  return (await getCurrentPermissions()).includes(permission);
}
