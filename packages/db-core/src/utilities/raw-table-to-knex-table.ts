import type { Knex, TableBuilder } from "knex";
import _ from "lodash";
import type DBTable from "../types/table-type";
import rawColumnToKnexColumn from "./raw-column-to-knex-column";
import rawConstraintToKnexConstraint from "./raw-constraint-to-knex-constraint";

function rawTableToKnexTable(
  knex: Knex.SchemaBuilder,
  table: DBTable,
): Knex.SchemaBuilder {
  return knex.createTable(_.snakeCase(table.name), (tableBuilder) => {
    for (const column of table.columns) {
      rawColumnToKnexColumn(tableBuilder, column);
    }
    for (const constraint of table.constraints) {
      rawConstraintToKnexConstraint(tableBuilder, constraint);
    }
  });
}

export default rawTableToKnexTable;
