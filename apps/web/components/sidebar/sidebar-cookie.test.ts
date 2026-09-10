import {
  SIDEBAR_COLLAPSED_COOKIE_NAME,
  parseSidebarCollapsedCookie,
  serializeSidebarCollapsedCookie,
} from "./sidebar-cookie";

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

describe("serializeSidebarCollapsedCookie", () => {
  it("writes a site-wide, long-lived cookie", () => {
    expect(serializeSidebarCollapsedCookie(true)).toBe(
      `${SIDEBAR_COLLAPSED_COOKIE_NAME}=true; path=/; max-age=31536000`,
    );
  });

  it("round-trips through the parser", () => {
    for (const collapsed of [true, false]) {
      const [nameAndValue] =
        serializeSidebarCollapsedCookie(collapsed).split("; ");
      const value = nameAndValue.slice(
        `${SIDEBAR_COLLAPSED_COOKIE_NAME}=`.length,
      );

      expect(parseSidebarCollapsedCookie(value)).toBe(collapsed);
    }
  });
});
