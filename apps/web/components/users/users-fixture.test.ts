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

  it("gives Users several, one or no Roles, the Initial User holding Administrator", () => {
    const counts = new Set(USERS.map((u) => u.roles.length));
    expect(counts).toEqual(new Set([0, 1, 2]));
    expect(
      USERS.find((u) => u.isInitial)!.roles.map((role) => role.name),
    ).toContain("Administrator");
  });

  it("has valid creation dates", () => {
    expect(USERS.every((u) => !Number.isNaN(u.createdAt.getTime()))).toBe(true);
  });
});
