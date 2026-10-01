import { getCurrentUser, type CurrentUser } from "../modules/auth/current-user";
import type { Permission } from "../modules/permissions/catalog";
import { getCurrentPermissions } from "../modules/permissions/current-permissions";

/**
 * Inner context: everything a procedure can use, with no request involved.
 * Tests and in-process server callers build it directly, passing whichever
 * User (or none) they call as, and the Permissions that User holds.
 */
export async function createContextInner({
  user,
  permissions,
}: {
  user: CurrentUser | null;
  permissions: Permission[];
}) {
  return { user, permissions };
}

export type Context = Awaited<ReturnType<typeof createContextInner>>;

/**
 * Outer context factory: `fetchRequestHandler` calls this for each HTTP
 * request. The User comes from that request's Session cookie, and their
 * Permissions from their Roles as they are now.
 */
export async function createContext() {
  return createContextInner({
    user: await getCurrentUser(),
    permissions: await getCurrentPermissions(),
  });
}
