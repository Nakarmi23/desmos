import { Suspense } from "react";

import { UsersTable } from "@/components/table/users-table";

export default function UsersModulePage() {
  // The table's view lives in the query string, which isn't known when the
  // page is prerendered.
  return (
    <Suspense>
      <UsersTable />
    </Suspense>
  );
}
