import type DBColumn from "./column-type";
import type DBConstraint from "./constraint-type";

interface DBTable {
  name: string;
  columns: DBColumn[];
  constraints: DBConstraint[];
}

export type { DBTable as default };
