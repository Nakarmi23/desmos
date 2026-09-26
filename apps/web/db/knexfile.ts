import path from "node:path";

import type { Knex } from "knex";

import { parseDbEnv } from "./env";

/**
 * Knex configuration built from the validated env. No pool is configured and no
 * connection is opened here — this only describes how to connect and where
 * migrations live. The env is read when a connection is first opened, not at
 * import, so importing the pool (e.g. while `next build` collects page data)
 * needs no DB env; the boot check in `instrumentation.ts` still fails fast. All migrations share one flat `db/migrations/` directory so
 * migration history stays a single, simply-ordered timeline.
 */
const config: Knex.Config = {
  client: "pg",
  connection: () => {
    const env = parseDbEnv();
    return {
      host: env.DB_HOST,
      port: env.DB_PORT,
      user: env.DB_USER,
      password: env.DB_PASSWORD,
      database: env.DB_NAME,
    };
  },
  migrations: {
    directory: path.join(__dirname, "migrations"),
    extension: "ts",
  },
};

export default config;
