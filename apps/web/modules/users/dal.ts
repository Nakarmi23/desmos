import type { Knex } from "knex";

import { db } from "../../db";
import type {
  DateFilter,
  TextFilter,
  UserColumnFilters,
  UserListFields,
  UserSort,
  UserSortColumn,
} from "./user";

export type ListUsersQuery = {
  /** 1-based. */
  page: number;
  pageSize: number;
  sort: UserSort;
  /** Basic Search: matched against name, username and email, ignoring case. */
  search?: string;
  /** Advanced Search, AND-ed with each other and Basic Search. */
  columns?: UserColumnFilters;
};

// Text sorts ignore case, like the Table's fixture adapter.
const SORT_EXPRESSIONS: Record<UserSortColumn, string> = {
  name: "lower(name)",
  username: "username",
  email: "lower(email)",
  status: "status",
  createdAt: "created_at",
};

const LIST_COLUMNS = {
  id: "id",
  name: "name",
  username: "username",
  email: "email",
  status: "status",
  isInitial: "is_initial",
  createdAt: "created_at",
};

/**
 * One page of Users plus the total across all pages, per the Table fetcher
 * contract (ADR 0004), without the Roles they hold (see `service.ts`). Never
 * selects the password hash.
 */
export async function listUsers(
  query: ListUsersQuery,
): Promise<{ rows: UserListFields[]; total: number }> {
  const matching = db("users")
    .where((where) => applySearch(where, query.search))
    .modify(applyColumnFilters, query.columns ?? {});

  const [{ count }] = await matching.clone().count({ count: "*" });
  const ordered = matching.clone().select(LIST_COLUMNS);
  if (query.sort) {
    const direction = query.sort.direction;
    // Missing values (no email) sort last ascending, first descending.
    ordered.orderByRaw(
      `${SORT_EXPRESSIONS[query.sort.columnId]} ${direction} nulls ${direction === "asc" ? "last" : "first"}`,
    );
  }
  // A stable tie-breaker, so paging never repeats or skips a row.
  ordered.orderBy([
    { column: "created_at", order: "asc" },
    { column: "id", order: "asc" },
  ]);

  const rows: UserListFields[] = await ordered
    .limit(query.pageSize)
    .offset((query.page - 1) * query.pageSize);
  return { rows, total: Number(count) };
}

/**
 * Advanced Search per the fetcher contract (`TableColumnFilterValue`): text
 * ignores case; dates compare whole UTC days; a missing value (no email)
 * never matches. Blank filter values are no constraint.
 */
function applyColumnFilters(
  query: Knex.QueryBuilder,
  filters: UserColumnFilters,
) {
  for (const column of ["name", "username", "email"] as const) {
    const filter = filters[column];
    if (filter) applyTextFilter(query, column, filter);
  }

  const status = filters.status;
  if (status?.values.length) {
    if (status.operator === "in") query.whereIn("status", status.values);
    else query.whereNotIn("status", status.values);
  }

  if (filters.createdAt)
    applyDateFilter(query, "created_at", filters.createdAt);

  // `in`: holds at least one of the Roles; `notIn`: holds none of them (so a
  // User with no Roles matches `notIn` only). A subquery of this one query,
  // so it lives here rather than in the service with the Roles lookup.
  const roles = filters.roles;
  if (roles?.values.length) {
    const holdsAny = db("user_roles")
      .whereRaw("user_roles.user_id = users.id")
      .whereIn("user_roles.role_id", roles.values);
    if (roles.operator === "in") query.whereExists(holdsAny);
    else query.whereNotExists(holdsAny);
  }
}

function applyTextFilter(
  query: Knex.QueryBuilder,
  column: string,
  filter: TextFilter,
) {
  // Blank is no constraint; otherwise the value is matched as given, as the
  // fixture adapter does.
  const value = filter.value;
  if (!value.trim()) return;
  const escaped = escapeLike(value);
  switch (filter.operator) {
    case "eq":
      query.whereRaw("lower(??) = lower(?)", [column, value]);
      return;
    case "contains":
      query.whereILike(column, `%${escaped}%`);
      return;
    case "startsWith":
      query.whereILike(column, `${escaped}%`);
      return;
    case "endsWith":
      query.whereILike(column, `%${escaped}`);
      return;
  }
}

const DAY_MS = 24 * 60 * 60 * 1000;

function applyDateFilter(
  query: Knex.QueryBuilder,
  column: string,
  filter: DateFilter,
) {
  // A `YYYY-MM-DD` day as the UTC instants it starts and ends (exclusive) at.
  const start = (day: string) => new Date(`${day}T00:00:00Z`);
  const end = (day: string) => new Date(start(day).getTime() + DAY_MS);

  switch (filter.operator) {
    case "eq":
      query
        .where(column, ">=", start(filter.value))
        .where(column, "<", end(filter.value));
      return;
    case "lt":
      query.where(column, "<", start(filter.value));
      return;
    case "lte":
      query.where(column, "<", end(filter.value));
      return;
    case "gt":
      query.where(column, ">=", end(filter.value));
      return;
    case "gte":
      query.where(column, ">=", start(filter.value));
      return;
    case "between":
      if (filter.from) query.where(column, ">=", start(filter.from));
      if (filter.to) query.where(column, "<", end(filter.to));
      return;
  }
}

function applySearch(where: Knex.QueryBuilder, search: string | undefined) {
  if (!search) return;
  const pattern = `%${escapeLike(search)}%`;
  where
    .whereILike("name", pattern)
    .orWhereILike("username", pattern)
    .orWhereILike("email", pattern);
}

// `%` and `_` in the search term are literal characters, not wildcards.
function escapeLike(term: string): string {
  return term.replace(/[\\%_]/g, (char) => `\\${char}`);
}
