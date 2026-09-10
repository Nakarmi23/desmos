"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { isNavItemActive } from "@/components/nav/nav-active";
import { NAV_ITEMS } from "@/components/nav/nav-items";

import { topBarStyles } from "./top-bar.styles";

const styles = topBarStyles();

export function TopBar({ actions }: { actions?: ReactNode }) {
  const pathname = usePathname();
  const activeItem = NAV_ITEMS.find((item) =>
    isNavItemActive(pathname, item.href),
  );

  return (
    <header className={styles.root()}>
      <h1 className={styles.title()}>{activeItem?.label ?? "Dashboard"}</h1>
      <div className={styles.actions()}>{actions}</div>
    </header>
  );
}
