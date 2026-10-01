/** `term` for a LIKE pattern: its `%` and `_` are literal, not wildcards. */
export function escapeLike(term: string): string {
  return term.replace(/[\\%_]/g, (char) => `\\${char}`);
}
