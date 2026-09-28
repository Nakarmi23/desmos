import { tv } from "tailwind-variants";

export const signInFormStyles = tv({
  slots: {
    root: "flex w-full max-w-sm flex-col gap-4 rounded-lg border border-border bg-surface p-6",
    title: "text-lg font-medium text-text",
    error:
      "rounded-md border border-border-danger bg-background-danger px-3 py-2 text-sm text-text-danger",
  },
});
