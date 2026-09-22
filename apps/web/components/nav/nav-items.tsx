import {
  Activity,
  HeartPulse,
  Layers,
  LayoutGrid,
  Settings,
  ShieldCheck,
  Table2,
  Users,
} from "lucide-react";

// The dashboard's nav model, shared by the sidebar (which renders a section
// per group) and the top bar (which derives the page title from the active
// item via the flattened `NAV_ITEMS`).
export interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

export interface NavSection {
  id: string;
  label: string;
  items: NavItem[];
  // Sections that can grow long (e.g. one nav entry per DB table) render
  // with a collapse toggle and a search box to filter their items.
  collapsible?: boolean;
}

// `main` holds the app's general pages (overview, and anything else that
// isn't tied to a specific DB-backed module). `modules` holds the nav entries
// for dynamic, DB-backed admin modules — real ones don't exist yet, so its
// items below are mocked; the sidebar skips rendering this section entirely
// once `items` is empty again.
export const NAV_SECTIONS: NavSection[] = [
  {
    id: "main",
    label: "General",
    items: [
      { href: "/overview", label: "Overview", icon: <Layers size={14} /> },
      { href: "/activity", label: "Activity", icon: <Activity size={14} /> },
      { href: "/health", label: "Health", icon: <HeartPulse size={14} /> },
      {
        href: "/modules/users",
        label: "Users",
        icon: <Users size={14} />,
      },
      {
        href: "/roles",
        label: "Roles",
        icon: <ShieldCheck size={14} />,
      },
      {
        href: "/modules",
        label: "Modules",
        icon: <LayoutGrid size={14} />,
      },
      { href: "/settings", label: "Settings", icon: <Settings size={14} /> },
    ],
  },
  {
    id: "modules",
    label: "Modules",
    collapsible: true,
    // Mocked stand-ins for dynamic, DB-backed admin modules — no module
    // generation exists yet, so these are hardcoded until a real one lands.
    items: [
      {
        href: "/modules/orders",
        label: "Orders",
        icon: <Table2 size={14} />,
      },
      {
        href: "/modules/products",
        label: "Products",
        icon: <Table2 size={14} />,
      },
    ],
  },
];

export const NAV_ITEMS: NavItem[] = NAV_SECTIONS.flatMap(
  (section) => section.items,
);
