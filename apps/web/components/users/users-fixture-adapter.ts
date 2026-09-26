import type { TableFetcher } from "@/components/table/table-fetcher";
import { windowFixture } from "@/components/table/window-fixture";
import type { UserListRow } from "@/modules/users/user";
import { FIXTURE_ROLES, USERS } from "./users-fixture";
import { toRoleOptions, userColumns } from "./users-table-config";

/** The fixture's Roles as the Roles column's options. */
export const FIXTURE_ROLE_OPTIONS = toRoleOptions(FIXTURE_ROLES);

/** The Users Table's columns over the fixture's Roles. */
export const FIXTURE_USER_COLUMNS = userColumns(FIXTURE_ROLE_OPTIONS);

/**
 * Fixture-backed adapter for the fetcher contract (ADR 0004), for Storybook
 * and DOM tests.
 */
export const fetchFixtureUsers: TableFetcher<UserListRow> = async (
  page,
  pageSize,
  sort,
  filters,
) => windowFixture(USERS, FIXTURE_USER_COLUMNS, page, pageSize, sort, filters);
