import { db } from "../../db";
import type { Permission } from "../permissions/catalog";
import { roleIdsHeldBy } from "../role-holdings/dal";

// `role_permissions` links Roles to the Permissions they grant. A bare link
// table with more than one consumer (Permissions, Roles), so it has its own
// module (docs/modules-convention.md). System Roles have no grants here: they
// grant every Permission implicitly (ADR 0006).

/**
 * The Permissions granted by the Roles this User holds, combined, in display
 * order.
 */
export function listPermissionsGranted(userId: string): Promise<Permission[]> {
  return db("role_permissions")
    .join("permissions", "permissions.key", "role_permissions.permission_key")
    .whereIn("role_permissions.role_id", roleIdsHeldBy(userId))
    .distinct("permissions.key", "permissions.position")
    .orderBy("permissions.position")
    .pluck("permissions.key");
}

/**
 * How many Permissions the Role in the enclosing query's `roles` row grants
 * — every one there is for a System Role — as a subquery to select.
 */
export function permissionCountOfRole() {
  return db.raw(
    `case when roles.is_system
      then (select count(*) from permissions)
      else (select count(*) from role_permissions where role_permissions.role_id = roles.id)
    end`,
  );
}
