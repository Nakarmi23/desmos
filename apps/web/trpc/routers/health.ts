import { publicProcedure, router } from "../init";

export const healthRouter = router({
  check: publicProcedure.query(() => ({
    status: "ok" as const,
    timestamp: new Date(),
  })),
});
