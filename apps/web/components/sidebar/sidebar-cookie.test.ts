import { parseSidebarCollapsedCookie } from "./sidebar-cookie";

describe("parseSidebarCollapsedCookie", () => {
  it("parses the literal string 'true' as collapsed", () => {
    expect(parseSidebarCollapsedCookie("true")).toBe(true);
  });

  it("parses the literal string 'false' as expanded", () => {
    expect(parseSidebarCollapsedCookie("false")).toBe(false);
  });

  it("defaults to expanded when the cookie is missing", () => {
    expect(parseSidebarCollapsedCookie(undefined)).toBe(false);
  });

  it("defaults to expanded for an unrecognized value", () => {
    expect(parseSidebarCollapsedCookie("yes")).toBe(false);
  });
});
