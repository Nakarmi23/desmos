import { useEffect, useRef, useState } from "react";

import { normalizeFilters, type FilterDraft } from "./normalize-filters";
import type { TableColumnFilterValue, TableFilters } from "./table-fetcher";

// How long typing must pause before the filters are sent to the fetcher.
const FILTER_DEBOUNCE_MS = 300;

/**
 * Basic Search text and Advanced Search column filters share one lifecycle:
 * the controls update instantly (`draft`), and after a pause the normalized
 * result is committed (`filters`) — but only if it actually changed, in which
 * case `onCommit` fires (the table uses it to go back to page 1). Both start
 * from `initial`, read on mount only.
 */
export function useTableFilters(
  onCommit: () => void,
  initial: TableFilters = {},
) {
  const [draft, setDraft] = useState<FilterDraft>(() => ({
    search: initial.search ?? "",
    columns: initial.columns ?? {},
  }));
  // Bumped on every edit, so callers can react before the edit settles.
  const [draftVersion, setDraftVersion] = useState(0);
  const [committed, setCommitted] = useState(() => {
    const filters = normalizeFilters(draft);
    return { filters, key: JSON.stringify(filters) };
  });

  const draftRef = useRef(draft);
  const committedKey = useRef(committed.key);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const onCommitRef = useRef(onCommit);

  useEffect(() => {
    onCommitRef.current = onCommit;
  });
  useEffect(() => () => clearTimeout(timer.current), []);

  function update(change: (current: FilterDraft) => FilterDraft) {
    const next = change(draftRef.current);
    draftRef.current = next;
    setDraft(next);
    setDraftVersion((version) => version + 1);

    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const filters = normalizeFilters(next);
      const key = JSON.stringify(filters);
      // Settling back on what's already applied isn't a new search.
      if (key === committedKey.current) return;
      committedKey.current = key;
      setCommitted({ filters, key });
      onCommitRef.current();
    }, FILTER_DEBOUNCE_MS);
  }

  return {
    draft,
    draftVersion,
    filters: committed.filters,
    filtersKey: committed.key,
    setSearch: (search: string) => update((d) => ({ ...d, search })),
    setColumnFilter: (columnId: string, value: TableColumnFilterValue) =>
      update((d) => ({ ...d, columns: { ...d.columns, [columnId]: value } })),
    /** Drops the column's filter (and its chip). */
    removeColumnFilter: (columnId: string) =>
      update((d) => {
        const columns = { ...d.columns };
        delete columns[columnId];
        return { ...d, columns };
      }),
    /** Drops every column filter; Basic Search is left alone. */
    clearColumnFilters: () => update((d) => ({ ...d, columns: {} })),
    /** Drops Basic Search and every column filter. */
    clearAll: () => update(() => ({ search: "", columns: {} })),
  };
}
