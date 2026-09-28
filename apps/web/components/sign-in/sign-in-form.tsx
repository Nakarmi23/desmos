"use client";

import { useActionState, useState, type FormEvent } from "react";

import { Button } from "@/components/button/button";
import { PasswordField } from "@/components/password-field/password-field";
import { TextField } from "@/components/text-field/text-field";
import {
  parseSignInForm,
  type SignInFieldErrors,
} from "@/modules/auth/sign-in-form";

import { signInFormStyles } from "./sign-in-form.styles";

/**
 * Why Sign in didn't happen, and the Username to refill: a refusal's generic
 * `error`, or `fieldErrors` from validating the form.
 */
export type SignInState =
  | { error?: string; fieldErrors?: SignInFieldErrors; username: string }
  | undefined;

export type SignInFormProps = {
  /** Signs in from the form's `username`, `password` and `returnTo`. */
  action: (state: SignInState, formData: FormData) => Promise<SignInState>;
  /** Where to go once signed in; passed through to `action`. */
  returnTo?: string;
};

const styles = signInFormStyles();

export function SignInForm({ action, returnTo }: SignInFormProps) {
  // `action` goes to `useActionState` unwrapped: a Server Action stays one,
  // so the form still submits (natively) before hydration.
  const [state, formAction, pending] = useActionState(action, undefined);
  // Counting results gives each one fresh fields: a refusal refills the
  // Username and clears the password, even twice in a row.
  const [attempt, setAttempt] = useState(0);
  const [lastState, setLastState] = useState(state);
  if (state !== lastState) {
    setLastState(state);
    setAttempt(attempt + 1);
  }
  // Found before submitting, so an incomplete form never reaches `action`.
  const [clientErrors, setClientErrors] = useState<SignInFieldErrors>();
  const fieldErrors = clientErrors ?? state?.fieldErrors;

  function validate(event: FormEvent<HTMLFormElement>) {
    const parsed = parseSignInForm(new FormData(event.currentTarget));
    if (parsed.success) {
      setClientErrors(undefined);
    } else {
      event.preventDefault();
      setClientErrors(parsed.fieldErrors);
    }
  }

  return (
    // The schema decides what's valid, not the browser: `noValidate`, and
    // `aria-required` rather than `required` (which would still mark empty
    // fields `:invalid`).
    <form
      action={formAction}
      onSubmit={validate}
      noValidate
      className={styles.root()}
    >
      <header className={styles.header()}>
        <span aria-hidden className={styles.glyph()}>
          D
        </span>
        <h1 className={styles.title()}>Welcome back</h1>
        <p className={styles.subtitle()}>Sign in to continue to Desmos.</p>
      </header>
      {state?.error && (
        <p role="alert" className={styles.error()}>
          {state.error}
        </p>
      )}
      <TextField
        key={`username-${attempt}`}
        label="Username"
        name="username"
        defaultValue={state?.username}
        error={fieldErrors?.username}
        autoComplete="username"
        autoFocus
        aria-required
      />
      <PasswordField
        key={`password-${attempt}`}
        label="Password"
        name="password"
        error={fieldErrors?.password}
        autoComplete="current-password"
        aria-required
      />
      {returnTo && <input type="hidden" name="returnTo" value={returnTo} />}
      <Button
        type="submit"
        variant="primary"
        size="lg"
        loading={pending}
        className={styles.submit()}
      >
        Sign in
      </Button>
    </form>
  );
}
