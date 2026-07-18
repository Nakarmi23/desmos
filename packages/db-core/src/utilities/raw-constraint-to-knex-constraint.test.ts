import type { Knex } from "knex";
import type DBConstraint from "../types/constraint-type";
import rawConstraintToKnexConstraint from "./raw-constraint-to-knex-constraint";
import { makeMockTableBuilder } from "./test-helpers";

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("rawConstraintToKnexConstraint", () => {
  describe("PRIMARY KEY constraint", () => {
    it("calls tableBuilder.primary with columns and constraint name", () => {
      const tb = makeMockTableBuilder();
      const constraint: DBConstraint = {
        type: "PRIMARY KEY",
        columns: ["id"],
        name: "pk_users",
      };

      rawConstraintToKnexConstraint(
        tb as unknown as Knex.TableBuilder,
        constraint,
      );

      expect(tb.primary).toHaveBeenCalledWith(["id"], {
        constraintName: "pk_users",
      });
    });

    it("works with composite primary key columns", () => {
      const tb = makeMockTableBuilder();
      const constraint: DBConstraint = {
        type: "PRIMARY KEY",
        columns: ["tenant_id", "user_id"],
        name: "pk_tenant_user",
      };

      rawConstraintToKnexConstraint(
        tb as unknown as Knex.TableBuilder,
        constraint,
      );

      expect(tb.primary).toHaveBeenCalledWith(["tenant_id", "user_id"], {
        constraintName: "pk_tenant_user",
      });
    });

    it("passes undefined constraintName when name is omitted", () => {
      const tb = makeMockTableBuilder();
      const constraint: DBConstraint = {
        type: "PRIMARY KEY",
        columns: ["id"],
      };

      rawConstraintToKnexConstraint(
        tb as unknown as Knex.TableBuilder,
        constraint,
      );

      expect(tb.primary).toHaveBeenCalledWith(["id"], {
        constraintName: undefined,
      });
    });
  });

  describe("FOREIGN KEY constraint", () => {
    it("calls foreign / references / inTable with correct arguments", () => {
      const tb = makeMockTableBuilder();
      const constraint: DBConstraint = {
        type: "FOREIGN KEY",
        columns: ["user_id"],
        referencedTable: {
          name: "users",
          columns: ["id"],
          displayColumn: "name",
        },
      };

      rawConstraintToKnexConstraint(
        tb as unknown as Knex.TableBuilder,
        constraint,
      );

      expect(tb.foreign).toHaveBeenCalledWith(["user_id"]);
      expect(tb._foreignBuilder.references).toHaveBeenCalledWith(["id"]);
      expect(tb._foreignBuilder.inTable).toHaveBeenCalledWith("users");
    });

    it("calls withKeyName when constraint name is provided", () => {
      const tb = makeMockTableBuilder();
      const constraint: DBConstraint = {
        type: "FOREIGN KEY",
        name: "fk_orders_user",
        columns: ["user_id"],
        referencedTable: {
          name: "users",
          columns: ["id"],
          displayColumn: "name",
        },
      };

      rawConstraintToKnexConstraint(
        tb as unknown as Knex.TableBuilder,
        constraint,
      );

      expect(tb._foreignBuilder.withKeyName).toHaveBeenCalledWith(
        "fk_orders_user",
      );
    });

    it("does not call withKeyName when constraint name is omitted", () => {
      const tb = makeMockTableBuilder();
      const constraint: DBConstraint = {
        type: "FOREIGN KEY",
        columns: ["user_id"],
        referencedTable: {
          name: "users",
          columns: ["id"],
          displayColumn: "name",
        },
      };

      rawConstraintToKnexConstraint(
        tb as unknown as Knex.TableBuilder,
        constraint,
      );

      expect(tb._foreignBuilder.withKeyName).not.toHaveBeenCalled();
    });

    it("calls onDelete when referencedTable.onDelete is provided", () => {
      const tb = makeMockTableBuilder();
      const constraint: DBConstraint = {
        type: "FOREIGN KEY",
        columns: ["user_id"],
        referencedTable: {
          name: "users",
          columns: ["id"],
          displayColumn: "name",
          onDelete: "CASCADE",
        },
      };

      rawConstraintToKnexConstraint(
        tb as unknown as Knex.TableBuilder,
        constraint,
      );

      expect(tb._foreignBuilder.onDelete).toHaveBeenCalledWith("CASCADE");
    });

    it("does not call onDelete when referencedTable.onDelete is omitted", () => {
      const tb = makeMockTableBuilder();
      const constraint: DBConstraint = {
        type: "FOREIGN KEY",
        columns: ["user_id"],
        referencedTable: {
          name: "users",
          columns: ["id"],
          displayColumn: "name",
        },
      };

      rawConstraintToKnexConstraint(
        tb as unknown as Knex.TableBuilder,
        constraint,
      );

      expect(tb._foreignBuilder.onDelete).not.toHaveBeenCalled();
    });

    it("calls onUpdate when referencedTable.onUpdate is provided", () => {
      const tb = makeMockTableBuilder();
      const constraint: DBConstraint = {
        type: "FOREIGN KEY",
        columns: ["user_id"],
        referencedTable: {
          name: "users",
          columns: ["id"],
          displayColumn: "name",
          onUpdate: "RESTRICT",
        },
      };

      rawConstraintToKnexConstraint(
        tb as unknown as Knex.TableBuilder,
        constraint,
      );

      expect(tb._foreignBuilder.onUpdate).toHaveBeenCalledWith("RESTRICT");
    });

    it("does not call onUpdate when referencedTable.onUpdate is omitted", () => {
      const tb = makeMockTableBuilder();
      const constraint: DBConstraint = {
        type: "FOREIGN KEY",
        columns: ["user_id"],
        referencedTable: {
          name: "users",
          columns: ["id"],
          displayColumn: "name",
        },
      };

      rawConstraintToKnexConstraint(
        tb as unknown as Knex.TableBuilder,
        constraint,
      );

      expect(tb._foreignBuilder.onUpdate).not.toHaveBeenCalled();
    });

    it("supports composite foreign key columns", () => {
      const tb = makeMockTableBuilder();
      const constraint: DBConstraint = {
        type: "FOREIGN KEY",
        columns: ["tenant_id", "user_id"],
        referencedTable: {
          name: "tenant_users",
          columns: ["tenant_id", "id"],
          displayColumn: "name",
        },
      };

      rawConstraintToKnexConstraint(
        tb as unknown as Knex.TableBuilder,
        constraint,
      );

      expect(tb.foreign).toHaveBeenCalledWith(["tenant_id", "user_id"]);
      expect(tb._foreignBuilder.references).toHaveBeenCalledWith([
        "tenant_id",
        "id",
      ]);
    });
  });

  describe("UNIQUE constraint", () => {
    it("calls tableBuilder.unique with columns and index name", () => {
      const tb = makeMockTableBuilder();
      const constraint: DBConstraint = {
        type: "UNIQUE",
        columns: ["email"],
        name: "uq_users_email",
      };

      rawConstraintToKnexConstraint(
        tb as unknown as Knex.TableBuilder,
        constraint,
      );

      expect(tb.unique).toHaveBeenCalledWith(["email"], {
        indexName: "uq_users_email",
      });
    });

    it("passes undefined indexName when name is omitted", () => {
      const tb = makeMockTableBuilder();
      const constraint: DBConstraint = {
        type: "UNIQUE",
        columns: ["email"],
      };

      rawConstraintToKnexConstraint(
        tb as unknown as Knex.TableBuilder,
        constraint,
      );

      expect(tb.unique).toHaveBeenCalledWith(["email"], {
        indexName: undefined,
      });
    });

    it("supports composite unique constraints", () => {
      const tb = makeMockTableBuilder();
      const constraint: DBConstraint = {
        type: "UNIQUE",
        columns: ["first_name", "last_name"],
        name: "uq_full_name",
      };

      rawConstraintToKnexConstraint(
        tb as unknown as Knex.TableBuilder,
        constraint,
      );

      expect(tb.unique).toHaveBeenCalledWith(["first_name", "last_name"], {
        indexName: "uq_full_name",
      });
    });
  });

  describe("INDEX constraint", () => {
    it("calls tableBuilder.index with columns and index name", () => {
      const tb = makeMockTableBuilder();
      const constraint: DBConstraint = {
        type: "INDEX",
        columns: ["created_at"],
        name: "idx_orders_created_at",
      };

      rawConstraintToKnexConstraint(
        tb as unknown as Knex.TableBuilder,
        constraint,
      );

      expect(tb.index).toHaveBeenCalledWith(
        ["created_at"],
        "idx_orders_created_at",
      );
    });

    it("supports composite index columns", () => {
      const tb = makeMockTableBuilder();
      const constraint: DBConstraint = {
        type: "INDEX",
        columns: ["status", "created_at"],
        name: "idx_status_created",
      };

      rawConstraintToKnexConstraint(
        tb as unknown as Knex.TableBuilder,
        constraint,
      );

      expect(tb.index).toHaveBeenCalledWith(
        ["status", "created_at"],
        "idx_status_created",
      );
    });

    it("passes undefined name when name is omitted", () => {
      const tb = makeMockTableBuilder();
      const constraint: DBConstraint = {
        type: "INDEX",
        columns: ["created_at"],
      };

      rawConstraintToKnexConstraint(
        tb as unknown as Knex.TableBuilder,
        constraint,
      );

      expect(tb.index).toHaveBeenCalledWith(["created_at"], undefined);
    });
  });

  describe("unsupported constraint type", () => {
    it("throws for an unknown constraint type", () => {
      const tb = makeMockTableBuilder();
      expect(() =>
        rawConstraintToKnexConstraint(tb as unknown as Knex.TableBuilder, {
          type: "CHECK" as unknown as "UNIQUE",
          columns: ["amount"],
        }),
      ).toThrow("Unsupported constraint type");
    });
  });
});
