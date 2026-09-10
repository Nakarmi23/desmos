# Seed data authored as migrations, not Knex's seed CLI

Seed data for `apps/web` is written as ordinary tracked migrations in `db/migrations/`, run by the
same `migrate:latest` path as schema changes — Knex's built-in `knex seed` CLI is deliberately never
used. We chose this because `knex seed` re-runs its seed files every invocation with no record of
what has already been applied, which is fine for throwaway dev fixtures but not safe to point at
production data; authoring seeds as migrations makes them ordered, run-once, and tracked in
`knex_migrations`, so dev, test, and prod all seed the same way with the same guarantees as any other
schema change.

**Consequences**: a future reader expecting `knex seed` won't find it, and that's intentional —
there is no separate seed directory or seed script to wire up. Seed data lives in the single
migration timeline; the cost is that a seed is as irreversible as any other migration (it needs a
real `down` or a follow-up migration to undo), which is the trade we want for anything that runs
against production.
