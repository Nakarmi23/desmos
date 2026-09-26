import { db } from "../../db";

export type Role = {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
};

/** Every Role, ordered by name ignoring case. */
export function listRoles(): Promise<Role[]> {
  return db("roles")
    .select({
      id: "id",
      name: "name",
      description: "description",
      isSystem: "is_system",
    })
    .orderByRaw("lower(name)");
}
