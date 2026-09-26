import type { Meta, StoryObj } from "@storybook/nextjs";

import { Table } from "./table";
import type { TableFetcher } from "./table-fetcher";
import { USER_BULK_ACTIONS, userColumns } from "@/components/users/users-table";
import type { User } from "@/components/users/users-fixture";
import {
  FIXTURE_ROLE_OPTIONS,
  fetchFixtureUsers,
} from "@/components/users/users-fixture-adapter";

const populated = fetchFixtureUsers;
const pending: TableFetcher<User> = () => new Promise(() => {});
const empty: TableFetcher<User> = async () => ({ rows: [], total: 0 });
const failing: TableFetcher<User> = async () => {
  throw new Error("Failed to load users");
};

const meta = {
  title: "Table",
  component: Table<User>,
  args: {
    columns: userColumns(FIXTURE_ROLE_OPTIONS),
    fetcher: populated,
    getRowId: (u: User) => u.id,
  },
} satisfies Meta<typeof Table<User>>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Populated: Story = {};
export const WithBulkActions: Story = {
  args: { bulkActions: USER_BULK_ACTIONS },
};
export const Loading: Story = { args: { fetcher: pending } };
export const Empty: Story = { args: { fetcher: empty } };
export const FetchError: Story = { args: { fetcher: failing } };

// Opens with a search + filter applied, so the empty state offers to clear them.
export const EmptyWithFilters: Story = {
  args: {
    fetcher: empty,
    initialView: {
      page: 1,
      pageSize: 25,
      sort: null,
      filters: {
        search: "nobody",
        columns: { role: { operator: "in", values: ["admin"] } },
      },
    },
  },
};

// Opens mid-way through a sorted, filtered view (as a shared URL would).
export const PresetView: Story = {
  args: {
    initialView: {
      page: 2,
      pageSize: 25,
      sort: { columnId: "createdAt", direction: "desc" },
      filters: { columns: { status: { operator: "in", values: ["active"] } } },
    },
  },
};

export const DefaultSort: Story = {
  args: { defaultSort: { columnId: "name", direction: "asc" } },
};

export const Mobile: Story = {
  args: WithBulkActions.args,
  globals: { viewport: "mobile2" },
};
