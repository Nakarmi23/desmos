"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { isNavItemActive } from "../sidebar/nav-active";
import { NAV_ITEMS } from "../sidebar/nav-items";
import { topBarRoot } from "./top-bar.styles";

export function TopBar({ actions }: { actions?: ReactNode }) {
  const pathname = usePathname();
  const activeItem = NAV_ITEMS.find((item) =>
    isNavItemActive(pathname, item.href),
  );

  return (
    <header className={topBarRoot()}>
      <h1 className="text-base font-medium text-text">
        {activeItem?.label ?? "Dashboard"}
      </h1>
      <div className="flex items-center gap-2">{actions}</div>
    </header>
  );
}
