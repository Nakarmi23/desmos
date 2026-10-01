// No DB access, so client components can import this too.

import { z } from "zod";

import type { TableFilters, TableSort } from "@/components/table/table-fetcher";

/** A Role as the Roles Table lists it. */
export type RoleListRow = {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  /** Every Permission there is, for a System Role. */
  permissionCount: number;
  /** Suspended holders included. */
  holderCount: number;
  createdAt: Date;
};

/** The Roles Table columns `roles.table` can sort by. */
export const ROLE_SORT_COLUMNS = ["name", "holderCount", "createdAt"] as const;

export type RoleSortColumn = (typeof ROLE_SORT_COLUMNS)[number];

/** A `roles.table` sort: the Table fetcher contract's, narrowed to its columns. */
export const roleSortSchema = z
  .object({
    columnId: z.enum(ROLE_SORT_COLUMNS),
    direction: z.enum(["asc", "desc"]),
  })
  .nullable();

export type RoleSort = z.infer<typeof roleSortSchema>;

/**
 * `roles.table` input: the Table fetcher contract's arguments (ADR 0004).
 * Basic Search only; the Roles Table has no Advanced Search.
 */
export const rolesTableInputSchema = z.object({
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1).max(100),
  sort: roleSortSchema,
  filters: z.strictObject({ search: z.string().optional() }),
});

export type RolesTableInput = z.infer<typeof rolesTableInputSchema>;

/**
 * The Table fetcher's arguments as a `roles.table` input. A sort it can't do
 * is none.
 */
export function toRolesTableInput(
  page: number,
  pageSize: number,
  sort: TableSort,
  filters: TableFilters,
): RolesTableInput {
  const parsedSort = roleSortSchema.safeParse(sort);
  return rolesTableInputSchema.parse({
    page,
    pageSize,
    sort: parsedSort.success ? parsedSort.data : null,
    filters: { search: filters.search },
  });
}
