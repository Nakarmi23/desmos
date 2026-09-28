"use client";

import { EyeIcon, EyeOffIcon } from "lucide-react";
import { useState } from "react";

import { IconButton } from "@/components/button/button";
import {
  TextField,
  type TextFieldProps,
} from "@/components/text-field/text-field";

export type PasswordFieldProps = Omit<TextFieldProps, "type" | "suffix">;

/**
 * A `TextField` for passwords: masked, with an eye button to show what was
 * typed. Browsers' own reveal buttons are hidden (see `fieldStyles`) so this
 * is the only one.
 */
export function PasswordField({ disabled, ...props }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <TextField
      {...props}
      disabled={disabled}
      type={visible ? "text" : "password"}
      suffix={
        <IconButton
          label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          size="xs"
          disabled={disabled}
          onClick={() => setVisible((shown) => !shown)}
          className="-mr-1"
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </IconButton>
      }
    />
  );
}
