import { router } from "../init";
import { healthRouter } from "./health";
import { rolesRouter } from "./roles";
import { usersRouter } from "./users";

export const appRouter = router({
  health: healthRouter,
  roles: rolesRouter,
  users: usersRouter,
});

export type AppRouter = typeof appRouter;
