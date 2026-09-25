export type TableSortDirection = "asc" | "desc";

export type TableSort = {
  columnId: string;
  direction: TableSortDirection;
} | null;

export type TableFilters = { search?: string };

export type TableFetcherResult<T> = { rows: T[]; total: number };

/**
 * Decoupled from tRPC per ADR 0004 (docs/adr/0004-table-data-contract-decoupled-from-trpc.md) —
 * callers supply an adapter implementing this signature: fixture-backed today,
 * tRPC-backed once a real DAL exists for that entity.
 */
export type TableFetcher<T> = (
  page: number,
  pageSize: number,
  sort: TableSort,
  filters: TableFilters,
) => Promise<TableFetcherResult<T>>;
