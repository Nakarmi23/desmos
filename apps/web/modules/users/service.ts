import { listRolesHeld } from "../role-holdings/dal";
import { listUsers, type ListUsersQuery } from "./dal";
import type { UserListRow } from "./user";

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
