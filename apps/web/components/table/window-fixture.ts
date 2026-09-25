import type { TableColumn } from "./table-column";
import type {
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
  const filtered = applySearch(rows, columns, filters.search);
  const sorted = applySort(filtered, columns, sort);
  const start = (page - 1) * pageSize;

  return { rows: sorted.slice(start, start + pageSize), total: sorted.length };
}

function applySearch<T>(
  rows: readonly T[],
  columns: readonly TableColumn<T>[],
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

function applySort<T>(
  rows: readonly T[],
  columns: readonly TableColumn<T>[],
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
