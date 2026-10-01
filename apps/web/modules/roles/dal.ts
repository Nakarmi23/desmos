import type { Knex } from "knex";

import { db } from "../../db";
import { escapeLike } from "../../db/escape-like";
import { permissionCountOfRole } from "../role-grants/dal";
import { holderCountOfRole } from "../role-holdings/dal";
import type { RoleListRow, RoleSort, RoleSortColumn } from "./role";

export type Role = {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
};

/** Every Role, ordered by name ignoring case. */
export function listRoles(): Promise<Role[]> {
  return db("roles")
    .select({
      id: "id",
      name: "name",
      description: "description",
      isSystem: "is_system",
    })
    .orderByRaw("lower(name)");
}

export type ListRolesPageQuery = {
  /** 1-based. */
  page: number;
  pageSize: number;
  sort: RoleSort;
  /** Basic Search: matched against name and description, ignoring case. */
  search?: string;
};

const SORT_EXPRESSIONS: Record<RoleSortColumn, string> = {
  name: "lower(name)",
  holderCount: '"holderCount"',
  createdAt: "created_at",
};

/**
 * One page of Roles, with how many Permissions each grants and how many Users
 * hold it, plus the total across all pages, per the Table fetcher contract
 * (ADR 0004).
 */
export async function listRolesPage(
  query: ListRolesPageQuery,
): Promise<{ rows: RoleListRow[]; total: number }> {
  const matching = db("roles").where((where) =>
    applySearch(where, query.search),
  );

  const [{ count }] = await matching.clone().count({ count: "*" });
  const ordered = matching.clone().select({
    id: "id",
    name: "name",
    description: "description",
    isSystem: "is_system",
    permissionCount: permissionCountOfRole(),
    holderCount: holderCountOfRole(),
    createdAt: "created_at",
  });
  if (query.sort) {
    ordered.orderByRaw(
      `${SORT_EXPRESSIONS[query.sort.columnId]} ${query.sort.direction}`,
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
  return {
    // Postgres counts are bigints, which come back as strings.
    rows: rows.map((row) => ({
      ...row,
      permissionCount: Number(row.permissionCount),
      holderCount: Number(row.holderCount),
    })),
    total: Number(count),
  };
}

function applySearch(where: Knex.QueryBuilder, search: string | undefined) {
  if (!search) return;
  const pattern = `%${escapeLike(search)}%`;
  where.whereILike("name", pattern).orWhereILike("description", pattern);
}
