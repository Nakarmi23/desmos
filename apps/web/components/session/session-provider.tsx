"use client";

import { createContext, useContext, type ReactNode } from "react";

import type { CurrentUser } from "@/modules/auth/current-user";

/** The client's view of this browser's Session. */
type SignedIn = {
  /** The signed-in User. */
  user: CurrentUser;
  /** Ends this browser's Session (the Sign out Server Action). */
  signOut: () => Promise<void>;
};

const SessionContext = createContext<SignedIn | null>(null);

/**
 * The signed-in User and Sign out, for client components under the
 * dashboard layout (which provides them).
 */
export function SessionProvider({
  user,
  signOut,
  children,
}: SignedIn & { children: ReactNode }) {
  return (
    <SessionContext.Provider value={{ user, signOut }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession(): SignedIn {
  const session = useContext(SessionContext);
  if (!session) throw new Error("useSession needs a <SessionProvider>");
  return session;
}
