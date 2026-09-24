"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { getActiveHref } from "@/components/nav/nav-active";
import { NAV_ITEMS } from "@/components/nav/nav-items";
import { MobileMenuTrigger } from "@/components/sidebar/mobile-menu-trigger";
import { SidebarTrigger } from "@/components/sidebar/sidebar-trigger";

import { topBarStyles } from "./top-bar.styles";

const styles = topBarStyles();

export function TopBar({ actions }: { actions?: ReactNode }) {
  const pathname = usePathname();
  const activeHref = getActiveHref(
    pathname,
    NAV_ITEMS.map((item) => item.href),
  );
  const activeItem = NAV_ITEMS.find((item) => item.href === activeHref);

  return (
    <header className={styles.root()}>
      <div className={styles.titleGroup()}>
        <SidebarTrigger />
        <MobileMenuTrigger />
        <h1 className={styles.title()}>{activeItem?.label ?? "Dashboard"}</h1>
      </div>
      <div className={styles.actions()}>{actions}</div>
    </header>
  );
}
