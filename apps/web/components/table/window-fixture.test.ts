import type { TableColumn } from "./table-column";
import { windowFixture } from "./window-fixture";

type Row = { id: string; name: string; age: number };

const rows: Row[] = [
  { id: "1", name: "Charlie", age: 30 },
  { id: "2", name: "Alice", age: 25 },
  { id: "3", name: "Bob", age: 35 },
  { id: "4", name: "Dana", age: 20 },
  { id: "5", name: "Eve", age: 40 },
];

const columns: TableColumn<Row>[] = [
  {
    id: "name",
    header: "Name",
    type: "text",
    sortable: true,
    searchable: true,
    accessor: (row) => row.name,
  },
  {
    id: "age",
    header: "Age",
    type: "number",
    sortable: true,
    accessor: (row) => row.age,
  },
];

describe("windowFixture", () => {
  it("pages results and reports the total across all pages", () => {
    const page1 = windowFixture(rows, columns, 1, 2, null, {});
    expect(page1.rows.map((r) => r.id)).toEqual(["1", "2"]);
    expect(page1.total).toBe(5);

    const page2 = windowFixture(rows, columns, 2, 2, null, {});
    expect(page2.rows.map((r) => r.id)).toEqual(["3", "4"]);

    const page3 = windowFixture(rows, columns, 3, 2, null, {});
    expect(page3.rows.map((r) => r.id)).toEqual(["5"]);
  });

  it("returns an empty page past the end of the data", () => {
    const result = windowFixture(rows, columns, 10, 2, null, {});
    expect(result.rows).toEqual([]);
    expect(result.total).toBe(5);
  });

  it("sorts ascending by a numeric column", () => {
    const result = windowFixture(
      rows,
      columns,
      1,
      10,
      { columnId: "age", direction: "asc" },
      {},
    );
    expect(result.rows.map((r) => r.id)).toEqual(["4", "2", "1", "3", "5"]);
  });

  it("sorts descending by a text column", () => {
    const result = windowFixture(
      rows,
      columns,
      1,
      10,
      { columnId: "name", direction: "desc" },
      {},
    );
    expect(result.rows.map((r) => r.name)).toEqual([
      "Eve",
      "Dana",
      "Charlie",
      "Bob",
      "Alice",
    ]);
  });

  it("leaves order unchanged when sorting by an unknown column id", () => {
    const result = windowFixture(
      rows,
      columns,
      1,
      10,
      { columnId: "nonexistent", direction: "asc" },
      {},
    );
    expect(result.rows.map((r) => r.id)).toEqual(["1", "2", "3", "4", "5"]);
  });

  it("filters to rows matching the search term in a searchable column", () => {
    const result = windowFixture(rows, columns, 1, 10, null, { search: "a" });
    expect(result.rows.map((r) => r.name).sort()).toEqual(
      ["Charlie", "Alice", "Dana"].sort(),
    );
    expect(result.total).toBe(3);
  });

  it("matches search case-insensitively", () => {
    const result = windowFixture(rows, columns, 1, 10, null, { search: "EVE" });
    expect(result.rows.map((r) => r.id)).toEqual(["5"]);
  });

  it("does not match a non-searchable column", () => {
    const result = windowFixture(rows, columns, 1, 10, null, { search: "30" });
    expect(result.rows).toEqual([]);
  });

  it("combines search, sort, and paging together", () => {
    const result = windowFixture(
      rows,
      columns,
      1,
      2,
      { columnId: "age", direction: "asc" },
      { search: "a" },
    );
    // matches: Charlie(30), Alice(25), Dana(20) -> sorted asc by age: Dana, Alice, Charlie
    expect(result.rows.map((r) => r.name)).toEqual(["Dana", "Alice"]);
    expect(result.total).toBe(3);
  });
});
