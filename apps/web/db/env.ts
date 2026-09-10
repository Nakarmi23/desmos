import { z } from "zod";

/**
 * Validated database connection configuration for `apps/web`.
 *
 * Dev and test default to the credentials baked into `docker-compose.yml` /
 * `docker/postgres/init.sql` (dev database `desmos`, test database
 * `desmos_test`), so a fresh checkout works against local Postgres with no env
 * setup. Production is given no defaults: every value must be supplied by the
 * environment, and a missing or malformed one fails fast with a clear error.
 */
const dbEnvSchema = z.object({
  DB_HOST: z.string().min(1),
  DB_PORT: z.coerce.number().int().positive(),
  DB_USER: z.string().min(1),
  DB_PASSWORD: z.string().min(1),
  DB_NAME: z.string().min(1),
});

export type DbEnv = z.infer<typeof dbEnvSchema>;

const DEV_DEFAULTS = {
  DB_HOST: "localhost",
  DB_PORT: "5432",
  DB_USER: "desmos",
  DB_PASSWORD: "desmos",
  DB_NAME: "desmos",
} as const;

const TEST_DEFAULTS = {
  ...DEV_DEFAULTS,
  DB_NAME: "desmos_test",
} as const;

type RawEnv = Record<string, string | undefined>;

function defaultsFor(nodeEnv: string | undefined): RawEnv {
  switch (nodeEnv) {
    case "production":
      return {};
    case "test":
      return TEST_DEFAULTS;
    default:
      return DEV_DEFAULTS;
  }
}

/** Drop keys whose value is `undefined` so they don't clobber a default. */
function definedEntries(env: RawEnv): RawEnv {
  return Object.fromEntries(
    Object.entries(env).filter(([, value]) => value !== undefined),
  );
}

/**
 * Validate the DB connection env vars, applying dev/test defaults based on
 * `NODE_ENV`. Throws a descriptive error listing every offending var when the
 * result is missing or malformed. Pure: pass an explicit env for testing.
 */
export function parseDbEnv(env: RawEnv = process.env): DbEnv {
  const source = { ...defaultsFor(env.NODE_ENV), ...definedEntries(env) };
  const result = dbEnvSchema.safeParse(source);

  if (!result.success) {
    throw new Error(
      `Invalid database environment configuration:\n${z.prettifyError(result.error)}`,
    );
  }

  return result.data;
}

/** Eagerly-parsed connection config, so misconfiguration fails at load time. */
export const dbEnv = parseDbEnv();
