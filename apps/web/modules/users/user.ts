// No DB access, so client components can import this too.

import { z } from "zod";

import type { TableFilters, TableSort } from "@/components/table/table-fetcher";

export const USER_STATUSES = ["active", "suspended"] as const;

/** A User's account state. */
export type UserStatus = (typeof USER_STATUSES)[number];

/** A Role as a User's holding shows it. */
export type RoleRef = { id: string; name: string };

/** A User as listed: never includes the password hash. */
export type UserListRow = {
  id: string;
  name: string;
  username: string;
  email: string | null;
  status: UserStatus;
  isInitial: boolean;
  /** Every Role the User holds, by name; empty when none. */
  roles: RoleRef[];
  createdAt: Date;
};

/** A listed User's own fields, without the Roles they hold. */
export type UserListFields = Omit<UserListRow, "roles">;

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

// Advanced Search values, per the fetcher contract's `TableColumnFilterValue`.
const textFilter = z.object({
  operator: z.enum(["contains", "eq", "startsWith", "endsWith"]),
  value: z.string(),
});

const day = z.iso.date();
const dateFilter = z.discriminatedUnion("operator", [
  z.object({ operator: z.enum(["eq", "lt", "lte", "gt", "gte"]), value: day }),
  z.object({
    operator: z.literal("between"),
    from: day.optional(),
    to: day.optional(),
  }),
]);

const setFilter = <V extends z.ZodType<string>>(value: V) =>
  z.object({ operator: z.enum(["in", "notIn"]), values: z.array(value) });

/** Advanced Search, keyed by the Users Table's filterable column ids. */
export const userColumnFiltersSchema = z.strictObject({
  name: textFilter.optional(),
  username: textFilter.optional(),
  email: textFilter.optional(),
  status: setFilter(z.enum(USER_STATUSES)).optional(),
  createdAt: dateFilter.optional(),
  /** Role ids. */
  roles: setFilter(z.uuid()).optional(),
});

export type UserColumnFilters = z.infer<typeof userColumnFiltersSchema>;
export type TextFilter = z.infer<typeof textFilter>;
export type DateFilter = z.infer<typeof dateFilter>;

/** `users.list` input: the Table fetcher contract's arguments (ADR 0004). */
export const usersListInputSchema = z.object({
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1).max(100),
  sort: userSortSchema,
  filters: z.strictObject({
    search: z.string().optional(),
    columns: userColumnFiltersSchema.optional(),
  }),
});

export type UsersListInput = z.infer<typeof usersListInputSchema>;

/**
 * The Table fetcher's arguments as a `users.list` input. Throws if a filter
 * isn't one `users.list` accepts (the Table only offers ones it does).
 */
export function toUsersListInput(
  page: number,
  pageSize: number,
  sort: TableSort,
  filters: TableFilters,
): UsersListInput {
  return usersListInputSchema.parse({
    page,
    pageSize,
    sort: toUserSort(sort),
    filters,
  });
}
