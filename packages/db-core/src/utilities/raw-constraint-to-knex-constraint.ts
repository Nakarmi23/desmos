import type { Knex } from "knex";
import type DBConstraint from "../types/constraint-type";

function rawConstraintToKnexConstraint(
  tableBuilder: Knex.TableBuilder,
  constraint: DBConstraint,
): Knex.TableBuilder {
  switch (constraint.type) {
    case "PRIMARY KEY":
      tableBuilder.primary(constraint.columns, {
        constraintName: constraint.name,
      });
      break;
    case "FOREIGN KEY":
      const builder = tableBuilder
        .foreign(constraint.columns)
        .references(constraint.referencedTable.columns)
        .inTable(constraint.referencedTable.name);

      if (constraint.name) builder.withKeyName(constraint.name);

      if (constraint.referencedTable.onDelete)
        builder.onDelete(constraint.referencedTable.onDelete);

      if (constraint.referencedTable.onUpdate)
        builder.onUpdate(constraint.referencedTable.onUpdate);
      break;
    case "UNIQUE":
      tableBuilder.unique(constraint.columns, {
        indexName: constraint.name,
      });
      break;
    case "INDEX":
      tableBuilder.index(constraint.columns, constraint.name);
      break;
    default:
      throw new Error(`Unsupported constraint type`);
  }

  return tableBuilder;
}

export default rawConstraintToKnexConstraint;
