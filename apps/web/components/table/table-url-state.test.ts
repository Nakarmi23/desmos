import type { TableColumn } from "./table-column";
import {
  decodeTableView,
  encodeTableView,
  withTableView,
} from "./table-url-state";
import type { TableView } from "./table-view";

type Row = { name: string; age: number; role: string; joined: string };

const columns: TableColumn<Row>[] = [
  {
    id: "name",
    header: "Name",
    type: "text",
    accessor: (r) => r.name,
    sortable: true,
    searchable: true,
    filter: { kind: "text" },
  },
  {
    id: "age",
    header: "Age",
    type: "number",
    accessor: (r) => r.age,
    sortable: true,
    filter: { kind: "number" },
  },
  {
    id: "role",
    header: "Role",
    type: "text",
    accessor: (r) => r.role,
    filter: {
      kind: "select",
      options: [{ value: "admin" }, { value: "member" }],
    },
  },
  {
    id: "joined",
    header: "Joined",
    type: "date",
    accessor: (r) => r.joined,
    filter: { kind: "date" },
  },
];

const config = { columns, defaultPageSize: 25, pageSizeOptions: [25, 50] };

const DEFAULT_VIEW: TableView = {
  page: 1,
  pageSize: 25,
  sort: null,
  filters: {},
};

const encode = (view: TableView) => encodeTableView(view, config).toString();
const decode = (query: string) =>
  decodeTableView(new URLSearchParams(query), config);

describe("table URL state", () => {
  it("round-trips the page", () => {
    const view: TableView = { ...DEFAULT_VIEW, page: 3 };
    expect(encode(view)).toBe("page=3");
    expect(decode("page=3")).toEqual(view);
  });

  it("leaves the default view out of the URL entirely", () => {
    expect(encode(DEFAULT_VIEW)).toBe("");
    expect(decode("")).toEqual(DEFAULT_VIEW);
  });

  it("round-trips a non-default page size", () => {
    const view: TableView = { ...DEFAULT_VIEW, page: 2, pageSize: 50 };
    expect(encode(view)).toBe("page=2&size=50");
    expect(decode("page=2&size=50")).toEqual(view);
  });

  it.each(["0", "-2", "1.5", "abc", ""])(
    "falls back to page 1 for page=%p",
    (page) => {
      expect(decode(`page=${page}`).page).toBe(1);
    },
  );

  it.each(["10", "abc", "0"])(
    "falls back to the default size for a size not on offer (size=%p)",
    (size) => {
      expect(decode(`size=${size}`).pageSize).toBe(25);
    },
  );

  it("round-trips an ascending sort as the column id", () => {
    const view: TableView = {
      ...DEFAULT_VIEW,
      sort: { columnId: "age", direction: "asc" },
    };
    expect(encode(view)).toBe("sort=age");
    expect(decode("sort=age")).toEqual(view);
  });

  it("round-trips a descending sort as the column id with a leading -", () => {
    const view: TableView = {
      ...DEFAULT_VIEW,
      sort: { columnId: "name", direction: "desc" },
    };
    expect(encode(view)).toBe("sort=-name");
    expect(decode("sort=-name")).toEqual(view);
  });

  it.each(["role", "-role", "nope", "-", ""])(
    "ignores a sort on a column that can't be sorted (sort=%p)",
    (sort) => {
      expect(decode(`sort=${sort}`).sort).toBeNull();
    },
  );

  it("round-trips the Basic Search query", () => {
    const view: TableView = {
      ...DEFAULT_VIEW,
      filters: { search: "ava & co" },
    };
    expect(encode(view)).toBe("q=ava+%26+co");
    expect(decode("q=ava+%26+co")).toEqual(view);
  });

  it("trims the Basic Search query and drops a blank one", () => {
    expect(decode("q=%20ava%20").filters).toEqual({ search: "ava" });
    expect(decode("q=%20%20").filters).toEqual({});
  });

  it("round-trips a single-value filter as f.<column>.<operator>", () => {
    const view: TableView = {
      ...DEFAULT_VIEW,
      filters: { columns: { name: { operator: "startsWith", value: "Av" } } },
    };
    expect(encode(view)).toBe("f.name.startsWith=Av");
    expect(decode("f.name.startsWith=Av")).toEqual(view);
  });

  it("reads number filter values back as numbers", () => {
    const view: TableView = {
      ...DEFAULT_VIEW,
      filters: { columns: { age: { operator: "gte", value: 30 } } },
    };
    expect(encode(view)).toBe("f.age.gte=30");
    expect(decode("f.age.gte=30")).toEqual(view);
  });

  it("round-trips a between filter as from..to, either bound optional", () => {
    const both: TableView = {
      ...DEFAULT_VIEW,
      filters: { columns: { age: { operator: "between", from: 1.5, to: 40 } } },
    };
    expect(encode(both)).toBe("f.age.between=1.5..40");
    expect(decode("f.age.between=1.5..40")).toEqual(both);

    const fromOnly: TableView = {
      ...DEFAULT_VIEW,
      filters: {
        columns: { joined: { operator: "between", from: "2024-01-01" } },
      },
    };
    expect(encode(fromOnly)).toBe("f.joined.between=2024-01-01..");
    expect(decode("f.joined.between=2024-01-01..")).toEqual(fromOnly);

    const toOnly: TableView = {
      ...DEFAULT_VIEW,
      filters: {
        columns: { joined: { operator: "between", to: "2024-12-31" } },
      },
    };
    expect(encode(toOnly)).toBe("f.joined.between=..2024-12-31");
    expect(decode("f.joined.between=..2024-12-31")).toEqual(toOnly);
  });

  it("round-trips a select filter as one repeated param per value", () => {
    const view: TableView = {
      ...DEFAULT_VIEW,
      filters: {
        columns: { role: { operator: "notIn", values: ["admin", "member"] } },
      },
    };
    expect(encode(view)).toBe("f.role.notIn=admin&f.role.notIn=member");
    expect(decode("f.role.notIn=admin&f.role.notIn=member")).toEqual(view);
  });

  it("round-trips a whole view: page, size, sort, search and several filters", () => {
    const view: TableView = {
      page: 4,
      pageSize: 50,
      sort: { columnId: "name", direction: "desc" },
      filters: {
        search: "ava",
        columns: {
          age: { operator: "lt", value: 60 },
          joined: { operator: "between", from: "2024-01-01", to: "2024-06-30" },
          role: { operator: "in", values: ["admin"] },
        },
      },
    };
    expect(decode(encode(view))).toEqual(view);
  });

  it.each([
    ["an unknown column", "f.nope.eq=1"],
    ["an operator the column's type doesn't offer", "f.name.gt=A"],
    ["an unknown operator", "f.age.like=3"],
    ["a non-numeric number", "f.age.eq=abc"],
    ["a malformed date", "f.joined.eq=yesterday"],
    ["a between without ..", "f.age.between=10"],
    ["an empty between", "f.age.between=.."],
    ["a value that isn't one of the select's options", "f.role.in=owner"],
    ["a blank value", "f.name.contains=%20"],
  ])("drops a filter with %s", (_, query) => {
    expect(decode(query).filters).toEqual({});
  });

  it("keeps one filter per column, the first operator given", () => {
    expect(decode("f.age.gt=1&f.age.lt=9&f.age.gt=5").filters).toEqual({
      columns: { age: { operator: "gt", value: 1 } },
    });
  });

  it("ignores query params it doesn't own", () => {
    expect(decode("tab=billing&utm_source=mail")).toEqual(DEFAULT_VIEW);
  });

  it("swaps the view into an existing query, keeping params it doesn't own", () => {
    const current = new URLSearchParams(
      "tab=billing&page=9&sort=age&q=old&f.name.eq=x&f.age.gt=1",
    );
    const view: TableView = { ...DEFAULT_VIEW, page: 2 };
    expect(withTableView(current, view, config).toString()).toBe(
      "tab=billing&page=2",
    );
    // The input is left as it was.
    expect(current.get("q")).toBe("old");
  });
});
