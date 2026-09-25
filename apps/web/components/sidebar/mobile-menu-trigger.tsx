"use client";

import { MenuIcon } from "lucide-react";

import { IconButton } from "@/components/button/button";
import { useSidebar } from "./sidebar-provider";

/** Opens `MobileSidebarDrawer`. Only relevant below `lg`, where the desktop rail is hidden. */
export function MobileMenuTrigger() {
  const { setMobileOpen } = useSidebar();

  return (
    <IconButton
      label="Open navigation"
      onClick={() => setMobileOpen(true)}
      className="lg:hidden"
    >
      <MenuIcon />
    </IconButton>
  );
}
