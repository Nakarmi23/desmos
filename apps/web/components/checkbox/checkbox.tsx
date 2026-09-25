"use client";

import type { ComponentProps, ReactNode } from "react";

import { checkboxStyles } from "./checkbox.styles";

export type CheckboxProps = Omit<
  ComponentProps<"input">,
  "type" | "checked" | "children"
> & {
  checked: boolean;
  /** Some, but not all, of what the box stands for is on. Overrides the checked look. */
  mixed?: boolean;
  /** Visible label. Without one, pass `aria-label`. */
  label?: ReactNode;
};

/** Native checkbox tinted with the accent color; `mixed` shows the dash state. */
export function Checkbox({
  checked,
  mixed = false,
  label,
  className,
  ...props
}: CheckboxProps) {
  const styles = checkboxStyles();
  const input = (
    <input
      {...props}
      type="checkbox"
      ref={(element) => {
        if (element) element.indeterminate = mixed;
      }}
      checked={checked}
      aria-checked={mixed ? "mixed" : checked}
      className={styles.input({ className: label ? undefined : className })}
    />
  );

  if (!label) return input;
  return (
    <label className={styles.root({ className })}>
      {input}
      {label}
    </label>
  );
}
