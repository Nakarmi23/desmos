import { db, destroyPool } from "./index";

describe("db (integration)", () => {
  afterAll(() => destroyPool());

  it("connects, runs migrate:latest as a no-op with zero migration files, and destroys the pool on shutdown", async () => {
    await expect(db.raw("select 1")).resolves.toBeDefined();

    const [, migrationsRun] = await db.migrate.latest();
    expect(migrationsRun).toEqual([]);

    await expect(db("knex_migrations").select()).resolves.toEqual([]);
    await expect(db("knex_migrations_lock").select()).resolves.toBeDefined();

    await destroyPool();

    await expect(db.raw("select 1")).rejects.toThrow();
  });
});
