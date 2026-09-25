import type { TableColumnFilterValue, TableFilters } from "./table-fetcher";

/** What the search box and filter controls currently show. */
export type FilterDraft = {
  search: string;
  columns: Record<string, TableColumnFilterValue>;
};

/**
 * Turns the draft into the `TableFilters` a fetcher receives: trimmed, with
 * empty values dropped, and keys/selections sorted so two drafts that mean
 * the same thing serialize identically (that's how "no change" is detected).
 */
export function normalizeFilters(draft: FilterDraft): TableFilters {
  const filters: TableFilters = {};

  const search = draft.search.trim();
  if (search) filters.search = search;

  const columns: Record<string, TableColumnFilterValue> = {};
  for (const id of Object.keys(draft.columns).sort()) {
    const value = cleanValue(draft.columns[id]);
    if (value !== undefined) columns[id] = value;
  }
  if (Object.keys(columns).length > 0) filters.columns = columns;

  return filters;
}

/** True when the value would actually constrain rows (i.e. survives normalizing). */
export function isFilterValueActive(value: TableColumnFilterValue | undefined) {
  return value !== undefined && cleanValue(value) !== undefined;
}

function cleanValue(
  filter: TableColumnFilterValue,
): TableColumnFilterValue | undefined {
  if ("values" in filter) {
    return filter.values.length > 0
      ? { operator: filter.operator, values: [...filter.values].sort() }
      : undefined;
  }

  if (filter.operator === "between") {
    const from = cleanScalar(filter.from);
    const to = cleanScalar(filter.to);
    if (from === undefined && to === undefined) return undefined;
    return {
      operator: "between",
      ...(from !== undefined && { from }),
      ...(to !== undefined && { to }),
    };
  }

  const value = cleanScalar(filter.value);
  if (value === undefined) return undefined;
  return { operator: filter.operator, value } as TableColumnFilterValue;
}

/** Blank strings, null/undefined and non-finite numbers all mean "not set". */
export function isBlank(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value === "number") return !Number.isFinite(value);
  return typeof value === "string" && value.trim() === "";
}

function cleanScalar(
  value: string | number | undefined,
): string | number | undefined {
  if (isBlank(value)) return undefined;
  return typeof value === "string" ? value.trim() : value;
}
