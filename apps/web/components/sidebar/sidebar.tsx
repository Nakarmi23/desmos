"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Collapsible } from "@base-ui/react/collapsible";

import { useSidebar } from "./sidebar-provider";
import { isNavItemActive } from "./nav-active";
import { NAV_ITEMS } from "./nav-items";
import {
  brandLabelPanel,
  collapseIcon,
  collapseTrigger,
  navIconGlyph,
  navLabelText,
  navLink,
  sidebarRoot,
} from "./sidebar.styles";

export function Sidebar() {
  const { collapsed, toggleCollapsed } = useSidebar();
  const pathname = usePathname();

  return (
    <Collapsible.Root
      open={!collapsed}
      onOpenChange={() => toggleCollapsed()}
      render={<aside className={sidebarRoot()} />}
    >
      <div className="flex h-14 items-center border-b border-border px-3 group-data-[open]:gap-3 group-data-[closed]:justify-center">
        <span
          aria-hidden
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-background-neutral-hovered text-sm font-medium text-text"
        >
          D
        </span>
        <Collapsible.Panel className={brandLabelPanel()}>
          <span className="text-sm font-medium text-text">Desmos</span>
        </Collapsible.Panel>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-2">
        {NAV_ITEMS.map((item) => {
          const active = isNavItemActive(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              data-active={active || undefined}
              className={navLink()}
            >
              <span aria-hidden className={navIconGlyph()}>
                {item.label.charAt(0)}
              </span>
              <span className={navLabelText()}>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-2">
        <Collapsible.Trigger className={collapseTrigger()}>
          <svg
            aria-hidden
            viewBox="0 0 16 16"
            fill="none"
            className={collapseIcon()}
          >
            <path
              d="M10 3 6 8l4 5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="sr-only">
            {collapsed ? "Expand sidebar" : "Collapse sidebar"}
          </span>
        </Collapsible.Trigger>
      </div>
    </Collapsible.Root>
  );
}
