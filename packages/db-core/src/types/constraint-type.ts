import type ForeignKeyEventAction from "./foreign-key-event-action-type";

type ConstraintType = "PRIMARY KEY" | "FOREIGN KEY" | "UNIQUE" | "INDEX";

interface DBConstraintReferencedTable {
  name: string;
  columns: string[];
  displayColumn: string;
  onDelete?: ForeignKeyEventAction;
  onUpdate?: ForeignKeyEventAction;
}

type DBConstraintBase = {
  name?: string;
  columns: string[];
  type: "PRIMARY KEY" | "UNIQUE" | "INDEX";
};

type DBConstraintForeignKey = {
  name?: string;
  columns: string[];
  type: "FOREIGN KEY";
  referencedTable: DBConstraintReferencedTable;
};

type DBConstraint = DBConstraintBase | DBConstraintForeignKey;

export type { DBConstraint as default, ConstraintType };
