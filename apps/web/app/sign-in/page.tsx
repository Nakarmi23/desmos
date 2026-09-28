import { SignInForm } from "@/components/sign-in/sign-in-form";
import { SignInShowcase } from "@/components/sign-in/sign-in-showcase";

import { signIn } from "./actions";

// Outside the dashboard layout: no sidebar or TopBar before Sign in.
export default async function SignInPage({
  searchParams,
}: PageProps<"/sign-in">) {
  const { returnTo } = await searchParams;

  return (
    <div className="grid flex-1 bg-surface lg:grid-cols-[minmax(0,5fr)_minmax(0,4fr)]">
      <SignInShowcase />
      <div className="flex flex-col p-6 sm:p-10">
        <main className="flex flex-1 items-center justify-center">
          <SignInForm
            action={signIn}
            returnTo={typeof returnTo === "string" ? returnTo : undefined}
          />
        </main>
        <LegalLinks />
      </div>
    </div>
  );
}

// Placeholders until the pages exist. When they do, `proxy.ts` must let
// them through without a Session, or these links bounce back to sign-in.
const LEGAL_LINKS = [
  { href: "#", label: "Terms & Conditions" },
  { href: "#", label: "Privacy Policy" },
];

function LegalLinks() {
  return (
    <footer className="flex justify-center gap-4 pt-6 text-xs text-text-subtle">
      {LEGAL_LINKS.map(({ href, label }) => (
        <a
          key={label}
          href={href}
          className="underline-offset-2 hover:text-text hover:underline"
        >
          {label}
        </a>
      ))}
    </footer>
  );
}
