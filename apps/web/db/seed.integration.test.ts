import { verify } from "@node-rs/argon2";

import { db, destroyPool } from "./index";

const INITIAL_ADMIN_VARS = [
  "INITIAL_ADMIN_USERNAME",
  "INITIAL_ADMIN_PASSWORD",
  "INITIAL_ADMIN_NAME",
  "INITIAL_ADMIN_EMAIL",
] as const;

function setInitialAdminEnv(env: Partial<Record<string, string>>) {
  for (const key of INITIAL_ADMIN_VARS) delete process.env[key];
  Object.assign(process.env, env);
}

/** Every migration undone, then run again: a fresh database. */
async function migrateFromEmpty() {
  await db.migrate.rollback(undefined, true);
  const [, run] = await db.migrate.latest();
  return run as string[];
}

const initialRoles = () => db("roles").select();
const initialUsers = () => db("users").select();

describe("Initial Role and Initial User seed (integration)", () => {
  afterAll(async () => {
    setInitialAdminEnv({});
    await migrateFromEmpty();
    await destroyPool();
  });

  describe("with the dev/test defaults", () => {
    beforeAll(async () => {
      setInitialAdminEnv({});
      await migrateFromEmpty();
    });

    it("creates exactly one Initial Role: Administrator, a System Role", async () => {
      expect(await initialRoles()).toEqual([
        expect.objectContaining({ name: "Administrator", is_system: true }),
      ]);
    });

    it("creates exactly one Initial User, active, holding the Initial Role", async () => {
      const users = await initialUsers();
      expect(users).toEqual([
        expect.objectContaining({
          username: "admin",
          name: "Administrator",
          email: null,
          status: "active",
          is_initial: true,
        }),
      ]);

      const [role] = await initialRoles();
      expect(await db("user_roles").select()).toEqual([
        { user_id: users[0].id, role_id: role.id },
      ]);
    });

    it("stores the password only as an argon2id hash of the configured one", async () => {
      const [user] = await initialUsers();
      expect(user.password_hash).toMatch(/^\$argon2id\$/);
      expect(user.password_hash).not.toContain("local-dev-admin-password");
      await expect(
        verify(user.password_hash, "local-dev-admin-password"),
      ).resolves.toBe(true);
      await expect(verify(user.password_hash, "wrong-password")).resolves.toBe(
        false,
      );
    });

    it("runs once: re-running the migrations is a no-op", async () => {
      const [, run] = await db.migrate.latest();

      expect(run).toEqual([]);
      expect(await initialRoles()).toHaveLength(1);
      expect(await initialUsers()).toHaveLength(1);
    });
  });

  it("takes the configured credentials, lowercasing username and email", async () => {
    setInitialAdminEnv({
      INITIAL_ADMIN_USERNAME: "Root",
      INITIAL_ADMIN_PASSWORD: "a-configured-password-of-some-length",
      INITIAL_ADMIN_NAME: "Site Owner",
      INITIAL_ADMIN_EMAIL: "Owner@Example.com",
    });
    await migrateFromEmpty();

    const [user] = await initialUsers();
    expect(user).toMatchObject({
      username: "root",
      name: "Site Owner",
      email: "owner@example.com",
    });
    await expect(
      verify(user.password_hash, "a-configured-password-of-some-length"),
    ).resolves.toBe(true);
  });

  it("fails with a descriptive error when the password is under 24 characters", async () => {
    setInitialAdminEnv({ INITIAL_ADMIN_PASSWORD: "too-short" });
    await db.migrate.rollback(undefined, true);

    await expect(db.migrate.latest()).rejects.toThrow(/INITIAL_ADMIN_PASSWORD/);
    // The batch runs in one transaction: nothing is left half-applied.
    expect(await db("knex_migrations").select()).toEqual([]);
    expect(await db.schema.hasTable("users")).toBe(false);
  });
});
