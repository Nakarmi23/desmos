import { EventEmitter } from "node:events";

// Every test needs its own copy of the module: destroying the pool is
// permanent, so a pool shared across tests would already be dead.
beforeEach(() => {
  jest.resetModules();
});

describe("db", () => {
  it("exposes a Knex query builder", async () => {
    const { db, destroyPool } = await import("./index");

    expect(typeof db.raw).toBe("function");
    await destroyPool();
  });
});

describe("destroyPool", () => {
  it("is idempotent: concurrent calls share the same destroy", async () => {
    const { destroyPool } = await import("./index");

    expect(destroyPool()).toBe(destroyPool());
    await destroyPool();
  });
});

describe("registerShutdownHandlers", () => {
  it.each(["SIGTERM", "SIGINT"] as const)(
    "destroys the pool and exits the process on %s",
    async (signal) => {
      const { db, destroyPool, registerShutdownHandlers } =
        await import("./index");
      const proc = new EventEmitter() as unknown as NodeJS.Process;
      proc.exit = jest.fn() as unknown as typeof process.exit;

      registerShutdownHandlers(proc);
      proc.emit(signal);
      // The handler's own destroyPool().finally(...) attached first, so this
      // shared, cached promise only settles after that finally has run.
      await destroyPool();

      expect(proc.exit).toHaveBeenCalledWith(0);
      await expect(db.raw("select 1")).rejects.toThrow();
    },
  );
});
