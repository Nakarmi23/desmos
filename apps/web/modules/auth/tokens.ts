import { createHash, randomBytes } from "node:crypto";

/** A new opaque token: 256 random bits, URL- and cookie-safe. */
export function generateToken(): string {
  return randomBytes(32).toString("base64url");
}

/**
 * The form a token is stored in. Tokens are high-entropy, so a fast
 * unsalted hash is enough to make a leaked table useless for replay.
 */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
