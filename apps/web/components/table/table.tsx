"use client";

import { ArrowDown, ArrowUp, ChevronsUpDown, SearchIcon } from "lucide-react";
import {
  rowPaginationFeature,
  rowSortingFeature,
  tableFeatures,
  useTable,
  type Column,
  type ColumnDef,
  type RowData,
} from "@tanstack/react-table";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";

import {
  resolveColumn,
  type ResolvedTableColumn,
  type TableColumn,
  type TableFilterOption,
} from "./table-column";
import type {
  TableFetcher,
  TableFetcherResult,
  TableSort,
} from "./table-fetcher";
import { TableAdvancedSearch } from "./table-advanced-search";
import { TablePagination } from "./table-pagination";
import { useTableFilters } from "./use-table-filters";
import {
  DEFAULT_PAGE_SIZE,
  DEFAULT_PAGE_SIZE_OPTIONS,
  type TableView,
} from "./table-view";
import { Button } from "@/components/button/button";
import { Checkbox } from "@/components/checkbox/checkbox";
import { TextField } from "@/components/text-field/text-field";
import { tableStyles } from "./table.styles";

/**
 * An operation offered against the Table's Selection. `onAction` gets the ids (per `getRowId`) of
 * the selected rows; the Table doesn't await it or change the rows itself.
 */
export type TableBulkAction = {
  id: string;
  label: string;
  onAction: (selectedIds: string[]) => void;
};

export type TableProps<T extends RowData> = {
  columns: readonly TableColumn<T>[];
  fetcher: TableFetcher<T>;
  getRowId: (row: T) => string;
  /** Rows per page on first render. Defaults to 25. */
  defaultPageSize?: number;
  /** Choices in the rows-per-page selector. Defaults to 25 / 50 / 100. */
  pageSizeOptions?: readonly number[];
  /**
   * Sort on first render. Defaults to none. With `initialView`, its `sort`
   * wins — give the URL codec the same `defaultSort` so it fills that in.
   */
  defaultSort?: TableSort;
  /** Adds a checkbox column; a toolbar with these actions shows while rows are selected. */
  bulkActions?: readonly TableBulkAction[];
  /**
   * The view to open on (e.g. read from the URL), used on mount only. A page
   * size not in `pageSizeOptions` falls back to `defaultPageSize`.
   */
  initialView?: TableView;
  /**
   * The fetcher's result for the view the Table opens on, loaded elsewhere
   * (e.g. on the server): shown on the first render, instead of fetching it.
   * Used on mount only; every later view goes through `fetcher`.
   */
  initialData?: TableFetcherResult<T>;
  /** Called with each settled view (debounced for search), mount included. */
  onViewChange?: (view: TableView) => void;
};

// Outcome of the fetch for one request, tagged with the request it answers so
// a stale answer never masquerades as the current page's.
type FetchResult<T extends RowData> = {
  requestKey: string;
  outcome:
    | { status: "error" }
    | { status: "success"; rows: T[] }
    // The page doesn't exist (e.g. a stale link); the Table moves to the last.
    | { status: "pastEnd"; lastPageIndex: number };
};

// Basic/Advanced Search and row Selection aren't table features — they're plain
// state (the fetcher gets the search; Selection is scoped to one page's view).
const features = tableFeatures({
  rowPaginationFeature,
  rowSortingFeature,
});

const EMPTY_ROWS: never[] = [];
const EMPTY_SELECTION: ReadonlySet<string> = new Set();

/** Id of the checkbox column, present only when the Table has Bulk Actions. */
const SELECT_COLUMN_ID = "_select";

/** Selected row ids, tagged with the view they were picked in. */
type Selection = { key: string; ids: ReadonlySet<string> };

/** Row 0 is the header row; data rows start at 1 (matches `aria-rowindex`). */
type GridPosition = { row: number; col: number };

/** The focused cell, remembered with the page it was on (see `activeRow`). */
type ActiveCell = GridPosition & { viewKey: string };

export function Table<T extends RowData>({
  columns,
  fetcher,
  getRowId,
  defaultPageSize = DEFAULT_PAGE_SIZE,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  bulkActions,
  defaultSort = null,
  initialView,
  initialData,
  onViewChange,
}: TableProps<T>) {
  const [result, setResult] = useState<FetchResult<T> | null>(null);
  // Last known total, kept while a new page loads so the controls don't vanish.
  const [total, setTotal] = useState(initialData?.total ?? 0);
  // `initialData`, until it's been taken as the first view's result.
  const [seed, setSeed] = useState(initialData);
  const [attempt, setAttempt] = useState(0);
  const [active, setActive] = useState<ActiveCell>({
    row: 0,
    col: 0,
    viewKey: "",
  });
  const [selection, setSelection] = useState<Selection>({
    key: "",
    ids: EMPTY_SELECTION,
  });
  const gridRef = useRef<HTMLTableElement>(null);
  const styles = tableStyles();

  // Every default a column leaves out, filled in from its `type`.
  const resolved = useMemo(() => columns.map(resolveColumn), [columns]);
  const hasBulkActions = bulkActions !== undefined && bulkActions.length > 0;
  const columnDefs = useMemo(
    () => toColumnDefs(resolved, hasBulkActions),
    [resolved, hasBulkActions],
  );
  const alignById = useMemo(
    () => new Map(resolved.map((c) => [c.id, c.align])),
    [resolved],
  );
  const widthById = useMemo(
    () => new Map(resolved.map((c) => [c.id, c.width])),
    [resolved],
  );

  const rows =
    result?.outcome.status === "success" ? result.outcome.rows : EMPTY_ROWS;

  const table = useTable({
    features,
    columns: columnDefs,
    data: rows,
    getRowId: (row) => getRowId(row),
    manualPagination: true,
    manualSorting: true,
    // One column at a time, always ascending <-> descending (no unsorted step).
    enableMultiSort: false,
    enableSortingRemoval: false,
    rowCount: total,
    initialState: {
      pagination: {
        pageIndex: initialView ? initialView.page - 1 : 0,
        pageSize:
          initialView && pageSizeOptions.includes(initialView.pageSize)
            ? initialView.pageSize
            : defaultPageSize,
      },
      sorting: toSorting(initialView ? initialView.sort : defaultSort),
    },
  });
  const { pageIndex, pageSize } = table.state.pagination;

  // Basic Search + Advanced Search; a committed change goes back to page 1.
  const {
    draft,
    draftVersion,
    filters,
    filtersKey,
    setSearch,
    setColumnFilter,
    removeColumnFilter,
    clearColumnFilters,
    clearAll,
  } = useTableFilters(() => table.setPageIndex(0), initialView?.filters);

  const sortColumnId = table.state.sorting[0]?.id;
  const sortDesc = table.state.sorting[0]?.desc ?? false;
  const sortKey = sortColumnId
    ? `${sortColumnId}:${sortDesc ? "desc" : "asc"}`
    : "";

  // Everything that picks which rows are on screen. Changing any of it drops
  // the grid's focus position and, together with `attempt`, keys the request.
  const viewKey = `${pageIndex}:${pageSize}:${sortKey}:${filtersKey}`;
  const requestKey = `${viewKey}:${attempt}`;
  // The first view's result is already here: take it during the first render
  // (so server-rendered HTML has the rows), keyed like a fetched one.
  if (seed) {
    setSeed(undefined);
    setResult({ requestKey, outcome: toOutcome(seed, pageIndex, pageSize) });
  }
  const outcome = result?.requestKey === requestKey ? result.outcome : null;
  // Past the end reads as still loading: the last page is on its way.
  const state =
    outcome && outcome.status !== "pastEnd"
      ? outcome
      : { status: "loading" as const };
  const pastEndTo =
    outcome?.status === "pastEnd" ? outcome.lastPageIndex : null;

  // Selection belongs to the view it was made in: when the view changes — or
  // the search/filter controls do, before that change even settles — drop it
  // right away (a derived check would revive it on returning to the same view).
  const selectionKey = `${viewKey}#${draftVersion}`;
  if (selection.key !== selectionKey) {
    setSelection({ key: selectionKey, ids: EMPTY_SELECTION });
  }
  const selected =
    selection.key === selectionKey ? selection.ids : EMPTY_SELECTION;
  const dataRows = state.status === "success" ? table.getRowModel().rows : [];
  const pageCount = table.getPageCount();
  // Last page is usually short; mirror it so the skeleton doesn't overshoot.
  const skeletonRowCount =
    total > 0
      ? Math.max(1, Math.min(pageSize, total - pageIndex * pageSize))
      : pageSize;
  // -1 is the ARIA value for "unknown" (nothing loaded yet).
  const rowCount = total > 0 ? total + 1 : state.status === "loading" ? -1 : 1;
  const pageIds = dataRows.map((row) => row.id);
  const selectedCount = selected.size;
  const allSelected =
    pageIds.length > 0 && pageIds.every((id) => selected.has(id));
  const lastRow = dataRows.length; // header is row 0
  const lastCol = columnDefs.length - 1;
  // A new page unmounts the focused row, so fall back to the header row
  // rather than snapping to a stale position when the rows arrive.
  const activeRow =
    active.viewKey === viewKey ? Math.min(active.row, lastRow) : 0;

  const cellProps = (row: number, col: number) => ({
    "data-grid-row": row,
    "data-grid-col": col,
    "aria-colindex": col + 1,
    tabIndex: row === activeRow && col === active.col ? 0 : -1,
    onFocus: () => setActive({ row, col, viewKey }),
  });

  const searchableHeaders = resolved
    .filter((column) => column.searchable)
    .map((column) => column.header.toLowerCase())
    .join(", ");
  const hasSearch = searchableHeaders !== "";
  // Names what the empty state's button would clear; null when nothing applies.
  const clearLabel =
    filters.search && filters.columns
      ? "Clear search and filters"
      : filters.search
        ? "Clear search"
        : filters.columns
          ? "Clear filters"
          : null;
  const filterableColumns = resolved.filter((column) => column.filter);
  const hasAdvancedSearch = filterableColumns.length > 0;

  function toggleRow(id: string) {
    const ids = new Set(selected);
    if (!ids.delete(id)) ids.add(id);
    setSelection({ key: selectionKey, ids });
  }

  function toggleAll() {
    setSelection({
      key: selectionKey,
      ids: allSelected ? EMPTY_SELECTION : new Set(pageIds),
    });
  }

  function toggleSort(column: Column<typeof features, T>) {
    // First click sorts ascending; clicking the sorted column flips it.
    column.toggleSorting(column.getIsSorted() === "asc");
    table.setPageIndex(0);
  }

  function moveTo(row: number, col: number) {
    setActive({ row, col, viewKey });
    gridRef.current
      ?.querySelector<HTMLElement>(
        `[data-grid-row="${row}"][data-grid-col="${col}"]`,
      )
      ?.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTableElement>) {
    // Ignore keys coming from interactive content inside a cell.
    const cell = event.target as HTMLElement;
    if (cell.dataset.gridRow === undefined) return;

    const row = Number(cell.dataset.gridRow);
    const col = Number(cell.dataset.gridCol);
    const ctrl = event.ctrlKey || event.metaKey;

    if (
      row === 0 &&
      (event.key === "Enter" || event.key === " ") &&
      !event.repeat &&
      !ctrl &&
      !event.altKey &&
      !event.shiftKey
    ) {
      const column = table.getAllLeafColumns()[col];
      if (column?.getCanSort()) {
        event.preventDefault();
        toggleSort(column);
      }
      return;
    }

    const next: GridPosition | null = (() => {
      switch (event.key) {
        case "ArrowUp":
          return { row: Math.max(row - 1, 0), col };
        case "ArrowDown":
          return { row: Math.min(row + 1, lastRow), col };
        case "ArrowLeft":
          return { row, col: Math.max(col - 1, 0) };
        case "ArrowRight":
          return { row, col: Math.min(col + 1, lastCol) };
        case "Home":
          return ctrl ? { row: 0, col: 0 } : { row, col: 0 };
        case "End":
          return ctrl ? { row: lastRow, col: lastCol } : { row, col: lastCol };
        default:
          return null;
      }
    })();

    if (!next) return;
    event.preventDefault();
    moveTo(next.row, next.col);
  }

  const sort: TableSort = useMemo(
    () =>
      sortColumnId
        ? { columnId: sortColumnId, direction: sortDesc ? "desc" : "asc" }
        : null,
    [sortColumnId, sortDesc],
  );

  useEffect(() => {
    if (pastEndTo !== null) table.setPageIndex(pastEndTo);
  }, [pastEndTo, table]);

  const onViewChangeRef = useRef(onViewChange);
  useEffect(() => {
    onViewChangeRef.current = onViewChange;
  });
  // Reported once the view has loaded (or failed), so a page that turns out to
  // be past the end is never reported, only the last page it's moved to.
  const settled = state.status !== "loading";
  useEffect(() => {
    if (!settled) return;
    onViewChangeRef.current?.({ page: pageIndex + 1, pageSize, sort, filters });
  }, [settled, pageIndex, pageSize, sort, filters]);

  // Only fetch a request that hasn't been answered (e.g. by `initialData`).
  const answeredKey = result?.requestKey;
  useEffect(() => {
    if (answeredKey === requestKey) return;
    let cancelled = false;
    fetcher(pageIndex + 1, pageSize, sort, filters).then(
      (response) => {
        if (cancelled) return;
        setTotal(response.total);
        setResult({
          requestKey,
          outcome: toOutcome(response, pageIndex, pageSize),
        });
      },
      () => {
        if (!cancelled) {
          setResult({ requestKey, outcome: { status: "error" } });
        }
      },
    );
    return () => {
      cancelled = true;
    };
  }, [fetcher, pageIndex, pageSize, sort, filters, requestKey, answeredKey]);

  const searchField = hasSearch ? (
    <TextField
      type="search"
      size="sm"
      aria-label="Search"
      placeholder={`Search ${searchableHeaders}`}
      prefix={<SearchIcon aria-hidden size={14} />}
      value={draft.search}
      onValueChange={setSearch}
      clearable
      clearLabel="Clear search"
      className="min-w-0 flex-1 sm:w-72 sm:flex-none"
    />
  ) : null;

  return (
    <div className={styles.wrapper()}>
      {hasAdvancedSearch ? (
        <TableAdvancedSearch
          columns={filterableColumns}
          values={draft.columns}
          onChange={setColumnFilter}
          onRemove={removeColumnFilter}
          onClear={clearColumnFilters}
          leading={searchField}
        />
      ) : (
        hasSearch && (
          <div className={styles.toolbar()}>
            <div className={styles.toolbarRow()}>{searchField}</div>
          </div>
        )
      )}
      {hasBulkActions && selectedCount > 0 && (
        <div
          role="toolbar"
          aria-label="Bulk actions"
          className={styles.bulkBar()}
        >
          <span className={styles.bulkCount()}>{selectedCount} selected</span>
          {bulkActions.map((action) => (
            <Button
              key={action.id}
              size="sm"
              onClick={() =>
                action.onAction(pageIds.filter((id) => selected.has(id)))
              }
            >
              {action.label}
            </Button>
          ))}
        </div>
      )}
      <div className={styles.root()}>
        <table
          ref={gridRef}
          role="grid"
          className={styles.table()}
          aria-busy={state.status === "loading"}
          aria-colcount={columnDefs.length}
          aria-rowcount={rowCount}
          onKeyDown={handleKeyDown}
        >
          <thead>
            {table.getHeaderGroups().map((group) => (
              <tr key={group.id} role="row" aria-rowindex={1}>
                {group.headers.map((header, col) => (
                  <th
                    key={header.id}
                    role="columnheader"
                    scope="col"
                    {...cellProps(0, col)}
                    data-align={alignById.get(header.column.id)}
                    data-sortable={header.column.getCanSort() ? "" : undefined}
                    aria-sort={ariaSort(header.column)}
                    onClick={
                      header.column.getCanSort()
                        ? () => toggleSort(header.column)
                        : undefined
                    }
                    className={styles.headerCell({
                      select: header.column.id === SELECT_COLUMN_ID,
                    })}
                    style={{ width: widthById.get(header.column.id) }}
                  >
                    {header.column.id === SELECT_COLUMN_ID ? (
                      <Checkbox
                        aria-label="Select all rows on this page"
                        checked={allSelected}
                        mixed={selectedCount > 0 && !allSelected}
                        disabled={pageIds.length === 0}
                        onChange={toggleAll}
                      />
                    ) : header.isPlaceholder ? null : (
                      <span className={styles.headerContent()}>
                        <table.FlexRender header={header} />
                        <SortIndicator column={header.column} />
                      </span>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {state.status === "loading" &&
              Array.from({ length: skeletonRowCount }, (_, index) => (
                <tr key={index} role="row" className={styles.row()}>
                  {columnDefs.map((column) => (
                    <td
                      key={column.id}
                      role="gridcell"
                      data-align={alignById.get(column.id!)}
                      className={styles.cell()}
                    >
                      <span className={styles.skeletonBar()} />
                    </td>
                  ))}
                </tr>
              ))}
            {state.status === "success" &&
              dataRows.map((row, rowIndex) => (
                <tr
                  key={row.id}
                  role="row"
                  aria-rowindex={pageIndex * pageSize + rowIndex + 2}
                  className={styles.row()}
                >
                  {row.getAllCells().map((cell, col) => (
                    <td
                      key={cell.id}
                      role="gridcell"
                      {...cellProps(rowIndex + 1, col)}
                      data-align={alignById.get(cell.column.id)}
                      className={styles.cell({
                        select: cell.column.id === SELECT_COLUMN_ID,
                      })}
                    >
                      {cell.column.id === SELECT_COLUMN_ID ? (
                        <Checkbox
                          aria-label={`Select row ${rowIndex + 1}`}
                          checked={selected.has(row.id)}
                          onChange={() => toggleRow(row.id)}
                        />
                      ) : (
                        <table.FlexRender cell={cell} />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
          </tbody>
        </table>
        {state.status === "success" && dataRows.length === 0 && (
          <div className={styles.message()}>
            <p>No results found</p>
            {clearLabel && (
              <Button size="sm" onClick={clearAll}>
                {clearLabel}
              </Button>
            )}
          </div>
        )}
        {state.status === "error" && (
          <div role="alert" className={styles.message()}>
            <p>Something went wrong while loading data.</p>
            <Button size="sm" onClick={() => setAttempt((n) => n + 1)}>
              Retry
            </Button>
          </div>
        )}
      </div>
      {total > 0 && (
        <div className={styles.footer()}>
          <TablePagination
            page={pageIndex + 1}
            pageCount={pageCount}
            onPageChange={(page) => table.setPageIndex(page - 1)}
            pageSize={pageSize}
            pageSizeOptions={pageSizeOptions}
            onPageSizeChange={(size) =>
              table.setPagination({ pageIndex: 0, pageSize: size })
            }
          />
        </div>
      )}
    </div>
  );
}

// An empty page beyond the last one means the rows moved (or the URL was
// stale): go to the last page rather than show "no results".
function toOutcome<T extends RowData>(
  response: TableFetcherResult<T>,
  pageIndex: number,
  pageSize: number,
): FetchResult<T>["outcome"] {
  const lastPageIndex = Math.max(Math.ceil(response.total / pageSize) - 1, 0);
  return response.rows.length === 0 && pageIndex > lastPageIndex
    ? { status: "pastEnd", lastPageIndex }
    : { status: "success", rows: response.rows };
}

function toSorting(sort: TableSort) {
  return sort ? [{ id: sort.columnId, desc: sort.direction === "desc" }] : [];
}

function ariaSort<T extends RowData>(
  column: Column<typeof features, T>,
): "ascending" | "descending" | "none" | undefined {
  if (!column.getCanSort()) return undefined;
  const sorted = column.getIsSorted();
  if (!sorted) return "none";
  return sorted === "asc" ? "ascending" : "descending";
}

function SortIndicator<T extends RowData>({
  column,
}: {
  column: Column<typeof features, T>;
}) {
  if (!column.getCanSort()) return null;
  const sorted = column.getIsSorted();
  const Icon =
    sorted === "asc" ? ArrowUp : sorted === "desc" ? ArrowDown : ChevronsUpDown;
  return (
    <Icon
      aria-hidden
      size={14}
      data-sorted={sorted ? "" : undefined}
      className={tableStyles().sortIcon()}
    />
  );
}

function toColumnDefs<T extends RowData>(
  columns: readonly ResolvedTableColumn<T>[],
  withSelectColumn: boolean,
): ColumnDef<typeof features, T>[] {
  const defs: ColumnDef<typeof features, T>[] = columns.map((column) => {
    const render = column.render;
    return render
      ? {
          id: column.id,
          header: column.header,
          cell: ({ row }) => render(row.original),
        }
      : {
          id: column.id,
          header: column.header,
          accessorFn: column.accessor,
          enableSorting: column.sortable,
          cell: ({ getValue }) =>
            column.type === "multiEnum" ? (
              <ValueChips values={getValue()} options={column.options} />
            ) : (
              <CellText value={formatValue(getValue(), column.options)} />
            ),
        };
  });
  if (!withSelectColumn) return defs;
  // Placeholder: the checkbox itself is drawn by the Table, which owns the state.
  return [
    {
      id: SELECT_COLUMN_ID,
      header: "",
      enableSorting: false,
      cell: () => null,
    },
    ...defs,
  ];
}

// `multiEnum` cells: one wrapping chip per value.
function ValueChips({
  values,
  options,
}: {
  values: unknown;
  options: readonly TableFilterOption[];
}) {
  if (!Array.isArray(values) || values.length === 0) return <EmptyValue />;
  const styles = tableStyles();
  return (
    <ul className={styles.valueChips()}>
      {values.map((value) => (
        <li key={String(value)} className={styles.valueChip()}>
          {formatValue(value, options)}
        </li>
      ))}
    </ul>
  );
}

function CellText({ value }: { value: string }) {
  return value.trim() === "" ? <EmptyValue /> : value;
}

// A cell with nothing in it (no value, an empty list) says so rather than
// looking unfinished.
function EmptyValue() {
  return <span className={tableStyles().emptyValue()}>—</span>;
}

// `enum` cells show their option's label, as the Advanced Search select does.
function formatValue(
  value: unknown,
  options?: readonly TableFilterOption[],
): string {
  if (value == null) return "";
  const option = options?.find((o) => o.value === value);
  if (option) return option.label ?? option.value;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value);
}
