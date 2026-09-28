import { cache } from "react";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { createCaller } from "./caller";
import { createContext } from "./context";
import { makeQueryClient } from "./query-client";

/**
 * One `QueryClient` per request — a module-level singleton here would leak
 * data across unrelated users' requests.
 */
export const getQueryClient = cache(makeQueryClient);

/**
 * A caller for Server Components, acting as the signed-in User — the same
 * User an HTTP call from this request would have.
 */
export async function createServerCaller() {
  return createCaller(await createContext());
}

export function HydrateClient({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {children}
    </HydrationBoundary>
  );
}
