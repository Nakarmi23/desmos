import { router } from "../init";
import { healthRouter } from "./health";
import { rolesRouter } from "./roles";

export const appRouter = router({
  health: healthRouter,
  roles: rolesRouter,
});

export type AppRouter = typeof appRouter;
