# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository overview

This is a pnpm/Turborepo monorepo. Right now the only real workspace package is `packages/db-core`; `apps/` and `packages/typescript-config` are scaffolding (the latter is a shared base `tsconfig.json` other packages extend). `apps/` is currently empty of actual applications.

`packages/db-core` (`@repo/db-core`) converts a JSON-serializable table schema description (`DBTable`) into a Knex `SchemaBuilder` call that creates the table — i.e. it's the core engine for turning declarative table definitions into actual SQL DDL via Knex, targeting Postgres (and partially MySQL).

## Commands

Run from the repo root unless noted.

- `pnpm install` — install all workspace dependencies.
- `turbo build` / `turbo dev` / `turbo lint` / `turbo check-types` — run the respective task across all packages (each package opts in by defining the matching script).
- `pnpm format` — Prettier over `**/*.{ts,tsx,md}`.
- `docker compose up -d` — start local Postgres (db `desmos` on port 5432, user/pass `desmos`/`desmos`). `docker/postgres/init.sql` also provisions a `desmos_test` database on container init.

### db-core package (`packages/db-core`)

Run these from inside `packages/db-core`, or via `pnpm --filter @repo/db-core <script>` from the root:

- `pnpm test` — run the Jest suite (ts-jest, node environment).
- `pnpm test:watch` — watch mode.
- `pnpm test:coverage` — with coverage report.
- Run a single test file: `pnpm test raw-column-to-knex-column.test.ts` (Jest matches by path/name).
- Run a single test by name: `pnpm test -t "test name substring"`.

## Architecture: db-core

The package models a database table as plain data and lowers it to Knex builder calls through a small chain of pure functions in `src/utilities/`:

- **`src/types/`** — the schema vocabulary: `DBTable` (name + `DBColumn[]` + `DBConstraint[]`), `DBColumn` (type, nullability, default, PK/unique/index flags, `generated` columns, inline `referencedTable` for a column-level FK), `DBConstraint` (table-level `PRIMARY KEY` / `FOREIGN KEY` / `UNIQUE` / `INDEX`, discriminated on `type`), `DBColumnType`/`DBColumnTypeKind` (`INTEGER`, `DECIMAL`, `VARCHAR`, `TEXT`, `BOOLEAN`, `DATE`, `TIMESTAMP`, `TIMESTAMPTZ`, `UUID`), `ForeignKeyEventAction` (`RESTRICT`/`CASCADE`/`SET NULL`/`NO ACTION`), and `DBClient` (`"postgres" | "mysql"`, currently mostly aspirational — most logic is Postgres-specific, e.g. `specificType` DDL strings and `gen_random_uuid()`).
- **`raw-table-to-knex-table.ts`** — entry point. Takes a `Knex.SchemaBuilder` and a `DBTable`, calls `knex.createTable(snakeCase(table.name), ...)`, and inside the callback applies every column via `rawColumnToKnexColumn` then every table-level constraint via `rawConstraintToKnexConstraint`.
- **`raw-column-to-knex-column.ts`** — builds a raw Postgres `specificType` DDL fragment per column (type + length/precision, `NULL`/`NOT NULL`, `DEFAULT`, `GENERATED ALWAYS AS IDENTITY` for auto-increment, `GENERATED ALWAYS AS (...) STORED/VIRTUAL` for computed columns), then separately wires up `tableBuilder.foreign()/primary()/unique()/index()` based on the column's flags and `referencedTable`. Column and table names are snake_cased via lodash; note `column.name` itself (used for `foreign()`/`primary()`) is passed *un*-snake-cased, while the `specificType()` call uses the snake_cased name — this asymmetry is intentional given current tests, not a bug to "fix" without checking.
- **`raw-constraint-to-knex-constraint.ts`** — applies table-level constraints (as opposed to column-level ones) by switching on `constraint.type` and calling the matching Knex builder method (`primary`/`foreign().references().inTable()`/`unique`/`index`), including FK `onDelete`/`onUpdate` actions and optional constraint naming.
- **`id-defaults.ts`** — two ready-made `DBColumn` presets for primary keys: `idDefault` (auto-increment `INTEGER`) and `uuidDefault` (`UUID` with a client-specific default — `gen_random_uuid()` for postgres, `UUID()` for mysql — picked via `DB_CLIENT` env var, defaulting to postgres).
- **`src/index.ts`** — the package's public surface: re-exports the three `raw-*-to-knex-*` functions as values and all `src/types/*` as `export type *`.

### Testing conventions

Tests avoid a real Knex instance; `src/utilities/test-helpers.ts` provides `makeMockSchemaBuilder()` / `makeMockTableBuilder()` / `makeMockForeignBuilder()`, which are chainable Jest-mock stand-ins for `Knex.SchemaBuilder`, `Knex.TableBuilder`, and the foreign-key sub-builder returned by `.foreign()`. Each mock table builder exposes `_tableBuilder`/`_foreignBuilder` so tests can assert on the exact builder calls (e.g. `tableBuilder.specificType`, `tableBuilder._foreignBuilder.onDelete`) rather than executing SQL. `pg` and a running Postgres (via `docker-compose.yml`) exist for integration-level testing but the current unit tests are pure mock-based.

# Design System

- Always reference `DESIGN.md` for all UI styling, components, colors, and typography.
- Do not invent or hardcode color hex values, spacing numbers, or font sizes that deviate from `DESIGN.md`.
