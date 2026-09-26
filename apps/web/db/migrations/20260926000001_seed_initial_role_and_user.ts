import type { Knex } from "knex";

import { parseInitialUserEnv } from "../initial-user-env";
import {
  normalizeEmail,
  normalizeUsername,
} from "../../modules/users/normalize";
import { hashPassword } from "../../modules/users/password";

const INITIAL_ROLE_NAME = "Administrator";

/**
 * The Initial Role and Initial User (see CONTEXT.md), seeded once per database
 * as a tracked migration (ADR 0002). Credentials come from the INITIAL_ADMIN_*
 * env vars, read here and nowhere else.
 */
export async function up(knex: Knex): Promise<void> {
  const admin = parseInitialUserEnv();

  const [role] = await knex("roles")
    .insert({
      name: INITIAL_ROLE_NAME,
      description: "Can administer everything in the app.",
      is_system: true,
    })
    .returning("id");
  const [user] = await knex("users")
    .insert({
      name: admin.name,
      username: normalizeUsername(admin.username),
      email: normalizeEmail(admin.email),
      password_hash: await hashPassword(admin.password),
      status: "active",
      is_initial: true,
    })
    .returning("id");
  await knex("user_roles").insert({ user_id: user.id, role_id: role.id });
}

export async function down(knex: Knex): Promise<void> {
  const initialUsers = () => knex("users").where({ is_initial: true });
  const initialRoles = () =>
    knex("roles").where({ name: INITIAL_ROLE_NAME, is_system: true });

  await knex("user_roles")
    .whereIn("user_id", initialUsers().select("id"))
    .orWhereIn("role_id", initialRoles().select("id"))
    .delete();
  await initialUsers().delete();
  await initialRoles().delete();
}
