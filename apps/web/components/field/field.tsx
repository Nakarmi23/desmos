"use client";

import { useId, type ReactNode } from "react";

import { fieldStyles } from "./field.styles";

/** What a field's control must spread/apply so it's wired to the label and messages. */
export type FieldControlProps = {
  id: string;
  "aria-describedby": string | undefined;
  "aria-invalid": true | undefined;
  /** Error or `invalid` — for the control's own styling. */
  invalid: boolean;
};

export type FieldProps = {
  label?: ReactNode;
  /** Helper text. Replaced by `error` while one is shown. */
  description?: ReactNode;
  /** Error message; also puts the field in the invalid state. */
  error?: ReactNode;
  /** Invalid state without a message. */
  invalid?: boolean;
  required?: boolean;
  /** Control id; generated when omitted. */
  id?: string;
  /** Extra `aria-describedby` ids for the control. */
  describedBy?: string;
  /** Right-aligned footer content, e.g. a character counter. */
  footerEnd?: ReactNode;
  /** Class for the outer wrapper (layout, width). */
  className?: string;
  children: (control: FieldControlProps) => ReactNode;
};

const present = (node: ReactNode) =>
  node != null && node !== false && node !== "";

/**
 * Label + control slot + helper/error footer, with the ids and ARIA wiring
 * between them. The control is a render prop so any input-like element
 * (`TextField`, `Select`, ...) can plug in.
 */
export function Field({
  label,
  description,
  error,
  invalid,
  required,
  id,
  describedBy,
  footerEnd,
  className,
  children,
}: FieldProps) {
  const styles = fieldStyles();
  const autoId = useId();
  const controlId = id ?? autoId;
  const descriptionId = `${controlId}-description`;
  const errorId = `${controlId}-error`;

  const hasError = present(error);
  const hasDescription = !hasError && present(description);
  const isInvalid = Boolean(invalid) || hasError;

  const ids =
    [hasError ? errorId : hasDescription ? descriptionId : null, describedBy]
      .filter(Boolean)
      .join(" ") || undefined;

  return (
    <div className={styles.root({ className })}>
      {label != null && (
        <label htmlFor={controlId} className={styles.label()}>
          {label}
          {required && (
            <span aria-hidden="true" className={styles.required()}>
              *
            </span>
          )}
        </label>
      )}
      {children({
        id: controlId,
        "aria-describedby": ids,
        "aria-invalid": isInvalid || undefined,
        invalid: isInvalid,
      })}
      {(hasError || hasDescription || footerEnd != null) && (
        <div className={styles.footer()}>
          {hasError ? (
            <p id={errorId} className={styles.error()}>
              {error}
            </p>
          ) : hasDescription ? (
            <p id={descriptionId} className={styles.description()}>
              {description}
            </p>
          ) : null}
          {footerEnd}
        </div>
      )}
    </div>
  );
}
