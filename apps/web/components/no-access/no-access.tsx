import { LockKeyhole } from "lucide-react";
import Link from "next/link";

import { noAccessStyles } from "./no-access.styles";

const styles = noAccessStyles();

/**
 * Shown in place of a page whose Resource the signed-in User can't view —
 * inside the dashboard shell, so the rest of the app stays a click away.
 */
export function NoAccess() {
  return (
    <div className={styles.root()}>
      <LockKeyhole aria-hidden size={24} className={styles.icon()} />
      <h1 className={styles.title()}>You don&apos;t have access</h1>
      <p className={styles.message()}>
        None of your Roles let you view this page. Ask an administrator if you
        need it.
      </p>
      <Link href="/" className={styles.link()}>
        Go to Overview
      </Link>
    </div>
  );
}
