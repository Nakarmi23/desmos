# Table Data Contract Decoupled from Direct tRPC Calls

The reusable `Table` UI component needs its pagination/sorting/search computed server-side (not
fetched-then-sliced in the browser) so it scales once real data exists — but no DAL or DB runtime
is wired up yet for the entities it will display. We decided `Table` takes an abstract fetcher,
`(page, pageSize, sort, filters) => { rows, total }`, supplied by its caller, rather than reaching
directly into `trpc.<entity>.list.useQuery()` the way ADR 0001 establishes for client-driven
interaction elsewhere in the app.

We chose this over calling tRPC directly because `Table` is meant to be reused across entities
that don't have real backends yet (fixture data today, real tRPC procedures once the Knex runtime
and domain modeling for that entity land). Coupling the component itself to tRPC's query shape
would mean either building it against a throwaway fixture API or blocking the component's
existence on that backend work landing first. The fetcher abstraction lets both proceed in
parallel, and keeps swapping fixture data for real data a caller-side change only.

**Consequences**: every `Table` usage needs a small adapter (fixture-backed now, tRPC-backed
later) implementing the fetcher signature — one extra layer of indirection versus calling
`useQuery` straight from the call site.
