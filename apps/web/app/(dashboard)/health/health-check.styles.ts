import { tv } from "tailwind-variants";

export const healthCheckStyles = tv({
  slots: {
    loading: "text-sm text-text-subtle",
    errorMessage:
      "flex items-start gap-3 rounded-md border border-border-danger bg-background-danger p-4",
    errorIcon: "mt-0.5 h-4 w-4 shrink-0 text-icon-danger",
    errorTitle: "text-sm font-medium text-text",
    errorBody: "text-sm text-text",
    resultList: "flex flex-col gap-3",
    resultRow: "flex items-center gap-2 text-sm",
    resultLabel: "text-text-subtle",
    resultValue: "font-medium text-text",
  },
});
