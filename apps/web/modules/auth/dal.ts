import { db } from "../../db";
import { rolesHeldByUser } from "../role-holdings/dal";

export type NewSession = {
  userId: string;
  accessTokenHash: string;
  accessTokenExpiresAt: Date;
  refreshTokenHash: string;
  userAgent: string | null;
  ip: string | null;
};

export async function insertSession(session: NewSession): Promise<void> {
  await db("sessions").insert({
    user_id: session.userId,
    access_token_hash: session.accessTokenHash,
    access_token_expires_at: session.accessTokenExpiresAt,
    refresh_token_hash: session.refreshTokenHash,
    user_agent: session.userAgent,
    ip: session.ip,
  });
}

/**
 * Deletes a User's Sessions that have ended by `now`: unrefreshed for
 * `idleTimeoutMs`, or older than `maxAgeMs`.
 */
export async function deleteEndedSessions(
  userId: string,
  now: Date,
  { idleTimeoutMs, maxAgeMs }: { idleTimeoutMs: number; maxAgeMs: number },
): Promise<void> {
  await db("sessions")
    .where("user_id", userId)
    .where((ended) =>
      ended
        .where("last_used_at", "<=", new Date(now.getTime() - idleTimeoutMs))
        .orWhere("created_at", "<=", new Date(now.getTime() - maxAgeMs)),
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
  return db("sessions")
    .join("users", "users.id", "sessions.user_id")
    .where("sessions.access_token_hash", accessTokenHash)
    .where("sessions.access_token_expires_at", ">", now)
    .where("sessions.created_at", ">", new Date(now.getTime() - maxAgeMs))
    .where("users.status", "active")
    .whereExists(rolesHeldByUser())
    .first({ userId: "users.id" });
}
