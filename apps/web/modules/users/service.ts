import { db } from "../../db";
import { listUsers, type ListUsersQuery } from "./dal";
import type { RoleRef, UserListRow } from "./user";

/** A page of Users, each with the Roles they hold, plus the total. */
export async function listUsersWithRoles(
  query: ListUsersQuery,
): Promise<{ rows: UserListRow[]; total: number }> {
  const { rows, total } = await listUsers(query);
  const rolesByUser = await listRolesHeld(rows.map((user) => user.id));
  return {
    rows: rows.map((user) => ({
      ...user,
      roles: rolesByUser.get(user.id) ?? [],
    })),
    total,
  };
}

// The Roles each User holds, by name. `user_roles` is a bare link table, so
// it's read inline here rather than owning a module
// (docs/modules-convention.md).
async function listRolesHeld(
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
