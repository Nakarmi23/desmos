// The browser's side of a Session (ADR 0005): the auth procedures deal only
// in tokens; the Server Actions and the proxy keep them in these cookies.

export const ACCESS_TOKEN_COOKIE = "desmos_access";
export const REFRESH_TOKEN_COOKIE = "desmos_refresh";

/** Options for a Session cookie living until `expires`. */
export function sessionCookieOptions(expires: Date) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    expires,
  };
}

type CookieJar = {
  set(
    name: string,
    value: string,
    options: ReturnType<typeof sessionCookieOptions>,
  ): unknown;
};

/**
 * Stores a Session's tokens in `cookies` — the Server Action's cookie store
 * or a proxy response's — each cookie living as long as its token. Without
 * a refresh token (a refresh that kept the current one), that cookie is
 * left as it is.
 */
export function setSessionCookies(
  cookies: CookieJar,
  tokens: {
    accessToken: string;
    accessTokenExpiresAt: Date;
    refreshToken?: string;
    refreshTokenExpiresAt?: Date;
  },
): void {
  cookies.set(
    ACCESS_TOKEN_COOKIE,
    tokens.accessToken,
    sessionCookieOptions(tokens.accessTokenExpiresAt),
  );
  if (tokens.refreshToken && tokens.refreshTokenExpiresAt) {
    cookies.set(
      REFRESH_TOKEN_COOKIE,
      tokens.refreshToken,
      sessionCookieOptions(tokens.refreshTokenExpiresAt),
    );
  }
}

/**
 * Removes a Session's cookies from `cookies`, set to expire with the same
 * attributes they were set with so the browser matches them.
 */
export function clearSessionCookies(cookies: CookieJar): void {
  for (const name of [ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE]) {
    cookies.set(name, "", sessionCookieOptions(new Date(0)));
  }
}
