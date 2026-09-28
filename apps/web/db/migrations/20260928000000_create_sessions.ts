import type { Knex } from "knex";

/**
 * Sessions (see CONTEXT.md, ADR 0005). Tokens are opaque and random; only
 * their SHA-256 hashes are stored, so a leaked table can't be replayed. An
 * ended Session is deleted, not flagged.
 */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("sessions", (table) => {
    table.uuid("id").primary().defaultTo(knex.fn.uuid());
    // Users are never deleted in the app; cascading only keeps test and
    // migration teardown simple.
    table
      .uuid("user_id")
      .notNullable()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE")
      .index();
    table.string("access_token_hash", 64).notNullable().unique();
    table.timestamp("access_token_expires_at", { useTz: true }).notNullable();
    table.string("refresh_token_hash", 64).notNullable().unique();
    // The refresh token this one replaced, and when: a replayed old token is
    // tolerated briefly (parallel refreshes), then revokes the Session.
    table.string("previous_refresh_token_hash", 64).unique();
    table.timestamp("refresh_token_rotated_at", { useTz: true });
    table
      .timestamp("created_at", { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());
    // Moves on refresh only; the idle timeout counts from here.
    table
      .timestamp("last_used_at", { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());
    table.text("user_agent");
    table.string("ip", 45);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("sessions");
}
