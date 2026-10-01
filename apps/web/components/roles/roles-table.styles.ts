import { tv } from "tailwind-variants";

export const rolesTableStyles = tv({
  slots: {
    systemBadge:
      "inline-flex items-center rounded-full border border-border-selected bg-surface px-2 text-xs font-medium leading-5 text-text-selected",
    empty: "text-text-subtle",
  },
});
