import type DBColumn from "../types/column-type";
import rawColumnToKnexColumn from "./raw-column-to-knex-column";
import type { Knex } from "knex";
import crypto from "node:crypto";
import { makeMockTableBuilder } from "./test-helpers";

// ---------------------------------------------------------------------------
// Unit tests — mock tableBuilder
// ---------------------------------------------------------------------------

describe("rawColumnToKnexColumn — unit (mock tableBuilder)", () => {
  describe("parameter validation", () => {
    it("throws when tableBuilder is missing", () => {
      expect(() =>
        rawColumnToKnexColumn(undefined as unknown as Knex.TableBuilder, {
          name: "id",
          type: { kind: "INTEGER" },
        }),
      ).toThrow("Missing required parameters");
    });

    it("throws when column is missing", () => {
      const tb = makeMockTableBuilder() as unknown as Knex.TableBuilder;
      expect(() =>
        rawColumnToKnexColumn(tb, undefined as unknown as DBColumn),
      ).toThrow("Missing required parameters");
    });
  });

  describe("column type mapping", () => {
    const primitiveTypes = [
      "INTEGER",
      "TEXT",
      "BOOLEAN",
      "DATE",
      "TIMESTAMP",
      "TIMESTAMPTZ",
    ] as const;

    it.each(primitiveTypes)("uses kind verbatim for %s type", (kind) => {
      const tb = makeMockTableBuilder();
      rawColumnToKnexColumn(tb as unknown as Knex.TableBuilder, {
        name: "col",
        type: { kind },
      });
      const [, sqlType] = tb.specificType.mock.calls[0];
      expect(sqlType).toContain(kind);
    });

    it("maps UUID to UUID for postgres", () => {
      const tb = makeMockTableBuilder();
      rawColumnToKnexColumn(tb as unknown as Knex.TableBuilder, {
        name: "id",
        type: { kind: "UUID" },
      });
      const [, sqlType] = tb.specificType.mock.calls[0];
      expect(sqlType).toContain("UUID");
      expect(sqlType).not.toContain("BINARY");
    });

    it("builds VARCHAR with explicit length", () => {
      const tb = makeMockTableBuilder();
      rawColumnToKnexColumn(tb as unknown as Knex.TableBuilder, {
        name: "name",
        type: { kind: "VARCHAR", length: 100 },
      });
      const [, sqlType] = tb.specificType.mock.calls[0];
      expect(sqlType).toContain("VARCHAR(100)");
    });

    it("defaults VARCHAR length to 225 when omitted", () => {
      const tb = makeMockTableBuilder();
      rawColumnToKnexColumn(tb as unknown as Knex.TableBuilder, {
        name: "name",
        type: { kind: "VARCHAR" },
      });
      const [, sqlType] = tb.specificType.mock.calls[0];
      expect(sqlType).toContain("VARCHAR(225)");
    });

    it("floors non-integer VARCHAR length", () => {
      const tb = makeMockTableBuilder();
      rawColumnToKnexColumn(tb as unknown as Knex.TableBuilder, {
        name: "name",
        type: { kind: "VARCHAR", length: 50.9 },
      });
      const [, sqlType] = tb.specificType.mock.calls[0];
      expect(sqlType).toContain("VARCHAR(50)");
    });

    it("throws for unsupported column type", () => {
      const tb = makeMockTableBuilder();
      expect(() =>
        rawColumnToKnexColumn(tb as unknown as Knex.TableBuilder, {
          name: "col",
          type: { kind: "DECIMAL" as unknown as "INTEGER" },
        }),
      ).toThrow("Unsupported column type");
    });
  });

  describe("nullable / NOT NULL suffix", () => {
    it("appends NOT NULL when isNullable is false", () => {
      const tb = makeMockTableBuilder();
      rawColumnToKnexColumn(tb as unknown as Knex.TableBuilder, {
        name: "col",
        type: { kind: "TEXT" },
        isNullable: false,
      });
      const [, sqlType] = tb.specificType.mock.calls[0];
      expect(sqlType).toContain("NOT NULL");
    });

    it("appends NULL when isNullable is true", () => {
      const tb = makeMockTableBuilder();
      rawColumnToKnexColumn(tb as unknown as Knex.TableBuilder, {
        name: "col",
        type: { kind: "TEXT" },
        isNullable: true,
      });
      const [, sqlType] = tb.specificType.mock.calls[0];
      expect(sqlType).toContain(" NULL");
      expect(sqlType).not.toContain("NOT NULL");
    });

    it("omits NULL / NOT NULL for primary key columns", () => {
      const tb = makeMockTableBuilder();
      rawColumnToKnexColumn(tb as unknown as Knex.TableBuilder, {
        name: "id",
        type: { kind: "INTEGER" },
        isPrimaryKey: true,
        isNullable: false,
      });
      const [, sqlType] = tb.specificType.mock.calls[0];
      expect(sqlType).not.toContain("NULL");
    });
  });

  describe("defaultValue", () => {
    it("appends DEFAULT clause when defaultValue is a string", () => {
      const tb = makeMockTableBuilder();
      rawColumnToKnexColumn(tb as unknown as Knex.TableBuilder, {
        name: "status",
        type: { kind: "TEXT" },
        defaultValue: "'active'",
      });
      const [, sqlType] = tb.specificType.mock.calls[0];
      expect(sqlType).toContain("DEFAULT 'active'");
    });

    it("appends DEFAULT null when defaultValue is explicitly null", () => {
      const tb = makeMockTableBuilder();
      rawColumnToKnexColumn(tb as unknown as Knex.TableBuilder, {
        name: "col",
        type: { kind: "TEXT" },
        defaultValue: null,
      });
      const [, sqlType] = tb.specificType.mock.calls[0];
      expect(sqlType).toContain("DEFAULT null");
    });

    it("omits DEFAULT clause when defaultValue is undefined", () => {
      const tb = makeMockTableBuilder();
      rawColumnToKnexColumn(tb as unknown as Knex.TableBuilder, {
        name: "col",
        type: { kind: "TEXT" },
        defaultValue: undefined,
      });
      const [, sqlType] = tb.specificType.mock.calls[0];
      expect(sqlType).not.toContain("DEFAULT");
    });

    it("omits DEFAULT clause when defaultValue property is absent", () => {
      const tb = makeMockTableBuilder();
      rawColumnToKnexColumn(tb as unknown as Knex.TableBuilder, {
        name: "col",
        type: { kind: "TEXT" },
      });
      const [, sqlType] = tb.specificType.mock.calls[0];
      expect(sqlType).not.toContain("DEFAULT");
    });
  });

  describe("autoIncrement", () => {
    it("adds GENERATED ALWAYS AS IDENTITY for postgres", () => {
      const tb = makeMockTableBuilder();
      rawColumnToKnexColumn(tb as unknown as Knex.TableBuilder, {
        name: "id",
        type: { kind: "INTEGER" },
        isAutoIncrement: true,
      });
      const [, sqlType] = tb.specificType.mock.calls[0];
      expect(sqlType).toContain("GENERATED ALWAYS AS IDENTITY");
    });

    it("omits auto-increment clause when isAutoIncrement is false", () => {
      const tb = makeMockTableBuilder();
      rawColumnToKnexColumn(tb as unknown as Knex.TableBuilder, {
        name: "id",
        type: { kind: "INTEGER" },
        isAutoIncrement: false,
      });
      const [, sqlType] = tb.specificType.mock.calls[0];
      expect(sqlType).not.toContain("IDENTITY");
    });
  });

  describe("generated columns", () => {
    it("appends GENERATED ALWAYS AS (...) STORED", () => {
      const tb = makeMockTableBuilder();
      rawColumnToKnexColumn(tb as unknown as Knex.TableBuilder, {
        name: "full_name",
        type: { kind: "TEXT" },
        generated: { as: "first_name || last_name", type: "STORED" },
      });
      const [, sqlType] = tb.specificType.mock.calls[0];
      expect(sqlType).toContain(
        "GENERATED ALWAYS AS (first_name || last_name) STORED",
      );
    });

    it("appends GENERATED ALWAYS AS (...) VIRTUAL", () => {
      const tb = makeMockTableBuilder();
      rawColumnToKnexColumn(tb as unknown as Knex.TableBuilder, {
        name: "display",
        type: { kind: "TEXT" },
        generated: { as: "CONCAT(a, b)", type: "VIRTUAL" },
      });
      const [, sqlType] = tb.specificType.mock.calls[0];
      expect(sqlType).toContain("GENERATED ALWAYS AS (CONCAT(a, b)) VIRTUAL");
    });

    it("omits generated clause when generated is null", () => {
      const tb = makeMockTableBuilder();
      rawColumnToKnexColumn(tb as unknown as Knex.TableBuilder, {
        name: "col",
        type: { kind: "TEXT" },
        generated: null,
      });
      const [, sqlType] = tb.specificType.mock.calls[0];
      expect(sqlType).not.toContain("GENERATED ALWAYS AS");
    });
  });

  describe("foreign key references", () => {
    it("calls foreign / references / inTable with correct args", () => {
      const tb = makeMockTableBuilder();
      rawColumnToKnexColumn(tb as unknown as Knex.TableBuilder, {
        name: "user_id",
        type: { kind: "INTEGER" },
        referencedTable: {
          name: "users",
          column: "id",
          displayColumn: "name",
        },
      });
      expect(tb.foreign).toHaveBeenCalledWith("user_id");
      expect(tb._foreignBuilder.references).toHaveBeenCalledWith("id");
      expect(tb._foreignBuilder.inTable).toHaveBeenCalledWith("users");
    });

    it("calls onDelete when provided", () => {
      const tb = makeMockTableBuilder();
      rawColumnToKnexColumn(tb as unknown as Knex.TableBuilder, {
        name: "user_id",
        type: { kind: "INTEGER" },
        referencedTable: {
          name: "users",
          column: "id",
          displayColumn: "name",
          onDelete: "CASCADE",
        },
      });
      expect(tb._foreignBuilder.onDelete).toHaveBeenCalledWith("CASCADE");
    });

    it("calls onUpdate when provided", () => {
      const tb = makeMockTableBuilder();
      rawColumnToKnexColumn(tb as unknown as Knex.TableBuilder, {
        name: "user_id",
        type: { kind: "INTEGER" },
        referencedTable: {
          name: "users",
          column: "id",
          displayColumn: "name",
          onUpdate: "SET NULL",
        },
      });
      expect(tb._foreignBuilder.onUpdate).toHaveBeenCalledWith("SET NULL");
    });

    it("does not call onDelete when omitted", () => {
      const tb = makeMockTableBuilder();
      rawColumnToKnexColumn(tb as unknown as Knex.TableBuilder, {
        name: "user_id",
        type: { kind: "INTEGER" },
        referencedTable: {
          name: "users",
          column: "id",
          displayColumn: "name",
        },
      });
      expect(tb._foreignBuilder.onDelete).not.toHaveBeenCalled();
    });

    it("does not call onUpdate when omitted", () => {
      const tb = makeMockTableBuilder();
      rawColumnToKnexColumn(tb as unknown as Knex.TableBuilder, {
        name: "user_id",
        type: { kind: "INTEGER" },
        referencedTable: {
          name: "users",
          column: "id",
          displayColumn: "name",
        },
      });
      expect(tb._foreignBuilder.onUpdate).not.toHaveBeenCalled();
    });

    it("skips foreign key setup when referencedTable is null", () => {
      const tb = makeMockTableBuilder();
      rawColumnToKnexColumn(tb as unknown as Knex.TableBuilder, {
        name: "col",
        type: { kind: "INTEGER" },
        referencedTable: null,
      });
      expect(tb.foreign).not.toHaveBeenCalled();
    });
  });

  describe("primary key / unique / index", () => {
    it("calls tableBuilder.primary for primary key columns", () => {
      const tb = makeMockTableBuilder();
      rawColumnToKnexColumn(tb as unknown as Knex.TableBuilder, {
        name: "id",
        type: { kind: "INTEGER" },
        isPrimaryKey: true,
      });
      expect(tb.primary).toHaveBeenCalledWith(["id"]);
    });

    it("does not call unique or index for primary key columns", () => {
      const tb = makeMockTableBuilder();
      rawColumnToKnexColumn(tb as unknown as Knex.TableBuilder, {
        name: "id",
        type: { kind: "INTEGER" },
        isPrimaryKey: true,
        isUnique: true,
        indexed: true,
      });
      expect(tb.unique).not.toHaveBeenCalled();
      expect(tb.index).not.toHaveBeenCalled();
    });

    it("calls unique for non-primary key unique columns", () => {
      const tb = makeMockTableBuilder();
      rawColumnToKnexColumn(tb as unknown as Knex.TableBuilder, {
        name: "email",
        type: { kind: "VARCHAR", length: 255 },
        isUnique: true,
      });
      expect(tb.unique).toHaveBeenCalledWith("email");
    });

    it("calls index for indexed non-primary key columns", () => {
      const tb = makeMockTableBuilder();
      rawColumnToKnexColumn(tb as unknown as Knex.TableBuilder, {
        name: "created_at",
        type: { kind: "TIMESTAMP" },
        indexed: true,
      });
      expect(tb.index).toHaveBeenCalledWith("created_at");
    });

    it("calls both unique and index when both flags are set", () => {
      const tb = makeMockTableBuilder();
      rawColumnToKnexColumn(tb as unknown as Knex.TableBuilder, {
        name: "code",
        type: { kind: "VARCHAR", length: 10 },
        isUnique: true,
        indexed: true,
      });
      expect(tb.unique).toHaveBeenCalledWith("code");
      expect(tb.index).toHaveBeenCalledWith("code");
    });
  });

  describe("column name conversion", () => {
    it("converts camelCase column name to snake_case", () => {
      const tb = makeMockTableBuilder();
      rawColumnToKnexColumn(tb as unknown as Knex.TableBuilder, {
        name: "createdAt",
        type: { kind: "TIMESTAMP" },
      });
      const [colName] = tb.specificType.mock.calls[0];
      expect(colName).toBe("created_at");
    });

    it("preserves already snake_case column name unchanged", () => {
      const tb = makeMockTableBuilder();
      rawColumnToKnexColumn(tb as unknown as Knex.TableBuilder, {
        name: "user_id",
        type: { kind: "INTEGER" },
      });
      const [colName] = tb.specificType.mock.calls[0];
      expect(colName).toBe("user_id");
    });
  });

  describe("return value", () => {
    it("returns the tableBuilder instance", () => {
      const tb = makeMockTableBuilder();
      const result = rawColumnToKnexColumn(tb as unknown as Knex.TableBuilder, {
        name: "id",
        type: { kind: "INTEGER" },
      });
      expect(result).toBe(tb);
    });
  });
});
