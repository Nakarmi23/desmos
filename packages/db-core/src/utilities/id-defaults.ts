import type DBColumn from "../types/column-type";
import type DBClient from "../types/db-client-type";

function getUUIDDefault(dbClient: DBClient): string {
  switch (dbClient) {
    case "postgres":
      return "gen_random_uuid()";
    case "mysql":
      return "UUID()";
    default:
      throw new Error("Unsupported database client for UUID default value");
  }
}

const uuidDefault: DBColumn = {
  name: "id",
  type: {
    kind: "UUID",
  },
  isNullable: false,
  isUnique: false,
  defaultValue: getUUIDDefault(
    (process.env.DB_CLIENT as DBClient) || "postgres",
  ),
  isAutoIncrement: false,
  isPrimaryKey: true,
  generated: null,
  referencedTable: null,
  indexed: false,
};

const idDefault: DBColumn = {
  name: "id",
  type: {
    kind: "INTEGER",
  },
  isNullable: false,
  isUnique: false,
  defaultValue: null,
  isAutoIncrement: true, // For PostgreSQL, this will be handled by IDENTITY, for MySQL, it will be AUTO_INCREMENT
  isPrimaryKey: true,
  generated: null,
  referencedTable: null,
  indexed: false,
};

export { uuidDefault, idDefault };
