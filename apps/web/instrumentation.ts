/**
 * Runs once, before the server accepts requests. An unreachable or
 * misconfigured database must fail loudly here rather than surfacing as a
 * confusing error on the first request. Guarded to the Node.js runtime since
 * `register` also runs under the Edge runtime, where the `pg` driver used by
 * the pool doesn't work.
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return;
  }

  const { db, registerShutdownHandlers } = await import("./db");

  registerShutdownHandlers();
  await db.raw("select 1");
}
