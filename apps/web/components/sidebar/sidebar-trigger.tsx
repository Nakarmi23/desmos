"use client";

import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

import { IconButton } from "@/components/button/button";
import { useSidebar } from "./sidebar-provider";

export function SidebarTrigger() {
  const { collapsed, setCollapsed } = useSidebar();

  return (
    <IconButton
      aria-expanded={!collapsed}
      label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      onClick={() => setCollapsed(!collapsed)}
      className="hidden lg:flex"
    >
      {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
    </IconButton>
  );
}
