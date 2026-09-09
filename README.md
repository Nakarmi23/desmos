# Desmos

A pnpm/Turborepo monorepo.

- **`packages/db-core`** (`@repo/db-core`) — converts a JSON-serializable table schema description
  (`DBTable`) into a Knex `SchemaBuilder` call that creates the table. It's the core engine for
  turning declarative table definitions into Postgres DDL via Knex (MySQL support is partial).
- **`apps/web`** — a Next.js app (early scaffold).
- **`packages/typescript-config`** — shared base `tsconfig.json` other packages extend.

## Getting started

```sh
pnpm install
docker compose up -d
```

`docker compose up -d` starts local Postgres (db `desmos`, user/pass `desmos`/`desmos`, port 5432);
`docker/postgres/init.sql` also provisions a `desmos_test` database on container init.

Common tasks, run from the repo root:

- `turbo build` / `turbo dev` / `turbo lint` / `turbo check-types` — run across all packages (each
  opts in via its own `package.json` scripts)
- `pnpm format` — Prettier over `**/*.{ts,tsx,md}`

Per-package scripts (e.g. running a single `db-core` test) are in each package's `package.json`.

See [CLAUDE.md](./CLAUDE.md) for conventions and gotchas relevant to working in this repo.
