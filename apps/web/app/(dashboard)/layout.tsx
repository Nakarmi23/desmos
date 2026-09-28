import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { SessionProvider } from "@/components/session/session-provider";
import { MobileSidebarDrawer } from "@/components/sidebar/mobile-sidebar-drawer";
import { Sidebar } from "@/components/sidebar/sidebar";
import {
  SIDEBAR_COLLAPSED_COOKIE_NAME,
  parseSidebarCollapsedCookie,
} from "@/components/sidebar/sidebar-cookie";
import { SidebarProvider } from "@/components/sidebar/sidebar-provider";
import { TopBar } from "@/components/top-bar/top-bar";
import { getCurrentUser } from "@/modules/auth/current-user";
import { SIGN_IN_PATH } from "@/modules/auth/return-to";

import { signOut } from "./actions";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  // `proxy.ts` already turns away requests without a Session; this is the
  // check that doesn't depend on it.
  const user = await getCurrentUser();
  if (!user) redirect(SIGN_IN_PATH);

  const cookieStore = await cookies();
  const defaultCollapsed = parseSidebarCollapsedCookie(
    cookieStore.get(SIDEBAR_COLLAPSED_COOKIE_NAME)?.value,
  );

  return (
    <SessionProvider user={user} signOut={signOut}>
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
    </SessionProvider>
  );
}
