import { hash, verify } from "@node-rs/argon2";

/**
 * Hashes a User's password with argon2id — the library's default algorithm
 * and parameters. Only the hash is ever stored.
 */
export function hashPassword(password: string): Promise<string> {
  return hash(password);
}

/** Whether `password` is the one `passwordHash` was made from. */
export function verifyPassword(
  passwordHash: string,
  password: string,
): Promise<boolean> {
  return verify(passwordHash, password);
}
