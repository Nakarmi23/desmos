// Usernames and emails are stored in this form, so a plain UNIQUE index makes
// them unique regardless of case. Every write path goes through these.

/** A Username as stored. */
export function normalizeUsername(username: string): string {
  return username.toLowerCase();
}

/** An email as stored; a User without one stays without one. */
export function normalizeEmail(email: string | null): string | null {
  return email?.toLowerCase() ?? null;
}
