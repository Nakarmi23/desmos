import { Suspense } from "react";

import { UsersPageTable } from "./users-page-table";

export default function UsersPage() {
  // The table's view lives in the query string, which isn't known when the
  // page is prerendered.
  return (
    <Suspense>
      <UsersPageTable />
    </Suspense>
  );
}
