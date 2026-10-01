# Administrator holds every Permission implicitly; Role managers can only hand out what they hold

Permissions are an app-defined catalog seeded as migrations (ADR 0002), and Roles grant them via
stored rows — **except the Administrator System Role, which stores no Permission rows and is treated
as holding every Permission, including ones added later.** We rejected giving it explicit rows
(granted by each new-Permission migration) because an editable Administrator could be stripped of
`roles.edit` and lock everyone out; implicit + fully read-only keeps "someone can always administer
the app" true by construction, and new Permissions (including runtime ones for dynamic modules)
reach it with no extra step.

Because Administrator is a rarely used "god" Role, day-to-day Role management is delegated: a User
with `roles.create`/`roles.edit`/`roles.delete` **can only add or remove Permissions they hold
themselves** (others show as locked), and can only delete a Role whose Permissions they all hold.
We rejected "`roles.edit` may grant anything", since that makes `roles.edit` silently equivalent to
Administrator (edit a Role you hold, grant yourself everything).

**Consequences**: every Permission check must special-case System Roles rather than just joining
`role_permissions`. To widen what a delegated "Access Manager" Role can hand out, an Administrator
must first grant those Permissions to that Role. Assigning Roles to Users (not yet built) must apply
the same rule, or it becomes the escalation path instead.
