import knex, { type Knex } from "knex";

import knexConfig from "./knexfile";

/**
 * The single shared Knex connection pool for the app. Created once at module
 * load; nothing else should call `knex(...)` directly.
 */
export const db: Knex = knex(knexConfig);

let destroyPromise: Promise<void> | null = null;

/**
 * Destroys the pool. Idempotent — SIGTERM and SIGINT can both fire during
 * shutdown, and repeated calls must share the one underlying destroy rather
 * than racing the pool a second time.
 */
export function destroyPool(): Promise<void> {
  if (!destroyPromise) {
    destroyPromise = db.destroy();
  }
  return destroyPromise;
}

const SHUTDOWN_SIGNALS = ["SIGTERM", "SIGINT"] as const;

/**
 * Wires SIGTERM/SIGINT to a graceful shutdown so stopping the app never
 * leaks open connections. Takes `process` as a parameter (defaulting to the
 * real one) so tests can drive it with a fake emitter instead of sending
 * real signals to the test runner.
 */
export function registerShutdownHandlers(
  proc: NodeJS.Process = process,
): void {
  for (const signal of SHUTDOWN_SIGNALS) {
    proc.once(signal, () => {
      void destroyPool().finally(() => proc.exit(0));
    });
  }
}
