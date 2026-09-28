import { NextResponse, type NextRequest } from "next/server";

import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  setSessionCookies,
} from "./modules/auth/cookies";
import { SIGN_IN_PATH, safeReturnTo } from "./modules/auth/return-to";
import type { RefreshedTokens } from "./modules/auth/service";
import { authCaller } from "./trpc/auth-caller";

/**
 * Gates every page behind a Session (CONTEXT.md). Checks the access token
 * against the database, not just the cookie's presence, so a Suspended User
 * is turned away on their next request (ADR 0005). An expired access token
 * is refreshed here, transparently: Server Components can't set cookies.
 */
export async function proxy(request: NextRequest) {
  const { signedIn, refreshed } = await resolveSession(request);
  const { pathname, search, searchParams } = request.nextUrl;

  let response: NextResponse;
  if (pathname === SIGN_IN_PATH) {
    response = signedIn
      ? NextResponse.redirect(
          new URL(safeReturnTo(searchParams.get("returnTo")), request.url),
        )
      : NextResponse.next();
  } else if (signedIn) {
    // The rest of this request (pages, Server Components) reads the new
    // tokens, not the stale ones the browser sent.
    if (refreshed) forwardTokens(request, refreshed);
    response = NextResponse.next({ request: { headers: request.headers } });
  } else {
    // Dead cookies are left alone: a parallel request's response may just
    // have set fresh ones, and clearing here could land after it.
    const signIn = new URL(SIGN_IN_PATH, request.url);
    signIn.searchParams.set("returnTo", pathname + search);
    response = NextResponse.redirect(signIn);
  }

  if (refreshed) setSessionCookies(response.cookies, refreshed);
  return response;
}

/**
 * Whether the request has a Session: a live access token, or else a refresh
 * token that gets it new ones (`refreshed`).
 */
async function resolveSession(
  request: NextRequest,
): Promise<{ signedIn: boolean; refreshed?: RefreshedTokens }> {
  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  if (accessToken && (await authCaller().validate({ accessToken }))) {
    return { signedIn: true };
  }
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
  const refreshed = refreshToken
    ? await authCaller().refresh({ refreshToken })
    : null;
  return refreshed ? { signedIn: true, refreshed } : { signedIn: false };
}

function forwardTokens(request: NextRequest, tokens: RefreshedTokens) {
  request.cookies.set(ACCESS_TOKEN_COOKIE, tokens.accessToken);
  if (tokens.refreshToken) {
    request.cookies.set(REFRESH_TOKEN_COOKIE, tokens.refreshToken);
  }
}

export const config = {
  // Everything but static assets and metadata files. API routes answer for
  // themselves.
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
