import type { Knex } from "knex";
import {
  rawTableToKnexTable,
  uuidDefault,
  type DBColumn,
  type DBTable,
} from "@repo/db-core";

const timestamps: DBColumn[] = [
  { name: "created_at", type: { kind: "TIMESTAMPTZ" }, defaultValue: "now()" },
  { name: "updated_at", type: { kind: "TIMESTAMPTZ" }, defaultValue: "now()" },
];

const roles: DBTable = {
  name: "roles",
  columns: [
    uuidDefault,
    // Shown as typed; uniqueness is case-insensitive via `name_key`.
    { name: "name", type: { kind: "VARCHAR", length: 100 } },
    {
      name: "name_key",
      type: { kind: "VARCHAR", length: 100 },
      generated: { as: "lower(name)", type: "STORED" },
      isUnique: true,
    },
    { name: "description", type: { kind: "TEXT" }, isNullable: true },
    { name: "is_system", type: { kind: "BOOLEAN" }, defaultValue: "false" },
    ...timestamps,
  ],
  constraints: [],
};

// `username` and `email` are stored lowercased (modules/users/normalize.ts), so
// plain UNIQUE is case-insensitive. Postgres allows any number of NULL emails.
const users: DBTable = {
  name: "users",
  columns: [
    uuidDefault,
    { name: "name", type: { kind: "VARCHAR", length: 200 } },
    {
      name: "username",
      type: { kind: "VARCHAR", length: 100 },
      isUnique: true,
    },
    {
      name: "email",
      type: { kind: "VARCHAR", length: 320 },
      isNullable: true,
      isUnique: true,
    },
    { name: "password_hash", type: { kind: "TEXT" } },
    // `active` | `suspended`, validated by the app on write.
    {
      name: "status",
      type: { kind: "VARCHAR", length: 20 },
      defaultValue: "'active'",
    },
    { name: "is_initial", type: { kind: "BOOLEAN" }, defaultValue: "false" },
    ...timestamps,
  ],
  constraints: [],
};

// Roles can't be deleted while held, and Users are never deleted.
const userRoles: DBTable = {
  name: "user_roles",
  columns: [
    {
      name: "user_id",
      type: { kind: "UUID" },
      referencedTable: {
        name: "users",
        column: "id",
        displayColumn: "name",
        onDelete: "RESTRICT",
      },
    },
    {
      name: "role_id",
      type: { kind: "UUID" },
      referencedTable: {
        name: "roles",
        column: "id",
        displayColumn: "name",
        onDelete: "RESTRICT",
      },
      indexed: true,
    },
  ],
  constraints: [{ type: "PRIMARY KEY", columns: ["user_id", "role_id"] }],
};

export async function up(knex: Knex): Promise<void> {
  for (const table of [roles, users, userRoles]) {
    await rawTableToKnexTable(knex.schema, table);
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("user_roles");
  await knex.schema.dropTable("users");
  await knex.schema.dropTable("roles");
}
