import { tv } from "tailwind-variants";

export const noAccessStyles = tv({
  slots: {
    root: "flex flex-1 flex-col items-center justify-center gap-2 text-center",
    icon: "mb-2 text-text-subtle",
    title: "text-lg font-semibold text-text",
    message: "max-w-sm text-sm text-text-subtle",
    link: "mt-2 text-sm font-medium text-text-selected hover:underline",
  },
});
