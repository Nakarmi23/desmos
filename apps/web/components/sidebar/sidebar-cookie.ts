export const SIDEBAR_COLLAPSED_COOKIE_NAME = "sidebar-collapsed";

// One year, roughly — long enough that a returning user's collapse
// preference doesn't silently reset.
export const SIDEBAR_COLLAPSED_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function parseSidebarCollapsedCookie(
  cookieValue: string | undefined,
): boolean {
  return cookieValue === "true";
}
