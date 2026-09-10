import path from "node:path";

import type { Knex } from "knex";

import { dbEnv } from "./env";

/**
 * Knex configuration built from the validated env. No pool is configured and no
 * connection is opened here — this only describes how to connect and where
 * migrations live. All migrations share one flat `db/migrations/` directory so
 * migration history stays a single, simply-ordered timeline.
 */
const config: Knex.Config = {
  client: "pg",
  connection: {
    host: dbEnv.DB_HOST,
    port: dbEnv.DB_PORT,
    user: dbEnv.DB_USER,
    password: dbEnv.DB_PASSWORD,
    database: dbEnv.DB_NAME,
  },
  migrations: {
    directory: path.join(__dirname, "migrations"),
    extension: "ts",
  },
};

export default config;
