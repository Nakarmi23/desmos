import { listRoles } from "../../modules/roles/dal";
import { procedureRequiringAny, router } from "../init";

export const rolesRouter = router({
  // The Users Role filter lists Role names too, so `users.view` will do.
  list: procedureRequiringAny("users.view", "roles.view").query(() =>
    listRoles(),
  ),
});
