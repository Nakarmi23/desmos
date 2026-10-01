import { db } from "../../db";
import type { RoleRef } from "../users/user";

// `user_roles` links Users to the Roles they hold. A bare link table with
// more than one consumer (Users, auth), so it has its own module
// (docs/modules-convention.md).

/**
 * The Roles held by the User in the enclosing query's `users` row — or only
 * those among `roleIds` — for `whereExists`/`whereNotExists`.
 */
export function rolesHeldByUser(roleIds?: string[]) {
  const held = db("user_roles").whereRaw("user_roles.user_id = users.id");
  if (roleIds) held.whereIn("user_roles.role_id", roleIds);
  return held;
}

/** The Roles each of these Users holds, by name. */
export async function listRolesHeld(
  userIds: string[],
): Promise<Map<string, RoleRef[]>> {
  const held: (RoleRef & { userId: string })[] = await db("user_roles")
    .join("roles", "roles.id", "user_roles.role_id")
    .whereIn("user_roles.user_id", userIds)
    .select({
      userId: "user_roles.user_id",
      id: "roles.id",
      name: "roles.name",
    })
    .orderByRaw("lower(roles.name)");

  const byUser = new Map<string, RoleRef[]>();
  for (const { userId, id, name } of held) {
    byUser.set(userId, [...(byUser.get(userId) ?? []), { id, name }]);
  }
  return byUser;
}

/** Whether this User holds a System Role. */
export async function holdsSystemRole(userId: string): Promise<boolean> {
  const row = await db("user_roles")
    .join("roles", "roles.id", "user_roles.role_id")
    .where({ "user_roles.user_id": userId, "roles.is_system": true })
    .first(db.raw("1"));
  return row !== undefined;
}

/**
 * How many Users hold the Role in the enclosing query's `roles` row, whatever
 * their Status, as a subquery to select.
 */
export function holderCountOfRole() {
  return db("user_roles").count("*").whereRaw("user_roles.role_id = roles.id");
}

/** The ids of the Roles this User holds, as a subquery for `whereIn`. */
export function roleIdsHeldBy(userId: string) {
  return db("user_roles").where("user_id", userId).select("role_id");
}
