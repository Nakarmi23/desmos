import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";

import type { Context } from "./context";

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const router = t.router;
export const createCallerFactory = t.createCallerFactory;

/**
 * Needs no signed-in User. Only the `auth` router's procedures (Sign in
 * itself, token handling) are public; everything in `appRouter` is not.
 */
export const publicProcedure = t.procedure;

/** Needs a signed-in User, then available as `ctx.user`. */
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
  return next({ ctx: { user: ctx.user } });
});
