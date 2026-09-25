import { tv } from "tailwind-variants";

export const checkboxStyles = tv({
  slots: {
    root: "inline-flex items-center gap-2 text-sm text-text has-[:disabled]:opacity-50",
    input:
      "size-4 cursor-pointer accent-background-brand align-middle focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-border-selected disabled:cursor-not-allowed",
  },
});
