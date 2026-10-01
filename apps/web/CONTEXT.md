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
value · ×`). A "+" button opens a searchable list of the filterable columns; picking one adds its
chip; clicking a chip's operator or value edits it in place. The operator is suited to the column's data type (text: contains / equals
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
A person with access to the app, shown in the Users Table. Has a display name, a **Username**, an
optional email, and any number of assigned **Roles** (none means no access). An email is only
needed for the User to receive emails.

**Username**:
The identifier a User signs in with. Unique, case-insensitive.

**Role**:
A named set of **Permissions** that admins manage and assign to Users. Not a fixed list — admins
can add Roles beyond the **Initial Role**. A User holding several Roles gets everything each of
them grants combined; Roles never contain other Roles.

**Permission**:
A single thing a Role allows its holders to do: one action on one **Resource** (e.g. "Roles: edit"),
or a one-off ability that isn't about a Resource (e.g. editing a settings section). The app defines
the Permissions; admins can only choose which ones each Role grants, never invent new ones. Any
action other than view needs view on the same Resource too. Changing a Role's Permissions takes
effect for all of its holders immediately.

**Resource**:
A kind of thing Permissions are granted over. Users have view, create, edit and suspend (suspend
also covers reactivating). Roles have view, create, edit and delete. Each dynamic module will
become a Resource later.
_Avoid_: module (it already means a dynamic module, or a code folder)

**Initial Role** / **Initial User**:
The Role and User that exist from the moment the app is first set up, so there is always someone
who can sign in and administer it. The Initial User's credentials come from the deployment's
configuration, never from source code. There is exactly one Initial User, fixed at setup, forever.
It can't be suspended or lose the Initial Role, and its name, username and email are fixed at
setup too. Only its password stays editable, and any other active holder of the Initial Role can
reset it (so leaked setup credentials can always be revoked from inside the app). Other Users may also hold the Initial Role — the Initial User is simply the one
holder that can never lose it.

**System Role**:
A Role the app itself depends on, which admins can't edit or delete at all. The Initial Role
("Administrator") is the only one, and it always grants every Permission, including ones added
later.

**Delegation rule**:
When creating, editing or deleting a Role, a User can only add or remove Permissions they hold
themselves, and can only delete a Role whose Permissions they all hold. This lets a non-Administrator
Role (e.g. an "Access Manager") manage Roles without ever handing out more than it has.

**Delete (Role)**:
Removing a Role for good. Only possible while no User holds it.

**Status**:
A User's account state: `active` or `suspended`.

**Suspend**:
The Bulk Action that moves one or more Users out of `active` status. The only way to remove a
User's access — Users are never deleted; the record and its data are retained.
_Avoid_: Deactivate, Delete

### Authentication

**Sign in**:
Proving to the app that you are a particular User, by Username and password, which starts a
**Session**. Only an `active` User holding at least one Role can sign in. Every rejection gets the
same generic message, so it never reveals whether the Username exists or why the attempt failed.
_Avoid_: login, log in

**Sign out**:
Ending the current Session on purpose.
_Avoid_: logout, log out

**Session**:
One signed-in browser for one User. A User may have several at once. A Session ends on Sign out,
after 7 days without use, 30 days after Sign in regardless of use, or the moment its User loses access (Suspended, or left with no Roles).
Everything in the app except the sign-in page requires a Session.
