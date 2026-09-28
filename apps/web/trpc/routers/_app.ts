import { router } from "../init";
import { rolesRouter } from "./roles";
import { usersRouter } from "./users";

export const appRouter = router({
  roles: rolesRouter,
  users: usersRouter,
});

export type AppRouter = typeof appRouter;
