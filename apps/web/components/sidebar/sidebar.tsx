"use client";

import { Collapsible } from "@base-ui/react/collapsible";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { isNavItemActive } from "@/components/nav/nav-active";
import { NAV_ITEMS } from "@/components/nav/nav-items";

import { useSidebar } from "./sidebar-provider";
import { sidebarStyles } from "./sidebar.styles";

const styles = sidebarStyles();

export function Sidebar() {
  const { collapsed, setCollapsed } = useSidebar();
  const pathname = usePathname();

  return (
    <Collapsible.Root
      open={!collapsed}
      onOpenChange={(open) => setCollapsed(!open)}
      render={<aside className={styles.root()} />}
    >
      <div className={styles.header()}>
        <span aria-hidden className={styles.brandGlyph()}>
          D
        </span>
        <Collapsible.Panel className={styles.brandLabelPanel()}>
          <span className={styles.brandLabelText()}>Desmos</span>
        </Collapsible.Panel>
      </div>

      <nav className={styles.nav()}>
        {NAV_ITEMS.map((item) => {
          const active = isNavItemActive(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              data-active={active || undefined}
              aria-current={active ? "page" : undefined}
              className={styles.navLink()}
            >
              <span aria-hidden className={styles.navIconGlyph()}>
                {item.label.charAt(0)}
              </span>
              <span className={styles.navLabelText()}>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className={styles.footer()}>
        <Collapsible.Trigger className={styles.collapseTrigger()}>
          <svg
            aria-hidden
            viewBox="0 0 16 16"
            fill="none"
            className={styles.collapseIcon()}
          >
            <path
              d="M10 3 6 8l4 5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="sr-only">
            {collapsed ? "Expand sidebar" : "Collapse sidebar"}
          </span>
        </Collapsible.Trigger>
      </div>
    </Collapsible.Root>
  );
}
