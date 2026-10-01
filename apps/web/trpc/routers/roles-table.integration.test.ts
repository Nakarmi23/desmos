import { db, destroyPool } from "../../db";
import { PERMISSIONS } from "../../modules/permissions/catalog";
import { callerAs, initialUserCaller } from "../test-callers";
import { createRole, createUser, removeTestData } from "../test-fixtures";

const TEST_DATA = {
  usernames: ["rt-viewer", "rt-ada", "rt-grace", "rt-linus"],
  roleNames: ["RT Viewer", "Auditor", "billing", "Warehouse"],
};

type TableInput = Parameters<
  Awaited<ReturnType<typeof initialUserCaller>>["roles"]["table"]
>[0];

const table = async (input: Partial<TableInput> = {}) =>
  (await initialUserCaller()).roles.table({
    page: 1,
    pageSize: 25,
    sort: null,
    filters: {},
    ...input,
  });

const names = (result: { rows: { name: string }[] }) =>
  result.rows.map((row) => row.name);

describe("roles.table (integration)", () => {
  beforeAll(async () => {
    await db.migrate.latest();
    await removeTestData(TEST_DATA);
  });
  afterAll(async () => {
    await removeTestData(TEST_DATA);
    await destroyPool();
  });

  it("is forbidden without roles.view, even with users.view", async () => {
    const role = await createRole("RT Viewer", ["users.view"]);
    const user = await createUser("rt-viewer", [role]);

    await expect(
      (await callerAs(user)).roles.table({
        page: 1,
        pageSize: 25,
        sort: null,
        filters: {},
      }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });

    await removeTestData(TEST_DATA);
  });

  describe("with Roles", () => {
    beforeAll(async () => {
      const auditor = await createRole(
        "Auditor",
        ["users.view", "roles.view"],
        {
          description: "Reads everything, changes nothing.",
          createdAt: new Date("2024-01-01T00:00:00Z"),
        },
      );
      const billing = await createRole("billing", ["users.view"], {
        description: "Invoices and payments.",
        createdAt: new Date("2024-02-01T00:00:00Z"),
      });
      await createRole("Warehouse", [], {
        createdAt: new Date("2024-03-01T00:00:00Z"),
      });
      await createUser("rt-ada", [auditor, billing]);
      await createUser("rt-grace", [auditor], "suspended");
      await createUser("rt-linus", [auditor]);
    });

    it("lists each Role with its Permission and holder counts", async () => {
      const result = await table({
        sort: { columnId: "name", direction: "asc" },
      });

      expect(result.total).toBe(4);
      expect(result.rows).toEqual([
        {
          id: expect.any(String),
          name: "Administrator",
          description: expect.any(String),
          isSystem: true,
          // Every Permission there is.
          permissionCount: PERMISSIONS.length,
          // Other test files leave Users holding it, so not a fixed number.
          holderCount: expect.any(Number),
          createdAt: expect.any(Date),
        },
        {
          id: expect.any(String),
          name: "Auditor",
          description: "Reads everything, changes nothing.",
          isSystem: false,
          permissionCount: 2,
          // Suspended holders count.
          holderCount: 3,
          createdAt: new Date("2024-01-01T00:00:00Z"),
        },
        expect.objectContaining({
          name: "billing",
          permissionCount: 1,
          holderCount: 1,
        }),
        expect.objectContaining({
          name: "Warehouse",
          description: null,
          permissionCount: 0,
          holderCount: 0,
        }),
      ]);
    });

    it("sorts by holder count and by creation date, both directions", async () => {
      // How many hold Administrator depends on what other test files leave.
      const withoutAdministrator = (result: { rows: { name: string }[] }) =>
        names(result).filter((name) => name !== "Administrator");

      expect(
        withoutAdministrator(
          await table({ sort: { columnId: "holderCount", direction: "desc" } }),
        ),
      ).toEqual(["Auditor", "billing", "Warehouse"]);
      expect(
        withoutAdministrator(
          await table({ sort: { columnId: "holderCount", direction: "asc" } }),
        ),
      ).toEqual(["Warehouse", "billing", "Auditor"]);
      expect(
        names(
          await table({ sort: { columnId: "createdAt", direction: "desc" } }),
        ),
      ).toEqual(["Administrator", "Warehouse", "billing", "Auditor"]);
    });

    it("sorts by name ignoring case", async () => {
      expect(
        names(await table({ sort: { columnId: "name", direction: "desc" } })),
      ).toEqual(["Warehouse", "billing", "Auditor", "Administrator"]);
    });

    it("searches name and description, ignoring case", async () => {
      expect(names(await table({ filters: { search: "BILL" } }))).toEqual([
        "billing",
      ]);
      expect(names(await table({ filters: { search: "payments" } }))).toEqual([
        "billing",
      ]);
      expect(names(await table({ filters: { search: "100%" } }))).toEqual([]);
    });

    it("pages, with the total across all pages", async () => {
      const result = await table({
        page: 2,
        pageSize: 3,
        sort: { columnId: "name", direction: "asc" },
      });

      expect(names(result)).toEqual(["Warehouse"]);
      expect(result.total).toBe(4);
    });

    it("rejects a sort column it can't sort by", async () => {
      await expect(
        table({
          sort: { columnId: "description", direction: "asc" },
        } as unknown as Partial<TableInput>),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    });
  });
});
