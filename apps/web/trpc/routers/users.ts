import { listUsers } from "../../modules/users/dal";
import { usersListInputSchema } from "../../modules/users/user";
import { publicProcedure, router } from "../init";

export const usersRouter = router({
  list: publicProcedure.input(usersListInputSchema).query(({ input }) =>
    listUsers({
      page: input.page,
      pageSize: input.pageSize,
      sort: input.sort,
      search: input.filters.search,
    }),
  ),
});
