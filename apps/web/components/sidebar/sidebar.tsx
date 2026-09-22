"use client";

import { Collapsible } from "@base-ui/react/collapsible";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { isNavItemActive } from "@/components/nav/nav-active";
import { NAV_ITEMS } from "@/components/nav/nav-items";

import { useSidebar } from "./sidebar-provider";
import { sidebarStyles } from "./sidebar.styles";
import Avatar from "boring-avatars";
import { ChevronsUpDownIcon } from "lucide-react";

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
              <div aria-hidden className={styles.navIconGlyph()}>
                {item.icon}
              </div>
              <span className={styles.navLabelText()}>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className={styles.footer()}>
        <div className={styles.footerRow()}>
          <Avatar
            name="John Doe"
            variant="beam"
            square
            className={styles.footerGlyph()}
          />
          <div className={styles.footerContent()}>
            <div className={styles.footerLabelPanel()}>
              <span className={styles.footerLabelText()}>John Doe</span>
              <span className={styles.footerSubLabelText()}>john.doe</span>
            </div>
            <button className={styles.footerTrigger()}>
              <ChevronsUpDownIcon className={styles.footerTriggerIcon()} />
            </button>
          </div>
        </div>
      </div>
    </Collapsible.Root>
  );
}
