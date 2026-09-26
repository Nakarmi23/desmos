import {
  toFilterOptions,
  type TableFilterOption,
} from "@/components/table/table-column";
import type { TableFetcher } from "@/components/table/table-fetcher";
import { windowFixture } from "@/components/table/window-fixture";
import { USERS, type User, type UserRole } from "./users-fixture";
import { userColumns } from "./users-table";

// Record<..> makes the compiler flag a new fixture role that has no label.
const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin",
  member: "Member",
  viewer: "Viewer",
};

/** The fixture's Roles, as options for the Users Table's Role filter. */
export const FIXTURE_ROLE_OPTIONS: readonly TableFilterOption[] =
  toFilterOptions(ROLE_LABELS);

const FIXTURE_COLUMNS = userColumns(FIXTURE_ROLE_OPTIONS);

/**
 * Fixture-backed adapter for the fetcher contract (ADR 0004), for Storybook,
 * DOM tests and any page without a real Users backend yet.
 */
export const fetchFixtureUsers: TableFetcher<User> = async (
  page,
  pageSize,
  sort,
  filters,
) => windowFixture(USERS, FIXTURE_COLUMNS, page, pageSize, sort, filters);
