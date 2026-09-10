import { tv } from "tailwind-variants";

// `sidebarRoot` is rendered by Base UI's `Collapsible.Root` (via its `render`
// prop), so it carries `data-open` / `data-closed` itself. `group` lets
// descendants (nav labels, the brand label) key off that same attribute via
// `group-data-open:` / `group-data-closed:` instead of a JS-computed
// className.
export const sidebarRoot = tv({
  base: [
    "group flex h-full shrink-0 flex-col overflow-hidden border-r border-border bg-surface",
    "transition-[width] duration-200 ease-out",
    "data-[open]:w-60 data-[closed]:w-16",
  ].join(" "),
});

export const brandLabelPanel = tv({
  base: [
    "overflow-hidden whitespace-nowrap transition-[width,opacity] duration-200 ease-out",
    "data-[open]:w-auto data-[open]:opacity-100",
    "data-[closed]:w-0 data-[closed]:opacity-0",
  ].join(" "),
});

export const navLabelText = tv({
  base: [
    "overflow-hidden whitespace-nowrap transition-[width,opacity] duration-200 ease-out",
    "group-data-[open]:w-auto group-data-[open]:opacity-100",
    "group-data-[closed]:w-0 group-data-[closed]:opacity-0",
  ].join(" "),
});

export const navLink = tv({
  base: [
    "flex items-center rounded-md border-l-2 border-transparent px-3 py-2 text-text-subtle",
    "group-data-[open]:gap-3 group-data-[closed]:justify-center",
    "hover:bg-background-neutral-hovered hover:text-text",
    "data-[active]:border-border-selected data-[active]:bg-background-selected data-[active]:text-text-selected",
    "data-[active]:hover:bg-background-selected-hovered",
  ].join(" "),
});

export const navIconGlyph = tv({
  base: "flex h-5 w-5 shrink-0 items-center justify-center rounded-sm bg-background-neutral-hovered text-xs font-medium",
});

export const collapseTrigger = tv({
  base: [
    "group flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-text-subtle",
    "hover:bg-background-neutral-hovered hover:text-text",
  ].join(" "),
});

export const collapseIcon = tv({
  base: "h-4 w-4 transition-transform duration-200 group-data-[panel-open]:rotate-180",
});
