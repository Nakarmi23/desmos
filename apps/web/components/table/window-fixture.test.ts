import type { TableColumn } from "./table-column";
import type { TableColumnFilterValue, TableFilters } from "./table-fetcher";
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

describe("windowFixture column filters (Advanced Search)", () => {
  type Person = {
    id: string;
    name: string;
    age: number;
    role: string;
    joined: Date;
  };

  const people: Person[] = [
    {
      id: "1",
      name: "Alice",
      age: 30,
      role: "admin",
      joined: new Date("2024-01-10T09:00:00Z"),
    },
    {
      id: "2",
      name: "Malcolm",
      age: 25,
      role: "member",
      joined: new Date("2024-02-20T23:30:00Z"),
    },
    {
      id: "3",
      name: "Bob",
      age: 35,
      role: "viewer",
      joined: new Date("2024-02-21T00:15:00Z"),
    },
    {
      id: "4",
      name: "Alan",
      age: 25,
      role: "admin",
      joined: new Date("2024-03-05T12:00:00Z"),
    },
  ];

  const personColumns: TableColumn<Person>[] = [
    {
      id: "name",
      header: "Name",
      type: "text",
      searchable: true,
      filter: { kind: "text" },
      accessor: (p) => p.name,
    },
    {
      id: "age",
      header: "Age",
      type: "number",
      filter: { kind: "number" },
      accessor: (p) => p.age,
    },
    {
      id: "role",
      header: "Role",
      type: "text",
      filter: {
        kind: "select",
        options: [{ value: "admin" }, { value: "member" }, { value: "viewer" }],
      },
      accessor: (p) => p.role,
    },
    {
      id: "joined",
      header: "Joined",
      type: "date",
      filter: { kind: "date" },
      accessor: (p) => p.joined,
    },
  ];

  const ids = (filters: TableFilters) =>
    windowFixture(people, personColumns, 1, 10, null, filters).rows.map(
      (p) => p.id,
    );

  describe("text", () => {
    it("contains: substring, ignoring case", () => {
      expect(
        ids({ columns: { name: { operator: "contains", value: "AL" } } }),
      ).toEqual(["1", "2", "4"]);
    });

    it("eq: whole value, ignoring case", () => {
      expect(
        ids({ columns: { name: { operator: "eq", value: "alice" } } }),
      ).toEqual(["1"]);
      expect(
        ids({ columns: { name: { operator: "eq", value: "al" } } }),
      ).toEqual([]);
    });

    it("startsWith / endsWith", () => {
      expect(
        ids({ columns: { name: { operator: "startsWith", value: "al" } } }),
      ).toEqual(["1", "4"]);
      expect(
        ids({ columns: { name: { operator: "endsWith", value: "an" } } }),
      ).toEqual(["4"]);
    });
  });

  describe("number", () => {
    const age = (value: TableColumnFilterValue) =>
      ids({ columns: { age: value } });

    it("compares with eq / neq / lt / lte / gt / gte", () => {
      expect(age({ operator: "eq", value: 25 })).toEqual(["2", "4"]);
      expect(age({ operator: "neq", value: 25 })).toEqual(["1", "3"]);
      expect(age({ operator: "lt", value: 30 })).toEqual(["2", "4"]);
      expect(age({ operator: "lte", value: 30 })).toEqual(["1", "2", "4"]);
      expect(age({ operator: "gt", value: 30 })).toEqual(["3"]);
      expect(age({ operator: "gte", value: 30 })).toEqual(["1", "3"]);
    });

    it("between is inclusive, and either bound may be left open", () => {
      expect(age({ operator: "between", from: 25, to: 30 })).toEqual([
        "1",
        "2",
        "4",
      ]);
      expect(age({ operator: "between", from: 31 })).toEqual(["3"]);
      expect(age({ operator: "between", to: 25 })).toEqual(["2", "4"]);
    });
  });

  describe("date", () => {
    const joined = (value: TableColumnFilterValue) =>
      ids({ columns: { joined: value } });

    it("compares whole UTC days with eq / lt / lte / gt / gte", () => {
      expect(joined({ operator: "eq", value: "2024-02-20" })).toEqual(["2"]);
      expect(joined({ operator: "lt", value: "2024-02-21" })).toEqual([
        "1",
        "2",
      ]);
      expect(joined({ operator: "lte", value: "2024-02-20" })).toEqual([
        "1",
        "2",
      ]);
      expect(joined({ operator: "gt", value: "2024-02-20" })).toEqual([
        "3",
        "4",
      ]);
      expect(joined({ operator: "gte", value: "2024-02-21" })).toEqual([
        "3",
        "4",
      ]);
    });

    it("between is inclusive of both boundary days, either bound optional", () => {
      expect(
        joined({ operator: "between", from: "2024-02-20", to: "2024-02-21" }),
      ).toEqual(["2", "3"]);
      expect(joined({ operator: "between", from: "2024-02-21" })).toEqual([
        "3",
        "4",
      ]);
      expect(joined({ operator: "between", to: "2024-02-20" })).toEqual([
        "1",
        "2",
      ]);
    });
  });

  describe("select", () => {
    it("in keeps rows equal to any chosen value; notIn excludes them", () => {
      expect(
        ids({
          columns: { role: { operator: "in", values: ["admin", "viewer"] } },
        }),
      ).toEqual(["1", "3", "4"]);
      expect(
        ids({ columns: { role: { operator: "notIn", values: ["admin"] } } }),
      ).toEqual(["2", "3"]);
    });
  });

  describe("missing and malformed cells", () => {
    type Loose = { id: string; score: unknown; when: unknown };
    const loose: Loose[] = [
      { id: "1", score: 0, when: new Date("2024-01-01T10:00:00Z") },
      { id: "2", score: null, when: null },
      { id: "3", score: "", when: new Date("not a date") },
      { id: "4", score: 5, when: "2024-01-01T23:00:00Z" },
      { id: "5", score: "abc", when: undefined },
    ];
    const looseColumns: TableColumn<Loose>[] = [
      {
        id: "score",
        header: "Score",
        type: "number",
        filter: { kind: "number" },
        accessor: (r) => r.score,
      },
      {
        id: "when",
        header: "When",
        type: "date",
        filter: { kind: "date" },
        accessor: (r) => r.when,
      },
    ];
    const looseIds = (filters: TableFilters) =>
      windowFixture(loose, looseColumns, 1, 10, null, filters).rows.map(
        (r) => r.id,
      );

    it("never matches a blank, null or non-numeric number cell against a number filter", () => {
      expect(
        looseIds({ columns: { score: { operator: "eq", value: 0 } } }),
      ).toEqual(["1"]);
      expect(
        looseIds({ columns: { score: { operator: "lte", value: 5 } } }),
      ).toEqual(["1", "4"]);
      // Like SQL NULL: a missing cell isn't "not equal" to anything either.
      expect(
        looseIds({ columns: { score: { operator: "neq", value: 5 } } }),
      ).toEqual(["1"]);
    });

    it("skips unparseable date cells instead of throwing, and reads the day off ISO strings", () => {
      expect(
        looseIds({
          columns: { when: { operator: "eq", value: "2024-01-01" } },
        }),
      ).toEqual(["1", "4"]);
      expect(
        looseIds({
          columns: { when: { operator: "lte", value: "2024-01-01" } },
        }),
      ).toEqual(["1", "4"]);
    });

    it("ignores a filter value it cannot parse rather than matching oddly", () => {
      expect(
        looseIds({ columns: { score: { operator: "gte", value: "abc" } } }),
      ).toEqual(["1", "2", "3", "4", "5"]);
    });
  });

  it("AND-s column filters together and with Basic Search", () => {
    expect(
      ids({
        columns: {
          name: { operator: "contains", value: "al" },
          role: { operator: "in", values: ["admin"] },
          age: { operator: "gte", value: 30 },
        },
      }),
    ).toEqual(["1"]);
    expect(
      ids({
        search: "alice",
        columns: { role: { operator: "in", values: ["admin", "member"] } },
      }),
    ).toEqual(["1"]);
    expect(
      ids({
        search: "bob",
        columns: { role: { operator: "in", values: ["admin"] } },
      }),
    ).toEqual([]);
  });

  it("treats empty filter values as no constraint", () => {
    expect(
      ids({
        columns: {
          name: { operator: "contains", value: "" },
          age: { operator: "eq", value: "" },
          role: { operator: "in", values: [] },
          joined: { operator: "between" },
        },
      }),
    ).toEqual(["1", "2", "3", "4"]);
  });

  it("reports the filtered total, not the page size", () => {
    const result = windowFixture(people, personColumns, 1, 1, null, {
      columns: { role: { operator: "in", values: ["admin"] } },
    });
    expect(result.rows).toHaveLength(1);
    expect(result.total).toBe(2);
  });
});
