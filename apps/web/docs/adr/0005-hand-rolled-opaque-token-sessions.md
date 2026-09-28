# Hand-rolled Sessions with opaque, DB-backed access and refresh tokens

Authentication is built in-house (argon2id + a Knex-migrated sessions table), not with Auth.js or
Better Auth: sign-in is Username + password only, Auth.js treats credentials as second-class and
nudges toward JWTs, and Better Auth owns its own schema/migrations, clashing with ADR 0002/0003.
Each Session has a short-lived (15 min) access token and a refresh token that rotates on every use,
with reuse after a 30-second grace window revoking the whole Session. **Both tokens are opaque and
checked against the DB — no JWTs** — because a Suspended User (or one left with no Roles) must lose
access immediately, which a stateless access token can't guarantee without a per-request DB check
that would erase its benefit. The access/refresh split (rather than one rotating Session token) is
there for a planned non-browser client, which can hold the pair and refresh the conventional way.

**Consequences**: every authenticated request costs a DB lookup. Only SHA-256 hashes of tokens are
stored. The `auth` tRPC procedures deal only in tokens, never cookies; the browser gets them via
thin adapters (Server Actions for Sign in/out, `proxy.ts` for transparent refresh), since Server
Components can't set cookies.

**Grace-window reuse gets an access token only.** Parallel requests (tabs, a page and its RSC
fetches) refresh with the same token at once, and the browser applies their `Set-Cookie`s in
whatever order responses land. If reuse rotated the refresh token again, the browser could keep a
superseded one and a later refresh would look like theft, revoking a legitimate Session. So only
the current refresh token ever rotates; reuse within the window gets a new access token and keeps
the replacement. A Session therefore holds several live access tokens (`session_access_tokens`),
each living out its 15 minutes — a new one never cancels another request's.

Accepted consequences: a refresh doesn't end the old access token early (it lives out its 15
minutes; revocation and Suspension still end every token at once). Only the most recently replaced
refresh token is remembered, so one replaced two or more rotations ago is simply unknown — refused,
but it doesn't trigger revocation; catching those would need a table of every token a Session has
had. "Use", for the 7-day idle timeout, means a refresh.
