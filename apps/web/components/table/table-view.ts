import type { TableFilters, TableSort } from "./table-fetcher";

/** Everything that picks which rows a Table shows: what a URL can capture. */
export type TableView = {
  /** 1-based. */
  page: number;
  pageSize: number;
  sort: TableSort;
  filters: TableFilters;
};

/** Rows per page when the Table isn't told otherwise. */
export const DEFAULT_PAGE_SIZE = 25;

/** Rows-per-page choices when the Table isn't told otherwise. */
export const DEFAULT_PAGE_SIZE_OPTIONS: readonly number[] = [25, 50, 100];
