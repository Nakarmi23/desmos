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

const list = async (input: {
  page?: number;
  pageSize?: number;
  sort?: { columnId: string; direction: "asc" | "desc" } | null;
  filters?: { search?: string };
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
    await db("users").insert(
      SEEDS.map((seed) => ({
        ...seed,
        // Stored the way every write stores them.
        username: normalizeUsername(seed.username),
        email: normalizeEmail(seed.email),
        password_hash: passwordHash,
      })),
    );
  });
  afterAll(async () => {
    await db("users")
      .whereIn(
        "username",
        SEEDS.map((seed) => seed.username),
      )
      .delete();
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
});
