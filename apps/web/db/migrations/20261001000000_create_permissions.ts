import type { Knex } from "knex";

/**
 * Permissions and the Roles that grant them (see CONTEXT.md, ADR 0006). The
 * app defines the Permissions; they're rows, not an enum, so Permissions for
 * dynamic modules can be added at runtime later. System Roles grant every
 * Permission implicitly and have no rows here.
 */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("permissions", (table) => {
    // `<resource>.<action>`, e.g. `roles.edit`.
    table.string("key", 100).primary();
    table.string("resource", 100).notNullable();
    table.string("resource_label", 100).notNullable();
    table.string("action_label", 100).notNullable();
    table.text("description").notNullable();
    // Display order, across Resources and within one.
    table.integer("position").notNullable();
  });

  // Deleting a Role takes its grants with it; a Permission some Role grants
  // can't be deleted.
  await knex.schema.createTable("role_permissions", (table) => {
    table
      .uuid("role_id")
      .notNullable()
      .references("id")
      .inTable("roles")
      .onDelete("CASCADE");
    table
      .string("permission_key", 100)
      .notNullable()
      .references("key")
      .inTable("permissions")
      .onDelete("RESTRICT")
      .index();
    table.primary(["role_id", "permission_key"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("role_permissions");
  await knex.schema.dropTable("permissions");
}
