import { listRoles, listRolesPage } from "../../modules/roles/dal";
import { rolesTableInputSchema } from "../../modules/roles/role";
import { procedureRequiringAny, router } from "../init";

export const rolesRouter = router({
  // The Users Role filter lists Role names too, so `users.view` will do.
  list: procedureRequiringAny("users.view", "roles.view").query(() =>
    listRoles(),
  ),
  table: procedureRequiringAny("roles.view")
    .input(rolesTableInputSchema)
    .query(({ input }) =>
      listRolesPage({
        page: input.page,
        pageSize: input.pageSize,
        sort: input.sort,
        search: input.filters.search,
      }),
    ),
});
