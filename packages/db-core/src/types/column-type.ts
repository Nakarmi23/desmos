import type ForeignKeyEventAction from "./foreign-key-event-action-type";

type DBColumnTypeKind =
  | "INTEGER"
  | "DECIMAL"
  | "VARCHAR"
  | "TEXT"
  | "BOOLEAN"
  | "DATE"
  | "TIMESTAMP"
  | "TIMESTAMPTZ"
  | "UUID";

type DBColumnType = {
  kind: DBColumnTypeKind;
  precision?: number;
  scale?: number;
  length?: number;
};

type DBColumnGenerated = {
  as: string;
  type: "STORED" | "VIRTUAL";
};

interface DBColumnReferencedTable {
  name: string;
  column: string;
  displayColumn: string;
  onDelete?: ForeignKeyEventAction;
  onUpdate?: ForeignKeyEventAction;
}

interface DBColumn {
  name: string;
  type: DBColumnType;
  isNullable?: boolean;
  isUnique?: boolean;
  defaultValue?: string | null;
  isAutoIncrement?: boolean;
  isPrimaryKey?: boolean;
  generated?: DBColumnGenerated | null;
  referencedTable?: DBColumnReferencedTable | null;
  indexed?: boolean;
}

export type {
  DBColumn as default,
  DBColumnType,
  DBColumnTypeKind,
  DBColumnGenerated,
};
