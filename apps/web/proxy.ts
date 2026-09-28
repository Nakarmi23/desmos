import { NextResponse, type NextRequest } from "next/server";

import { ACCESS_TOKEN_COOKIE } from "./modules/auth/cookies";
import { SIGN_IN_PATH, safeReturnTo } from "./modules/auth/return-to";
import { authCaller } from "./trpc/auth-caller";

/**
 * Gates every page behind a Session (CONTEXT.md). Checks the access token
 * against the database, not just the cookie's presence, so a Suspended User
 * is turned away on their next request (ADR 0005).
 */
export async function proxy(request: NextRequest) {
  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const session = accessToken
    ? await authCaller().validate({ accessToken })
    : null;
  const { pathname, search, searchParams } = request.nextUrl;

  if (pathname === SIGN_IN_PATH) {
    if (!session) return NextResponse.next();
    const returnTo = safeReturnTo(searchParams.get("returnTo"));
    return NextResponse.redirect(new URL(returnTo, request.url));
  }

  if (session) return NextResponse.next();
  const signIn = new URL(SIGN_IN_PATH, request.url);
  signIn.searchParams.set("returnTo", pathname + search);
  return NextResponse.redirect(signIn);
}

export const config = {
  // Everything but static assets and metadata files. API routes answer for
  // themselves.
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
