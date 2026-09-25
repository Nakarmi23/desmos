# apps/web

The Next.js dashboard app — the only user-facing product context in this repo. Vocabulary here
covers the UI/interaction layer for browsing and acting on data, layered on top of
`@repo/db-core`'s schema-lowering (a separate, generic concern).

## Language

### Data table UI

**Table**:
A reusable, column-config-driven UI component that displays a paginated, sortable, searchable
collection of records. Not a database table — when both meanings are in play, qualify as "UI
Table" vs "DB table" (the latter being a `DBTable` schema entity from `@repo/db-core`).

**Basic Search**:
A single free-text input on a Table, matched against a configurable set of that Table's
searchable columns.
_Avoid_: quick search, simple search

**Advanced Search**:
Structured, per-column filters on a Table, shown as a bar of **filter chips** (`Column · operator ·
value · ×`). A "+" menu (searchable) adds a chip for a filterable column; clicking a chip's operator
or value edits it in place. The operator is suited to the column's data type (text: contains / equals
/ starts with / ends with; number: equals, does not equal, less/greater than (or equal), between;
date: between / is / before / after (and on or before/after); select: is any of / is none of). One
chip per column; "Clear filters" removes them all. Combines with Basic Search as AND-ed constraints —
it layers on top rather than replacing it.
_Avoid_: filter panel, power search

**View**:
Everything that picks which rows a Table shows: page, page size, sort, Basic Search and Advanced
Search. Kept in the page URL's query string, so a View can be bookmarked, shared or refreshed;
Back/Forward step through Views. Selection is not part of the View.

**Selection**:
The set of currently checked rows in a Table. Scoped to the current page only — the "select all"
control selects just the visible page, and any page, sort, or search/filter change clears it.
Only present when the Table is configured with at least one Bulk Action.

**Bulk Action**:
An operation a Table's caller can offer against the current Selection, surfaced via a toolbar
that appears once at least one row is selected. Actions are supplied by the caller and may be
stubbed (no real effect) until a real backend exists for that data.

### Users

**User**:
A person with access to the app, shown in the Users Table. Columns: `name`, `email`, `role`,
`status`, `createdAt`.

**Role**:
A User's permission level: `admin`, `member`, or `viewer`.

**Status**:
A User's account state: `active`, `invited`, or `suspended`.

**Suspend**:
The Bulk Action that moves one or more Users out of `active` status. Not a deletion — the User
record and its data are retained.
_Avoid_: Deactivate, Delete
