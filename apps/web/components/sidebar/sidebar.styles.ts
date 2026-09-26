import { tv } from "tailwind-variants";

// The `root` slot is rendered by Base UI's `Collapsible.Root` (via its
// `render` prop), so it carries `data-open` / `data-closed` itself. Its
// `group` class lets descendants (nav rows, nav labels) key off that same
// state with `group-data-[open]:` / `group-data-[closed]:` instead of a
// JS-computed className.
export const sidebarStyles = tv({
  slots: {
    // `hidden lg:flex` is the desktop/mobile split: below `lg` the off-canvas
    // `MobileSidebarDrawer` takes over instead.
    root: [
      "theme-inverse group hidden h-vh shrink-0 flex-col overflow-hidden border-r border-border bg-surface lg:flex",
      "transition-[width] duration-200 ease-out",
      "data-[open]:w-56 data-[closed]:w-14",
    ],
    // `h-14`/`border-b` match the top bar's own height and bottom border, so
    // the two headers' bottom edges form one continuous line across the app.
    header: [
      "flex h-14 items-center border-b border-border px-2.5",
      "group-data-[open]:gap-2.5 group-data-[closed]:justify-center",
    ],
    brandGlyph:
      "flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-background-brand text-sm font-medium text-text-inverse",
    // Unlike the nav labels below, the brand label is a `Collapsible.Panel`,
    // so it carries `data-open` / `data-closed` directly.
    brandLabelPanel: [
      "overflow-hidden whitespace-nowrap transition-[width,opacity] duration-200 ease-out flex flex-col",
      "data-[open]:w-auto data-[open]:opacity-100",
      "data-[closed]:w-0 data-[closed]:opacity-0",
    ],
    brandLabelText: "text-sm font-bold text-text w-full truncate",
    brandSubLabelText: "text-xs font-medium text-text-subtle w-full truncate",
    // `divide-y` draws the line between sections; the padding either side of
    // it (rather than `gap`) keeps the line itself flush against no extra
    // margin, so it reads as one crisp divider instead of a doubled-up rule.
    nav: "flex flex-1 flex-col divide-y divide-border overflow-y-auto p-3 [&>*+*]:pt-2.5 [&>*:not(:last-child)]:pb-2.5",
    navSection: "flex flex-col gap-px",
    navSectionLabel:
      "text-[11px] font-semibold uppercase tracking-wide text-text-subtle",
    // Plain (non-collapsible) section heading — just the label, padded to
    // match the collapsible header's row.
    navSectionStaticLabel: "px-0 pb-0.5 group-data-[closed]:hidden",
    // Collapsible section heading — a button so the whole row toggles the
    // section, hidden in the icon rail since there's no room to interact
    // with it there (items still render, unaffected by the toggle state).
    navSectionHeader: [
      "flex w-full items-center justify-between gap-1 px-0 pb-0.5 text-left",
      "cursor-pointer hover:text-text",
      "group-data-[closed]:hidden",
    ],
    navSectionChevron: [
      "h-3 w-3 shrink-0 text-text-subtle transition-transform duration-150",
      "data-[expanded]:rotate-90",
    ],
    navLink: [
      // `border-transparent` reserves the same space the active state's
      // `border-border-selected` needs, so the row doesn't shift width when
      // it toggles active.
      "flex items-center rounded-md border border-transparent px-2.5 py-1.5 text-sm text-text-subtle",
      "group-data-[open]:gap-2 group-data-[closed]:justify-center",
      "hover:bg-background-neutral-hovered hover:text-text",
      "data-[active]:data-[active]:bg-background-selected data-[active]:text-text-selected",
    ],
    navIconGlyph:
      "flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-sm text-xs font-medium",
    navLabelText: [
      "overflow-hidden whitespace-nowrap transition-[width,opacity] duration-200 ease-out",
      "group-data-[open]:w-auto group-data-[open]:opacity-100",
      "group-data-[closed]:w-0 group-data-[closed]:opacity-0",
    ],
    // Names a nav row in the icon rail, where its label is hidden. Portaled
    // out of the sidebar, so it re-applies `theme-inverse` to match it.
    // Above the table's sticky header (`z-10`) and filter popups (`z-20`).
    navTooltipPositioner: "z-50",
    navTooltipPopup: [
      "theme-inverse rounded-md border border-border bg-surface px-2 py-1 text-xs font-medium text-text shadow-lg",
      "transition-[transform,opacity] duration-150 ease-out",
      "data-[starting-style]:scale-95 data-[starting-style]:opacity-0",
      "data-[ending-style]:scale-95 data-[ending-style]:opacity-0",
    ],
    footer: "border-t border-border p-1",
    // The trigger for the user menu — the whole row is clickable, not just
    // the chevron, so it's a `<button>` (via `Menu.Trigger`) rather than the
    // plain `<div>` it used to be.
    // No hover/open styling by request — flat until keyboard-focused. A real
    // `<button>` otherwise falls back to the browser's default blue outline
    // (which doesn't respect `rounded-md` and lingers after the menu
    // closes), so `focus-visible` still gets a themed ring — that's a
    // keyboard-only a11y affordance, not a hover effect, and stays invisible
    // for mouse/tap use.
    footerRow: [
      "flex w-full cursor-pointer items-center rounded-md p-1 text-left outline-none",
      "group-data-[open]:gap-2 group-data-[closed]:justify-center",
      "focus-visible:ring-2 focus-visible:ring-border-selected",
    ],
    footerGlyph: "h-7 w-7 shrink-0 rounded",
    // Mirrors `brandLabelPanel`/`navLabelText`: collapses to zero width
    // (rather than staying `flex-1`, which would keep reserving — and
    // clipping into — its layout space) so the icon rail is left with just
    // the centered avatar.
    footerContent: [
      "flex min-w-0 items-center gap-2 overflow-hidden",
      "transition-[width,height,opacity] duration-200 ease-out",
      "group-data-[open]:w-auto group-data-[open]:h-auto group-data-[open]:flex-1 group-data-[open]:opacity-100",
      "group-data-[closed]:h-0 group-data-[closed]:w-0 group-data-[closed]:opacity-0",
    ],
    footerLabelPanel: "flex flex-1 flex-col gap-0.5 overflow-hidden",
    footerLabelText: "text-sm font-bold text-text",
    footerSubLabelText: "text-xs font-medium text-text-subtle",
    // Decorative now — the whole row (`footerRow`) is the actual button, so
    // this is just the chevron glyph rather than its own nested trigger.
    footerTrigger:
      "flex h-6 w-6 shrink-0 items-center justify-center rounded-md",
    footerTriggerIcon: "h-4 w-4 text-text-subtle",
    // The user menu's popup animates in/out from its anchor side using Base
    // UI's `data-starting-style`/`data-ending-style` (set right as it opens
    // / right before it's removed) rather than a hand-rolled keyframe.
    userMenuPopup: [
      "w-56 rounded-md border border-border bg-surface p-1 shadow-lg outline-none",
      "transition-[transform,opacity] duration-150 ease-out",
      "data-[starting-style]:scale-95 data-[starting-style]:opacity-0",
      "data-[ending-style]:scale-95 data-[ending-style]:opacity-0",
    ],
    userMenuItem: [
      "flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-text outline-none",
      "data-[highlighted]:bg-background-neutral-hovered",
    ],
    userMenuItemIcon: "h-4 w-4 shrink-0 text-text-subtle",
    userMenuSeparator: "my-1 h-px bg-border",

    // The mobile off-canvas drawer (`MobileSidebarDrawer`), driven by Base
    // UI's `Dialog` rather than `Collapsible`. It reuses `navLink` etc.
    // as-is, but those rows key their spacing off a `group` ancestor's
    // `data-open`/`data-closed` (normally the desktop rail's
    // `Collapsible.Root`) — `drawerNav` supplies its own `group` +
    // `data-open` so the same rows always render in their "expanded" spacing
    // here, since the drawer has no rail/icon-only state of its own.
    drawerBackdrop: [
      "fixed inset-0 z-40 bg-blanket lg:hidden",
      "transition-opacity duration-150 ease-out",
      "data-[starting-style]:opacity-0 data-[ending-style]:opacity-0",
    ],
    drawerPopup: [
      "theme-inverse fixed inset-y-0 left-0 z-40 flex h-vh w-64 flex-col overflow-hidden bg-surface shadow-lg lg:hidden",
      "transition-transform duration-200 ease-out",
      "data-[starting-style]:-translate-x-full data-[ending-style]:-translate-x-full",
    ],
    drawerHeader:
      "flex h-14 items-center gap-2.5 border-b border-border px-2.5",
    drawerBrandLabel: "flex min-w-0 flex-1 flex-col",
    drawerNav:
      "group flex flex-1 flex-col divide-y divide-border overflow-y-auto p-3 [&>*+*]:pt-2.5 [&>*:not(:last-child)]:pb-2.5",
  },
});
