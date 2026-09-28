"use server";

import { TRPCError } from "@trpc/server";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import type { SignInState } from "@/components/sign-in/sign-in-form";
import { setSessionCookies } from "@/modules/auth/cookies";
import { safeReturnTo } from "@/modules/auth/return-to";
import { authCaller } from "@/trpc/auth-caller";

/**
 * Sign in from the sign-in form: the tokens `auth.signIn` hands back go into
 * cookies, then the User is sent where they were going. A refusal comes back
 * as the generic message for the form to show.
 */
export async function signIn(
  _state: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const username = String(formData.get("username") ?? "");
  const requestHeaders = await headers();

  let tokens;
  try {
    tokens = await authCaller().signIn({
      username,
      password: String(formData.get("password") ?? ""),
      userAgent: requestHeaders.get("user-agent"),
      ip: clientIp(requestHeaders),
    });
  } catch (error) {
    if (error instanceof TRPCError && error.code === "UNAUTHORIZED") {
      return { error: error.message, username };
    }
    throw error;
  }

  setSessionCookies(await cookies(), tokens);
  redirect(safeReturnTo(formData.get("returnTo")?.toString()));
}

/**
 * The client's address as the nearest proxy reports it, if any. The header
 * is client-supplied unless a trusted proxy overwrites it, so this is an
 * audit hint only — never use it for access decisions.
 */
function clientIp(requestHeaders: Headers): string | null {
  const forwarded = requestHeaders.get("x-forwarded-for")?.split(",")[0];
  return forwarded?.trim() || requestHeaders.get("x-real-ip");
}
