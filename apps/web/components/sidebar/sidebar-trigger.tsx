"use client";

import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

import { useSidebar } from "./sidebar-provider";
import { sidebarStyles } from "./sidebar.styles";

const styles = sidebarStyles();

export function SidebarTrigger() {
  const { collapsed, setCollapsed } = useSidebar();

  return (
    <button
      type="button"
      aria-expanded={!collapsed}
      aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      onClick={() => setCollapsed(!collapsed)}
      className={styles.collapseTrigger({ className: "hidden lg:flex" })}
    >
      {collapsed ? (
        <PanelLeftOpen aria-hidden className={styles.collapseIcon()} />
      ) : (
        <PanelLeftClose aria-hidden className={styles.collapseIcon()} />
      )}
    </button>
  );
}
