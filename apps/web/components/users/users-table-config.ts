// Not a client module, so the server can read the URL's view with the same
// config the Table uses.
import {
  toFilterOptions,
  type TableColumn,
} from "@/components/table/table-column";
import type { TableUrlConfig } from "@/components/table/table-url-state";
import {
  DEFAULT_PAGE_SIZE,
  DEFAULT_PAGE_SIZE_OPTIONS,
} from "@/components/table/table-view";
import type { UserListRow, UserStatus } from "@/modules/users/user";

// Record<..> makes the compiler flag a new status that has no label.
const STATUS_LABELS: Record<UserStatus, string> = {
  active: "Active",
  suspended: "Suspended",
};

// `users.list` doesn't do Advanced Search yet, so no column offers it.
const NO_FILTER = { filter: false } as const;

// Sorting and Basic Search (text columns) come from `type`.
export const USER_COLUMNS: TableColumn<UserListRow>[] = [
  {
    id: "name",
    header: "Name",
    type: "text",
    accessor: (user) => user.name,
    ...NO_FILTER,
  },
  {
    id: "username",
    header: "Username",
    type: "text",
    accessor: (user) => user.username,
    ...NO_FILTER,
  },
  {
    id: "email",
    header: "Email",
    type: "text",
    accessor: (user) => user.email,
    ...NO_FILTER,
  },
  {
    id: "status",
    header: "Status",
    type: "enum",
    options: toFilterOptions(STATUS_LABELS),
    accessor: (user) => user.status,
    ...NO_FILTER,
  },
  {
    id: "createdAt",
    header: "Created",
    type: "date",
    accessor: (user) => user.createdAt,
    ...NO_FILTER,
  },
];

// One source for both the Table and the URL, so they agree on columns, page
// sizes and (if one is added) the default sort.
export const USERS_TABLE_CONFIG: TableUrlConfig<UserListRow> = {
  columns: USER_COLUMNS,
  defaultPageSize: DEFAULT_PAGE_SIZE,
  pageSizeOptions: DEFAULT_PAGE_SIZE_OPTIONS,
};
