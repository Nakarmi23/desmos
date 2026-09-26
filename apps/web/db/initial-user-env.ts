import { z } from "zod";

/** The Initial User's password must be at least this long, in every environment. */
export const MIN_INITIAL_PASSWORD_LENGTH = 24;

/**
 * The Initial User's credentials, read only by the seed migration that creates
 * it — never at app boot, so the app starts without them and operators can drop
 * them from the environment after the first migration.
 *
 * Dev and test default to a local admin account so a fresh checkout works with
 * no env setup. Production has no defaults: every required var must be set.
 */
const initialUserEnvSchema = z
  .object({
    INITIAL_ADMIN_USERNAME: z.string().trim().min(1),
    INITIAL_ADMIN_PASSWORD: z
      .string()
      .min(
        MIN_INITIAL_PASSWORD_LENGTH,
        `must be at least ${MIN_INITIAL_PASSWORD_LENGTH} characters`,
      ),
    INITIAL_ADMIN_NAME: z.string().trim().min(1),
    INITIAL_ADMIN_EMAIL: z
      .string()
      .trim()
      .transform((email) => email || undefined)
      .pipe(z.email().optional())
      .optional(),
  })
  .transform((env) => ({
    username: env.INITIAL_ADMIN_USERNAME,
    password: env.INITIAL_ADMIN_PASSWORD,
    name: env.INITIAL_ADMIN_NAME,
    email: env.INITIAL_ADMIN_EMAIL ?? null,
  }));

export type InitialUserEnv = z.infer<typeof initialUserEnvSchema>;

const DEV_DEFAULTS = {
  INITIAL_ADMIN_USERNAME: "admin",
  INITIAL_ADMIN_PASSWORD: "local-dev-admin-password",
  INITIAL_ADMIN_NAME: "Administrator",
} as const;

type RawEnv = Record<string, string | undefined>;

/** Drop keys whose value is `undefined` so they don't clobber a default. */
function definedEntries(env: RawEnv): RawEnv {
  return Object.fromEntries(
    Object.entries(env).filter(([, value]) => value !== undefined),
  );
}

/**
 * Validate the Initial User env vars, applying dev/test defaults based on
 * `NODE_ENV`. Throws a descriptive error listing every offending var. Pure:
 * pass an explicit env for testing.
 */
export function parseInitialUserEnv(env: RawEnv = process.env): InitialUserEnv {
  const defaults = env.NODE_ENV === "production" ? {} : DEV_DEFAULTS;
  const result = initialUserEnvSchema.safeParse({
    ...defaults,
    ...definedEntries(env),
  });

  if (!result.success) {
    throw new Error(
      `Invalid Initial User configuration (INITIAL_ADMIN_* env vars):\n${z.prettifyError(result.error)}`,
    );
  }

  return result.data;
}
