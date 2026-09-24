"use client";

import { MenuIcon } from "lucide-react";

import { useSidebar } from "./sidebar-provider";
import { sidebarStyles } from "./sidebar.styles";

const styles = sidebarStyles();

/** Opens `MobileSidebarDrawer`. Only relevant below `lg`, where the desktop rail is hidden. */
export function MobileMenuTrigger() {
  const { setMobileOpen } = useSidebar();

  return (
    <button
      type="button"
      aria-label="Open navigation"
      onClick={() => setMobileOpen(true)}
      className={styles.collapseTrigger({ className: "lg:hidden" })}
    >
      <MenuIcon aria-hidden className={styles.collapseIcon()} />
    </button>
  );
}
