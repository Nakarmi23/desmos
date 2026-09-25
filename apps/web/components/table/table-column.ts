import type { ReactNode } from "react";

export type TableColumnType = "text" | "number" | "date";

export type TableColumnAlign = "left" | "right";

export type TableColumnBase = {
  id: string;
  header: string;
  type: TableColumnType;
  align?: TableColumnAlign;
  width?: number | string;
};

export type TableFilterOption = { value: string; label?: string };

/** Which Advanced Search control a column gets. */
export type TableColumnFilter =
  | { kind: "text" }
  | { kind: "number" }
  | { kind: "date" }
  | { kind: "select"; options: readonly TableFilterOption[] };

export type TableColumnFilterKind = TableColumnFilter["kind"];

/**
 * `sortable`/`searchable`/`filter` require `accessor` — sorting, searching and filtering need a
 * primitive value to compare, which a `render`-only column doesn't provide.
 */
export type TableColumn<T> = TableColumnBase &
  (
    | {
        accessor: (row: T) => unknown;
        render?: never;
        sortable?: boolean;
        searchable?: boolean;
        filter?: TableColumnFilter;
      }
    | {
        render: (row: T) => ReactNode;
        accessor?: never;
        sortable?: never;
        searchable?: never;
        filter?: never;
      }
  );

/** `number` columns right-align by default; everything else left-aligns. */
export function resolveColumnAlign(
  column: Pick<TableColumnBase, "type" | "align">,
): TableColumnAlign {
  return column.align ?? (column.type === "number" ? "right" : "left");
}
