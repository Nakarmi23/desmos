import { tv } from "tailwind-variants";

// The `root` slot is rendered by Base UI's `Collapsible.Root` (via its
// `render` prop), so it carries `data-open` / `data-closed` itself. Its
// `group` class lets descendants (nav rows, nav labels) key off that same
// state with `group-data-[open]:` / `group-data-[closed]:` instead of a
// JS-computed className.
export const sidebarStyles = tv({
  slots: {
    root: [
      "group flex h-vh shrink-0 flex-col overflow-hidden border-r border-border bg-surface",
      "transition-[width] duration-200 ease-out",
      "data-[open]:w-60 data-[closed]:w-16",
    ],
    header: [
      "flex h-14 items-center border-b border-border px-3",
      "group-data-[open]:gap-3 group-data-[closed]:justify-center",
    ],
    brandGlyph:
      "flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-background-neutral-hovered text-sm font-medium text-text",
    // Unlike the nav labels below, the brand label is a `Collapsible.Panel`,
    // so it carries `data-open` / `data-closed` directly.
    brandLabelPanel: [
      "overflow-hidden whitespace-nowrap transition-[width,opacity] duration-200 ease-out",
      "data-[open]:w-auto data-[open]:opacity-100",
      "data-[closed]:w-0 data-[closed]:opacity-0",
    ],
    brandLabelText: "text-sm font-medium text-text",
    nav: "flex flex-1 flex-col gap-1 p-2",
    navLink: [
      "flex items-center rounded-md px-3 py-2 text-text-subtle",
      "group-data-[open]:gap-3 group-data-[closed]:justify-center",
      "hover:bg-background-neutral-hovered hover:text-text",
      "data-[active]:border-border-selected data-[active]:bg-background-selected data-[active]:text-text-selected",
      "data-[active]:hover:bg-background-selected-hovered",
    ],
    navIconGlyph:
      "flex h-5 w-5 shrink-0 items-center justify-center rounded-sm bg-background-neutral-hovered text-xs font-medium",
    navLabelText: [
      "overflow-hidden whitespace-nowrap transition-[width,opacity] duration-200 ease-out",
      "group-data-[open]:w-auto group-data-[open]:opacity-100",
      "group-data-[closed]:w-0 group-data-[closed]:opacity-0",
    ],
    footer: "border-t border-border p-2 group-data-[closed]:flex group-data-[closed]:justify-center",
    // `Collapsible.Trigger` carries `data-panel-open`; its own `group` class
    // is what `collapseIcon` rotates against.
    collapseTrigger: [
      "group flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-text-subtle",
      "hover:bg-background-neutral-hovered hover:text-text",
    ],
    collapseIcon:
      "h-4 w-4 transition-transform duration-200 group-data-[panel-open]:rotate-180",
  },
});
