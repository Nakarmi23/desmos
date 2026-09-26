import type { TableFetcher } from "@/components/table/table-fetcher";
import { windowFixture } from "@/components/table/window-fixture";
import { USERS, type User } from "./users-fixture";
import { USER_COLUMNS } from "./users-table";

/**
 * Fixture-backed adapter for the fetcher contract (ADR 0004), for Storybook
 * and DOM tests.
 */
export const fetchFixtureUsers: TableFetcher<User> = async (
  page,
  pageSize,
  sort,
  filters,
) => windowFixture(USERS, USER_COLUMNS, page, pageSize, sort, filters);
