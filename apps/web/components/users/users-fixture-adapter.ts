import type { TableFetcher } from "@/components/table/table-fetcher";
import { windowFixture } from "@/components/table/window-fixture";
import type { UserListRow } from "@/modules/users/user";
import { USERS } from "./users-fixture";
import { USER_COLUMNS } from "./users-table-config";

/**
 * Fixture-backed adapter for the fetcher contract (ADR 0004), for Storybook
 * and DOM tests.
 */
export const fetchFixtureUsers: TableFetcher<UserListRow> = async (
  page,
  pageSize,
  sort,
  filters,
) => windowFixture(USERS, USER_COLUMNS, page, pageSize, sort, filters);
