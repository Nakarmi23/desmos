import type { Knex } from "knex";

import { db } from "../../db";
import { rolesHeldByUser } from "../role-holdings/dal";

// Writes take an optional transaction: multi-step writes are composed in
// `service.ts` (docs/modules-convention.md).

export type NewAccessToken = { tokenHash: string; expiresAt: Date };

export type NewSession = {
  userId: string;
  refreshTokenHash: string;
  userAgent: string | null;
  ip: string | null;
};

/** How long Sessions last: see `IDLE_TIMEOUT_MS`, `MAX_SESSION_AGE_MS`. */
export type SessionLifetime = { idleTimeoutMs: number; maxAgeMs: number };

/** The instant `ms` before `now`. */
const before = (now: Date, ms: number) => new Date(now.getTime() - ms);

/** Creates a Session (without access tokens); its id. */
export async function insertSession(
  session: NewSession,
  query: Knex = db,
): Promise<string> {
  const [{ id }] = await query("sessions")
    .insert({
      user_id: session.userId,
      refresh_token_hash: session.refreshTokenHash,
      user_agent: session.userAgent,
      ip: session.ip,
    })
    .returning("id");
  return id;
}

/** Gives a Session one more access token. */
export async function insertAccessToken(
  sessionId: string,
  token: NewAccessToken,
  query: Knex = db,
): Promise<void> {
  await query("session_access_tokens").insert({
    session_id: sessionId,
    token_hash: token.tokenHash,
    expires_at: token.expiresAt,
  });
}

/** Clears a Session's access tokens that have expired by `now`. */
export async function deleteExpiredAccessTokens(
  sessionId: string,
  now: Date,
  query: Knex = db,
): Promise<void> {
  await query("session_access_tokens")
    .where("session_id", sessionId)
    .where("expires_at", "<=", now)
    .delete();
}

/** Deletes a User's Sessions that have ended by `now`. */
export async function deleteEndedSessions(
  userId: string,
  now: Date,
  { idleTimeoutMs, maxAgeMs }: SessionLifetime,
): Promise<void> {
  await db("sessions")
    .where("user_id", userId)
    .where((ended) =>
      ended
        .where("last_used_at", "<=", before(now, idleTimeoutMs))
        .orWhere("created_at", "<=", before(now, maxAgeMs)),
    )
    .delete();
}

/**
 * The User of the Session an access token belongs to, if that Session still
 * grants access at `now`: the token is unexpired, the Session is under
 * `maxAgeMs` old, and its User is active and holds at least one Role. One
 * query, so losing access takes effect on the very next request.
 */
export async function findSessionUser(
  accessTokenHash: string,
  now: Date,
  maxAgeMs: number,
): Promise<{ userId: string } | undefined> {
  return db("session_access_tokens")
    .join("sessions", "sessions.id", "session_access_tokens.session_id")
    .join("users", "users.id", "sessions.user_id")
    .where("session_access_tokens.token_hash", accessTokenHash)
    .where("session_access_tokens.expires_at", ">", now)
    .where("sessions.created_at", ">", before(now, maxAgeMs))
    .modify(grantsAccess)
    .first({ userId: "users.id" });
}

/** Narrows a query joined to `users` to Users who still have access. */
function grantsAccess(query: Knex.QueryBuilder) {
  query.where("users.status", "active").whereExists(rolesHeldByUser());
}

/**
 * A Session as a refresh token finds it: presented as its current refresh
 * token, or as the previous one, replaced at `rotatedAt`.
 */
export type RefreshableSession = {
  id: string;
  refreshTokenHash: string;
  createdAt: Date;
} & ({ presented: "current" } | { presented: "previous"; rotatedAt: Date });

/**
 * The Session a refresh token belongs to, if it's still live at `now`:
 * refreshed within the idle timeout, under the maximum age, and its User
 * still has access.
 */
export async function findLiveSessionByRefreshToken(
  refreshTokenHash: string,
  now: Date,
  { idleTimeoutMs, maxAgeMs }: SessionLifetime,
): Promise<RefreshableSession | undefined> {
  const row = await db("sessions")
    .join("users", "users.id", "sessions.user_id")
    .where((token) =>
      token
        .where("sessions.refresh_token_hash", refreshTokenHash)
        .orWhere("sessions.previous_refresh_token_hash", refreshTokenHash),
    )
    .where("sessions.last_used_at", ">", before(now, idleTimeoutMs))
    .where("sessions.created_at", ">", before(now, maxAgeMs))
    .modify(grantsAccess)
    .first({
      id: "sessions.id",
      refreshTokenHash: "sessions.refresh_token_hash",
      createdAt: "sessions.created_at",
      rotatedAt: "sessions.refresh_token_rotated_at",
    });
  if (!row) return undefined;

  const { rotatedAt, ...session } = row;
  // The previous-token column is only ever set together with `rotatedAt`.
  return session.refreshTokenHash === refreshTokenHash
    ? { ...session, presented: "current" }
    : { ...session, presented: "previous", rotatedAt };
}

/**
 * Replaces a Session's refresh token, keeping the replaced one as its
 * previous one, and marks the Session used at `now`. Only if
 * `currentRefreshTokenHash` is still its refresh token: `false` means a
 * concurrent refresh rotated it first.
 */
export async function rotateRefreshToken(
  sessionId: string,
  currentRefreshTokenHash: string,
  nextRefreshTokenHash: string,
  now: Date,
  query: Knex = db,
): Promise<boolean> {
  const updated = await query("sessions")
    .where({ id: sessionId, refresh_token_hash: currentRefreshTokenHash })
    .update({
      refresh_token_hash: nextRefreshTokenHash,
      previous_refresh_token_hash: currentRefreshTokenHash,
      refresh_token_rotated_at: now,
      last_used_at: now,
    });
  return updated === 1;
}

/** Ends a Session outright; every token it had stops working. */
export async function deleteSession(sessionId: string): Promise<void> {
  await db("sessions").where({ id: sessionId }).delete();
}
