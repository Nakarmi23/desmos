import { tv } from "tailwind-variants";

export const tableStyles = tv({
  slots: {
    wrapper:
      "flex min-h-0 min-w-0 grow flex-col rounded-lg border border-border bg-surface",

    chip: "inline-flex h-8 items-stretch rounded-md border border-border bg-surface text-sm text-text",
    chipColumn:
      "inline-flex items-center gap-1.5 rounded-l-md border-r border-border px-2 py-1",
    chipSegment:
      "border-r border-border px-2 py-1 hover:bg-background-neutral-hovered focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-border-selected data-[muted]:text-text-subtle",
    chipRemove:
      "inline-flex items-center rounded-r-md px-1.5 text-text-subtle hover:bg-background-neutral-hovered hover:text-text focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-border-selected",
    // Placed by Base UI's positioner, which keeps them on-screen; capped to the
    // room it reports so they never run wider than the viewport.
    popup:
      "flex max-w-(--available-width) min-w-56 flex-col gap-0.5 rounded-lg border border-border bg-surface p-1.5 text-sm text-text shadow-lg outline-none",
    popupBody:
      "flex max-w-(--available-width) min-w-60 flex-col gap-2.5 rounded-lg border border-border bg-surface p-3 text-sm text-text shadow-lg outline-none",
    popupEmpty: "px-2.5 py-1.5 text-text-subtle",
    menuItem:
      "flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left outline-none hover:bg-background-neutral-hovered data-[highlighted]:bg-background-neutral-hovered focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-border-selected",
    toolbar: "flex flex-col gap-2 border-b border-border p-2",
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
    emptyValue: "text-text-subtle",
    valueChips: "flex flex-wrap gap-1",
    valueChip:
      "inline-flex items-center rounded-full border border-border bg-surface-sunken px-2 text-xs leading-5 text-text",
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
