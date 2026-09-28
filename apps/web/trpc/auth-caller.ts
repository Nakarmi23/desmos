import { createCallerFactory } from "./init";
import { authRouter } from "./routers/auth";

const createAuthCaller = createCallerFactory(authRouter);

/**
 * The only way to reach `authRouter`: server code (Server Actions, the proxy)
 * calls it in-process, as no one in particular.
 */
export function authCaller() {
  return createAuthCaller({ user: null });
}
