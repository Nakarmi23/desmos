// Not a client module, so the server can read the URL's view with the same
// config the Table uses.
import type { TableColumn } from "@/components/table/table-column";
import type { TableUrlConfig } from "@/components/table/table-url-state";
import {
  DEFAULT_PAGE_SIZE,
  DEFAULT_PAGE_SIZE_OPTIONS,
} from "@/components/table/table-view";
import type { RoleListRow } from "@/modules/roles/role";

import { rolesTableStyles } from "./roles-table.styles";

const styles = rolesTableStyles();

// Sorting by name, holders and created only; Basic Search over name and
// description; no Advanced Search.
export const roleColumns: TableColumn<RoleListRow>[] = [
  {
    id: "name",
    header: "Name",
    type: "text",
    accessor: (role) => role.name,
    filter: false,
  },
  {
    id: "type",
    header: "Type",
    type: "text",
    render: (role) =>
      role.isSystem ? (
        <span className={styles.systemBadge()}>System</span>
      ) : (
        <span className={styles.empty()}>—</span>
      ),
  },
  {
    id: "description",
    header: "Description",
    type: "text",
    accessor: (role) => role.description,
    sortable: false,
    filter: false,
  },
  {
    id: "permissionCount",
    header: "Permissions",
    type: "number",
    // A System Role grants every Permission, including ones added later.
    render: (role) => (role.isSystem ? "All" : String(role.permissionCount)),
  },
  {
    id: "holderCount",
    header: "Holders",
    type: "number",
    accessor: (role) => role.holderCount,
    filter: false,
  },
  {
    id: "createdAt",
    header: "Created",
    type: "date",
    accessor: (role) => role.createdAt,
    filter: false,
  },
];

// One source for both the Table and the URL (on the server and the client).
export const rolesTableConfig: TableUrlConfig<RoleListRow> = {
  columns: roleColumns,
  defaultPageSize: DEFAULT_PAGE_SIZE,
  pageSizeOptions: DEFAULT_PAGE_SIZE_OPTIONS,
};
