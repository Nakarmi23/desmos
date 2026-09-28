"use client";

import { useState } from "react";
import { QueryClientProvider, type QueryClient } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { createTRPCContext } from "@trpc/tanstack-react-query";
import superjson from "superjson";

import { signInPath } from "../modules/auth/return-to";
import { makeQueryClient } from "./query-client";
import type { AppRouter } from "./routers/_app";

export const { TRPCProvider, useTRPC, useTRPCClient } =
  createTRPCContext<AppRouter>();

let browserQueryClient: QueryClient | undefined;

function getQueryClient() {
  if (typeof window === "undefined") {
    return makeQueryClient();
  }
  browserQueryClient ??= makeQueryClient();
  return browserQueryClient;
}

function getUrl() {
  const base =
    typeof window !== "undefined"
      ? ""
      : `http://localhost:${process.env.PORT ?? 3000}`;
  return `${base}/api/trpc`;
}

/**
 * `fetch`, except that a 401 — the Session has ended (Suspended, revoked,
 * expired) — sends the browser to sign in, then back where it was.
 */
async function signInOnUnauthorized(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const response = await fetch(input, init);
  if (response.status === 401 && typeof window !== "undefined") {
    const returnTo = window.location.pathname + window.location.search;
    // A full page load, not `router.push`: a client navigation already in
    // flight (e.g. a Table writing its View to the URL) would override a
    // push, and a full load also drops everything cached for the old User.
    window.location.assign(signInPath(returnTo));
  }
  return response;
}

export function TRPCReactProvider({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();
  const [trpcClient] = useState(() =>
    createTRPCClient<AppRouter>({
      links: [
        httpBatchLink({
          url: getUrl(),
          transformer: superjson,
          fetch: signInOnUnauthorized,
        }),
      ],
    }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        {children}
      </TRPCProvider>
    </QueryClientProvider>
  );
}
