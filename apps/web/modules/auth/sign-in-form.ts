import { z } from "zod";

/**
 * The sign-in form's fields. Checked on submit in the browser and again by
 * the Server Action, which is the check that counts.
 */
export const signInFormSchema = z.object({
  username: z.string().trim().min(1, "Enter your Username"),
  password: z.string().min(1, "Enter your password"),
  returnTo: z.string().optional(),
});

export type SignInFormFields = z.infer<typeof signInFormSchema>;

/** The first problem with each field that has one. */
export type SignInFieldErrors = Partial<Record<keyof SignInFormFields, string>>;

/**
 * The form's fields, or what's wrong with them. Reads only the fields it
 * knows, so anything else the framework adds to the form is ignored.
 */
export function parseSignInForm(
  formData: FormData,
):
  | { success: true; data: SignInFormFields }
  | { success: false; fieldErrors: SignInFieldErrors } {
  const field = (name: keyof SignInFormFields) =>
    formData.get(name) ?? undefined;
  const result = signInFormSchema.safeParse({
    username: field("username") ?? "",
    password: field("password") ?? "",
    returnTo: field("returnTo"),
  });
  if (result.success) return { success: true, data: result.data };

  const fieldErrors: SignInFieldErrors = {};
  for (const issue of result.error.issues) {
    const name = issue.path[0] as keyof SignInFormFields;
    fieldErrors[name] ??= issue.message;
  }
  return { success: false, fieldErrors };
}
