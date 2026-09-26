"use client";

import {
  FIXTURE_ROLE_OPTIONS,
  fetchFixtureUsers,
} from "@/components/users/users-fixture-adapter";
import { UsersTable } from "@/components/users/users-table";

// Binds the fetcher on the client side of the server→client boundary.
// Fixture-backed until a real Users backend exists.
export function UsersPageTable() {
  return (
    <UsersTable
      fetcher={fetchFixtureUsers}
      roleOptions={FIXTURE_ROLE_OPTIONS}
    />
  );
}
