# Module / DAL convention for DB-backed features

This is the agreed shape every future DB-backed feature in `apps/web` follows, so the first real
feature doesn't have to re-litigate where its data-access code goes. No `modules/` folders exist
yet — they're created lazily by the first feature that needs one, not scaffolded ahead of time.

## `modules/<feature>/{dal.ts, service.ts}`

A feature owns a folder under `modules/<feature>/`:

- **`dal.ts`** — the data-access layer: plain functions that read and write that feature's tables
  via the shared Knex pool. No classes, no repository objects — just functions taking the arguments
  they need and returning rows. One function does one query (or one simple query with its obvious
  variants).
- **`service.ts`** — only for logic that spans multiple steps or multiple tables: a write that has
  to touch two tables in a transaction, a read that composes several DAL calls, business rules that
  don't belong in a single query. A feature whose DAL functions are called directly with no
  orchestration needed doesn't get a `service.ts` until it actually has multi-step logic.

`trpc/routers/` stays where it is. Routers import from `modules/<feature>/` (the service when there
is one, otherwise the DAL directly); data-access code does not move into `trpc/`, and routers hold
no SQL of their own.

## Join tables

- **A bare linking table** — two foreign keys, no attributes of its own — stays **inline in the
  service of whichever module needs it**. It does not get its own module and it is never dumped into
  a generic `shared/`.
- When a **second consumer** appears, that bare join table is **promoted to its own small module
  named for the relationship** (name it for what the link means, not `shared/`), so both consumers
  import the same access functions instead of duplicating them.
- **A join table that carries real attributes** (columns beyond the two foreign keys) gets **its own
  module from the start** — it's an entity in its own right, not just a link.

## Extension tables

A 1:1 table that augments another entity is owned by **whichever module actually needs the extra
data**, not automatically by the base entity's module. The base entity's module does not grow to own
every satellite table just because it owns the base row.
