import { db, destroyPool } from "../../db";
import { createCaller } from "../caller";
import { createContextInner } from "../context";

const caller = async () => createCaller(await createContextInner());

describe("roles.list (integration)", () => {
  beforeAll(() => db.migrate.latest());
  afterAll(() => destroyPool());

  it("returns the seeded Administrator Role as a System Role", async () => {
    expect(await (await caller()).roles.list()).toEqual([
      {
        id: expect.any(String),
        name: "Administrator",
        description: expect.any(String),
        isSystem: true,
      },
    ]);
  });

  it("keeps Role names unique regardless of case", async () => {
    await expect(db("roles").insert({ name: "ADMINISTRATOR" })).rejects.toThrow(
      /roles_name_lower_unique/,
    );
  });

  describe("with other Roles", () => {
    const names = ["auditor", "Zebra keeper", "Billing"];

    beforeAll(() => db("roles").insert(names.map((name) => ({ name }))));
    afterAll(() => db("roles").whereIn("name", names).delete());

    it("lists every Role ordered by name, ignoring case", async () => {
      const roles = await (await caller()).roles.list();

      expect(roles.map((role) => role.name)).toEqual([
        "Administrator",
        "auditor",
        "Billing",
        "Zebra keeper",
      ]);
      expect(roles.find((role) => role.name === "Billing")).toEqual({
        id: expect.any(String),
        name: "Billing",
        description: null,
        isSystem: false,
      });
    });
  });
});
