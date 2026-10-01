"use client";

import { Dialog } from "@base-ui/react/dialog";
import { XIcon } from "lucide-react";
import { usePathname } from "next/navigation";

import { IconButton } from "@/components/button/button";
import { getActiveHref } from "@/components/nav/nav-active";
import { NAV_ITEMS, visibleNavSections } from "@/components/nav/nav-items";
import { useSession } from "@/components/session/session-provider";

import { NavSectionGroup } from "./nav-section";
import { useSidebar } from "./sidebar-provider";
import { sidebarStyles } from "./sidebar.styles";

const styles = sidebarStyles();

export function MobileSidebarDrawer() {
  const { mobileOpen, setMobileOpen } = useSidebar();
  const { permissions } = useSession();
  const pathname = usePathname();
  const activeHref = getActiveHref(
    pathname,
    NAV_ITEMS.map((item) => item.href),
  );

  return (
    <Dialog.Root open={mobileOpen} onOpenChange={setMobileOpen}>
      <Dialog.Portal>
        <Dialog.Backdrop className={styles.drawerBackdrop()} />
        <Dialog.Popup aria-label="Navigation" className={styles.drawerPopup()}>
          <div className={styles.drawerHeader()}>
            <span aria-hidden className={styles.brandGlyph()}>
              D
            </span>
            <div className={styles.drawerBrandLabel()}>
              <span className={styles.brandLabelText()}>Desmos</span>
              <span className={styles.brandSubLabelText()}>
                Dynamic Admin System
              </span>
            </div>
            <Dialog.Close
              render={
                <IconButton label="Close navigation">
                  <XIcon />
                </IconButton>
              }
            />
          </div>

          <nav className={styles.drawerNav()} data-open="true">
            {visibleNavSections(permissions).map((section) => (
              <NavSectionGroup
                key={section.id}
                section={section}
                activeHref={activeHref}
                showTooltips={false}
              />
            ))}
          </nav>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
