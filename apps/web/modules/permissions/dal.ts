import { db } from "../../db";
import type { Permission } from "./catalog";

/** Every Permission there is, in display order. */
export function listPermissionKeys(): Promise<Permission[]> {
  return db("permissions").orderBy("position").pluck("key");
}

/**
 * The Permissions granted by the Roles this User holds, combined, in display
 * order. Grants only: System Roles have none (see `findPermissionsHeld`).
 */
export function listPermissionsGranted(userId: string): Promise<Permission[]> {
  return db("role_permissions")
    .join("user_roles", "user_roles.role_id", "role_permissions.role_id")
    .join("permissions", "permissions.key", "role_permissions.permission_key")
    .where("user_roles.user_id", userId)
    .distinct("permissions.key", "permissions.position")
    .orderBy("permissions.position")
    .pluck("permissions.key");
}
