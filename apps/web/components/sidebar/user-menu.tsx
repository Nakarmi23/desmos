"use client";

import { Menu } from "@base-ui/react/menu";
import Avatar from "boring-avatars";
import { ChevronsUpDownIcon, LogOutIcon, SettingsIcon, UserIcon } from "lucide-react";
import Link from "next/link";

import { sidebarStyles } from "./sidebar.styles";

const styles = sidebarStyles();

export function UserMenu() {
  return (
    <Menu.Root>
      <Menu.Trigger className={styles.footerRow()}>
        <Avatar
          name="John Doe"
          variant="beam"
          square
          size={28}
          className={styles.footerGlyph()}
        />
        <div className={styles.footerContent()}>
          <div className={styles.footerLabelPanel()}>
            <span className={styles.footerLabelText()}>John Doe</span>
            <span className={styles.footerSubLabelText()}>john.doe</span>
          </div>
          <span aria-hidden className={styles.footerTrigger()}>
            <ChevronsUpDownIcon className={styles.footerTriggerIcon()} />
          </span>
        </div>
      </Menu.Trigger>

      <Menu.Portal>
        {/* `sideOffset` puts clear air between the sidebar and the popup;
            `align="end"` keeps it from spilling below the viewport since the
            trigger sits at the very bottom of the sidebar. */}
        <Menu.Positioner side="right" align="end" sideOffset={12}>
          <Menu.Popup className={styles.userMenuPopup()}>
            <Menu.LinkItem
              render={<Link href="/settings" />}
              className={styles.userMenuItem()}
            >
              <UserIcon aria-hidden className={styles.userMenuItemIcon()} />
              Profile
            </Menu.LinkItem>
            <Menu.LinkItem
              render={<Link href="/settings" />}
              className={styles.userMenuItem()}
            >
              <SettingsIcon
                aria-hidden
                className={styles.userMenuItemIcon()}
              />
              Settings
            </Menu.LinkItem>

            <Menu.Separator className={styles.userMenuSeparator()} />

            <Menu.Item
              className={styles.userMenuItem({
                className: "text-text-danger data-[highlighted]:bg-background-danger",
              })}
            >
              <LogOutIcon aria-hidden className={styles.userMenuItemIcon()} />
              Log out
            </Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
