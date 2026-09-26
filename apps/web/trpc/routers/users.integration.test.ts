import { hash } from "@node-rs/argon2";

import { db, destroyPool } from "../../db";
import {
  normalizeEmail,
  normalizeUsername,
} from "../../modules/users/normalize";
import { createCaller } from "../caller";
import { createContextInner } from "../context";

const caller = async () => createCaller(await createContextInner());

type Seed = {
  name: string;
  username: string;
  email: string | null;
  status: "active" | "suspended";
  created_at: Date;
};

// Test Users alongside the migrated Initial User ("Administrator" / admin,
// created now, so it sorts after all of these by creation date).
const SEEDS: Seed[] = [
  {
    name: "Ada Lovelace",
    username: "ada",
    email: "ada@example.com",
    status: "active",
    created_at: new Date("2024-01-01T10:00:00Z"),
  },
  {
    name: "Grace Hopper",
    username: "grace",
    email: "Grace.Hopper@navy.example",
    status: "suspended",
    created_at: new Date("2024-02-01T10:00:00Z"),
  },
  {
    name: "Linus Torvalds",
    username: "linus",
    email: null,
    status: "active",
    created_at: new Date("2024-03-01T10:00:00Z"),
  },
  {
    name: "Barbara Liskov",
    username: "liskov",
    email: "barbara@example.com",
    status: "active",
    created_at: new Date("2024-04-01T10:00:00Z"),
  },
];

// Roles beside the migrated Administrator (held by the Initial User only).
const EXTRA_ROLES = ["Viewer", "Editor"];
const HOLDINGS: Record<string, string[]> = {
  ada: ["Viewer", "Editor"],
  grace: ["Viewer"],
  liskov: ["Editor"],
  // linus holds no Roles.
};

const list = async (input: {
  page?: number;
  pageSize?: number;
  sort?: { columnId: string; direction: "asc" | "desc" } | null;
  filters?: { search?: string; columns?: Record<string, unknown> };
}) =>
  (await caller()).users.list({
    page: 1,
    pageSize: 25,
    sort: null,
    filters: {},
    ...input,
  } as Parameters<Awaited<ReturnType<typeof caller>>["users"]["list"]>[0]);

const usernames = (result: { rows: { username: string }[] }) =>
  result.rows.map((row) => row.username);

describe("users.list (integration)", () => {
  beforeAll(async () => {
    // A freshly migrated database: the Initial User is the only other User.
    await db.migrate.rollback(undefined, true);
    await db.migrate.latest();
    const passwordHash = await hash("irrelevant-test-password");
    const users: { id: string; username: string }[] = await db("users")
      .insert(
        SEEDS.map((seed) => ({
          ...seed,
          // Stored the way every write stores them.
          username: normalizeUsername(seed.username),
          email: normalizeEmail(seed.email),
          password_hash: passwordHash,
        })),
      )
      .returning(["id", "username"]);
    const roles: { id: string; name: string }[] = await db("roles")
      .insert(EXTRA_ROLES.map((name) => ({ name })))
      .returning(["id", "name"]);
    const idOf = (list: { id: string }[], key: string, value: string) =>
      list.find((item) => (item as Record<string, string>)[key] === value)!.id;
    await db("user_roles").insert(
      Object.entries(HOLDINGS).flatMap(([username, names]) =>
        names.map((name) => ({
          user_id: idOf(users, "username", username),
          role_id: idOf(roles, "name", name),
        })),
      ),
    );
  });
  afterAll(async () => {
    const seeded = db("users")
      .whereIn(
        "username",
        SEEDS.map((seed) => seed.username),
      )
      .select("id");
    await db("user_roles").whereIn("user_id", seeded).delete();
    await db("users")
      .whereIn(
        "username",
        SEEDS.map((seed) => seed.username),
      )
      .delete();
    await db("roles").whereIn("name", EXTRA_ROLES).delete();
    await destroyPool();
  });

  it("returns each User's listed fields and never a password hash", async () => {
    const result = await list({
      sort: { columnId: "createdAt", direction: "asc" },
    });

    expect(result.total).toBe(5);
    expect(result.rows[0]).toEqual({
      id: expect.any(String),
      name: "Ada Lovelace",
      username: "ada",
      email: "ada@example.com",
      status: "active",
      isInitial: false,
      roles: [
        { id: expect.any(String), name: "Editor" },
        { id: expect.any(String), name: "Viewer" },
      ],
      createdAt: new Date("2024-01-01T10:00:00Z"),
    });
    expect(result.rows.at(-1)).toMatchObject({
      username: "admin",
      isInitial: true,
    });
    expect(JSON.stringify(result)).not.toMatch(/password|argon2/i);
  });

  it("pages through Users with an accurate total", async () => {
    const sort = { columnId: "createdAt", direction: "asc" } as const;

    const page1 = await list({ page: 1, pageSize: 2, sort });
    const page3 = await list({ page: 3, pageSize: 2, sort });
    const past = await list({ page: 9, pageSize: 2, sort });

    expect(usernames(page1)).toEqual(["ada", "grace"]);
    expect(usernames(page3)).toEqual(["admin"]);
    expect(past.rows).toEqual([]);
    expect([page1.total, page3.total, past.total]).toEqual([5, 5, 5]);
  });

  it.each([
    ["name", ["ada", "admin", "liskov", "grace", "linus"]],
    ["username", ["ada", "admin", "grace", "linus", "liskov"]],
    ["createdAt", ["ada", "grace", "linus", "liskov", "admin"]],
  ])("sorts by %s in both directions", async (columnId, ascending) => {
    const asc = await list({ sort: { columnId, direction: "asc" } });
    const desc = await list({ sort: { columnId, direction: "desc" } });

    expect(usernames(asc)).toEqual(ascending);
    expect(usernames(desc)).toEqual([...ascending].reverse());
  });

  // Ties (same Status, no email) keep creation order in both directions.
  it.each([
    [
      "email",
      // Missing emails (Linus, the Initial User) sort last ascending.
      ["ada", "liskov", "grace", "linus", "admin"],
      ["linus", "admin", "grace", "liskov", "ada"],
    ],
    [
      "status",
      ["ada", "linus", "liskov", "admin", "grace"],
      ["grace", "ada", "linus", "liskov", "admin"],
    ],
  ])("sorts by %s in both directions", async (columnId, asc, desc) => {
    expect(
      usernames(await list({ sort: { columnId, direction: "asc" } })),
    ).toEqual(asc);
    expect(
      usernames(await list({ sort: { columnId, direction: "desc" } })),
    ).toEqual(desc);
  });

  it("Basic Search matches name, username or email, ignoring case", async () => {
    const search = async (term: string) =>
      usernames(await list({ filters: { search: term } })).sort();

    expect(await search("LOVELACE")).toEqual(["ada"]);
    expect(await search("lisk")).toEqual(["liskov"]);
    expect(await search("navy.EXAMPLE")).toEqual(["grace"]);
    expect(await search("example.com")).toEqual(["ada", "liskov"]);
    expect((await list({ filters: { search: "example.com" } })).total).toBe(2);
  });

  it("treats Basic Search wildcards literally", async () => {
    expect((await list({ filters: { search: "%" } })).rows).toEqual([]);
    expect((await list({ filters: { search: "_" } })).rows).toEqual([]);
  });

  it("rejects a sort column the Users Table doesn't have", async () => {
    await expect(
      list({ sort: { columnId: "password_hash", direction: "asc" } }),
    ).rejects.toThrow(/columnId/);
  });

  it("lists each User's Roles by name, and none for a User holding none", async () => {
    const byUsername = Object.fromEntries(
      (await list({})).rows.map((row) => [
        row.username,
        row.roles.map((role) => role.name),
      ]),
    );

    expect(byUsername).toEqual({
      ada: ["Editor", "Viewer"],
      grace: ["Viewer"],
      linus: [],
      liskov: ["Editor"],
      admin: ["Administrator"],
    });
  });

  describe("Advanced Search", () => {
    const filtered = async (
      columns: Record<string, unknown>,
      search?: string,
    ) => usernames(await list({ filters: { search, columns } })).sort();

    it("text columns: contains / eq / startsWith / endsWith, ignoring case", async () => {
      expect(
        await filtered({ name: { operator: "contains", value: "LOV" } }),
      ).toEqual(["ada"]);
      expect(
        await filtered({ username: { operator: "eq", value: "ADA" } }),
      ).toEqual(["ada"]);
      expect(
        await filtered({ username: { operator: "startsWith", value: "li" } }),
      ).toEqual(["linus", "liskov"]);
      // A missing email never matches.
      expect(
        await filtered({ email: { operator: "endsWith", value: ".COM" } }),
      ).toEqual(["ada", "liskov"]);
      expect(
        await filtered({ name: { operator: "contains", value: "%" } }),
      ).toEqual([]);
    });

    it("Status: is any of / is none of", async () => {
      expect(
        await filtered({ status: { operator: "in", values: ["suspended"] } }),
      ).toEqual(["grace"]);
      expect(
        await filtered({
          status: { operator: "notIn", values: ["suspended"] },
        }),
      ).toEqual(["ada", "admin", "linus", "liskov"]);
    });

    it("created: whole UTC days with eq / lt / lte / gt / gte / between", async () => {
      const created = (value: Record<string, unknown>) =>
        filtered({ createdAt: value });

      expect(await created({ operator: "eq", value: "2024-02-01" })).toEqual([
        "grace",
      ]);
      expect(await created({ operator: "lt", value: "2024-02-01" })).toEqual([
        "ada",
      ]);
      expect(await created({ operator: "lte", value: "2024-02-01" })).toEqual([
        "ada",
        "grace",
      ]);
      expect(await created({ operator: "gt", value: "2024-03-01" })).toEqual([
        "admin",
        "liskov",
      ]);
      expect(await created({ operator: "gte", value: "2024-03-01" })).toEqual([
        "admin",
        "linus",
        "liskov",
      ]);
      expect(
        await created({
          operator: "between",
          from: "2024-02-01",
          to: "2024-03-01",
        }),
      ).toEqual(["grace", "linus"]);
      expect(await created({ operator: "between", to: "2024-01-31" })).toEqual([
        "ada",
      ]);
      expect(await created({ operator: "between" })).toHaveLength(5);
    });

    describe("Roles", () => {
      const roleIds = async (...names: string[]) => {
        const roles = await (await caller()).roles.list();
        return names.map((name) => roles.find((r) => r.name === name)!.id);
      };

      it("is any of: Users holding at least one of the Roles", async () => {
        expect(
          await filtered({
            roles: { operator: "in", values: await roleIds("Editor") },
          }),
        ).toEqual(["ada", "liskov"]);
        expect(
          await filtered({
            roles: {
              operator: "in",
              values: await roleIds("Viewer", "Administrator"),
            },
          }),
        ).toEqual(["ada", "admin", "grace"]);
      });

      it("is none of: Users holding none of them, Users with no Roles included", async () => {
        expect(
          await filtered({
            roles: { operator: "notIn", values: await roleIds("Editor") },
          }),
        ).toEqual(["admin", "grace", "linus"]);
        expect(
          await filtered({
            roles: {
              operator: "notIn",
              values: await roleIds("Editor", "Viewer", "Administrator"),
            },
          }),
        ).toEqual(["linus"]);
      });
    });

    it("AND-combines filters with each other and with Basic Search", async () => {
      const [viewer] = await (async () => {
        const roles = await (await caller()).roles.list();
        return [roles.find((r) => r.name === "Viewer")!.id];
      })();

      expect(
        await filtered({
          roles: { operator: "in", values: [viewer] },
          status: { operator: "in", values: ["active"] },
        }),
      ).toEqual(["ada"]);
      expect(
        await filtered(
          { createdAt: { operator: "gte", value: "2024-02-01" } },
          "example",
        ),
      ).toEqual(["grace", "liskov"]);

      const result = await list({
        pageSize: 1,
        filters: {
          columns: { status: { operator: "in", values: ["active"] } },
        },
      });
      expect(result.total).toBe(4);
    });

    it("rejects a filter on a column the Users Table doesn't have, or a malformed value", async () => {
      await expect(
        filtered({ password_hash: { operator: "eq", value: "x" } }),
      ).rejects.toThrow(/password_hash/);
      await expect(
        filtered({ status: { operator: "in", values: ["invited"] } }),
      ).rejects.toThrow();
      await expect(
        filtered({ roles: { operator: "in", values: ["not-a-uuid"] } }),
      ).rejects.toThrow();
      await expect(
        filtered({ createdAt: { operator: "eq", value: "yesterday" } }),
      ).rejects.toThrow();
      await expect(
        filtered({ name: { operator: "between", from: "a" } }),
      ).rejects.toThrow();
    });
  });
});
