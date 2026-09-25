import { resolveColumn, resolveColumnAlign } from "./table-column";

describe("resolveColumnAlign", () => {
  it("right-aligns number columns by default", () => {
    expect(resolveColumnAlign({ type: "number" })).toBe("right");
  });

  it("left-aligns text columns by default", () => {
    expect(resolveColumnAlign({ type: "text" })).toBe("left");
  });

  it("left-aligns date columns by default", () => {
    expect(resolveColumnAlign({ type: "date" })).toBe("left");
  });

  it("honors an explicit align override regardless of type", () => {
    expect(resolveColumnAlign({ type: "number", align: "left" })).toBe("left");
    expect(resolveColumnAlign({ type: "text", align: "right" })).toBe("right");
  });
});

describe("resolveColumn", () => {
  type Row = { name: string; age: number; joined: string; role: string };
  const roleOptions = [{ value: "admin" }, { value: "member" }];

  it("makes a text column sortable, searchable and filterable by text", () => {
    const column = resolveColumn<Row>({
      id: "name",
      header: "Name",
      type: "text",
      accessor: (r) => r.name,
    });
    expect(column).toMatchObject({
      align: "left",
      sortable: true,
      searchable: true,
      filter: { kind: "text" },
    });
  });

  it("gives number and date columns their own filter, but no Basic Search", () => {
    const number = resolveColumn<Row>({
      id: "age",
      header: "Age",
      type: "number",
      accessor: (r) => r.age,
    });
    expect(number).toMatchObject({
      align: "right",
      sortable: true,
      searchable: false,
      filter: { kind: "number" },
    });

    const date = resolveColumn<Row>({
      id: "joined",
      header: "Joined",
      type: "date",
      accessor: (r) => r.joined,
    });
    expect(date).toMatchObject({ searchable: false, filter: { kind: "date" } });
  });

  it("gives an enum column a select filter over its options", () => {
    const column = resolveColumn<Row>({
      id: "role",
      header: "Role",
      type: "enum",
      options: roleOptions,
      accessor: (r) => r.role,
    });
    expect(column).toMatchObject({
      align: "left",
      sortable: true,
      searchable: false,
      filter: { kind: "select", options: roleOptions },
    });
  });

  it("lets every default be overridden", () => {
    const column = resolveColumn<Row>({
      id: "name",
      header: "Name",
      type: "text",
      accessor: (r) => r.name,
      sortable: false,
      searchable: false,
      filter: false,
    });
    expect(column).toMatchObject({ sortable: false, searchable: false });
    expect(column.filter).toBeUndefined();

    const select = resolveColumn<Row>({
      id: "name",
      header: "Name",
      type: "text",
      accessor: (r) => r.name,
      filter: { kind: "select", options: roleOptions },
    });
    expect(select.filter).toEqual({ kind: "select", options: roleOptions });
  });

  it("makes a render-only column display-only", () => {
    const column = resolveColumn<Row>({
      id: "badge",
      header: "Badge",
      type: "text",
      render: (r) => r.name,
    });
    expect(column).toMatchObject({ sortable: false, searchable: false });
    expect(column.filter).toBeUndefined();
  });
});
