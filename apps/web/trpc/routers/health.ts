import { protectedProcedure, router } from "../init";

export const healthRouter = router({
  check: protectedProcedure.query(() => ({
    status: "ok" as const,
    timestamp: new Date(),
  })),
});
