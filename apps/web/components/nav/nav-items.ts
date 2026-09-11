// The dashboard's nav model, shared by the sidebar (which renders a row per
// item) and the top bar (which derives the page title from the active item).
export interface NavItem {
  href: string;
  label: string;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/overview", label: "Overview" },
  { href: "/health", label: "Health" },
  { href: "/settings", label: "Settings" },
];
