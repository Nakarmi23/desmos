import type { Knex } from "knex";

/**
 * Builds a mock Knex foreign key chain builder.
 * All methods return the same object so chained calls resolve correctly.
 */
export function makeMockForeignBuilder() {
  const fb = {
    references: jest.fn(),
    inTable: jest.fn(),
    withKeyName: jest.fn(),
    onDelete: jest.fn(),
    onUpdate: jest.fn(),
  };
  fb.references.mockReturnValue(fb);
  fb.inTable.mockReturnValue(fb);
  fb.withKeyName.mockReturnValue(fb);
  fb.onDelete.mockReturnValue(fb);
  fb.onUpdate.mockReturnValue(fb);
  return fb;
}

/**
 * Builds a mock Knex.TableBuilder.
 * Exposes `_foreignBuilder` for asserting on the foreign key chain.
 */
export function makeMockTableBuilder() {
  const foreignBuilder = makeMockForeignBuilder();
  const tb = {
    specificType: jest.fn().mockReturnThis(),
    foreign: jest.fn().mockReturnValue(foreignBuilder),
    primary: jest.fn().mockReturnThis(),
    unique: jest.fn().mockReturnThis(),
    index: jest.fn().mockReturnThis(),
    _foreignBuilder: foreignBuilder,
  };
  return tb;
}

/**
 * Builds a mock Knex.SchemaBuilder.
 * `createTable` immediately invokes the callback with a fresh mock TableBuilder
 * and returns the schema builder, mirroring the real knex API.
 * Exposes `_tableBuilder` for asserting on per-table operations.
 */
export function makeMockSchemaBuilder() {
  const tableBuilder = makeMockTableBuilder();
  const sb = {
    createTable: jest
      .fn()
      .mockImplementation(
        (_tableName: string, cb: (t: Knex.TableBuilder) => void) => {
          cb(tableBuilder as unknown as Knex.TableBuilder);
          return sb;
        },
      ),
    _tableBuilder: tableBuilder,
  };
  return sb;
}
