import { normalizeEmail, normalizeUsername } from "./normalize";

describe("normalizeUsername", () => {
  it("lowercases, so Usernames are unique regardless of case", () => {
    expect(normalizeUsername("Alice")).toBe("alice");
  });
});

describe("normalizeEmail", () => {
  it("lowercases an email, so it's unique regardless of case", () => {
    expect(normalizeEmail("Alice@Example.COM")).toBe("alice@example.com");
  });

  it("keeps a missing email missing", () => {
    expect(normalizeEmail(null)).toBeNull();
  });
});
