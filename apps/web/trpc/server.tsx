import { cache } from "react";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";

import { createCaller } from "./caller";
import { createContext, createContextInner } from "./context";
import { makeQueryClient } from "./query-client";
import { appRouter } from "./routers/_app";

/**
 * One `QueryClient` per request — a module-level singleton here would leak
 * data across unrelated users' requests.
 */
export const getQueryClient = cache(makeQueryClient);

/**
 * Only used to compute query keys matching what `useTRPC()` produces on the
 * client — the data itself always comes from `createCaller` below, so the
 * initial page load never makes an HTTP hop.
 */
const trpcKeys = createTRPCOptionsProxy({
  router: appRouter,
  ctx: () => createContextInner({ user: null }),
  queryClient: getQueryClient,
});

/**
 * A caller for Server Components, acting as the signed-in User — the same
 * User an HTTP call from this request would have.
 */
export async function createServerCaller() {
  return createCaller(await createContext());
}

export async function prefetchHealthCheck() {
  const queryClient = getQueryClient();
  const caller = await createServerCaller();
  const data = await caller.health.check();
  queryClient.setQueryData(trpcKeys.health.check.queryKey(), data);
}

export function HydrateClient({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {children}
    </HydrationBoundary>
  );
}
