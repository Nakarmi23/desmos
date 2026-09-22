export function isNavItemActive(pathname: string, href: string): boolean {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

// When multiple nav items match the current path (e.g. sibling items
// "/modules" and "/modules/users"), only the most specific one — the longest
// matching href — should render as active.
export function getActiveHref(
  pathname: string,
  hrefs: string[],
): string | undefined {
  return hrefs
    .filter((href) => isNavItemActive(pathname, href))
    .sort((a, b) => b.length - a.length)[0];
}
