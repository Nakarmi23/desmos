import { PlusIcon } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { defaultFilterValue } from "./filter-operators";
import type { ResolvedTableColumn } from "./table-column";
import type { TableColumnFilterValue } from "./table-fetcher";
import { FILTER_KIND_ICON, TableFilterChip } from "./table-filter-chip";
import { Button } from "@/components/button/button";
import { TextField } from "@/components/text-field/text-field";
import { tableStyles } from "./table.styles";
import { useDismiss } from "./use-dismiss";

export type TableAdvancedSearchProps<T> = {
  /** Only columns with a `filter`. */
  columns: readonly ResolvedTableColumn<T>[];
  /** Columns present here have a chip, active or not. */
  values: Record<string, TableColumnFilterValue>;
  onChange: (columnId: string, value: TableColumnFilterValue) => void;
  onRemove: (columnId: string) => void;
  onClear: () => void;
  /** Rendered at the start of the toolbar row (Basic Search). */
  leading?: ReactNode;
};

/**
 * Advanced Search: a bar of filter chips (one per column, added via the "+"
 * menu), each editable in place — operator, then value — plus "Clear filters".
 */
export function TableAdvancedSearch<T>({
  columns,
  values,
  onChange,
  onRemove,
  onClear,
  leading,
}: TableAdvancedSearchProps<T>) {
  const styles = tableStyles();
  const [addOpen, setAddOpen] = useState(false);
  const [query, setQuery] = useState("");
  // The chip just created opens straight into its value editor.
  const [justAdded, setJustAdded] = useState<string | null>(null);
  const addButton = useRef<HTMLButtonElement>(null);
  const searchBox = useRef<HTMLInputElement>(null);
  const addRoot = useRef<HTMLDivElement>(null);
  const addDismiss = useDismiss(
    addRoot,
    addOpen,
    () => setAddOpen(false),
    addButton,
  );

  useEffect(() => {
    if (addOpen) searchBox.current?.focus();
  }, [addOpen]);

  // Removing a chip unmounts the button that had focus; once that has
  // committed, hand focus to "Add filter" so keyboard users aren't dropped.
  const restoreFocus = useRef(false);
  useEffect(() => {
    if (!restoreFocus.current) return;
    restoreFocus.current = false;
    addButton.current?.focus();
  });

  const hasChip = (column: ResolvedTableColumn<T>) =>
    Object.hasOwn(values, column.id);
  const chips = columns.filter(hasChip);
  const addable = columns
    .filter((column) => !hasChip(column))
    .filter((column) =>
      column.header.toLowerCase().includes(query.trim().toLowerCase()),
    );

  function add(column: ResolvedTableColumn<T>) {
    if (!column.filter) return;
    onChange(column.id, defaultFilterValue(column.filter.kind));
    setJustAdded(column.id);
    setAddOpen(false);
  }

  return (
    <div className={styles.toolbar()}>
      <div className={styles.toolbarRow()}>
        {leading}
        <div
          ref={addRoot}
          {...addDismiss}
          className={`${styles.chipPart()} ml-auto`}
        >
          <Button
            ref={addButton}
            size="sm"
            aria-expanded={addOpen}
            aria-label="Add filter"
            startIcon={<PlusIcon />}
            onClick={() => {
              setQuery("");
              setAddOpen((open) => !open);
            }}
          >
            Filter
          </Button>
          {addOpen && (
            <div
              role="group"
              aria-label="Add filter options"
              className={styles.popupEnd()}
            >
              <TextField
                ref={searchBox}
                type="search"
                size="sm"
                aria-label="Search columns"
                placeholder="Add filter…"
                value={query}
                onValueChange={setQuery}
                className="mb-1"
              />
              {addable.map((column) => {
                const Icon = column.filter
                  ? FILTER_KIND_ICON[column.filter.kind]
                  : null;
                return (
                  <button
                    key={column.id}
                    type="button"
                    className={styles.menuItem()}
                    onClick={() => add(column)}
                  >
                    {Icon && <Icon aria-hidden size={14} />}
                    {column.header}
                  </button>
                );
              })}
              {addable.length === 0 && (
                <p className={styles.popupEmpty()}>No matching columns</p>
              )}
            </div>
          )}
        </div>
      </div>

      {chips.length > 0 && (
        <div className={styles.toolbarRow()}>
          {chips.map((column) => (
            <TableFilterChip
              key={column.id}
              column={column}
              value={values[column.id]}
              defaultOpen={justAdded === column.id}
              onChange={(value) => onChange(column.id, value)}
              onRemove={() => {
                restoreFocus.current = true;
                onRemove(column.id);
              }}
            />
          ))}
          <Button
            variant="subtle"
            size="sm"
            className="ml-auto"
            onClick={() => {
              restoreFocus.current = true;
              onClear();
            }}
          >
            Clear filters
          </Button>
        </div>
      )}
    </div>
  );
}
