import { isNavItemActive } from "./nav-active";

describe("isNavItemActive", () => {
  it("matches an exact path", () => {
    expect(isNavItemActive("/overview", "/overview")).toBe(true);
  });

  it("matches a nested path under the nav item's href", () => {
    expect(isNavItemActive("/settings/profile", "/settings")).toBe(true);
  });

  it("does not match an unrelated path", () => {
    expect(isNavItemActive("/overview", "/settings")).toBe(false);
  });

  it("does not match a different item that merely shares a prefix", () => {
    expect(isNavItemActive("/settings-billing", "/settings")).toBe(false);
  });

  it("only matches the root href on an exact root path", () => {
    expect(isNavItemActive("/overview", "/")).toBe(false);
    expect(isNavItemActive("/", "/")).toBe(true);
  });
});
