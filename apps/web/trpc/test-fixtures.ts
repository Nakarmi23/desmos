import { db } from "../db";
import type { Permission } from "../modules/permissions/catalog";
import type { UserStatus } from "../modules/users/user";

// For integration tests: Roles and Users inserted directly, and removed
// again by `removeTestData` with the names and usernames they were given.

/** A Role granting `permissions`. */
export async function createRole(
  name: string,
  permissions: Permission[] = [],
  fields: { description?: string; createdAt?: Date } = {},
): Promise<string> {
  const [{ id }] = await db("roles")
    .insert({
      name,
      description: fields.description,
      created_at: fields.createdAt,
    })
    .returning("id");
  if (permissions.length > 0) {
    await db("role_permissions").insert(
      permissions.map((key) => ({ role_id: id, permission_key: key })),
    );
  }
  return id;
}

/** A User holding `roleIds`. */
export async function createUser(
  username: string,
  roleIds: string[] = [],
  status: UserStatus = "active",
): Promise<string> {
  const [{ id }] = await db("users")
    .insert({ name: username, username, password_hash: "not-a-hash", status })
    .returning("id");
  if (roleIds.length > 0) {
    await db("user_roles").insert(
      roleIds.map((roleId) => ({ user_id: id, role_id: roleId })),
    );
  }
  return id;
}

/** Removes these Users and Roles, with their holdings and grants. */
export async function removeTestData({
  usernames = [],
  roleNames = [],
}: {
  usernames?: string[];
  roleNames?: string[];
}) {
  const users = db("users").whereIn("username", usernames).select("id");
  const roles = db("roles").whereIn("name", roleNames).select("id");
  await db("user_roles")
    .whereIn("user_id", users)
    .orWhereIn("role_id", roles)
    .delete();
  await db("users").whereIn("username", usernames).delete();
  await db("roles").whereIn("name", roleNames).delete();
}
