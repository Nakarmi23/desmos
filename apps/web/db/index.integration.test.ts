import { readdirSync } from "node:fs";
import path from "node:path";

import { db, destroyPool } from "./index";

const migrationFiles = readdirSync(path.join(__dirname, "migrations"))
  .filter((file) => file.endsWith(".ts"))
  .sort();

describe("db (integration)", () => {
  afterAll(() => destroyPool());

  it("connects, runs migrate:latest (then as a no-op), and destroys the pool on shutdown", async () => {
    await expect(db.raw("select 1")).resolves.toBeDefined();

    await db.migrate.latest();
    const [, rerun] = await db.migrate.latest();
    expect(rerun).toEqual([]);

    const applied = await db("knex_migrations").orderBy("id").pluck("name");
    expect(applied).toEqual(migrationFiles);
    expect(migrationFiles.length).toBeGreaterThan(0);
    await expect(db("knex_migrations_lock").select()).resolves.toBeDefined();

    await destroyPool();

    await expect(db.raw("select 1")).rejects.toThrow();
  });
});
