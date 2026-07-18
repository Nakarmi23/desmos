import type { Knex } from "knex";
import type DBTable from "../types/table-type";
import rawTableToKnexTable from "./raw-table-to-knex-table";
import { makeMockSchemaBuilder } from "./test-helpers";

jest.mock("./raw-column-to-knex-column");
jest.mock("./raw-constraint-to-knex-constraint");

import rawColumnToKnexColumn from "./raw-column-to-knex-column";
import rawConstraintToKnexConstraint from "./raw-constraint-to-knex-constraint";

const mockedColumn = rawColumnToKnexColumn as jest.MockedFunction<
  typeof rawColumnToKnexColumn
>;
const mockedConstraint = rawConstraintToKnexConstraint as jest.MockedFunction<
  typeof rawConstraintToKnexConstraint
>;

beforeEach(() => {
  jest.clearAllMocks();
});

describe("rawTableToKnexTable", () => {
  describe("table name", () => {
    it("calls createTable with the exact snake_case table name", () => {
      const sb = makeMockSchemaBuilder();
      const table: DBTable = { name: "user_orders", columns: [], constraints: [] };

      rawTableToKnexTable(sb as unknown as Knex.SchemaBuilder, table);

      expect(sb.createTable).toHaveBeenCalledWith(
        "user_orders",
        expect.any(Function),
      );
    });

    it("converts camelCase table name to snake_case", () => {
      const sb = makeMockSchemaBuilder();
      const table: DBTable = { name: "userOrders", columns: [], constraints: [] };

      rawTableToKnexTable(sb as unknown as Knex.SchemaBuilder, table);

      expect(sb.createTable).toHaveBeenCalledWith(
        "user_orders",
        expect.any(Function),
      );
    });

    it("converts PascalCase table name to snake_case", () => {
      const sb = makeMockSchemaBuilder();
      const table: DBTable = { name: "UserProfile", columns: [], constraints: [] };

      rawTableToKnexTable(sb as unknown as Knex.SchemaBuilder, table);

      expect(sb.createTable).toHaveBeenCalledWith(
        "user_profile",
        expect.any(Function),
      );
    });
  });

  describe("columns delegation", () => {
    it("calls rawColumnToKnexColumn once per column with the tableBuilder", () => {
      const sb = makeMockSchemaBuilder();
      const col1 = { name: "id", type: { kind: "INTEGER" as const } };
      const col2 = { name: "email", type: { kind: "VARCHAR" as const, length: 255 } };
      const table: DBTable = { name: "users", columns: [col1, col2], constraints: [] };

      rawTableToKnexTable(sb as unknown as Knex.SchemaBuilder, table);

      expect(mockedColumn).toHaveBeenCalledTimes(2);
      expect(mockedColumn).toHaveBeenNthCalledWith(
        1,
        sb._tableBuilder,
        col1,
      );
      expect(mockedColumn).toHaveBeenNthCalledWith(
        2,
        sb._tableBuilder,
        col2,
      );
    });

    it("does not call rawColumnToKnexColumn when columns array is empty", () => {
      const sb = makeMockSchemaBuilder();
      const table: DBTable = { name: "empty", columns: [], constraints: [] };

      rawTableToKnexTable(sb as unknown as Knex.SchemaBuilder, table);

      expect(mockedColumn).not.toHaveBeenCalled();
    });

    it("calls rawColumnToKnexColumn for a single column", () => {
      const sb = makeMockSchemaBuilder();
      const col = { name: "id", type: { kind: "INTEGER" as const } };
      const table: DBTable = { name: "t", columns: [col], constraints: [] };

      rawTableToKnexTable(sb as unknown as Knex.SchemaBuilder, table);

      expect(mockedColumn).toHaveBeenCalledTimes(1);
      expect(mockedColumn).toHaveBeenCalledWith(sb._tableBuilder, col);
    });
  });

  describe("constraints delegation", () => {
    it("calls rawConstraintToKnexConstraint once per constraint with the tableBuilder", () => {
      const sb = makeMockSchemaBuilder();
      const c1 = { type: "PRIMARY KEY" as const, columns: ["id"] };
      const c2 = { type: "INDEX" as const, columns: ["created_at"], name: "idx" };
      const table: DBTable = { name: "orders", columns: [], constraints: [c1, c2] };

      rawTableToKnexTable(sb as unknown as Knex.SchemaBuilder, table);

      expect(mockedConstraint).toHaveBeenCalledTimes(2);
      expect(mockedConstraint).toHaveBeenNthCalledWith(
        1,
        sb._tableBuilder,
        c1,
      );
      expect(mockedConstraint).toHaveBeenNthCalledWith(
        2,
        sb._tableBuilder,
        c2,
      );
    });

    it("does not call rawConstraintToKnexConstraint when constraints array is empty", () => {
      const sb = makeMockSchemaBuilder();
      const table: DBTable = { name: "t", columns: [], constraints: [] };

      rawTableToKnexTable(sb as unknown as Knex.SchemaBuilder, table);

      expect(mockedConstraint).not.toHaveBeenCalled();
    });

    it("calls rawConstraintToKnexConstraint for a single constraint", () => {
      const sb = makeMockSchemaBuilder();
      const c = { type: "UNIQUE" as const, columns: ["email"] };
      const table: DBTable = { name: "t", columns: [], constraints: [c] };

      rawTableToKnexTable(sb as unknown as Knex.SchemaBuilder, table);

      expect(mockedConstraint).toHaveBeenCalledTimes(1);
      expect(mockedConstraint).toHaveBeenCalledWith(sb._tableBuilder, c);
    });
  });

  describe("delegation order", () => {
    it("processes all columns before any constraints", () => {
      const sb = makeMockSchemaBuilder();
      const callOrder: string[] = [];
      mockedColumn.mockImplementation(() => {
        callOrder.push("column");
        return {} as Knex.TableBuilder;
      });
      mockedConstraint.mockImplementation(() => {
        callOrder.push("constraint");
        return {} as Knex.TableBuilder;
      });

      const col = { name: "id", type: { kind: "INTEGER" as const } };
      const c = { type: "PRIMARY KEY" as const, columns: ["id"] };
      const table: DBTable = { name: "t", columns: [col], constraints: [c] };

      rawTableToKnexTable(sb as unknown as Knex.SchemaBuilder, table);

      expect(callOrder).toEqual(["column", "constraint"]);
    });
  });

  describe("return value", () => {
    it("returns the SchemaBuilder instance", () => {
      const sb = makeMockSchemaBuilder();
      const table: DBTable = { name: "t", columns: [], constraints: [] };

      const result = rawTableToKnexTable(
        sb as unknown as Knex.SchemaBuilder,
        table,
      );

      expect(result).toBe(sb);
    });
  });
});
