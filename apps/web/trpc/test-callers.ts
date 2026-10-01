import { db } from "../db";
import { findPermissionsHeld } from "../modules/permissions/service";
import { createCaller } from "./caller";
import { createContextInner } from "./context";

// For tests: calling `appRouter` in-process as someone or no one.

/**
 * A caller signed in as this User, holding the Permissions their Roles grant
 * right now, as a request would.
 */
export async function callerAs(userId: string) {
  const user = await db("users")
    .where({ id: userId })
    .first("id", "name", "username");
  return createCaller(
    await createContextInner({
      user,
      permissions: await findPermissionsHeld(userId),
    }),
  );
}

/** A caller signed in as the Initial User, who holds every Permission. */
export async function initialUserCaller() {
  const { id } = await db("users").where({ is_initial: true }).first("id");
  return callerAs(id);
}

/** A caller with no Session. */
export async function anonymousCaller() {
  return createCaller(
    await createContextInner({ user: null, permissions: [] }),
  );
}
