// Not a client module, so the server can read the URL's view with the same
// config the Table uses.
import {
  toFilterOptions,
  type TableColumn,
  type TableFilterOption,
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

/** A Role as an option for the Roles column: its id, labelled by name. */
export const toRoleOptions = (
  roles: readonly { id: string; name: string }[],
): TableFilterOption[] =>
  roles.map(({ id, name }) => ({ value: id, label: name }));

// Sorting, Basic Search (text columns) and Advanced Search come from `type`.
// Roles are data, not a fixed set, so their options come from the caller.
export const userColumns = (
  roleOptions: readonly TableFilterOption[],
): TableColumn<UserListRow>[] => [
  {
    id: "name",
    header: "Name",
    type: "text",
    accessor: (user) => user.name,
  },
  {
    id: "username",
    header: "Username",
    type: "text",
    accessor: (user) => user.username,
  },
  {
    id: "email",
    header: "Email",
    type: "text",
    accessor: (user) => user.email,
  },
  {
    id: "roles",
    header: "Roles",
    type: "multiEnum",
    options: roleOptions,
    accessor: (user) => user.roles.map((role) => role.id),
  },
  {
    id: "status",
    header: "Status",
    type: "enum",
    options: toFilterOptions(STATUS_LABELS),
    accessor: (user) => user.status,
  },
  {
    id: "createdAt",
    header: "Created",
    type: "date",
    accessor: (user) => user.createdAt,
  },
];

// One source for both the Table and the URL (on the server and the client),
// so they agree on columns, page sizes and (if one is added) the default sort.
export const usersTableConfig = (
  roleOptions: readonly TableFilterOption[],
): TableUrlConfig<UserListRow> => ({
  columns: userColumns(roleOptions),
  defaultPageSize: DEFAULT_PAGE_SIZE,
  pageSizeOptions: DEFAULT_PAGE_SIZE_OPTIONS,
});
