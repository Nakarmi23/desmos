"use client";

import { Collapsible } from "@base-ui/react/collapsible";
import { usePathname } from "next/navigation";

import { getActiveHref } from "@/components/nav/nav-active";
import { NAV_ITEMS, visibleNavSections } from "@/components/nav/nav-items";
import { useSession } from "@/components/session/session-provider";

import { NavSectionGroup } from "./nav-section";
import { useSidebar } from "./sidebar-provider";
import { sidebarStyles } from "./sidebar.styles";
import { UserMenu } from "./user-menu";

const styles = sidebarStyles();

export function Sidebar() {
  const { collapsed, setCollapsed } = useSidebar();
  const { permissions } = useSession();
  const pathname = usePathname();
  const activeHref = getActiveHref(
    pathname,
    NAV_ITEMS.map((item) => item.href),
  );

  return (
    <Collapsible.Root
      open={!collapsed}
      onOpenChange={(open) => setCollapsed(!open)}
      render={<aside className={styles.root()} />}
    >
      <header className={styles.header()}>
        <span aria-hidden className={styles.brandGlyph()}>
          D
        </span>
        <Collapsible.Panel className={styles.brandLabelPanel()}>
          <span className={styles.brandLabelText()}>Desmos</span>
          <span className={styles.brandSubLabelText()}>
            Dynamic Admin System
          </span>
        </Collapsible.Panel>
      </header>

      <nav className={styles.nav()}>
        {visibleNavSections(permissions).map((section) => (
          <NavSectionGroup
            key={section.id}
            section={section}
            activeHref={activeHref}
            showTooltips={collapsed}
          />
        ))}
      </nav>

      <div className={styles.footer()}>
        <UserMenu />
      </div>
    </Collapsible.Root>
  );
}
