import { getCurrentUser, type CurrentUser } from "../modules/auth/current-user";

/**
 * Inner context: everything a procedure can use, with no request involved.
 * Tests and in-process server callers build it directly, passing whichever
 * User (or none) they call as.
 */
export async function createContextInner({
  user,
}: {
  user: CurrentUser | null;
}) {
  return { user };
}

export type Context = Awaited<ReturnType<typeof createContextInner>>;

/**
 * Outer context factory: `fetchRequestHandler` calls this for each HTTP
 * request. The User comes from that request's Session cookie.
 */
export async function createContext() {
  return createContextInner({ user: await getCurrentUser() });
}
