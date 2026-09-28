import type { Knex } from "knex";

import { db } from "../../db";
import { findUserCredentials } from "../users/dal";
import { normalizeUsername } from "../users/normalize";
import { hashPassword, verifyPassword } from "../users/password";
import {
  deleteEndedSessions,
  deleteSession,
  deleteSessionByAccessToken,
  deleteSessionByRefreshToken,
  findLiveSessionByRefreshToken,
  deleteExpiredAccessTokens,
  findSessionUser,
  insertAccessToken,
  insertSession,
  rotateRefreshToken,
  type NewAccessToken,
  type SessionLifetime,
} from "./dal";
import { generateToken, hashToken } from "./tokens";

const MINUTE_MS = 60_000;
const DAY_MS = 24 * 60 * MINUTE_MS;

export const ACCESS_TOKEN_TTL_MS = 15 * MINUTE_MS;
/** A Session unrefreshed this long has ended. */
export const IDLE_TIMEOUT_MS = 7 * DAY_MS;
/** Every Session ends this long after Sign in, however much it's used. */
export const MAX_SESSION_AGE_MS = 30 * DAY_MS;
/** How long a just-replaced refresh token is still accepted. */
export const REUSE_GRACE_MS = 30_000;

const SESSION_LIFETIME: SessionLifetime = {
  idleTimeoutMs: IDLE_TIMEOUT_MS,
  maxAgeMs: MAX_SESSION_AGE_MS,
};

export type SessionTokens = {
  accessToken: string;
  accessTokenExpiresAt: Date;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
};

/**
 * What a refresh hands back: always a new access token, and a new refresh
 * token unless the one presented was just replaced (keep the replacement).
 */
export type RefreshedTokens = Pick<
  SessionTokens,
  "accessToken" | "accessTokenExpiresAt"
> &
  Partial<Pick<SessionTokens, "refreshToken" | "refreshTokenExpiresAt">>;

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
  await deleteEndedSessions(user.id, new Date(now), SESSION_LIFETIME);
  const tokens = { ...newAccessToken(now), ...newRefreshToken(now, now) };
  await db.transaction(async (trx) => {
    const sessionId = await insertSession(
      {
        userId: user.id,
        refreshTokenHash: hashToken(tokens.refreshToken),
        userAgent: input.userAgent ?? null,
        ip: input.ip ?? null,
      },
      trx,
    );
    await insertAccessToken(sessionId, storedAccessToken(tokens), trx);
  });
  return tokens;
}

/** A signed-in User: who they are, and what to call them. */
export type SignedInUser = { id: string; name: string; username: string };

/**
 * The User whose Session this access token belongs to, or `null` once that
 * Session no longer grants access (see `findSessionUser`).
 */
export async function findSignedInUser(
  accessToken: string,
): Promise<SignedInUser | null> {
  const user = await findSessionUser(
    hashToken(accessToken),
    new Date(),
    MAX_SESSION_AGE_MS,
  );
  return user ?? null;
}

/** `findSignedInUser`, as just the User's id. */
export async function validateAccessToken(
  accessToken: string,
): Promise<{ userId: string } | null> {
  const user = await findSignedInUser(accessToken);
  return user && { userId: user.id };
}

/**
 * New tokens for the Session a refresh token belongs to, or `null` when
 * there is none to refresh: unknown, ended, or its User has lost access.
 *
 * The current refresh token rotates: both tokens are replaced. The one it
 * just replaced is still accepted for `REUSE_GRACE_MS`, since parallel tabs
 * and requests refresh with it at once; those get a new access token only,
 * so the browser keeps the replacement and never ends up holding a stale
 * refresh token. Turning up after that, it's taken as stolen and the whole
 * Session is revoked.
 */
export async function refresh(
  refreshToken: string,
): Promise<RefreshedTokens | null> {
  const presented = hashToken(refreshToken);
  // A concurrent refresh can rotate the Session between reading and
  // rotating it; the retry then finds the token as the replaced one.
  for (let attempt = 0; attempt < 2; attempt++) {
    const now = Date.now();
    const session = await findLiveSessionByRefreshToken(
      presented,
      new Date(now),
      SESSION_LIFETIME,
    );
    if (!session) return null;

    const access = newAccessToken(now);
    if (session.presented === "previous") {
      if (now - session.rotatedAt.getTime() > REUSE_GRACE_MS) {
        await deleteSession(session.id);
        return null;
      }
      await addAccessToken(session.id, access, now);
      return access;
    }

    const tokens = {
      ...access,
      ...newRefreshToken(now, session.createdAt.getTime()),
    };
    const rotated = await db.transaction(async (trx) => {
      const won = await rotateRefreshToken(
        session.id,
        session.refreshTokenHash,
        hashToken(tokens.refreshToken),
        new Date(now),
        trx,
      );
      if (won) await addAccessToken(session.id, tokens, now, trx);
      return won;
    });
    if (rotated) return tokens;
  }
  return null;
}

/**
 * Sign out: ends the Session the tokens belong to, and only that one. The
 * refresh token finds it even as the one just replaced; the access token is
 * the fallback for a browser that has lost its refresh cookie.
 */
export async function signOut(tokens: {
  refreshToken?: string;
  accessToken?: string;
}): Promise<void> {
  if (tokens.refreshToken) {
    await deleteSessionByRefreshToken(hashToken(tokens.refreshToken));
  }
  if (tokens.accessToken) {
    await deleteSessionByAccessToken(hashToken(tokens.accessToken));
  }
}

function newAccessToken(now: number) {
  return {
    accessToken: generateToken(),
    accessTokenExpiresAt: new Date(now + ACCESS_TOKEN_TTL_MS),
  };
}

/**
 * A refresh token issued at `now` for a Session started at `createdAt`: it
 * lasts the idle timeout, but never past the Session's maximum age.
 */
function newRefreshToken(now: number, createdAt: number) {
  return {
    refreshToken: generateToken(),
    refreshTokenExpiresAt: new Date(
      Math.min(now + IDLE_TIMEOUT_MS, createdAt + MAX_SESSION_AGE_MS),
    ),
  };
}

function storedAccessToken(tokens: {
  accessToken: string;
  accessTokenExpiresAt: Date;
}): NewAccessToken {
  return {
    tokenHash: hashToken(tokens.accessToken),
    expiresAt: tokens.accessTokenExpiresAt,
  };
}

/**
 * Gives a Session one more access token, clearing its expired ones as it
 * goes so a Session only ever holds a handful.
 */
async function addAccessToken(
  sessionId: string,
  tokens: { accessToken: string; accessTokenExpiresAt: Date },
  now: number,
  query: Knex = db,
) {
  await deleteExpiredAccessTokens(sessionId, new Date(now), query);
  await insertAccessToken(sessionId, storedAccessToken(tokens), query);
}
