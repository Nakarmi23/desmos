import { isBlank } from "./normalize-filters";
import {
  resolveColumn,
  type ResolvedTableColumn,
  type TableColumn,
  type TableColumnFilterKind,
} from "./table-column";
import type {
  TableColumnFilterValue,
  TableFetcherResult,
  TableFilters,
  TableSort,
} from "./table-fetcher";

/**
 * Pages, sorts, and filters an in-memory fixture array the same way a real
 * `TableFetcher` (docs/adr/0004-table-data-contract-decoupled-from-trpc.md)
 * would against a database — the fixture-backed half of that adapter.
 */
export function windowFixture<T>(
  rows: readonly T[],
  columns: readonly TableColumn<T>[],
  page: number,
  pageSize: number,
  sort: TableSort,
  filters: TableFilters,
): TableFetcherResult<T> {
  const resolved = columns.map(resolveColumn);
  const searched = applySearch(rows, resolved, filters.search);
  const filtered = applyColumnFilters(searched, resolved, filters.columns);
  const sorted = applySort(filtered, resolved, sort);
  const start = (page - 1) * pageSize;

  return { rows: sorted.slice(start, start + pageSize), total: sorted.length };
}

function applySearch<T>(
  rows: readonly T[],
  columns: readonly ResolvedTableColumn<T>[],
  search: string | undefined,
): T[] {
  if (!search) return [...rows];

  const needle = search.toLowerCase();
  const searchableColumns = columns.filter((column) => column.searchable);

  return rows.filter((row) =>
    searchableColumns.some((column) =>
      String(column.accessor?.(row) ?? "")
        .toLowerCase()
        .includes(needle),
    ),
  );
}

function applyColumnFilters<T>(
  rows: T[],
  columns: readonly ResolvedTableColumn<T>[],
  filters: Record<string, TableColumnFilterValue> | undefined,
): T[] {
  if (!filters) return rows;

  const active = columns.flatMap((column) => {
    const value = filters[column.id];
    if (!column.accessor || !column.filter || value === undefined) return [];
    return [{ accessor: column.accessor, kind: column.filter.kind, value }];
  });

  return rows.filter((row) =>
    active.every(({ accessor, kind, value }) =>
      matchesFilter(kind, accessor(row), value),
    ),
  );
}

// Blank filter values mean "no constraint"; a blank/unparseable *cell* never
// matches a comparison (like SQL NULL — not even `neq`).
function matchesFilter(
  kind: TableColumnFilterKind,
  cell: unknown,
  filter: TableColumnFilterValue,
): boolean {
  switch (filter.operator) {
    case "in":
    case "notIn": {
      if (filter.values.length === 0) return true;
      // A multi-value cell matches `in` if it holds any chosen value, `notIn`
      // if it holds none — so an empty list only ever matches `notIn`.
      const held = Array.isArray(cell) ? cell.map(String) : [String(cell)];
      const holdsAny = held.some((value) => filter.values.includes(value));
      return holdsAny === (filter.operator === "in");
    }
    case "between":
      return matchesRange(kind, cell, filter.from, filter.to);
    case "contains":
    case "startsWith":
    case "endsWith":
      return (
        isBlank(filter.value) ||
        matchesSubstring(cell, filter.operator, String(filter.value))
      );
    default:
      return (
        isBlank(filter.value) ||
        matchesComparison(kind, cell, filter.operator, filter.value)
      );
  }
}

function matchesSubstring(
  cell: unknown,
  operator: "contains" | "startsWith" | "endsWith",
  needle: string,
): boolean {
  const haystack = String(cell ?? "").toLowerCase();
  const target = needle.toLowerCase();
  switch (operator) {
    case "contains":
      return haystack.includes(target);
    case "startsWith":
      return haystack.startsWith(target);
    case "endsWith":
      return haystack.endsWith(target);
  }
}

function matchesComparison(
  kind: TableColumnFilterKind,
  cell: unknown,
  operator: "eq" | "neq" | "lt" | "lte" | "gt" | "gte",
  target: string | number,
): boolean {
  const bound = comparable(kind, target);
  if (bound === undefined) return true; // unparseable filter value: no constraint
  const value = comparable(kind, cell);
  if (value === undefined) return false;

  const order = compare(value, bound);
  switch (operator) {
    case "eq":
      return order === 0;
    case "neq":
      return order !== 0;
    case "lt":
      return order < 0;
    case "lte":
      return order <= 0;
    case "gt":
      return order > 0;
    case "gte":
      return order >= 0;
  }
}

function matchesRange(
  kind: TableColumnFilterKind,
  cell: unknown,
  from: string | number | undefined,
  to: string | number | undefined,
): boolean {
  const lower = comparable(kind, from);
  const upper = comparable(kind, to);
  if (lower === undefined && upper === undefined) return true;

  const value = comparable(kind, cell);
  if (value === undefined) return false;
  return (
    (lower === undefined || compare(value, lower) >= 0) &&
    (upper === undefined || compare(value, upper) <= 0)
  );
}

// Numbers compare as numbers, dates as UTC `YYYY-MM-DD` days (so a whole day
// counts as one value, whatever time of day the cell holds), text lowercased.
// `undefined` = missing or unparseable.
function comparable(
  kind: TableColumnFilterKind,
  value: unknown,
): number | string | undefined {
  if (isBlank(value)) return undefined;

  if (kind === "number") {
    const number = Number(value);
    return Number.isFinite(number) ? number : undefined;
  }
  if (kind === "date") {
    if (value instanceof Date) {
      return Number.isNaN(value.getTime())
        ? undefined
        : value.toISOString().slice(0, 10);
    }
    const day =
      typeof value === "string" ? /^\d{4}-\d{2}-\d{2}/.exec(value) : null;
    return day?.[0];
  }
  return String(value).toLowerCase();
}

function compare(a: number | string, b: number | string): number {
  if (typeof a === "number" && typeof b === "number") return a - b;
  const [x, y] = [String(a), String(b)];
  return x < y ? -1 : x > y ? 1 : 0;
}

function applySort<T>(
  rows: readonly T[],
  columns: readonly ResolvedTableColumn<T>[],
  sort: TableSort,
): T[] {
  if (!sort) return [...rows];

  const column = columns.find((c) => c.id === sort.columnId);
  if (!column?.accessor) return [...rows];

  const accessor = column.accessor;
  const direction = sort.direction === "asc" ? 1 : -1;

  return [...rows].sort(
    (a, b) => compareValues(accessor(a), accessor(b)) * direction,
  );
}

function compareValues(a: unknown, b: unknown): number {
  if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime();
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b));
}
