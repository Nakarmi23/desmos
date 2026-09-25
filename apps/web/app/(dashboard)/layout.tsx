import { cookies } from "next/headers";
import type { ReactNode } from "react";

import { MobileSidebarDrawer } from "@/components/sidebar/mobile-sidebar-drawer";
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
      <div className="flex h-screen">
        <Sidebar />
        <MobileSidebarDrawer />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar />
          <main className="flex min-h-0 flex-1 flex-col overflow-auto bg-surface-sunken p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
