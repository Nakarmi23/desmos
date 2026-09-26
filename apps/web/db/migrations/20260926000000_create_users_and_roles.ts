import type { Knex } from "knex";

function timestamps(knex: Knex, table: Knex.CreateTableBuilder): void {
  table
    .timestamp("created_at", { useTz: true })
    .notNullable()
    .defaultTo(knex.fn.now());
  table
    .timestamp("updated_at", { useTz: true })
    .notNullable()
    .defaultTo(knex.fn.now());
}

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("roles", (table) => {
    table.uuid("id").primary().defaultTo(knex.fn.uuid());
    table.string("name", 100).notNullable();
    table.text("description");
    table.boolean("is_system").notNullable().defaultTo(false);
    timestamps(knex, table);
  });
  // Shown as typed, unique regardless of case.
  await knex.raw(
    "CREATE UNIQUE INDEX roles_name_lower_unique ON roles (lower(name))",
  );

  // `username` and `email` are stored lowercased (modules/users/normalize.ts),
  // so plain UNIQUE is case-insensitive. Postgres allows any number of NULL
  // emails.
  await knex.schema.createTable("users", (table) => {
    table.uuid("id").primary().defaultTo(knex.fn.uuid());
    table.string("name", 200).notNullable();
    table.string("username", 100).notNullable().unique();
    table.string("email", 320).unique();
    table.text("password_hash").notNullable();
    // `active` | `suspended`, validated by the app on write.
    table.string("status", 20).notNullable().defaultTo("active");
    table.boolean("is_initial").notNullable().defaultTo(false);
    timestamps(knex, table);
  });

  // Roles can't be deleted while held, and Users are never deleted.
  await knex.schema.createTable("user_roles", (table) => {
    table
      .uuid("user_id")
      .notNullable()
      .references("id")
      .inTable("users")
      .onDelete("RESTRICT");
    table
      .uuid("role_id")
      .notNullable()
      .references("id")
      .inTable("roles")
      .onDelete("RESTRICT")
      .index();
    table.primary(["user_id", "role_id"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("user_roles");
  await knex.schema.dropTable("users");
  await knex.schema.dropTable("roles");
}
