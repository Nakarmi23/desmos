import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

import { createContext } from "@/trpc/context";
import { appRouter } from "@/trpc/routers/_app";

function handler(req: Request) {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext,
  });
}

export { handler as GET, handler as POST };
