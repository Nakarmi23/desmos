import { listUsersWithRoles } from "../../modules/users/service";
import { usersListInputSchema } from "../../modules/users/user";
import { procedureRequiringAny, router } from "../init";

export const usersRouter = router({
  list: procedureRequiringAny("users.view")
    .input(usersListInputSchema)
    .query(({ input }) =>
      listUsersWithRoles({
        page: input.page,
        pageSize: input.pageSize,
        sort: input.sort,
        search: input.filters.search,
        columns: input.filters.columns,
      }),
    ),
});
