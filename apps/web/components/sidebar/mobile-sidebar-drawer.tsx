"use client";

import { Dialog } from "@base-ui/react/dialog";
import { XIcon } from "lucide-react";
import { usePathname } from "next/navigation";

import { getActiveHref } from "@/components/nav/nav-active";
import { NAV_ITEMS, NAV_SECTIONS } from "@/components/nav/nav-items";

import { NavSectionGroup } from "./nav-section";
import { useSidebar } from "./sidebar-provider";
import { sidebarStyles } from "./sidebar.styles";

const styles = sidebarStyles();

export function MobileSidebarDrawer() {
  const { mobileOpen, setMobileOpen } = useSidebar();
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
              aria-label="Close navigation"
              className={styles.drawerCloseButton()}
            >
              <XIcon aria-hidden className={styles.drawerCloseIcon()} />
            </Dialog.Close>
          </div>

          <nav className={styles.drawerNav()} data-open="true">
            {NAV_SECTIONS.filter((section) => section.items.length > 0).map(
              (section) => (
                <NavSectionGroup
                  key={section.id}
                  section={section}
                  activeHref={activeHref}
                />
              ),
            )}
          </nav>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
