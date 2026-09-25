import { tv } from "tailwind-variants";

/** Shared chrome for form fields: label, bordered control, adornments, helper/error footer. */
export const fieldStyles = tv({
  slots: {
    root: "flex min-w-0 flex-col gap-1",
    label: "text-sm font-medium text-text",
    required: "ml-0.5 text-text-danger",
    control:
      "group/control flex w-full min-w-0 cursor-text items-center gap-2 rounded-md border border-border bg-surface text-text hover:border-border-selected/60 focus-within:border-border-selected focus-within:outline-2 focus-within:outline-border-selected data-[invalid]:border-border-danger data-[invalid]:focus-within:outline-border-danger data-[readonly]:bg-surface-sunken data-[disabled]:cursor-not-allowed data-[disabled]:bg-surface-sunken data-[disabled]:opacity-60 data-[disabled]:hover:border-border",
    input:
      "min-w-0 flex-1 bg-transparent text-text outline-none placeholder:text-text-subtle disabled:cursor-not-allowed [&::-webkit-search-cancel-button]:appearance-none",
    adornment:
      "flex shrink-0 items-center text-text-subtle [&>svg]:size-4 group-data-[disabled]/control:pointer-events-none",
    spinner: "size-4 animate-spin text-text-subtle",
    footer: "flex items-start justify-between gap-2 text-xs",
    description: "text-text-subtle",
    error: "text-text-danger",
    counter: "ml-auto shrink-0 text-text-subtle tabular-nums",
  },
  variants: {
    size: {
      sm: { control: "h-8 px-2", input: "text-sm" },
      md: { control: "h-9 px-2.5", input: "text-sm" },
      lg: { control: "h-11 px-3", input: "text-base" },
    },
  },
  defaultVariants: { size: "md" },
});
