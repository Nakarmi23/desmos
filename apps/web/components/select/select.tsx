"use client";

import { ChevronDownIcon } from "lucide-react";
import {
  useRef,
  useState,
  type ChangeEvent,
  type ComponentProps,
  type ReactNode,
  type Ref,
} from "react";

import { Field } from "@/components/field/field";
import { fieldStyles } from "@/components/field/field.styles";

export type SelectOption = {
  value: string;
  /** Text shown for the option; defaults to `value`. */
  label?: string;
  disabled?: boolean;
};

export type SelectProps = Omit<
  ComponentProps<"select">,
  "size" | "prefix" | "value" | "defaultValue" | "children" | "multiple"
> & {
  options: readonly SelectOption[];
  /** Visible label. Without one, pass `aria-label`. */
  label?: ReactNode;
  /** Helper text under the select. Replaced by `error` while one is shown. */
  description?: ReactNode;
  /** Error message; also puts the field in the invalid state. */
  error?: ReactNode;
  /** Invalid styling/`aria-invalid` without a message. */
  invalid?: boolean;
  size?: "sm" | "md" | "lg";
  /** Adornment before the select (icon or short text). */
  prefix?: ReactNode;
  /** Shown, muted, while nothing is chosen. Adds an unselectable empty option. */
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  /** Fires with the chosen option's value. */
  onValueChange?: (value: string) => void;
  /** Class for the outer wrapper (layout, width). */
  className?: string;
  ref?: Ref<HTMLSelectElement>;
};

/**
 * Styled native `<select>` sharing `TextField`'s field chrome (label, helper
 * and error text, prefix, size, invalid/disabled states). Native so it keeps
 * platform keyboard, mobile pickers and accessibility for free. Works
 * controlled (`value`) or uncontrolled (`defaultValue`).
 */
export function Select({
  options,
  label,
  description,
  error,
  invalid,
  size,
  prefix,
  placeholder,
  value,
  defaultValue,
  onValueChange,
  onChange,
  className,
  ref,
  id,
  disabled,
  required,
  "aria-describedby": ariaDescribedBy,
  ...selectProps
}: SelectProps) {
  const styles = fieldStyles({ size });
  const localRef = useRef<HTMLSelectElement | null>(null);
  const [inner, setInner] = useState(
    defaultValue ??
      (placeholder !== undefined ? "" : (options[0]?.value ?? "")),
  );
  const controlled = value !== undefined;
  const current = controlled ? value : inner;

  function setRefs(node: HTMLSelectElement | null) {
    localRef.current = node;
    if (typeof ref === "function") ref(node);
    else if (ref) ref.current = node;
  }

  function handleChange(e: ChangeEvent<HTMLSelectElement>) {
    if (!controlled) setInner(e.target.value);
    onValueChange?.(e.target.value);
    onChange?.(e);
  }

  return (
    <Field
      label={label}
      description={description}
      error={error}
      invalid={invalid}
      required={required}
      id={id}
      describedBy={ariaDescribedBy}
      className={className}
    >
      {(field) => (
        <div
          className={styles.control({ className: "cursor-pointer" })}
          data-invalid={field.invalid || undefined}
          data-disabled={disabled || undefined}
          onMouseDown={(e) => {
            // Padding, prefix and chevron open the list like the select itself.
            if (e.target === localRef.current || disabled) return;
            e.preventDefault();
            localRef.current?.focus();
            try {
              localRef.current?.showPicker();
            } catch {
              // showPicker is unsupported or blocked; focus is enough.
            }
          }}
        >
          {prefix != null && (
            <span className={styles.adornment()}>{prefix}</span>
          )}
          <select
            {...selectProps}
            ref={setRefs}
            id={field.id}
            value={current}
            onChange={handleChange}
            disabled={disabled}
            required={required}
            aria-invalid={field["aria-invalid"]}
            aria-describedby={field["aria-describedby"]}
            data-placeholder={current === "" ? "" : undefined}
            className={styles.input({
              className:
                "cursor-pointer appearance-none data-[placeholder]:text-text-subtle disabled:cursor-not-allowed",
            })}
          >
            {placeholder !== undefined && (
              <option value="" disabled={required} hidden={required}>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label ?? option.value}
              </option>
            ))}
          </select>
          <span className={styles.adornment()}>
            <ChevronDownIcon aria-hidden="true" />
          </span>
        </div>
      )}
    </Field>
  );
}
