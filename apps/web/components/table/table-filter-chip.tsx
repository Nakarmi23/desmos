import { Menu } from "@base-ui/react/menu";
import { Popover } from "@base-ui/react/popover";
import { CheckIcon, XIcon } from "lucide-react";
import { useRef } from "react";

import {
  FILTER_KIND_ICON,
  FILTER_POPUP_POSITION,
  returnFocusOnKeyboard,
} from "./filter-popup";
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
import type {
  TableColumnFilterValue,
  TableFilterOperator,
} from "./table-fetcher";
import { Checkbox } from "@/components/checkbox/checkbox";
import { TextField } from "@/components/text-field/text-field";
import { tableStyles } from "./table.styles";

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
  // Set when an operator is picked, so focus goes back to the trigger however
  // it was picked (a click on an item, or Enter).
  const chose = useRef(false);
  const operatorMenu = useRef<HTMLDivElement>(null);
  const filter = column.filter;
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

      <Menu.Root
        // Land on the operator in use, so it's one key from its neighbours.
        onOpenChangeComplete={(open) => {
          if (!open) return;
          operatorMenu.current
            ?.querySelector<HTMLElement>('[aria-checked="true"]')
            ?.focus();
        }}
      >
        <Menu.Trigger
          aria-label={`${column.header} operator: ${operatorLabel}`}
          className={styles.chipSegment()}
          data-muted=""
        >
          {operatorLabel.toLowerCase()}
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner {...FILTER_POPUP_POSITION}>
            {/* Named by its trigger ("<Column> operator: <current>"). */}
            <Menu.Popup
              ref={operatorMenu}
              finalFocus={(closeType) => {
                const returnFocus =
                  chose.current || returnFocusOnKeyboard(closeType);
                chose.current = false;
                return returnFocus;
              }}
              className={styles.popup()}
            >
              <Menu.RadioGroup
                value={current.operator}
                onValueChange={(operator: TableFilterOperator) => {
                  chose.current = true;
                  onChange(withOperator(current, operator));
                }}
              >
                {FILTER_OPERATORS[kind].map((option) => (
                  <Menu.RadioItem
                    key={option.operator}
                    value={option.operator}
                    closeOnClick
                    className={styles.menuItem()}
                  >
                    {option.label}
                    <Menu.RadioItemIndicator className="ml-auto">
                      <CheckIcon aria-hidden size={14} />
                    </Menu.RadioItemIndicator>
                  </Menu.RadioItem>
                ))}
              </Menu.RadioGroup>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>

      <Popover.Root defaultOpen={defaultOpen}>
        <Popover.Trigger
          aria-label={`${column.header} value: ${valueText}`}
          className={styles.chipSegment()}
          data-muted={summary ? undefined : ""}
        >
          {valueText}
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Positioner {...FILTER_POPUP_POSITION}>
            <Popover.Popup
              aria-label={`${column.header} value`}
              finalFocus={returnFocusOnKeyboard}
              className={styles.popupBody()}
            >
              <ValueControls
                header={column.header}
                kind={kind}
                options={options}
                current={current}
                onChange={onChange}
              />
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>

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
