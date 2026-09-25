import type { ReactNode } from "react";

/** `enum` columns hold one of a known set of `options`. */
export type TableColumnType = "text" | "number" | "date" | "enum";

export type TableColumnAlign = "left" | "right";

export type TableFilterOption = { value: string; label?: string };

export type TableColumnBase = {
  id: string;
  header: string;
  align?: TableColumnAlign;
  width?: number | string;
} & (
  | { type: "text" | "number" | "date"; options?: never }
  | { type: "enum"; options: readonly TableFilterOption[] }
);

/** Which Advanced Search control a column gets. */
export type TableColumnFilter =
  | { kind: "text" }
  | { kind: "number" }
  | { kind: "date" }
  | { kind: "select"; options: readonly TableFilterOption[] };

export type TableColumnFilterKind = TableColumnFilter["kind"];

/**
 * `sortable`/`searchable`/`filter` default from `type` (see `resolveColumn`)
 * and need `accessor` — sorting, searching and filtering need a primitive
 * value to compare, which a `render`-only column doesn't provide.
 */
export type TableColumn<T> = TableColumnBase &
  (
    | {
        accessor: (row: T) => unknown;
        render?: never;
        sortable?: boolean;
        searchable?: boolean;
        /** `false` opts out of Advanced Search; an object overrides the control. */
        filter?: boolean | TableColumnFilter;
      }
    | {
        render: (row: T) => ReactNode;
        accessor?: never;
        sortable?: never;
        searchable?: never;
        filter?: never;
      }
  );

/** A column with every default filled in from its `type`. */
export type ResolvedTableColumn<T> = TableColumnBase & {
  accessor?: (row: T) => unknown;
  render?: (row: T) => ReactNode;
  align: TableColumnAlign;
  sortable: boolean;
  searchable: boolean;
  /** Absent when the column isn't in Advanced Search. */
  filter?: TableColumnFilter;
};

/** `number` columns right-align by default; everything else left-aligns. */
export function resolveColumnAlign(column: {
  type: TableColumnType;
  align?: TableColumnAlign;
}): TableColumnAlign {
  return column.align ?? (column.type === "number" ? "right" : "left");
}

/**
 * Fills in what `type` implies: any `accessor` column sorts and gets the
 * Advanced Search control for its type (`enum` -> select over its options);
 * only `text` columns join Basic Search. Explicit settings win.
 */
export function resolveColumn<T>(
  column: TableColumn<T>,
): ResolvedTableColumn<T> {
  const hasValue = column.accessor !== undefined;
  const filter =
    !hasValue || column.filter === false
      ? undefined
      : typeof column.filter === "object"
        ? column.filter
        : defaultFilter(column);
  return {
    ...column,
    align: resolveColumnAlign(column),
    sortable: hasValue && (column.sortable ?? true),
    searchable: hasValue && (column.searchable ?? column.type === "text"),
    filter,
  } as ResolvedTableColumn<T>;
}

function defaultFilter(column: TableColumnBase): TableColumnFilter {
  return column.type === "enum"
    ? { kind: "select", options: column.options }
    : { kind: column.type };
}
