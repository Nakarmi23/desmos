import { createCallerFactory } from "./init";
import { appRouter } from "./routers/_app";

/**
 * The canonical seam for calling procedures without going through HTTP or
 * React rendering — used by tests (see `routers/health.test.ts`).
 */
export const createCaller = createCallerFactory(appRouter);
