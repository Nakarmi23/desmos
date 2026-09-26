// Types only (no DB access), so client components can import them too.

export const USER_STATUSES = ["active", "suspended"] as const;

/** A User's account state. */
export type UserStatus = (typeof USER_STATUSES)[number];

/** A User as listed: never includes the password hash. */
export type UserListRow = {
  id: string;
  name: string;
  username: string;
  email: string | null;
  status: UserStatus;
  isInitial: boolean;
  createdAt: Date;
};

/** The Users Table columns `users.list` can sort by. */
export const USER_SORT_COLUMNS = [
  "name",
  "username",
  "email",
  "status",
  "createdAt",
] as const;

export type UserSortColumn = (typeof USER_SORT_COLUMNS)[number];
