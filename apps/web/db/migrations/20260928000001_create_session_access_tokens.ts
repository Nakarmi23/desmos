import type { Knex } from "knex";

/**
 * Access tokens move to their own table so a Session can hold several live
 * ones: refreshes from parallel requests each get one without cancelling
 * the others' (ADR 0005).
 */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("session_access_tokens", (table) => {
    table
      .uuid("session_id")
      .notNullable()
      .references("id")
      .inTable("sessions")
      .onDelete("CASCADE")
      .index();
    table.string("token_hash", 64).primary();
    table.timestamp("expires_at", { useTz: true }).notNullable();
  });
  await knex.schema.alterTable("sessions", (table) => {
    table.dropColumn("access_token_hash");
    table.dropColumn("access_token_expires_at");
  });
}

export async function down(knex: Knex): Promise<void> {
  // Access tokens are short-lived: signing everyone out is the simplest way
  // back to one token per Session.
  await knex("sessions").delete();
  await knex.schema.alterTable("sessions", (table) => {
    table.string("access_token_hash", 64).notNullable().unique();
    table.timestamp("access_token_expires_at", { useTz: true }).notNullable();
  });
  await knex.schema.dropTable("session_access_tokens");
}
