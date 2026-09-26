import { listRoles } from "../../modules/roles/dal";
import { publicProcedure, router } from "../init";

export const rolesRouter = router({
  list: publicProcedure.query(() => listRoles()),
});
