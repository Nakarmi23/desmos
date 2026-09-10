import { cookies } from "next/headers";
import type { ReactNode } from "react";

import { Sidebar } from "@/components/sidebar/sidebar";
import {
  SIDEBAR_COLLAPSED_COOKIE_NAME,
  parseSidebarCollapsedCookie,
} from "@/components/sidebar/sidebar-cookie";
import { SidebarProvider } from "@/components/sidebar/sidebar-provider";
import { TopBar } from "@/components/top-bar/top-bar";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const cookieStore = await cookies();
  const defaultCollapsed = parseSidebarCollapsedCookie(
    cookieStore.get(SIDEBAR_COLLAPSED_COOKIE_NAME)?.value,
  );

  return (
    <SidebarProvider defaultCollapsed={defaultCollapsed}>
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex flex-1 flex-col">
          <TopBar />
          <main className="flex-1 bg-surface-sunken p-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
