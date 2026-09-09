export async function createContextInner() {
  return {};
}

export type Context = Awaited<ReturnType<typeof createContextInner>>;

/**
 * Outer context factory: `fetchRequestHandler` calls this with the incoming
 * request. It ignores that request for now, but this is the seam where a
 * future `protectedProcedure` would pull a session from `opts.req`.
 */
export async function createContext() {
  return createContextInner();
}
