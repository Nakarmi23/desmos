import { USERS } from "./users-fixture";

describe("USERS fixture", () => {
  it("has 200 users with unique ids, usernames and emails", () => {
    expect(USERS).toHaveLength(200);
    expect(new Set(USERS.map((u) => u.id)).size).toBe(200);
    expect(new Set(USERS.map((u) => u.username)).size).toBe(200);
    expect(new Set(USERS.map((u) => u.email)).size).toBe(200);
  });

  it("covers every status, and has exactly one Initial User", () => {
    expect(new Set(USERS.map((u) => u.status))).toEqual(
      new Set(["active", "suspended"]),
    );
    expect(USERS.filter((u) => u.isInitial)).toHaveLength(1);
  });

  it("has valid creation dates", () => {
    expect(USERS.every((u) => !Number.isNaN(u.createdAt.getTime()))).toBe(true);
  });
});
