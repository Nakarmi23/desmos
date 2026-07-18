import { Knex } from "knex";
import type DBColumn from "../types/column-type";
import type DBClient from "../types/db-client-type";
import _ from "lodash";

function rawColumnToKnexColumn(
  tableBuilder: Knex.TableBuilder,
  column: DBColumn,
): Knex.TableBuilder {
  if (!tableBuilder || !column) {
    throw new Error("Missing required parameters for rawColumnToKnexColumn");
  }

  let specificType = "";

  switch (column.type.kind) {
    case "INTEGER":
    case "TEXT":
    case "BOOLEAN":
    case "DATE":
    case "TIMESTAMP":
    case "TIMESTAMPTZ":
    case "UUID":
      specificType = column.type.kind;
      break;
    case "VARCHAR":
      specificType = `${column.type.kind}(${Math.floor(column.type.length || 225)})`;
      break;
    default:
      throw new Error(`Unsupported column type: ${column.type.kind}`);
  }

  if (!column.isPrimaryKey) {
    if (column.isNullable) {
      specificType += " NULL";
    } else {
      specificType += " NOT NULL";
    }
  }

  if (column.defaultValue !== undefined) {
    specificType += ` DEFAULT ${column.defaultValue}`;
  }

  if (column.isAutoIncrement) {
    specificType += " GENERATED ALWAYS AS IDENTITY";
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

  if (column.isPrimaryKey) {
    tableBuilder.primary([column.name]);
  } else {
    if (column.isUnique) {
      tableBuilder.unique(column.name);
    }
    if (column.indexed) {
      tableBuilder.index(column.name);
    }
  }

  return tableBuilder;
}

export default rawColumnToKnexColumn;
