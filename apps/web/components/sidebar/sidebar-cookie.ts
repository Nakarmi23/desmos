export const SIDEBAR_COLLAPSED_COOKIE_NAME = "sidebar-collapsed";

// One year, roughly — long enough that a returning user's collapse
// preference doesn't silently reset.
const SIDEBAR_COLLAPSED_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function parseSidebarCollapsedCookie(
  cookieValue: string | undefined,
): boolean {
  return cookieValue === "true";
}

// Formats the `document.cookie` assignment that `parseSidebarCollapsedCookie`
// reads back on the next server render.
export function serializeSidebarCollapsedCookie(collapsed: boolean): string {
  return `${SIDEBAR_COLLAPSED_COOKIE_NAME}=${collapsed}; path=/; max-age=${SIDEBAR_COLLAPSED_COOKIE_MAX_AGE}`;
}
