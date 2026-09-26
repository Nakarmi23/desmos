import type { Knex } from "knex";

import { db } from "../../db";
import type { UserListRow, UserSortColumn } from "./user";

export type ListUsersQuery = {
  /** 1-based. */
  page: number;
  pageSize: number;
  sort: { columnId: UserSortColumn; direction: "asc" | "desc" } | null;
  /** Basic Search: matched against name, username and email, ignoring case. */
  search?: string;
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
 * contract (ADR 0004). Never selects the password hash.
 */
export async function listUsers(
  query: ListUsersQuery,
): Promise<{ rows: UserListRow[]; total: number }> {
  const matching = db("users").where((where) =>
    applySearch(where, query.search),
  );

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

  const rows = await ordered
    .limit(query.pageSize)
    .offset((query.page - 1) * query.pageSize);
  return { rows, total: Number(count) };
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
