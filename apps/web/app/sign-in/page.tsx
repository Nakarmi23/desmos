import { SignInForm } from "@/components/sign-in/sign-in-form";

import { signIn } from "./actions";

// Outside the dashboard layout: no sidebar or TopBar before Sign in.
export default async function SignInPage({
  searchParams,
}: PageProps<"/sign-in">) {
  const { returnTo } = await searchParams;

  return (
    <main className="flex flex-1 items-center justify-center bg-surface-sunken p-6">
      <SignInForm
        action={signIn}
        returnTo={typeof returnTo === "string" ? returnTo : undefined}
      />
    </main>
  );
}
