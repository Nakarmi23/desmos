// The Permissions the app defines (see CONTEXT.md). Each one is seeded by a
// migration, which also holds its labels; a change here needs a migration
// too, and the Permissions integration test fails until both agree.
export const PERMISSIONS = [
  "users.view",
  "users.create",
  "users.edit",
  "users.suspend",
  "roles.view",
  "roles.create",
  "roles.edit",
  "roles.delete",
] as const;

export type Permission = (typeof PERMISSIONS)[number];
