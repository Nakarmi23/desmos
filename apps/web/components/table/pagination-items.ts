export type PaginationItem = number | "ellipsis";

// Pages listed when the current page sits near either end.
const NEAR_EDGE = 4;
// Beyond this many pages, some get collapsed into an ellipsis.
const MAX_LISTED_PAGES = 2 * NEAR_EDGE - 1;

/**
 * Page numbers (1-based) to render, with "ellipsis" standing in for skipped
 * runs. First and last pages are always present; the current page keeps a
 * neighbour on each side.
 */
export function getPaginationItems(
  page: number,
  pageCount: number,
): PaginationItem[] {
  if (pageCount <= MAX_LISTED_PAGES) return range(1, pageCount);

  if (page <= NEAR_EDGE)
    return [...range(1, NEAR_EDGE + 1), "ellipsis", pageCount];
  if (page > pageCount - NEAR_EDGE) {
    return [1, "ellipsis", ...range(pageCount - NEAR_EDGE, pageCount)];
  }
  return [1, "ellipsis", page - 1, page, page + 1, "ellipsis", pageCount];
}

function range(from: number, to: number): number[] {
  return Array.from({ length: to - from + 1 }, (_, i) => from + i);
}
