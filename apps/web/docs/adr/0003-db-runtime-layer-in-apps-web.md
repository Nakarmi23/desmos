# The database runtime layer lives in `apps/web`, not `@repo/db-core` or a new package

The connection pool, env-validated config, migration runner wiring, and the `modules/<feature>`
DAL/service code all live directly in `apps/web` (under `db/` and `modules/`). We chose this over
putting them in the existing `@repo/db-core` package or spinning up a new `@repo/db` package because
`@repo/db-core` is deliberately a pure, app-agnostic schema-to-DDL _engine_ — it turns declarative
`DBTable` objects into Knex builder calls and knows nothing about connections, pools, or one app's
env — and giving it a live pool or feature DAL code would couple that reusable engine to `apps/web`'s
runtime concerns. There is only one consumer app today, so a separate `@repo/db` package would be
premature indirection with no second consumer to justify it.

**Consequences**: `apps/web` owns its own pool lifecycle, env schema, and data-access code, and takes
`@repo/db-core` as a workspace dependency used only by migration files for schema lowering.
`@repo/db-core` stays free of runtime/connection concerns. If a second app ever needs the same
runtime machinery, that's the point to extract a shared `@repo/db` package — not before.
