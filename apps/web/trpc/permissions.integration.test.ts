import { db, destroyPool } from "../db";
import { PERMISSIONS } from "../modules/permissions/catalog";
import { findPermissionsHeld } from "../modules/permissions/service";
import { callerAs, initialUserCaller } from "./test-callers";
import { createRole, createUser, removeTestData } from "./test-fixtures";

const USERS_LIST_INPUT = {
  page: 1,
  pageSize: 25,
  sort: null,
  filters: {},
} as const;

const TEST_DATA = {
  usernames: ["perm-nobody", "perm-viewer", "perm-both"],
  roleNames: ["Perm Empty", "Perm Users", "Perm Roles"],
};
const cleanUp = () => removeTestData(TEST_DATA);

describe("Permissions (integration)", () => {
  beforeAll(async () => {
    await db.migrate.latest();
    await cleanUp();
  });
  afterEach(() => cleanUp());
  afterAll(() => destroyPool());

  it("seeds exactly the Permissions the app defines", async () => {
    const seeded = await db("permissions").orderBy("key").pluck("key");

    expect(seeded).toEqual([
      "roles.create",
      "roles.delete",
      "roles.edit",
      "roles.view",
      "users.create",
      "users.edit",
      "users.suspend",
      "users.view",
    ]);
    expect([...PERMISSIONS].sort()).toEqual(seeded);
  });

  describe("users.list", () => {
    it("is forbidden to a User whose Roles don't grant users.view", async () => {
      const role = await createRole("Perm Empty", []);
      const user = await createUser("perm-nobody", [role]);

      await expect(
        (await callerAs(user)).users.list(USERS_LIST_INPUT),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    });

    it("is allowed with users.view", async () => {
      const role = await createRole("Perm Users", ["users.view"]);
      const user = await createUser("perm-viewer", [role]);

      await expect(
        (await callerAs(user)).users.list(USERS_LIST_INPUT),
      ).resolves.toMatchObject({ total: expect.any(Number) });
    });
  });

  describe("roles.list", () => {
    it("is allowed with users.view, for the Users Role filter", async () => {
      const role = await createRole("Perm Users", ["users.view"]);
      const user = await createUser("perm-viewer", [role]);

      await expect((await callerAs(user)).roles.list()).resolves.toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: "Administrator" }),
        ]),
      );
    });

    it("is allowed with roles.view", async () => {
      const role = await createRole("Perm Roles", ["roles.view"]);
      const user = await createUser("perm-viewer", [role]);

      await expect((await callerAs(user)).roles.list()).resolves.toBeDefined();
    });

    it("is forbidden with neither", async () => {
      const role = await createRole("Perm Empty", ["users.create"]);
      const user = await createUser("perm-nobody", [role]);

      await expect((await callerAs(user)).roles.list()).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
    });
  });

  it("combines the Permissions of every Role a User holds", async () => {
    const usersRole = await createRole("Perm Users", ["users.view"]);
    const rolesRole = await createRole("Perm Roles", [
      "roles.view",
      "users.view",
    ]);
    const user = await createUser("perm-both", [usersRole, rolesRole]);

    expect(await findPermissionsHeld(user)).toEqual([
      "users.view",
      "roles.view",
    ]);
  });

  it("gives the Administrator Role every Permission without granting any", async () => {
    const administrator = await db("roles")
      .where({ is_system: true })
      .first("id");
    expect(
      await db("role_permissions").where({ role_id: administrator.id }),
    ).toEqual([]);
    const initialUser = await db("users")
      .where({ is_initial: true })
      .first("id");

    expect(await findPermissionsHeld(initialUser.id)).toEqual([...PERMISSIONS]);
    const admin = await initialUserCaller();
    await expect(admin.users.list(USERS_LIST_INPUT)).resolves.toBeDefined();
    await expect(admin.roles.list()).resolves.toBeDefined();
  });

  it("applies a change to a Role's Permissions from its holders' next request", async () => {
    const role = await createRole("Perm Empty", []);
    const user = await createUser("perm-nobody", [role]);
    await expect(
      (await callerAs(user)).users.list(USERS_LIST_INPUT),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });

    await db("role_permissions").insert({
      role_id: role,
      permission_key: "users.view",
    });

    await expect(
      (await callerAs(user)).users.list(USERS_LIST_INPUT),
    ).resolves.toBeDefined();
  });
});
