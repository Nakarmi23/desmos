import { findUserCredentials } from "../users/dal";
import { normalizeUsername } from "../users/normalize";
import { hashPassword, verifyPassword } from "../users/password";
import { deleteEndedSessions, findSessionUser, insertSession } from "./dal";
import { generateToken, hashToken } from "./tokens";

const MINUTE_MS = 60_000;
const DAY_MS = 24 * 60 * MINUTE_MS;

export const ACCESS_TOKEN_TTL_MS = 15 * MINUTE_MS;
/** A Session unrefreshed this long has ended. */
export const IDLE_TIMEOUT_MS = 7 * DAY_MS;
/** Every Session ends this long after Sign in, however much it's used. */
export const MAX_SESSION_AGE_MS = 30 * DAY_MS;

export type SessionTokens = {
  accessToken: string;
  accessTokenExpiresAt: Date;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
};

export type SignInInput = {
  username: string;
  password: string;
  userAgent?: string | null;
  ip?: string | null;
};

// Checked against when the Username is unknown, so a miss costs the same
// argon2 time as a wrong password and timing can't reveal which exist.
let dummyHash: Promise<string> | undefined;
const getDummyHash = () =>
  (dummyHash ??= hashPassword("no-user-has-this-password"));

/**
 * Starts a Session, or `null` when Sign in is refused: an unknown Username,
 * a wrong password, a Suspended User or one holding no Roles all look alike.
 */
export async function signIn(
  input: SignInInput,
): Promise<SessionTokens | null> {
  const user = await findUserCredentials(normalizeUsername(input.username));
  const passwordMatches = await verifyPassword(
    user?.passwordHash ?? (await getDummyHash()),
    input.password,
  );
  if (
    !user ||
    !passwordMatches ||
    user.status !== "active" ||
    !user.holdsRole
  ) {
    return null;
  }

  const now = Date.now();
  // No cleanup job exists: Sign in tidies up after the User's own Sessions.
  await deleteEndedSessions(user.id, new Date(now), {
    idleTimeoutMs: IDLE_TIMEOUT_MS,
    maxAgeMs: MAX_SESSION_AGE_MS,
  });
  const tokens: SessionTokens = {
    accessToken: generateToken(),
    accessTokenExpiresAt: new Date(now + ACCESS_TOKEN_TTL_MS),
    refreshToken: generateToken(),
    refreshTokenExpiresAt: new Date(now + IDLE_TIMEOUT_MS),
  };
  await insertSession({
    userId: user.id,
    accessTokenHash: hashToken(tokens.accessToken),
    accessTokenExpiresAt: tokens.accessTokenExpiresAt,
    refreshTokenHash: hashToken(tokens.refreshToken),
    userAgent: input.userAgent ?? null,
    ip: input.ip ?? null,
  });
  return tokens;
}

/**
 * The User whose Session this access token belongs to, or `null` once that
 * Session no longer grants access (see `findSessionUser`).
 */
export async function validateAccessToken(
  accessToken: string,
): Promise<{ userId: string } | null> {
  const session = await findSessionUser(
    hashToken(accessToken),
    new Date(),
    MAX_SESSION_AGE_MS,
  );
  return session ?? null;
}
