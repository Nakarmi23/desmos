import { createCaller } from "./caller";
import { createContextInner } from "./context";

// For tests: calling `appRouter` in-process as someone or no one.

/** A caller signed in as some User; the procedures only need one to exist. */
export async function signedInCaller() {
  return createCaller(
    await createContextInner({ user: { id: "a-signed-in-user" } }),
  );
}

/** A caller with no Session. */
export async function anonymousCaller() {
  return createCaller(await createContextInner({ user: null }));
}
