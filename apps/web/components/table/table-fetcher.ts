export type TableSortDirection = "asc" | "desc";

export type TableSort = {
  columnId: string;
  direction: TableSortDirection;
} | null;

export type TableTextOperator = "contains" | "eq" | "startsWith" | "endsWith";
export type TableComparisonOperator =
  | "eq"
  | "neq"
  | "lt"
  | "lte"
  | "gt"
  | "gte";
export type TableSetOperator = "in" | "notIn";
export type TableFilterOperator =
  | TableTextOperator
  | TableComparisonOperator
  | "between"
  | TableSetOperator;

/**
 * Per-column Advanced Search value, keyed by column id in `TableFilters.columns`.
 * The column's `filter.kind` (see `TableColumnFilter`) says how to read it:
 * - `text`   -> `contains` / `eq` / `startsWith` / `endsWith`, case-insensitive
 * - `number` -> `eq` / `neq` / `lt` / `lte` / `gt` / `gte` / `between`
 * - `date`   -> `eq` / `lt` / `lte` / `gt` / `gte` / `between`; values are
 *               `YYYY-MM-DD` UTC days, so `lte`/`between` include the whole day
 * - `select` -> `in` (equals any of `values`) / `notIn` (equals none of them)
 * `between` bounds are inclusive and either may be omitted. Empty values
 * (blank text, no number/date, no selection) are never sent. A row whose cell
 * is missing (null/blank/unparseable) never matches a number/date comparison,
 * `neq` included — SQL NULL semantics.
 * Adapters read a value's meaning from the column's `filter.kind`, not its
 * shape alone (`eq` with a string is text on a text column, a day on a date one).
 */
export type TableColumnFilterValue =
  | { operator: TableTextOperator; value: string }
  | { operator: TableComparisonOperator; value: string | number }
  | { operator: "between"; from?: string | number; to?: string | number }
  | { operator: TableSetOperator; values: string[] };

export type TableFilters = {
  /** Basic Search: free text matched against the `searchable` columns. */
  search?: string;
  /** Advanced Search: structured filters, AND-ed with each other and `search`. */
  columns?: Record<string, TableColumnFilterValue>;
};

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
