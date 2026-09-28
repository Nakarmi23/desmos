"use client";

import { Menu } from "@base-ui/react/menu";
import Avatar from "boring-avatars";
import {
  ChevronsUpDownIcon,
  LogOutIcon,
  SettingsIcon,
  UserIcon,
} from "lucide-react";
import Link from "next/link";
import { startTransition } from "react";

import { IconButton } from "@/components/button/button";
import { useSession } from "@/components/session/session-provider";

import { sidebarStyles } from "./sidebar.styles";

const styles = sidebarStyles();

/** The signed-in User's menu, from the foot of the sidebar. */
export function UserMenu() {
  const { user } = useSession();

  return (
    <Menu.Root>
      <Menu.Trigger className={styles.footerRow()}>
        <UserAvatar name={user.name} size={28} />
        <div className={styles.footerContent()}>
          <div className={styles.footerLabelPanel()}>
            <span className={styles.footerLabelText()}>{user.name}</span>
            <span className={styles.footerSubLabelText()}>{user.username}</span>
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
          <UserMenuPopup />
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

/**
 * The same menu from an avatar button, for the TopBar on small screens,
 * where the sidebar (and its menu) is off-canvas.
 */
export function UserMenuButton() {
  const { user } = useSession();

  return (
    <Menu.Root>
      <Menu.Trigger
        render={
          <IconButton label={`Account: ${user.name}`} className="lg:hidden" />
        }
      >
        <UserAvatar name={user.name} size={24} />
      </Menu.Trigger>

      <Menu.Portal>
        <Menu.Positioner side="bottom" align="end" sideOffset={8}>
          <UserMenuPopup />
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

function UserAvatar({ name, size }: { name: string; size: number }) {
  return (
    <Avatar
      name={name}
      variant="beam"
      square
      size={size}
      className={styles.footerGlyph()}
    />
  );
}

function UserMenuPopup() {
  const { signOut } = useSession();

  return (
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
        <SettingsIcon aria-hidden className={styles.userMenuItemIcon()} />
        Settings
      </Menu.LinkItem>

      <Menu.Separator className={styles.userMenuSeparator()} />

      <Menu.Item
        onClick={() => startTransition(() => signOut())}
        className={styles.userMenuItem({
          className: "text-text-danger data-[highlighted]:bg-background-danger",
        })}
      >
        <LogOutIcon aria-hidden className={styles.userMenuItemIcon()} />
        Sign out
      </Menu.Item>
    </Menu.Popup>
  );
}
