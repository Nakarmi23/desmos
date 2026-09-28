export const SIGN_IN_PATH = "/sign-in";
/** Overview. */
export const DEFAULT_RETURN_TO = "/";

// Any fixed origin: resolving against it shows whether a path stays on-site.
const BASE = new URL("http://return-to.invalid");

/**
 * Where to send a User after Sign in: `returnTo` if it's a path on this site
 * (other than the sign-in page), otherwise Overview. Never an open redirect —
 * `//host`, `/\host` and absolute URLs all fall back.
 */
export function safeReturnTo(returnTo: string | null | undefined): string {
  if (!returnTo?.startsWith("/")) return DEFAULT_RETURN_TO;
  const url = new URL(returnTo, BASE);
  if (url.origin !== BASE.origin || url.pathname === SIGN_IN_PATH) {
    return DEFAULT_RETURN_TO;
  }
  return url.pathname + url.search + url.hash;
}
