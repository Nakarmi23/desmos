import { tv } from "tailwind-variants";

export const tableStyles = tv({
  slots: {
    wrapper:
      "flex min-h-0 min-w-0 grow flex-col rounded-lg border border-border bg-surface",

    chip: "inline-flex h-8 items-stretch rounded-md border border-border bg-surface text-sm text-text",
    chipColumn:
      "inline-flex items-center gap-1.5 rounded-l-md border-r border-border px-2 py-1",
    // Below `lg` a chip's popup anchors to the toolbar instead, spanning it, so
    // a chip near the right edge can't push its popup off-screen.
    chipPart: "relative flex max-lg:static",
    chipSegment:
      "border-r border-border px-2 py-1 hover:bg-background-neutral-hovered focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-border-selected data-[muted]:text-text-subtle",
    chipRemove:
      "inline-flex items-center rounded-r-md px-1.5 text-text-subtle hover:bg-background-neutral-hovered hover:text-text focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-border-selected",
    popup:
      "absolute top-full left-0 z-20 max-lg:inset-x-2 mt-1.5 flex min-w-56 flex-col gap-0.5 rounded-lg border border-border bg-surface p-1.5 text-sm text-text shadow-lg",
    popupEnd:
      "absolute top-full right-0 z-20 max-lg:right-2 mt-1.5 flex min-w-56 flex-col gap-0.5 rounded-lg border border-border bg-surface p-1.5 text-sm text-text shadow-lg",
    popupBody:
      "absolute top-full left-0 z-20 max-lg:inset-x-2 mt-1.5 flex min-w-60 flex-col gap-2.5 rounded-lg border border-border bg-surface p-3 text-sm text-text shadow-lg",
    popupEmpty: "px-2.5 py-1.5 text-text-subtle",
    menuItem:
      "flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left hover:bg-background-neutral-hovered focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-border-selected",
    toolbar: "relative flex flex-col gap-2 border-b border-border p-2",
    toolbarRow: "flex flex-wrap items-center gap-2",
    root: "min-h-0 flex-1 overflow-auto first:rounded-t-lg",
    // Below `lg`: natural column widths, and `root` scrolls sideways.
    table:
      "w-full border-separate border-spacing-0 text-sm text-text max-lg:min-w-max",
    row: "hover:bg-surface-sunken",
    headerCell:
      "sticky top-0 z-10 border-b border-r border-border bg-surface-sunken px-3 py-1.5 font-medium text-text-subtle last:border-r-0 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-border-selected data-[sortable]:cursor-pointer data-[sortable]:select-none data-[sortable]:hover:bg-background-neutral-hovered data-[align=right]:text-right data-[align=left]:text-left",
    sortIcon:
      "text-text-subtle opacity-50 data-[sorted]:text-text data-[sorted]:opacity-100",
    headerContent: "inline-flex items-center gap-1",
    cell: "border-b border-r border-border px-3 py-1.5 last:border-r-0 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-border-selected data-[align=right]:text-right data-[align=left]:text-left",
    bulkBar:
      "flex flex-wrap items-center gap-2 border-b border-border bg-surface-sunken px-3 py-2 text-sm text-text",
    bulkCount: "font-medium",
    skeletonBar: "inline-block h-3.5 w-3/4 animate-pulse rounded bg-border",
    message:
      "flex flex-col items-center gap-2 px-4 py-8 text-center text-sm text-text-subtle",
    footer:
      "flex flex-wrap items-center justify-between gap-2 rounded-b-lg border-t border-border px-3 py-2 text-sm text-text-subtle",
    pageSizeLabel: "flex items-center gap-2",
    pageEllipsis: "px-1",
    pagination: "flex flex-wrap items-center gap-1",
  },
  variants: {
    // The checkbox column: as narrow as its box.
    select: {
      true: { headerCell: "w-10", cell: "w-10" },
    },
  },
});
