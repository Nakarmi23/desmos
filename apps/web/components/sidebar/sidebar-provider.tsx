"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { serializeSidebarCollapsedCookie } from "./sidebar-cookie";

interface SidebarContextValue {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

export function SidebarProvider({
  defaultCollapsed,
  children,
}: {
  defaultCollapsed: boolean;
  children: ReactNode;
}) {
  const [collapsed, setCollapsedState] = useState(defaultCollapsed);

  // Persisting on every change (rather than in an effect) keeps the cookie
  // untouched for users who never toggle the sidebar.
  const setCollapsed = useCallback((next: boolean) => {
    setCollapsedState(next);
    document.cookie = serializeSidebarCollapsedCookie(next);
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "b") {
        event.preventDefault();
        setCollapsed(!collapsed);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [collapsed, setCollapsed]);

  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}
