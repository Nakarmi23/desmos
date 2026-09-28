"use client";

import { useActionState } from "react";

import { Button } from "@/components/button/button";
import { TextField } from "@/components/text-field/text-field";

import { signInFormStyles } from "./sign-in-form.styles";

/** A refused Sign in: the message to show, and the Username to refill. */
export type SignInState = { error: string; username: string } | undefined;

export type SignInFormProps = {
  /** Signs in from the form's `username`, `password` and `returnTo`. */
  action: (state: SignInState, formData: FormData) => Promise<SignInState>;
  /** Where to go once signed in; passed through to `action`. */
  returnTo?: string;
};

const styles = signInFormStyles();

export function SignInForm({ action, returnTo }: SignInFormProps) {
  // Counting attempts gives each result fresh fields: a refusal refills the
  // Username and clears the password, even twice in a row.
  const [{ state, attempt }, formAction, pending] = useActionState(
    async (
      previous: { state: SignInState; attempt: number },
      formData: FormData,
    ) => ({
      state: await action(previous.state, formData),
      attempt: previous.attempt + 1,
    }),
    { state: undefined, attempt: 0 },
  );

  return (
    <form action={formAction} className={styles.root()}>
      <h1 className={styles.title()}>Sign in</h1>
      {state && (
        <p role="alert" className={styles.error()}>
          {state.error}
        </p>
      )}
      <TextField
        key={`username-${attempt}`}
        label="Username"
        name="username"
        defaultValue={state?.username}
        autoComplete="username"
        autoFocus
        required
      />
      <TextField
        key={`password-${attempt}`}
        label="Password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
      />
      {returnTo && <input type="hidden" name="returnTo" value={returnTo} />}
      <Button type="submit" variant="primary" loading={pending}>
        Sign in
      </Button>
    </form>
  );
}
