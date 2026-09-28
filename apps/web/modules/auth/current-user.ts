import { cookies } from "next/headers";
import { cache } from "react";

import { ACCESS_TOKEN_COOKIE } from "./cookies";
import { findSignedInUser, type SignedInUser } from "./service";

/** The signed-in User, for authorization (`id`) and display. */
export type CurrentUser = SignedInUser;

/**
 * The User whose Session this request carries, or `null`. Read once per
 * request. Uses the request's cookies, which `proxy.ts` has already brought
 * up to date if it refreshed the Session.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const accessToken = (await cookies()).get(ACCESS_TOKEN_COOKIE)?.value;
  if (!accessToken) return null;
  return findSignedInUser(accessToken);
});
