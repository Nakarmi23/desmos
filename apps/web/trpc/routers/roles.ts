import { listRoles } from "../../modules/roles/dal";
import { protectedProcedure, router } from "../init";

export const rolesRouter = router({
  list: protectedProcedure.query(() => listRoles()),
});
