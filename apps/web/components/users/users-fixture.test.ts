import { USERS } from "./users-fixture";

describe("USERS fixture", () => {
  it("has 200 users with unique ids and emails", () => {
    expect(USERS).toHaveLength(200);
    expect(new Set(USERS.map((u) => u.id)).size).toBe(200);
    expect(new Set(USERS.map((u) => u.email)).size).toBe(200);
  });

  it("covers every role and status", () => {
    expect(new Set(USERS.map((u) => u.role))).toEqual(
      new Set(["admin", "member", "viewer"]),
    );
    expect(new Set(USERS.map((u) => u.status))).toEqual(
      new Set(["active", "invited", "suspended"]),
    );
  });

  it("has valid creation dates", () => {
    expect(USERS.every((u) => !Number.isNaN(u.createdAt.getTime()))).toBe(true);
  });
});
