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
