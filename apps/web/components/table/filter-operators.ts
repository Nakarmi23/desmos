import type { TableColumnFilterKind, TableFilterOption } from "./table-column";
import type {
  TableColumnFilterValue,
  TableFilterOperator,
} from "./table-fetcher";
import { isBlank, isFilterValueActive } from "./normalize-filters";

export type OperatorOption = {
  operator: TableFilterOperator;
  /** What the operator menu shows; lowercased on the filter chip. */
  label: string;
};

/** Operators per data type, in dropdown order (the first is the default). */
export const FILTER_OPERATORS: Record<
  TableColumnFilterKind,
  readonly OperatorOption[]
> = {
  text: [
    { operator: "contains", label: "Contains" },
    { operator: "eq", label: "Equals" },
    { operator: "startsWith", label: "Starts with" },
    { operator: "endsWith", label: "Ends with" },
  ],
  number: [
    { operator: "eq", label: "Equals" },
    { operator: "neq", label: "Does not equal" },
    { operator: "lt", label: "Less than" },
    { operator: "lte", label: "Less than or equal to" },
    { operator: "gt", label: "Greater than" },
    { operator: "gte", label: "Greater than or equal to" },
    { operator: "between", label: "Between" },
  ],
  date: [
    { operator: "between", label: "Between" },
    { operator: "eq", label: "Is" },
    { operator: "lt", label: "Before" },
    { operator: "lte", label: "On or before" },
    { operator: "gt", label: "After" },
    { operator: "gte", label: "On or after" },
  ],
  select: [
    { operator: "in", label: "Is any of" },
    { operator: "notIn", label: "Is none of" },
  ],
};

/** An empty (inactive) filter on the kind's first operator. */
export function defaultFilterValue(
  kind: TableColumnFilterKind,
): TableColumnFilterValue {
  return withOperator(undefined, FILTER_OPERATORS[kind][0].operator);
}

/**
 * Switches operator, carrying over what still makes sense: a single value
 * becomes a range's lower bound (and back), and selections survive in/notIn.
 */
export function withOperator(
  current: TableColumnFilterValue | undefined,
  operator: TableFilterOperator,
): TableColumnFilterValue {
  if (operator === "in" || operator === "notIn") {
    return {
      operator,
      values: current && "values" in current ? current.values : [],
    };
  }

  if (operator === "between") {
    if (current?.operator === "between") return { ...current };
    const single = current && "value" in current ? current.value : "";
    return isBlank(single) ? { operator } : { operator, from: single };
  }

  const carried =
    current && "value" in current
      ? current.value
      : current?.operator === "between"
        ? [current.from, current.to].find((bound) => !isBlank(bound))
        : undefined;
  return { operator, value: carried ?? "" } as TableColumnFilterValue;
}

/** The chip's value text — just the value, not the operator; "" when inactive. */
export function summarizeValue(
  kind: TableColumnFilterKind,
  filter: TableColumnFilterValue | undefined,
  options: readonly TableFilterOption[] = [],
): string {
  if (!filter || !isFilterValueActive(filter)) return "";

  if ("values" in filter) {
    return filter.values
      .map((v) => options.find((o) => o.value === v)?.label ?? v)
      .sort()
      .join(", ");
  }

  if (filter.operator === "between") {
    const { from, to } = filter;
    if (!isBlank(from) && !isBlank(to)) return `${from} – ${to}`;
    if (kind === "date") return isBlank(to) ? `from ${from}` : `until ${to}`;
    return isBlank(to) ? `≥ ${from}` : `≤ ${to}`;
  }

  return String(filter.value);
}
