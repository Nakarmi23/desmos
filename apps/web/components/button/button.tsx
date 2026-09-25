"use client";

import { Loader2Icon } from "lucide-react";
import type { ComponentProps, ReactNode, Ref } from "react";

import { buttonStyles } from "./button.styles";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "subtle"
  | "danger"
  | "link";
export type ButtonSize = "xs" | "sm" | "md" | "lg";

export type ButtonProps = Omit<ComponentProps<"button">, "ref"> & {
  /** Visual emphasis: `primary` > `secondary` > `subtle`; `danger` is destructive; `link` is inline text. */
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Icon before the label. */
  startIcon?: ReactNode;
  /** Icon after the label. */
  endIcon?: ReactNode;
  /** Shows a spinner, sets `aria-busy`, and blocks clicks. */
  loading?: boolean;
  /** Toggled-on look (e.g. the current page in a pager). */
  selected?: boolean;
  ref?: Ref<HTMLButtonElement>;
};

/** Text button. Defaults to `type="button"` so it never submits a form by accident. */
export function Button({
  variant,
  size,
  startIcon,
  endIcon,
  loading = false,
  selected = false,
  disabled,
  type = "button",
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      data-selected={selected || undefined}
      className={buttonStyles({ variant, size, selected, className })}
    >
      {loading ? <Spinner /> : startIcon}
      {children}
      {endIcon}
    </button>
  );
}

export type IconButtonProps = Omit<
  ButtonProps,
  "startIcon" | "endIcon" | "aria-label"
> & {
  /** Accessible name — required since there's no visible text. */
  label: string;
};

/** Square button holding a single icon (`children`). */
export function IconButton({
  label,
  loading = false,
  children,
  variant = "subtle",
  className,
  size,
  selected = false,
  ...props
}: IconButtonProps) {
  return (
    <button
      type="button"
      {...props}
      disabled={props.disabled || loading}
      aria-label={label}
      aria-busy={loading || undefined}
      data-selected={selected || undefined}
      className={buttonStyles({
        variant,
        size,
        selected,
        iconOnly: true,
        className,
      })}
    >
      {loading ? <Spinner /> : children}
    </button>
  );
}

function Spinner() {
  return <Loader2Icon aria-hidden="true" className="animate-spin" />;
}
