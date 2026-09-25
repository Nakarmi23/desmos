import { tv } from "tailwind-variants";

export const buttonStyles = tv({
  base: [
    "inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-md border border-transparent font-medium whitespace-nowrap select-none",
    "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-border-selected",
    "disabled:cursor-not-allowed disabled:opacity-50",
    "[&>svg]:shrink-0",
  ],
  variants: {
    variant: {
      primary:
        "bg-background-brand text-text-inverse hover:bg-background-brand-hovered disabled:hover:bg-background-brand",
      secondary:
        "border-border bg-surface text-text hover:bg-background-neutral-hovered disabled:hover:bg-surface",
      subtle:
        "text-text-subtle hover:bg-background-neutral-hovered hover:text-text disabled:hover:bg-transparent disabled:hover:text-text-subtle",
      danger:
        "bg-background-danger-bold text-text-inverse hover:bg-background-danger-bold-hovered focus-visible:outline-border-danger disabled:hover:bg-background-danger-bold",
      link: "h-auto! rounded-sm p-0! text-text-selected underline-offset-2 hover:underline",
    },
    size: {
      xs: "h-6 px-2 text-xs [&>svg]:size-3.5",
      sm: "h-8 px-2.5 text-sm [&>svg]:size-4",
      md: "h-9 px-3 text-sm [&>svg]:size-4",
      lg: "h-11 px-4 text-base [&>svg]:size-5",
    },
    iconOnly: { true: "px-0" },
    selected: {
      true: "border-border-selected bg-background-selected text-text-selected hover:bg-background-selected-hovered",
    },
  },
  compoundVariants: [
    { iconOnly: true, size: "xs", className: "w-6" },
    { iconOnly: true, size: "sm", className: "w-8" },
    { iconOnly: true, size: "md", className: "w-9" },
    { iconOnly: true, size: "lg", className: "w-11" },
  ],
  defaultVariants: { variant: "secondary", size: "md" },
});
