"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  clearSessionCookies,
} from "@/modules/auth/cookies";
import { SIGN_IN_PATH } from "@/modules/auth/return-to";
import { authCaller } from "@/trpc/auth-caller";

/**
 * Sign out: ends this browser's Session (the User's others go on), clears
 * its cookies, and lands on the sign-in page — the last two even if ending
 * the Session fails.
 */
export async function signOut(): Promise<void> {
  const cookieStore = await cookies();
  try {
    await authCaller().signOut({
      refreshToken: cookieStore.get(REFRESH_TOKEN_COOKIE)?.value,
      accessToken: cookieStore.get(ACCESS_TOKEN_COOKIE)?.value,
    });
  } finally {
    clearSessionCookies(cookieStore);
  }
  redirect(SIGN_IN_PATH);
}
