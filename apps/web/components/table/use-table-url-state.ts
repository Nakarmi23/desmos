"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import {
  decodeTableView,
  encodeTableView,
  withTableView,
  type TableUrlConfig,
} from "./table-url-state";
import type { TableView } from "./table-view";

/**
 * Keeps a Table's view in the URL's query string: spread the result onto the
 * Table. It opens on the view in the URL, and each new view is pushed as a
 * history entry (the first one only replaces, to tidy a hand-typed URL). When
 * the view in the URL changes from elsewhere — Back/Forward, a nav link — the
 * Table is remounted (via `key`) on it. Other query params are left alone.
 */
export function useTableUrlState<T>(config: TableUrlConfig<T>) {
  const searchParams = useSearchParams();
  const initialView = decodeTableView(searchParams, config);
  // Just the view's part of the query, canonical, so foreign params and
  // spelling differences (e.g. a default written out) don't count as changes.
  const query = encodeTableView(initialView, config).toString();
  const [mountKey, setMountKey] = useState(0);
  // Views we wrote that the router hasn't echoed back yet, oldest first.
  const pending = useRef<string[]>([]);
  // The view the mounted Table is showing.
  const shown = useRef(query);
  const reported = useRef<number | null>(null);

  useEffect(() => {
    const echoed = pending.current.indexOf(query);
    if (echoed !== -1) {
      pending.current = pending.current.slice(echoed + 1);
      return;
    }
    if (query === shown.current) return;
    shown.current = query;
    pending.current = [];
    setMountKey((key) => key + 1);
  }, [query]);

  function onViewChange(view: TableView) {
    const current = new URLSearchParams(window.location.search);
    const next = withTableView(current, view, config).toString();
    const firstReport = reported.current !== mountKey;
    reported.current = mountKey;
    const own = encodeTableView(view, config).toString();
    // Same view: nothing to record (though a first report still tidies junk).
    const unchanged = firstReport
      ? next === current.toString()
      : own === shown.current;
    if (unchanged) return;

    // Tidying alone leaves the view's part as it was, so no echo will come.
    if (own !== shown.current) pending.current.push(own);
    shown.current = own;
    const { pathname, hash } = window.location;
    const url = `${pathname}${next ? `?${next}` : ""}${hash}`;
    if (firstReport) window.history.replaceState(null, "", url);
    else window.history.pushState(null, "", url);
  }

  return {
    key: mountKey,
    initialView,
    onViewChange,
  };
}
