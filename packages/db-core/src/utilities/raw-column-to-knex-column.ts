import { Knex } from "knex";
import type DBColumn from "../types/column-type";
import type DBClient from "../types/db-client-type";
import _ from "lodash";

function rawColumnToKnexColumn(
  tableBuilder: Knex.TableBuilder,
  dbClient: DBClient,
  column: DBColumn,
): Knex.TableBuilder {
  let specificType = "";

  switch (column.type.kind) {
    case "INTEGER":
    case "TEXT":
    case "BOOLEAN":
    case "DATE":
    case "DATETIME":
      specificType = column.type.kind;
      break;
    case "VARCHAR":
      specificType = `${column.type.kind}(${column.type.length || 255})`;
      break;
    case "UUID":
      specificType = dbClient === "postgres" ? "UUID" : `BINARY(36)`;
      break;
    default:
      throw new Error(`Unsupported column type: ${column.type.kind}`);
  }

  if (column.isNullable) {
    specificType += " NULLABLE";
  } else {
    specificType += " NOT NULLABLE";
  }

  if (column.defaultValue !== undefined) {
    specificType += ` DEFAULT ${column.defaultValue}`;
  }

  if (column.isAutoIncrement) {
    if (dbClient === "postgres") {
      specificType += " GENERATED ALWAYS AS IDENTITY";
    } else if (dbClient === "mysql") {
      specificType += " AUTO_INCREMENT";
    }
  }

  if (column.generated) {
    specificType += ` GENERATED ALWAYS AS (${column.generated.as}) ${column.generated.type}`;
  }

  tableBuilder.specificType(_.snakeCase(column.name), specificType);

  if (column.referencedTable) {
    const relationBuilder = tableBuilder
      .foreign(column.name)
      .references(column.referencedTable.column)
      .inTable(column.referencedTable.name);

    if (column.referencedTable.onDelete)
      relationBuilder.onDelete(column.referencedTable.onDelete);
    if (column.referencedTable.onUpdate)
      relationBuilder.onUpdate(column.referencedTable.onUpdate);
  }

  if (column.isUnique) {
    tableBuilder.unique(column.name);
  }

  if (column.isPrimaryKey) {
    tableBuilder.primary([column.name]);
  }

  if (column.indexed) {
    tableBuilder.index(column.name);
  }

  return tableBuilder;
}

export default rawColumnToKnexColumn;
