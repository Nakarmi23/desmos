import { z } from "zod";

import { listUsers } from "../../modules/users/dal";
import { USER_SORT_COLUMNS } from "../../modules/users/user";
import { publicProcedure, router } from "../init";

// The Table fetcher contract's shapes (ADR 0004). Advanced Search filters
// aren't supported yet, so only Basic Search is accepted.
const listInput = z.object({
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1).max(100),
  sort: z
    .object({
      columnId: z.enum(USER_SORT_COLUMNS),
      direction: z.enum(["asc", "desc"]),
    })
    .nullable(),
  filters: z.strictObject({ search: z.string().optional() }),
});

export const usersRouter = router({
  list: publicProcedure.input(listInput).query(({ input }) =>
    listUsers({
      page: input.page,
      pageSize: input.pageSize,
      sort: input.sort,
      search: input.filters.search,
    }),
  ),
});
