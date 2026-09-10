import { tv } from "tailwind-variants";

export const topBarStyles = tv({
  slots: {
    root: "flex h-14 shrink-0 items-center justify-between border-b border-border bg-surface px-6",
    title: "text-base font-medium text-text",
    // Slot for future controls (account menu, search, ...).
    actions: "flex items-center gap-2",
  },
});
