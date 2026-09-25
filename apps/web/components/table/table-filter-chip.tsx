import {
  CalendarIcon,
  CheckIcon,
  HashIcon,
  ListIcon,
  TypeIcon,
  XIcon,
} from "lucide-react";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";

import {
  defaultFilterValue,
  FILTER_OPERATORS,
  summarizeValue,
  withOperator,
} from "./filter-operators";
import type {
  ResolvedTableColumn,
  TableColumnFilterKind,
  TableFilterOption,
} from "./table-column";
import type { TableColumnFilterValue } from "./table-fetcher";
import { Checkbox } from "@/components/checkbox/checkbox";
import { TextField } from "@/components/text-field/text-field";
import { tableStyles } from "./table.styles";
import { useDismiss } from "./use-dismiss";

export const FILTER_KIND_ICON = {
  text: TypeIcon,
  number: HashIcon,
  date: CalendarIcon,
  select: ListIcon,
} as const;

export type TableFilterChipProps<T> = {
  column: ResolvedTableColumn<T>;
  value: TableColumnFilterValue | undefined;
  /** Open the value editor on mount (a chip that was just added). */
  defaultOpen: boolean;
  onChange: (value: TableColumnFilterValue) => void;
  onRemove: () => void;
};

/**
 * One applied filter: `[icon Column | operator | value | ×]`. The operator
 * segment opens a menu of operators for the column's data type; the value
 * segment opens an editor for the value(s).
 */
export function TableFilterChip<T>({
  column,
  value,
  defaultOpen,
  onChange,
  onRemove,
}: TableFilterChipProps<T>) {
  const styles = tableStyles();
  const filter = column.filter;
  const [operatorOpen, setOperatorOpen] = useState(false);
  const [valueOpen, setValueOpen] = useState(defaultOpen);
  const operatorButton = useRef<HTMLButtonElement>(null);
  const valueButton = useRef<HTMLButtonElement>(null);
  const operatorRoot = useRef<HTMLDivElement>(null);
  const valueRoot = useRef<HTMLDivElement>(null);
  const operatorDismiss = useDismiss(
    operatorRoot,
    operatorOpen,
    () => setOperatorOpen(false),
    operatorButton,
  );
  const valueDismiss = useDismiss(
    valueRoot,
    valueOpen,
    () => setValueOpen(false),
    valueButton,
  );
  const operatorPopup = useRef<HTMLDivElement>(null);
  const valuePopup = useRef<HTMLDivElement>(null);

  // Land keyboard users inside whichever popup just opened.
  useEffect(() => {
    if (operatorOpen) {
      const items =
        operatorPopup.current?.querySelectorAll<HTMLElement>("button");
      const checked = operatorPopup.current?.querySelector<HTMLElement>(
        '[aria-checked="true"]',
      );
      (checked ?? items?.[0])?.focus();
    }
  }, [operatorOpen]);
  useEffect(() => {
    if (valueOpen) {
      valuePopup.current?.querySelector<HTMLElement>("input, button")?.focus();
    }
  }, [valueOpen]);

  if (!filter) return null;
  const kind = filter.kind;
  const options = filter.kind === "select" ? filter.options : [];
  const current = value ?? defaultFilterValue(kind);
  const operatorLabel =
    FILTER_OPERATORS[kind].find((o) => o.operator === current.operator)
      ?.label ?? "";
  const summary = summarizeValue(kind, current, options);
  const Icon = FILTER_KIND_ICON[kind];
  // Same words for sighted and assistive users (label must contain visible text).
  const valueText = summary || (kind === "select" ? "Select…" : "Enter value…");

  return (
    <div
      role="group"
      aria-label={`${column.header} filter`}
      className={styles.chip()}
    >
      <span className={styles.chipColumn()}>
        <Icon aria-hidden size={14} />
        {column.header}
      </span>

      <div
        ref={operatorRoot}
        {...operatorDismiss}
        className={styles.chipPart()}
      >
        <button
          ref={operatorButton}
          type="button"
          aria-haspopup="menu"
          aria-expanded={operatorOpen}
          aria-label={`${column.header} operator: ${operatorLabel}`}
          className={styles.chipSegment()}
          data-muted=""
          onClick={() => {
            setValueOpen(false);
            setOperatorOpen((open) => !open);
          }}
        >
          {operatorLabel.toLowerCase()}
        </button>
        {operatorOpen && (
          <div
            ref={operatorPopup}
            role="menu"
            aria-label={`${column.header} operator`}
            className={styles.popup()}
            onKeyDown={moveMenuFocus}
          >
            {FILTER_OPERATORS[kind].map((option) => (
              <button
                key={option.operator}
                type="button"
                role="menuitemradio"
                aria-checked={option.operator === current.operator}
                className={styles.menuItem()}
                onClick={() => {
                  onChange(withOperator(current, option.operator));
                  setOperatorOpen(false);
                  operatorButton.current?.focus();
                }}
              >
                {option.label}
                {option.operator === current.operator && (
                  <CheckIcon aria-hidden size={14} className="ml-auto" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <div ref={valueRoot} {...valueDismiss} className={styles.chipPart()}>
        <button
          ref={valueButton}
          type="button"
          aria-expanded={valueOpen}
          aria-label={`${column.header} value: ${valueText}`}
          className={styles.chipSegment()}
          data-muted={summary ? undefined : ""}
          onClick={() => {
            setOperatorOpen(false);
            setValueOpen((open) => !open);
          }}
        >
          {valueText}
        </button>
        {valueOpen && (
          <div
            ref={valuePopup}
            role="group"
            aria-label={`${column.header} value`}
            className={styles.popupBody()}
          >
            <ValueControls
              header={column.header}
              kind={kind}
              options={options}
              current={current}
              onChange={onChange}
            />
          </div>
        )}
      </div>

      <button
        type="button"
        aria-label={`Remove ${column.header} filter`}
        className={styles.chipRemove()}
        onClick={onRemove}
      >
        <XIcon aria-hidden size={14} />
      </button>
    </div>
  );
}

/** Arrow/Home/End roving focus between a menu's items, wrapping at the ends. */
function moveMenuFocus(event: KeyboardEvent<HTMLElement>) {
  const items = Array.from(
    event.currentTarget.querySelectorAll<HTMLElement>('[role="menuitemradio"]'),
  );
  const at = items.indexOf(document.activeElement as HTMLElement);
  const target = {
    ArrowDown: (at + 1) % items.length,
    ArrowUp: (at - 1 + items.length) % items.length,
    Home: 0,
    End: items.length - 1,
  }[event.key];
  if (target === undefined) return;
  event.preventDefault();
  items[target]?.focus();
}

const INPUT_TYPE = { text: "text", number: "number", date: "date" } as const;

/** The value input(s) for the current operator: one field, a from/to pair, or checkboxes. */
function ValueControls({
  header,
  kind,
  options,
  current,
  onChange,
}: {
  header: string;
  kind: TableColumnFilterKind;
  options: readonly TableFilterOption[];
  current: TableColumnFilterValue;
  onChange: (value: TableColumnFilterValue) => void;
}) {
  if ("values" in current) {
    return options.map((option) => {
      const checked = current.values.includes(option.value);
      return (
        <Checkbox
          key={option.value}
          label={option.label ?? option.value}
          checked={checked}
          className="py-0.5"
          onChange={() =>
            onChange({
              operator: current.operator,
              values: checked
                ? current.values.filter((v) => v !== option.value)
                : [...current.values, option.value],
            })
          }
        />
      );
    });
  }

  if (kind === "select") return null;
  const type = INPUT_TYPE[kind];
  // Number inputs hold numbers (blank stays ""), the others hold their text.
  const parse = (raw: string) =>
    kind === "number" && raw !== "" ? Number(raw) : raw;

  if (current.operator === "between") {
    return (
      <>
        <TextField
          size="sm"
          type={type}
          label={`${header} from`}
          value={String(current.from ?? "")}
          onValueChange={(v) => onChange({ ...current, from: parse(v) })}
        />
        <TextField
          size="sm"
          type={type}
          label={`${header} to`}
          value={String(current.to ?? "")}
          onValueChange={(v) => onChange({ ...current, to: parse(v) })}
        />
      </>
    );
  }

  return (
    <TextField
      size="sm"
      type={type}
      label={header}
      value={String(current.value)}
      onValueChange={(v) =>
        onChange({
          ...current,
          value: parse(v),
        } as TableColumnFilterValue)
      }
    />
  );
}
