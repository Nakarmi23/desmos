"use client";

import { createContext, useContext, type ReactNode } from "react";

import type { CurrentUser } from "@/modules/auth/current-user";
import type { Permission } from "@/modules/permissions/catalog";

/** The client's view of this browser's Session. */
type SignedIn = {
  /** The signed-in User. */
  user: CurrentUser;
  /** The Permissions they hold, as of this page load. */
  permissions: Permission[];
  /** Ends this browser's Session (the Sign out Server Action). */
  signOut: () => Promise<void>;
};

const SessionContext = createContext<SignedIn | null>(null);

/**
 * The signed-in User, their Permissions and Sign out, for client components under the
 * dashboard layout (which provides them).
 */
export function SessionProvider({
  user,
  permissions,
  signOut,
  children,
}: SignedIn & { children: ReactNode }) {
  return (
    <SessionContext.Provider value={{ user, permissions, signOut }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession(): SignedIn {
  const session = useContext(SessionContext);
  if (!session) throw new Error("useSession needs a <SessionProvider>");
  return session;
}
