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
 * or a proxy response's — each cookie living as long as its token.
 */
export function setSessionCookies(
  cookies: CookieJar,
  tokens: {
    accessToken: string;
    accessTokenExpiresAt: Date;
    refreshToken: string;
    refreshTokenExpiresAt: Date;
  },
): void {
  cookies.set(
    ACCESS_TOKEN_COOKIE,
    tokens.accessToken,
    sessionCookieOptions(tokens.accessTokenExpiresAt),
  );
  cookies.set(
    REFRESH_TOKEN_COOKIE,
    tokens.refreshToken,
    sessionCookieOptions(tokens.refreshTokenExpiresAt),
  );
}
