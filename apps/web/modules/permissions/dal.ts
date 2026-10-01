import { db } from "../../db";
import type { Permission } from "./catalog";

/** Every Permission there is, in display order. */
export function listPermissionKeys(): Promise<Permission[]> {
  return db("permissions").orderBy("position").pluck("key");
}
