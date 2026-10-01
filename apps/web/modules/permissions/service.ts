import { listPermissionsGranted } from "../role-grants/dal";
import { holdsSystemRole } from "../role-holdings/dal";
import type { Permission } from "./catalog";
import { listPermissionKeys } from "./dal";

/**
 * The Permissions this User's Roles grant, combined. A System Role grants
 * every Permission there is (ADR 0006), with no grants of its own.
 */
export async function findPermissionsHeld(
  userId: string,
): Promise<Permission[]> {
  return (await holdsSystemRole(userId))
    ? listPermissionKeys()
    : listPermissionsGranted(userId);
}
