import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  refresh,
  signIn,
  validateAccessToken,
} from "../../modules/auth/service";
import { publicProcedure, router } from "../init";

/** The one message every failed Sign in gets, whatever the reason. */
export const SIGN_IN_FAILED_MESSAGE = "Username or password is incorrect";

/**
 * Sign in and Session tokens (ADR 0005). Deals only in tokens, never
 * cookies, and is deliberately not part of `appRouter`: nothing serves it
 * over HTTP. Server code reaches it through `authCaller()`.
 */
export const authRouter = router({
  signIn: publicProcedure
    .input(
      z.object({
        username: z.string(),
        password: z.string(),
        userAgent: z.string().nullish(),
        ip: z.string().nullish(),
      }),
    )
    .mutation(async ({ input }) => {
      const tokens = await signIn(input);
      if (!tokens) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: SIGN_IN_FAILED_MESSAGE,
        });
      }
      return tokens;
    }),

  /** The User whose Session this access token belongs to, or `null` if it has ended. */
  validate: publicProcedure
    .input(z.object({ accessToken: z.string() }))
    .query(({ input }) => validateAccessToken(input.accessToken)),

  /** New tokens for a refresh token's Session (see `refresh`), or `null` if it has ended. */
  refresh: publicProcedure
    .input(z.object({ refreshToken: z.string() }))
    .mutation(({ input }) => refresh(input.refreshToken)),
});
