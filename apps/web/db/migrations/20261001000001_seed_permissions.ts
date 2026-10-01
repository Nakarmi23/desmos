import type { Knex } from "knex";

// The Users and Roles Permissions, seeded once (ADR 0002). Frozen here as
// written: later catalog changes are new migrations.
const PERMISSIONS = [
  ["users", "Users", "view", "View", "See Users and the Roles they hold."],
  ["users", "Users", "create", "Create", "Add new Users."],
  ["users", "Users", "edit", "Edit", "Change Users' details and Roles."],
  [
    "users",
    "Users",
    "suspend",
    "Suspend",
    "Suspend Users, and reactivate them.",
  ],
  ["roles", "Roles", "view", "View", "See Roles and their Permissions."],
  ["roles", "Roles", "create", "Create", "Add new Roles."],
  [
    "roles",
    "Roles",
    "edit",
    "Edit",
    "Change Roles' names, descriptions and Permissions.",
  ],
  ["roles", "Roles", "delete", "Delete", "Delete Roles nobody holds."],
] as const;

export async function up(knex: Knex): Promise<void> {
  await knex("permissions").insert(
    PERMISSIONS.map(
      ([resource, resourceLabel, action, actionLabel, description], i) => ({
        key: `${resource}.${action}`,
        resource,
        resource_label: resourceLabel,
        action_label: actionLabel,
        description,
        position: i,
      }),
    ),
  );
}

export async function down(knex: Knex): Promise<void> {
  await knex("permissions")
    .whereIn(
      "key",
      PERMISSIONS.map(([resource, , action]) => `${resource}.${action}`),
    )
    .delete();
}
