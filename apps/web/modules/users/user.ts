// No DB access, so client components can import this too.

import { z } from "zod";

import type { TableFilters, TableSort } from "@/components/table/table-fetcher";

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

/** A `users.list` sort: the Table fetcher contract's, narrowed to its columns. */
export const userSortSchema = z
  .object({
    columnId: z.enum(USER_SORT_COLUMNS),
    direction: z.enum(["asc", "desc"]),
  })
  .nullable();

export type UserSort = z.infer<typeof userSortSchema>;

/** The Table's sort as a `users.list` one; a column it can't sort by is none. */
export function toUserSort(sort: TableSort): UserSort {
  const parsed = userSortSchema.safeParse(sort);
  return parsed.success ? parsed.data : null;
}

/**
 * `users.list` input: the Table fetcher contract's arguments (ADR 0004).
 * Advanced Search isn't supported yet, so only Basic Search is accepted.
 */
export const usersListInputSchema = z.object({
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1).max(100),
  sort: userSortSchema,
  filters: z.strictObject({ search: z.string().optional() }),
});

export type UsersListInput = z.infer<typeof usersListInputSchema>;

/** The Table fetcher's arguments as a `users.list` input. */
export function toUsersListInput(
  page: number,
  pageSize: number,
  sort: TableSort,
  filters: TableFilters,
): UsersListInput {
  return {
    page,
    pageSize,
    sort: toUserSort(sort),
    filters: { search: filters.search },
  };
}
