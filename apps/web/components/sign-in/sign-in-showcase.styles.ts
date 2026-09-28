import { tv } from "tailwind-variants";

export const signInShowcaseStyles = tv({
  slots: {
    // `theme-inverse`: the sidebar's dark indigo, so the brand looks the
    // same before and after Sign in.
    root: "theme-inverse relative hidden flex-col justify-between gap-10 overflow-hidden bg-surface p-10 text-text lg:flex",
    brand: "flex items-center gap-3",
    glyph:
      "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-background-brand text-base font-semibold text-text-inverse",
    brandText: "flex flex-col",
    brandName: "text-base font-bold text-text",
    brandTagline: "text-xs font-medium text-text-subtle",
    // The grid fades out toward the edges instead of stopping hard.
    plot: "w-full max-w-2xl self-center [mask-image:radial-gradient(ellipse_at_center,black_45%,transparent_75%)]",
    gridLine: "fill-none stroke-text-subtle/15",
    axis: "stroke-text-subtle/30",
    curve:
      "fill-none [stroke-dasharray:1] motion-safe:animate-draw [stroke-linecap:round]",
    point:
      "fill-surface stroke-text stroke-2 motion-safe:animate-[fade-in_600ms_ease-out_1.6s_both]",
    copy: "flex max-w-md flex-col gap-2",
    headline: "text-2xl font-semibold leading-snug text-text",
    subline: "text-sm text-text-subtle",
  },
  variants: {
    tone: {
      bold: { curve: "stroke-text stroke-[3]" },
      muted: {
        curve: "stroke-text-subtle/60 stroke-2 [animation-delay:300ms]",
      },
    },
  },
});
