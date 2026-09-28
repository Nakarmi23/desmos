import { cookies } from "next/headers";
import { cache } from "react";

import { ACCESS_TOKEN_COOKIE } from "./cookies";
import { validateAccessToken } from "./service";

/** The signed-in User, as far as authorization needs to know. */
export type CurrentUser = { id: string };

/**
 * The User whose Session this request carries, or `null`. Read once per
 * request. Uses the request's cookies, which `proxy.ts` has already brought
 * up to date if it refreshed the Session.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const accessToken = (await cookies()).get(ACCESS_TOKEN_COOKIE)?.value;
  if (!accessToken) return null;
  const session = await validateAccessToken(accessToken);
  return session && { id: session.userId };
});
