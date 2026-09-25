"use client";

import { Loader2Icon, XIcon } from "lucide-react";
import {
  type ChangeEvent,
  type ComponentProps,
  type ReactNode,
  type Ref,
} from "react";

import { IconButton } from "@/components/button/button";
import { Field } from "@/components/field/field";
import { fieldStyles } from "@/components/field/field.styles";
import { useFieldControl } from "@/components/field/use-field-control";

export type TextFieldProps = Omit<
  ComponentProps<"input">,
  "size" | "prefix" | "value" | "defaultValue"
> & {
  /** Visible label. Without one, pass `aria-label`. */
  label?: ReactNode;
  /** Helper text under the input. Replaced by `error` while one is shown. */
  description?: ReactNode;
  /** Error message; also puts the field in the invalid state. */
  error?: ReactNode;
  /** Invalid styling/`aria-invalid` without a message. */
  invalid?: boolean;
  size?: "sm" | "md" | "lg";
  /** Inline adornment before the input (icon, or short text like "$"). */
  prefix?: ReactNode;
  /** Inline adornment after the input (icon, or short text like "kg"). */
  suffix?: ReactNode;
  /** Replaces the suffix with a spinner and sets `aria-busy`. */
  loading?: boolean;
  /** Shows a clear button while the field has a value and is editable. */
  clearable?: boolean;
  /** With `maxLength`, shows a `n/max` counter. */
  showCount?: boolean;
  value?: string;
  defaultValue?: string;
  /** Fires with the next value on typing and on clear. */
  onValueChange?: (value: string) => void;
  onClear?: () => void;
  /** Accessible name of the clear button. */
  clearLabel?: string;
  /** Class for the outer wrapper (layout, width). */
  className?: string;
  ref?: Ref<HTMLInputElement>;
};

/**
 * Single-line text input with label, helper/error text, inline prefix/suffix,
 * and the usual states (invalid, disabled, read-only, loading). Works
 * controlled (`value`) or uncontrolled (`defaultValue`).
 */
export function TextField({
  label,
  description,
  error,
  invalid,
  size,
  prefix,
  suffix,
  loading = false,
  clearable = false,
  showCount = false,
  value,
  defaultValue = "",
  onValueChange,
  onClear,
  clearLabel = "Clear",
  onChange,
  className,
  ref,
  id,
  disabled,
  readOnly,
  required,
  maxLength,
  type = "text",
  "aria-describedby": ariaDescribedBy,
  ...inputProps
}: TextFieldProps) {
  const styles = fieldStyles({ size });

  const { localRef, setRefs, current, setValue } =
    useFieldControl<HTMLInputElement>({ ref, value, defaultValue });

  function update(next: string) {
    setValue(next);
    onValueChange?.(next);
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    update(e.target.value);
    onChange?.(e);
  }

  function handleClear() {
    update("");
    onClear?.();
    localRef.current?.focus();
  }

  const showClear = clearable && current !== "" && !disabled && !readOnly;
  const showCounter = showCount && maxLength != null;

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
      footerEnd={
        showCounter ? (
          <span className={styles.counter()}>
            {current.length}/{maxLength}
          </span>
        ) : undefined
      }
    >
      {(field) => (
        <div
          className={styles.control()}
          data-invalid={field.invalid || undefined}
          data-disabled={disabled || undefined}
          data-readonly={readOnly || undefined}
          onMouseDown={(e) => {
            // Clicking padding or an adornment focuses the input, but leave
            // real controls (the clear button) alone.
            if (e.target === localRef.current) return;
            if ((e.target as HTMLElement).closest("button")) return;
            e.preventDefault();
            localRef.current?.focus();
          }}
        >
          {prefix != null && (
            <span className={styles.adornment()}>{prefix}</span>
          )}
          <input
            {...inputProps}
            ref={setRefs}
            id={field.id}
            type={type}
            value={current}
            onChange={handleChange}
            disabled={disabled}
            readOnly={readOnly}
            required={required}
            maxLength={maxLength}
            aria-invalid={field["aria-invalid"]}
            aria-describedby={field["aria-describedby"]}
            aria-busy={loading || undefined}
            className={styles.input()}
          />
          {showClear && (
            <IconButton
              label={clearLabel}
              size="xs"
              onClick={handleClear}
              className="-mr-1"
            >
              <XIcon />
            </IconButton>
          )}
          {loading ? (
            <Loader2Icon aria-hidden="true" className={styles.spinner()} />
          ) : (
            suffix != null && (
              <span className={styles.adornment()}>{suffix}</span>
            )
          )}
        </div>
      )}
    </Field>
  );
}
