import { tv } from "tailwind-variants";

export const signInFormStyles = tv({
  slots: {
    root: "flex w-full max-w-sm flex-col gap-5",
    header: "flex flex-col gap-1.5",
    // The brand mark, on small screens where the showcase panel is hidden.
    glyph:
      "mb-4 flex h-9 w-9 items-center justify-center rounded-lg bg-background-brand text-base font-semibold text-text-inverse lg:hidden",
    title: "text-2xl font-semibold text-text",
    subtitle: "text-sm text-text-subtle",
    error:
      "rounded-md border border-border-danger bg-background-danger px-3 py-2 text-sm text-text-danger",
    submit: "mt-1 w-full",
  },
});
