import { FILTER_OPERATORS } from "./filter-operators";
import { normalizeFilters } from "./normalize-filters";
import {
  resolveColumn,
  type ResolvedTableColumn,
  type TableColumn,
  type TableColumnFilterKind,
} from "./table-column";
import type {
  TableColumnFilterValue,
  TableFilterOperator,
  TableSort,
} from "./table-fetcher";
import type { TableView } from "./table-view";

export type TableUrlConfig<T> = {
  columns: readonly TableColumn<T>[];
  defaultPageSize: number;
  /** The Table's `defaultSort`: what an absent `sort` param means. */
  defaultSort?: TableSort;
  pageSizeOptions: readonly number[];
};

// `f.<column id>.<operator>=<value>` per Advanced Search filter; a between
// value is `from..to` (either side may be empty), a select repeats the param.
const FILTER_PREFIX = "f.";
const RANGE = "..";

/** The view as query params, leaving out whatever is at its default. */
export function encodeTableView<T>(
  view: TableView,
  config: TableUrlConfig<T>,
): URLSearchParams {
  const params = new URLSearchParams();
  if (view.page > 1) params.set("page", String(view.page));
  if (view.pageSize !== config.defaultPageSize) {
    params.set("size", String(view.pageSize));
  }
  if (view.sort && !sameSort(view.sort, config.defaultSort ?? null)) {
    const { columnId, direction } = view.sort;
    params.set("sort", direction === "desc" ? `-${columnId}` : columnId);
  }
  if (view.filters.search) params.set("q", view.filters.search);
  for (const [columnId, filter] of Object.entries(view.filters.columns ?? {})) {
    const key = `${FILTER_PREFIX}${columnId}.${filter.operator}`;
    if ("values" in filter) {
      for (const value of filter.values) params.append(key, value);
    } else if (filter.operator === "between") {
      params.set(key, `${filter.from ?? ""}${RANGE}${filter.to ?? ""}`);
    } else {
      params.set(key, String(filter.value));
    }
  }
  return params;
}

const OWN_KEYS = new Set(["page", "size", "sort", "q"]);

/** `current` with its view params replaced by `view`'s; other params are kept. */
export function withTableView<T>(
  current: URLSearchParams,
  view: TableView,
  config: TableUrlConfig<T>,
): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of current) {
    if (!OWN_KEYS.has(key) && !key.startsWith(FILTER_PREFIX)) {
      params.append(key, value);
    }
  }
  for (const [key, value] of encodeTableView(view, config)) {
    params.append(key, value);
  }
  return params;
}

/**
 * Reads a view back from query params. Anything missing, malformed or not
 * offered by the columns falls back to the default, so any URL is safe to load.
 */
export function decodeTableView<T>(
  params: URLSearchParams,
  config: TableUrlConfig<T>,
): TableView {
  const resolved = config.columns.map(resolveColumn);
  const page = parsePositiveInt(params.get("page")) ?? 1;
  const size = parsePositiveInt(params.get("size"));
  return {
    page,
    pageSize:
      size !== undefined && config.pageSizeOptions.includes(size)
        ? size
        : config.defaultPageSize,
    sort:
      decodeSort(params.get("sort"), resolved) ?? config.defaultSort ?? null,
    filters: normalizeFilters({
      search: params.get("q") ?? "",
      columns: decodeColumnFilters(params, resolved),
    }),
  };
}

function parsePositiveInt(raw: string | null): number | undefined {
  if (raw === null || !/^\d+$/.test(raw)) return undefined;
  const n = Number(raw);
  return n >= 1 && Number.isSafeInteger(n) ? n : undefined;
}

function decodeSort<T>(
  raw: string | null,
  columns: readonly ResolvedTableColumn<T>[],
): TableSort {
  if (!raw) return null;
  const desc = raw.startsWith("-");
  const columnId = desc ? raw.slice(1) : raw;
  const sortable = columns.some((c) => c.id === columnId && c.sortable);
  return sortable ? { columnId, direction: desc ? "desc" : "asc" } : null;
}

function decodeColumnFilters<T>(
  params: URLSearchParams,
  columns: readonly ResolvedTableColumn<T>[],
): Record<string, TableColumnFilterValue> {
  const filters: Record<string, TableColumnFilterValue> = {};
  for (const [key, raw] of params) {
    if (!key.startsWith(FILTER_PREFIX)) continue;
    const dot = key.lastIndexOf(".");
    const columnId = key.slice(FILTER_PREFIX.length, dot);
    const operator = key.slice(dot + 1) as TableFilterOperator;
    const filter = columns.find((c) => c.id === columnId)?.filter;
    if (!filter) continue;
    if (!FILTER_OPERATORS[filter.kind].some((o) => o.operator === operator)) {
      continue;
    }

    // One filter per column: the first operator seen wins.
    const existing = filters[columnId];
    if (existing && existing.operator !== operator) continue;

    if (operator === "in" || operator === "notIn") {
      if (filter.kind !== "select") continue;
      if (!filter.options.some((o) => o.value === raw)) continue;
      const values = existing && "values" in existing ? existing.values : [];
      if (!values.includes(raw)) {
        filters[columnId] = { operator, values: [...values, raw] };
      }
    } else if (existing) {
      continue;
    } else if (operator === "between") {
      const split = raw.indexOf(RANGE);
      if (split === -1) continue;
      const from = parseScalar(filter.kind, raw.slice(0, split));
      const to = parseScalar(filter.kind, raw.slice(split + RANGE.length));
      filters[columnId] = {
        operator,
        ...(from !== undefined && { from }),
        ...(to !== undefined && { to }),
      };
    } else {
      const value = parseScalar(filter.kind, raw);
      if (value === undefined) continue;
      filters[columnId] = { operator, value } as TableColumnFilterValue;
    }
  }
  return filters;
}

/** A single filter value, typed for the column; undefined when unusable. */
function parseScalar(
  kind: TableColumnFilterKind,
  raw: string,
): string | number | undefined {
  const text = raw.trim();
  if (text === "") return undefined;
  if (kind === "number") {
    const n = Number(text);
    return Number.isFinite(n) ? n : undefined;
  }
  if (kind === "date")
    return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : undefined;
  return text;
}

function sameSort(a: TableSort, b: TableSort): boolean {
  return a?.columnId === b?.columnId && a?.direction === b?.direction;
}
