import type { Meta, StoryObj } from "@storybook/nextjs";

import { Table } from "./table";
import type { TableColumn } from "./table-column";
import { windowFixture } from "./window-fixture";
import type { TableFetcher } from "./table-fetcher";
import { USER_BULK_ACTIONS } from "@/components/users/users-table";
import {
  FIXTURE_ROLE_OPTIONS,
  FIXTURE_USER_COLUMNS,
  fetchFixtureUsers,
} from "@/components/users/users-fixture-adapter";
import type { UserListRow } from "@/modules/users/user";

const pending: TableFetcher<UserListRow> = () => new Promise(() => {});
const empty: TableFetcher<UserListRow> = async () => ({ rows: [], total: 0 });
const failing: TableFetcher<UserListRow> = async () => {
  throw new Error("Failed to load users");
};

const meta = {
  title: "Table",
  component: Table<UserListRow>,
  args: {
    columns: FIXTURE_USER_COLUMNS,
    fetcher: fetchFixtureUsers,
    getRowId: (u: UserListRow) => u.id,
  },
} satisfies Meta<typeof Table<UserListRow>>;

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
        columns: {
          roles: { operator: "in", values: [FIXTURE_ROLE_OPTIONS[0].value] },
        },
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

type Project = { id: string; name: string; tags: string[] };

const PROJECTS: Project[] = [
  { id: "1", name: "Atlas", tags: ["frontend", "design", "research"] },
  { id: "2", name: "Beacon", tags: ["backend"] },
  { id: "3", name: "Comet", tags: [] },
  { id: "4", name: "Delta", tags: ["backend", "infra", "frontend", "design"] },
];

const PROJECT_COLUMNS: TableColumn<Project>[] = [
  { id: "name", header: "Name", type: "text", accessor: (p) => p.name },
  {
    id: "tags",
    header: "Tags",
    type: "multiEnum",
    width: 220,
    options: [
      { value: "frontend", label: "Frontend" },
      { value: "backend", label: "Backend" },
      { value: "design", label: "Design" },
      { value: "infra", label: "Infra" },
      { value: "research", label: "Research" },
    ],
    accessor: (p) => p.tags,
  },
];

// A column holding a list per row: wrapping chips, "is any of" / "is none of"
// filtering, no sorting.
export const MultiValueColumn: Story = {
  render: () => (
    <Table
      columns={PROJECT_COLUMNS}
      fetcher={async (page, pageSize, sort, filters) =>
        windowFixture(PROJECTS, PROJECT_COLUMNS, page, pageSize, sort, filters)
      }
      getRowId={(p) => p.id}
    />
  ),
};
