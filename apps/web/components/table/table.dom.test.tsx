import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { TableColumn, TableColumnFilter } from "./table-column";
import type { TableFetcher } from "./table-fetcher";
import { Table } from "./table";

type Row = { id: string; name: string; age: number };

// Plain columns: no sorting, Basic Search or Advanced Search.
const PLAIN = { sortable: false, searchable: false, filter: false } as const;

const columns: TableColumn<Row>[] = [
  {
    id: "name",
    header: "Name",
    type: "text",
    accessor: (r) => r.name,
    ...PLAIN,
  },
  {
    id: "age",
    header: "Age",
    type: "number",
    accessor: (r) => r.age,
    ...PLAIN,
  },
];

const rows: Row[] = [
  { id: "1", name: "Ada", age: 36 },
  { id: "2", name: "Grace", age: 45 },
];

// Tests page through a handful of rows, so they use small pages, not the defaults.
const SMALL_PAGES = { defaultPageSize: 10, pageSizeOptions: [10, 25, 50] };

function renderTable(fetcher: TableFetcher<Row>) {
  return render(
    <Table
      columns={columns}
      fetcher={fetcher}
      getRowId={(r) => r.id}
      {...SMALL_PAGES}
    />,
  );
}

const manyRows: Row[] = Array.from({ length: 25 }, (_, i) => ({
  id: String(i + 1),
  name: `Person ${i + 1}`,
  age: 20 + i,
}));

// Fake fetcher over `manyRows`, recording the args it's called with.
function pagedFetcher() {
  return jest.fn<ReturnType<TableFetcher<Row>>, Parameters<TableFetcher<Row>>>(
    async (page, pageSize) => ({
      rows: manyRows.slice((page - 1) * pageSize, page * pageSize),
      total: manyRows.length,
    }),
  );
}

function expectLastSort(
  fetcher: jest.Mock,
  columnId: string,
  direction: "asc" | "desc",
) {
  return waitFor(() =>
    expect(fetcher).toHaveBeenLastCalledWith(
      1,
      10,
      { columnId, direction },
      {},
    ),
  );
}

describe("Table", () => {
  it("renders the rows returned by the fetcher under their column headers", async () => {
    const fetcher: TableFetcher<Row> = async () => ({ rows, total: 2 });
    renderTable(fetcher);

    expect(await screen.findByText("Ada")).toBeInTheDocument();
    expect(screen.getByText("Grace")).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: "Name" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: "Age" }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("row")).toHaveLength(3); // header + 2 rows
  });

  it("exposes grid semantics with row and column counts", async () => {
    renderTable(async () => ({ rows, total: 2 }));

    await screen.findByText("Ada");
    const grid = screen.getByRole("grid");
    expect(grid).toHaveAttribute("aria-colcount", "2");
    expect(grid).toHaveAttribute("aria-rowcount", "3"); // header + 2 rows
    expect(screen.getAllByRole("gridcell")).toHaveLength(4);
  });

  it("is a single tab stop and moves cell focus with the keyboard", async () => {
    const user = userEvent.setup();
    renderTable(async () => ({ rows, total: 2 }));
    await screen.findByText("Ada");

    const tabbable = screen
      .getAllByRole("gridcell")
      .concat(screen.getAllByRole("columnheader"))
      .filter((cell) => cell.tabIndex === 0);
    expect(tabbable).toHaveLength(1);

    await user.tab();
    expect(screen.getByRole("columnheader", { name: "Name" })).toHaveFocus();

    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("gridcell", { name: "Ada" })).toHaveFocus();

    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("gridcell", { name: "36" })).toHaveFocus();

    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("gridcell", { name: "45" })).toHaveFocus();

    // Edges don't wrap.
    await user.keyboard("{ArrowDown}{ArrowRight}");
    expect(screen.getByRole("gridcell", { name: "45" })).toHaveFocus();

    await user.keyboard("{Home}");
    expect(screen.getByRole("gridcell", { name: "Grace" })).toHaveFocus();

    await user.keyboard("{End}");
    expect(screen.getByRole("gridcell", { name: "45" })).toHaveFocus();

    await user.keyboard("{Control>}{Home}{/Control}");
    expect(screen.getByRole("columnheader", { name: "Name" })).toHaveFocus();

    await user.keyboard("{Control>}{End}{/Control}");
    expect(screen.getByRole("gridcell", { name: "45" })).toHaveFocus();

    await user.keyboard("{ArrowUp}{ArrowUp}");
    expect(screen.getByRole("columnheader", { name: "Age" })).toHaveFocus();
  });

  it("makes a clicked cell the grid's tab stop", async () => {
    const user = userEvent.setup();
    renderTable(async () => ({ rows, total: 2 }));

    await user.click(await screen.findByText("Grace"));

    expect(screen.getByRole("gridcell", { name: "Grace" })).toHaveAttribute(
      "tabindex",
      "0",
    );
    expect(screen.getByRole("columnheader", { name: "Name" })).toHaveAttribute(
      "tabindex",
      "-1",
    );
  });

  it("aligns cells by column type: number right, text left, explicit align wins", async () => {
    const aligned: TableColumn<Row>[] = [
      ...columns,
      {
        id: "nameRight",
        header: "Name (right)",
        type: "text",
        align: "right",
        accessor: (r) => r.name,
      },
    ];
    render(
      <Table
        columns={aligned}
        fetcher={async () => ({ rows: [rows[0]], total: 1 })}
        getRowId={(r) => r.id}
      />,
    );

    const [name, age, nameRight] = await screen.findAllByRole("gridcell");
    expect(name).toHaveAttribute("data-align", "left");
    expect(age).toHaveAttribute("data-align", "right");
    expect(nameRight).toHaveAttribute("data-align", "right");
    expect(screen.getByRole("columnheader", { name: "Age" })).toHaveAttribute(
      "data-align",
      "right",
    );
  });

  it("shows an empty state when the fetcher returns no rows", async () => {
    const fetcher: TableFetcher<Row> = async () => ({ rows: [], total: 0 });
    renderTable(fetcher);

    expect(await screen.findByText("No results found")).toBeInTheDocument();
    expect(screen.getByRole("grid")).toHaveAttribute("aria-busy", "false");
    expect(screen.queryByRole("gridcell")).not.toBeInTheDocument();
    // Nothing to clear when no search or filter is applied.
    expect(
      screen.queryByRole("button", { name: /^Clear/ }),
    ).not.toBeInTheDocument();
  });

  it("shows an error state when the fetcher rejects, and Retry refetches", async () => {
    const user = userEvent.setup();
    const fetcher = jest
      .fn<ReturnType<TableFetcher<Row>>, Parameters<TableFetcher<Row>>>()
      .mockRejectedValueOnce(new Error("boom"))
      .mockResolvedValueOnce({ rows, total: 2 });
    renderTable(fetcher);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Something went wrong",
    );
    expect(screen.queryByRole("gridcell")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Retry" }));

    expect(await screen.findByText("Ada")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it("shows a busy skeleton shaped from the columns while the fetcher is pending", () => {
    const fetcher: TableFetcher<Row> = () => new Promise(() => {});
    render(
      <Table
        columns={columns}
        fetcher={fetcher}
        getRowId={(r) => r.id}
        defaultPageSize={4}
      />,
    );

    expect(screen.getByRole("grid")).toHaveAttribute("aria-busy", "true");
    // Headers stay so the layout doesn't jump once data arrives.
    expect(
      screen.getByRole("columnheader", { name: "Name" }),
    ).toBeInTheDocument();
    const tableRows = screen.getAllByRole("row");
    expect(tableRows).toHaveLength(1 + 4); // header + pageSize skeleton rows
    expect(within(tableRows[1]).getAllByRole("gridcell")).toHaveLength(
      columns.length,
    );
  });
});

describe("Table pagination", () => {
  it("fetches the requested page when a page control is used", async () => {
    const user = userEvent.setup();
    const fetcher = pagedFetcher();
    renderTable(fetcher);

    expect(await screen.findByText("Person 1")).toBeInTheDocument();
    expect(fetcher).toHaveBeenLastCalledWith(1, 10, null, {});
    expect(screen.getByRole("button", { name: "Page 1" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getAllByRole("button", { name: /^Page \d+$/ })).toHaveLength(
      3, // 25 rows / 10 per page
    );

    await user.click(screen.getByRole("button", { name: "Next page" }));

    expect(await screen.findByText("Person 11")).toBeInTheDocument();
    expect(screen.queryByText("Person 1")).not.toBeInTheDocument();
    expect(fetcher).toHaveBeenLastCalledWith(2, 10, null, {});

    await user.click(screen.getByRole("button", { name: "Page 3" }));

    expect(await screen.findByText("Person 25")).toBeInTheDocument();
    expect(fetcher).toHaveBeenLastCalledWith(3, 10, null, {});
    expect(screen.getByRole("button", { name: "Page 3" })).toHaveAttribute(
      "aria-current",
      "page",
    );

    await user.click(screen.getByRole("button", { name: "Previous page" }));

    expect(await screen.findByText("Person 11")).toBeInTheDocument();
    expect(fetcher).toHaveBeenLastCalledWith(2, 10, null, {});
  });

  it("fetches with the new page size, back on page 1, when the selector changes", async () => {
    const user = userEvent.setup();
    const fetcher = pagedFetcher();
    renderTable(fetcher);
    await screen.findByText("Person 1");

    await user.click(screen.getByRole("button", { name: "Page 2" }));
    await screen.findByText("Person 11");

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Rows per page" }),
      "25",
    );

    expect(await screen.findByText("Person 25")).toBeInTheDocument();
    expect(fetcher).toHaveBeenLastCalledWith(1, 25, null, {});
    expect(screen.getByText("Person 1")).toBeInTheDocument();
    // 25 rows at 25 per page is a single page.
    expect(screen.getAllByRole("button", { name: /^Page \d+$/ })).toHaveLength(
      1,
    );
  });

  it("takes the default page size and the size options from table config", async () => {
    const fetcher = pagedFetcher();
    render(
      <Table
        columns={columns}
        fetcher={fetcher}
        getRowId={(r) => r.id}
        defaultPageSize={5}
        pageSizeOptions={[5, 15]}
      />,
    );
    await screen.findByText("Person 1");

    expect(fetcher).toHaveBeenCalledWith(1, 5, null, {});
    const select = screen.getByRole("combobox", { name: "Rows per page" });
    expect(select).toHaveValue("5");
    expect(
      within(select)
        .getAllByRole("option")
        .map((option) => option.textContent),
    ).toEqual(["5", "15"]);
    expect(screen.getAllByRole("button", { name: /^Page \d+$/ })).toHaveLength(
      5, // 25 rows / 5 per page
    );
  });

  it("disables Previous on the first page and Next on the last", async () => {
    const user = userEvent.setup();
    renderTable(pagedFetcher());
    await screen.findByText("Person 1");

    expect(
      screen.getByRole("button", { name: "Previous page" }),
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next page" })).toBeEnabled();

    await user.click(screen.getByRole("button", { name: "Page 3" }));
    await screen.findByText("Person 21");

    expect(screen.getByRole("button", { name: "Next page" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Previous page" })).toBeEnabled();
  });

  it("reports the whole result set and each row's absolute position to assistive tech", async () => {
    const user = userEvent.setup();
    renderTable(pagedFetcher());
    await screen.findByText("Person 1");

    expect(screen.getByRole("grid")).toHaveAttribute("aria-rowcount", "26"); // header + 25

    await user.click(screen.getByRole("button", { name: "Page 2" }));
    await screen.findByText("Person 11");

    const rowOf = (name: string) =>
      screen.getByRole("gridcell", { name }).closest("tr");
    expect(rowOf("Person 11")).toHaveAttribute("aria-rowindex", "12");
    expect(rowOf("Person 20")).toHaveAttribute("aria-rowindex", "21");
  });

  it("drops grid focus back to the header row after a page change", async () => {
    const user = userEvent.setup();
    renderTable(pagedFetcher());
    await user.click(await screen.findByText("Person 3"));
    expect(screen.getByRole("gridcell", { name: "Person 3" })).toHaveAttribute(
      "tabindex",
      "0",
    );

    await user.click(screen.getByRole("button", { name: "Next page" }));
    await screen.findByText("Person 11");

    expect(screen.getByRole("columnheader", { name: "Name" })).toHaveAttribute(
      "tabindex",
      "0",
    );
    expect(screen.getByRole("gridcell", { name: "Person 13" })).toHaveAttribute(
      "tabindex",
      "-1",
    );
  });
});

describe("Table sorting", () => {
  const sortableColumns: TableColumn<Row>[] = [
    {
      id: "name",
      header: "Name",
      type: "text",
      accessor: (r) => r.name,
      searchable: false,
      filter: false,
    },
    {
      id: "age",
      header: "Age",
      type: "number",
      accessor: (r) => r.age,
      filter: false,
    },
    { id: "note", header: "Note", type: "text", render: () => "-" },
  ];

  function renderSortable(fetcher: TableFetcher<Row>) {
    return render(
      <Table
        columns={sortableColumns}
        fetcher={fetcher}
        getRowId={(r) => r.id}
        {...SMALL_PAGES}
      />,
    );
  }

  const header = (name: string) => screen.getByRole("columnheader", { name });

  it("starts on the configured default sort", async () => {
    const fetcher = pagedFetcher();
    render(
      <Table
        columns={sortableColumns}
        fetcher={fetcher}
        getRowId={(r) => r.id}
        {...SMALL_PAGES}
        defaultSort={{ columnId: "age", direction: "desc" }}
      />,
    );

    await expectLastSort(fetcher, "age", "desc");
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(header("Age")).toHaveAttribute("aria-sort", "descending");
  });

  it("sorts ascending on first click, toggles to descending on the second", async () => {
    const user = userEvent.setup();
    const fetcher = pagedFetcher();
    renderSortable(fetcher);
    await screen.findByText("Person 1");
    expect(header("Name")).toHaveAttribute("aria-sort", "none");

    await user.click(header("Name"));

    await expectLastSort(fetcher, "name", "asc");
    expect(header("Name")).toHaveAttribute("aria-sort", "ascending");

    await user.click(header("Name"));

    await expectLastSort(fetcher, "name", "desc");
    expect(header("Name")).toHaveAttribute("aria-sort", "descending");

    // Toggles back and forth; there's no "unsorted" third state.
    await user.click(header("Name"));
    await expectLastSort(fetcher, "name", "asc");
  });

  it("sorts by one column at a time — a new column replaces the old sort", async () => {
    const user = userEvent.setup();
    const fetcher = pagedFetcher();
    renderSortable(fetcher);
    await screen.findByText("Person 1");

    await user.click(header("Name"));
    await user.click(header("Age"));

    await expectLastSort(fetcher, "age", "asc");
    expect(header("Age")).toHaveAttribute("aria-sort", "ascending");
    expect(header("Name")).toHaveAttribute("aria-sort", "none");
  });

  it("ignores clicks on columns that aren't sortable", async () => {
    const user = userEvent.setup();
    const fetcher = pagedFetcher();
    renderSortable(fetcher);
    await screen.findByText("Person 1");
    const callsBefore = fetcher.mock.calls.length;

    await user.click(header("Note"));

    expect(header("Note")).not.toHaveAttribute("aria-sort");
    expect(fetcher).toHaveBeenCalledTimes(callsBefore);
  });

  it("returns to page 1 when the sort changes", async () => {
    const user = userEvent.setup();
    const fetcher = pagedFetcher();
    renderSortable(fetcher);
    await screen.findByText("Person 1");
    await user.click(screen.getByRole("button", { name: "Page 3" }));
    await screen.findByText("Person 21");

    await user.click(header("Name"));

    await expectLastSort(fetcher, "name", "asc");
  });

  it("doesn't sort on modified Enter, and keeps focus on the header after sorting", async () => {
    const user = userEvent.setup();
    const fetcher = pagedFetcher();
    renderSortable(fetcher);
    await screen.findByText("Person 1");
    await user.tab();
    const callsBefore = fetcher.mock.calls.length;

    await user.keyboard("{Control>}{Enter}{/Control}");
    expect(fetcher).toHaveBeenCalledTimes(callsBefore);

    await user.keyboard("{Enter}");
    await expectLastSort(fetcher, "name", "asc");
    expect(header("Name")).toHaveFocus();
  });

  it("sorts from the keyboard with Enter or Space on a focused header", async () => {
    const user = userEvent.setup();
    const fetcher = pagedFetcher();
    renderSortable(fetcher);
    await screen.findByText("Person 1");

    await user.tab();
    expect(header("Name")).toHaveFocus();
    await user.keyboard("{Enter}");
    await expectLastSort(fetcher, "name", "asc");

    await user.keyboard(" ");
    await expectLastSort(fetcher, "name", "desc");
  });
});

describe("Table basic search", () => {
  const searchableColumns: TableColumn<Row>[] = [
    {
      id: "name",
      header: "Name",
      type: "text",
      accessor: (r) => r.name,
      searchable: true,
    },
    { id: "age", header: "Age", type: "number", accessor: (r) => r.age },
  ];

  function renderSearchable(fetcher: TableFetcher<Row>) {
    return render(
      <Table
        columns={searchableColumns}
        fetcher={fetcher}
        getRowId={(r) => r.id}
        {...SMALL_PAGES}
      />,
    );
  }

  const searchBox = () => screen.getByRole("searchbox", { name: "Search" });

  it("renders a search input above the grid when some column is searchable", async () => {
    renderSearchable(pagedFetcher());
    await screen.findByText("Person 1");

    expect(
      searchBox().compareDocumentPosition(screen.getByRole("grid")) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("renders no search input when no column is searchable", async () => {
    renderTable(pagedFetcher());
    await screen.findByText("Person 1");

    expect(screen.queryByRole("searchbox")).not.toBeInTheDocument();
  });

  it("fetches with the typed query once typing settles", async () => {
    const user = userEvent.setup();
    const fetcher = pagedFetcher();
    renderSearchable(fetcher);
    await screen.findByText("Person 1");

    await user.type(searchBox(), "ada");

    await waitFor(() =>
      expect(fetcher).toHaveBeenLastCalledWith(1, 10, null, { search: "ada" }),
    );
    // Debounced: the intermediate "a" / "ad" never hit the fetcher.
    const searched = fetcher.mock.calls
      .map((call) => call[3].search)
      .filter(Boolean);
    expect(searched).toEqual(["ada"]);
  });

  it("returns to page 1 when the query changes", async () => {
    const user = userEvent.setup();
    const fetcher = pagedFetcher();
    renderSearchable(fetcher);
    await screen.findByText("Person 1");
    await user.click(screen.getByRole("button", { name: "Page 3" }));
    await screen.findByText("Person 21");

    await user.type(searchBox(), "x");

    await waitFor(() =>
      expect(fetcher).toHaveBeenLastCalledWith(1, 10, null, { search: "x" }),
    );
  });

  it("stays on the current page when the query settles back to what it was", async () => {
    const user = userEvent.setup();
    const fetcher = pagedFetcher();
    renderSearchable(fetcher);
    await screen.findByText("Person 1");
    await user.click(screen.getByRole("button", { name: "Page 2" }));
    await screen.findByText("Person 11");

    // Type and undo inside the debounce window: net query is still empty.
    await user.type(searchBox(), "x{Backspace}");
    await new Promise((resolve) => setTimeout(resolve, 400));

    expect(fetcher).toHaveBeenLastCalledWith(2, 10, null, {});
    expect(screen.getByText("Person 11")).toBeInTheDocument();
  });

  it("drops the filter when the query is cleared", async () => {
    const user = userEvent.setup();
    const fetcher = pagedFetcher();
    renderSearchable(fetcher);
    await screen.findByText("Person 1");

    await user.type(searchBox(), "ada");
    await waitFor(() =>
      expect(fetcher).toHaveBeenLastCalledWith(1, 10, null, { search: "ada" }),
    );

    await user.clear(searchBox());

    await waitFor(() =>
      expect(fetcher).toHaveBeenLastCalledWith(1, 10, null, {}),
    );
  });

  it("keeps the search input available when a query matches nothing", async () => {
    const user = userEvent.setup();
    const fetcher: TableFetcher<Row> = async (_page, _size, _sort, filters) =>
      filters.search
        ? { rows: [], total: 0 }
        : { rows: manyRows.slice(0, 10), total: manyRows.length };
    renderSearchable(fetcher);
    await screen.findByText("Person 1");

    await user.type(searchBox(), "zzz");

    expect(await screen.findByText("No results found")).toBeInTheDocument();
    expect(searchBox()).toHaveValue("zzz");
  });
});

describe("Table advanced search", () => {
  type Member = {
    id: string;
    name: string;
    age: number;
    role: string;
    joined: Date;
  };

  const members: Member[] = Array.from({ length: 25 }, (_, i) => ({
    id: String(i + 1),
    name: `Member ${i + 1}`,
    age: 20 + i,
    role: ["admin", "member", "viewer"][i % 3],
    joined: new Date(Date.UTC(2024, 0, i + 1)),
  }));

  const memberColumns: TableColumn<Member>[] = [
    {
      id: "name",
      header: "Name",
      type: "text",
      accessor: (m) => m.name,
      searchable: true,
      filter: { kind: "text" },
    },
    {
      id: "age",
      header: "Age",
      type: "number",
      accessor: (m) => m.age,
      filter: { kind: "number" },
    },
    {
      id: "role",
      header: "Role",
      type: "text",
      accessor: (m) => m.role,
      filter: {
        kind: "select",
        options: [
          { value: "admin", label: "Admin" },
          { value: "member", label: "Member" },
          { value: "viewer", label: "Viewer" },
        ],
      },
    },
    {
      id: "joined",
      header: "Joined",
      type: "date",
      accessor: (m) => m.joined,
      filter: { kind: "date" },
    },
  ];

  function memberFetcher() {
    return jest.fn<
      ReturnType<TableFetcher<Member>>,
      Parameters<TableFetcher<Member>>
    >(async (page, pageSize) => ({
      rows: members.slice((page - 1) * pageSize, page * pageSize),
      total: members.length,
    }));
  }

  async function renderMembers(fetcher = memberFetcher()) {
    render(
      <Table
        columns={memberColumns}
        fetcher={fetcher}
        getRowId={(m) => m.id}
        {...SMALL_PAGES}
      />,
    );
    await screen.findByText("Member 1");
    return fetcher;
  }

  type User = ReturnType<typeof userEvent.setup>;

  const addButton = () => screen.getByRole("button", { name: "Add filter" });
  const addMenu = () =>
    screen.getByRole("group", { name: "Add filter options" });
  const queryAddMenu = () =>
    screen.queryByRole("group", { name: "Add filter options" });
  const chip = (header: string) =>
    screen.getByRole("group", { name: `${header} filter` });
  const queryChip = (header: string) =>
    screen.queryByRole("group", { name: `${header} filter` });
  const editor = (header: string) =>
    screen.getByRole("group", { name: `${header} value` });
  const queryEditor = (header: string) =>
    screen.queryByRole("group", { name: `${header} value` });
  const operatorButton = (header: string) =>
    within(chip(header)).getByRole("button", {
      name: new RegExp(`^${header} operator`),
    });
  const valueButton = (header: string) =>
    within(chip(header)).getByRole("button", {
      name: new RegExp(`^${header} value`),
    });

  /** "+" -> pick the column: adds its chip and opens the value editor. */
  async function addFilter(user: User, header: string) {
    await user.click(addButton());
    await user.click(
      within(addMenu()).getByRole("button", { name: new RegExp(`^${header}`) }),
    );
    return editor(header);
  }

  async function chooseOperator(user: User, header: string, label: string) {
    await user.click(operatorButton(header));
    await user.click(screen.getByRole("menuitemradio", { name: label }));
  }

  function expectLastFilters(fetcher: jest.Mock, filters: object, page = 1) {
    return waitFor(() =>
      expect(fetcher).toHaveBeenLastCalledWith(page, 10, null, filters),
    );
  }

  async function goToPage(user: User, page: number, firstRow: string) {
    await user.click(screen.getByRole("button", { name: `Page ${page}` }));
    await screen.findByText(firstRow);
  }

  it("has no Add filter button when no column is filterable", async () => {
    renderTable(pagedFetcher());
    await screen.findByText("Person 1");

    expect(
      screen.queryByRole("button", { name: "Add filter" }),
    ).not.toBeInTheDocument();
  });

  describe("adding filters", () => {
    it("lists the filterable columns in a menu that closes with Escape or a click elsewhere", async () => {
      const user = userEvent.setup();
      await renderMembers();

      expect(addButton()).toHaveAttribute("aria-expanded", "false");
      await user.click(addButton());

      expect(addButton()).toHaveAttribute("aria-expanded", "true");
      expect(
        within(addMenu())
          .getAllByRole("button")
          .map((button) => button.textContent),
      ).toEqual(["Name", "Age", "Role", "Joined"]);

      await user.keyboard("{Escape}");
      expect(queryAddMenu()).not.toBeInTheDocument();
      expect(addButton()).toHaveFocus();

      await user.click(addButton());
      await user.click(screen.getByRole("grid"));
      expect(queryAddMenu()).not.toBeInTheDocument();
    });

    it("narrows the column list as you type in its search box", async () => {
      const user = userEvent.setup();
      await renderMembers();
      await user.click(addButton());

      await user.type(
        within(addMenu()).getByRole("searchbox", { name: "Search columns" }),
        "ro",
      );
      expect(
        within(addMenu())
          .getAllByRole("button")
          .map((button) => button.textContent),
      ).toEqual(["Role"]);

      await user.clear(
        within(addMenu()).getByRole("searchbox", { name: "Search columns" }),
      );
      await user.type(
        within(addMenu()).getByRole("searchbox", { name: "Search columns" }),
        "zzz",
      );
      expect(within(addMenu()).getByText("No matching columns")).toBeVisible();
    });

    it("adds a chip on the column's default operator and opens its value editor", async () => {
      const user = userEvent.setup();
      await renderMembers();

      await addFilter(user, "Name");

      expect(queryAddMenu()).not.toBeInTheDocument();
      expect(chip("Name").firstElementChild).toHaveTextContent("Name");
      expect(operatorButton("Name")).toHaveTextContent("contains");
      expect(valueButton("Name")).toHaveTextContent("Enter value");
      expect(editor("Name")).toBeVisible();
      // One filter per column: it's no longer offered.
      await user.keyboard("{Escape}");
      await user.click(addButton());
      expect(
        within(addMenu()).queryByRole("button", { name: /^Name/ }),
      ).not.toBeInTheDocument();
    });

    it("doesn't refetch for a chip or operator that has no value yet", async () => {
      const user = userEvent.setup();
      const fetcher = await renderMembers();
      const callsBefore = fetcher.mock.calls.length;

      await addFilter(user, "Age");
      await chooseOperator(user, "Age", "Greater than");
      await new Promise((resolve) => setTimeout(resolve, 400));

      expect(fetcher).toHaveBeenCalledTimes(callsBefore);
    });
  });

  describe("operators", () => {
    const operatorLabels = () =>
      within(screen.getByRole("menu"))
        .getAllByRole("menuitemradio")
        .map((item) => item.textContent);

    it("offers operators suited to each column's data type, current one checked", async () => {
      const user = userEvent.setup();
      await renderMembers();

      await addFilter(user, "Name");
      await user.click(operatorButton("Name"));
      expect(operatorLabels()).toEqual([
        "Contains",
        "Equals",
        "Starts with",
        "Ends with",
      ]);
      expect(
        screen.getByRole("menuitemradio", { name: "Contains" }),
      ).toBeChecked();
      await user.keyboard("{Escape}");

      await addFilter(user, "Age");
      await user.click(operatorButton("Age"));
      expect(operatorLabels()).toEqual([
        "Equals",
        "Does not equal",
        "Less than",
        "Less than or equal to",
        "Greater than",
        "Greater than or equal to",
        "Between",
      ]);
      await user.keyboard("{Escape}");

      await addFilter(user, "Joined");
      await user.click(operatorButton("Joined"));
      expect(operatorLabels()).toEqual([
        "Between",
        "Is",
        "Before",
        "On or before",
        "After",
        "On or after",
      ]);
      await user.keyboard("{Escape}");

      await addFilter(user, "Role");
      await user.click(operatorButton("Role"));
      expect(operatorLabels()).toEqual(["Is any of", "Is none of"]);
    });

    it("shows the chosen operator on the chip", async () => {
      const user = userEvent.setup();
      await renderMembers();
      await addFilter(user, "Age");

      await chooseOperator(user, "Age", "Less than or equal to");

      expect(operatorButton("Age")).toHaveTextContent("less than or equal to");
    });
  });

  describe("text", () => {
    it("contains by default, and returns to page 1", async () => {
      const user = userEvent.setup();
      const fetcher = await renderMembers();
      await goToPage(user, 3, "Member 21");

      const column = await addFilter(user, "Name");
      await user.type(
        within(column).getByRole("textbox", { name: "Name" }),
        "ali",
      );

      await expectLastFilters(fetcher, {
        columns: { name: { operator: "contains", value: "ali" } },
      });
      expect(valueButton("Name")).toHaveTextContent("ali");
    });

    it("switches operator while keeping what was typed", async () => {
      const user = userEvent.setup();
      const fetcher = await renderMembers();
      const column = await addFilter(user, "Name");
      await user.type(
        within(column).getByRole("textbox", { name: "Name" }),
        "ali",
      );
      await expectLastFilters(fetcher, {
        columns: { name: { operator: "contains", value: "ali" } },
      });

      await chooseOperator(user, "Name", "Equals");
      await expectLastFilters(fetcher, {
        columns: { name: { operator: "eq", value: "ali" } },
      });

      await chooseOperator(user, "Name", "Starts with");
      await expectLastFilters(fetcher, {
        columns: { name: { operator: "startsWith", value: "ali" } },
      });

      await chooseOperator(user, "Name", "Ends with");
      await expectLastFilters(fetcher, {
        columns: { name: { operator: "endsWith", value: "ali" } },
      });
    });
  });

  describe("number", () => {
    it("compares against a single number with the chosen operator", async () => {
      const user = userEvent.setup();
      const fetcher = await renderMembers();
      await goToPage(user, 2, "Member 11");

      const column = await addFilter(user, "Age");
      await user.type(
        within(column).getByRole("spinbutton", { name: "Age" }),
        "30",
      );
      await expectLastFilters(fetcher, {
        columns: { age: { operator: "eq", value: 30 } },
      });

      await chooseOperator(user, "Age", "Less than or equal to");
      await expectLastFilters(fetcher, {
        columns: { age: { operator: "lte", value: 30 } },
      });

      await chooseOperator(user, "Age", "Does not equal");
      await expectLastFilters(fetcher, {
        columns: { age: { operator: "neq", value: 30 } },
      });
    });

    it("takes a from/to pair for Between, seeded from the single value", async () => {
      const user = userEvent.setup();
      const fetcher = await renderMembers();
      const column = await addFilter(user, "Age");
      await user.type(
        within(column).getByRole("spinbutton", { name: "Age" }),
        "30",
      );
      await expectLastFilters(fetcher, {
        columns: { age: { operator: "eq", value: 30 } },
      });

      await chooseOperator(user, "Age", "Between");
      await expectLastFilters(fetcher, {
        columns: { age: { operator: "between", from: 30 } },
      });
      // Reopen the value editor (choosing an operator closes the menu).
      await user.click(valueButton("Age"));
      await user.type(
        within(editor("Age")).getByRole("spinbutton", { name: "Age to" }),
        "40",
      );
      await expectLastFilters(fetcher, {
        columns: { age: { operator: "between", from: 30, to: 40 } },
      });
      expect(valueButton("Age")).toHaveTextContent("30 – 40");
    });
  });

  describe("date", () => {
    it("is a from/to range by default, back on page 1", async () => {
      const user = userEvent.setup();
      const fetcher = await renderMembers();
      await goToPage(user, 2, "Member 11");

      const column = await addFilter(user, "Joined");
      await user.type(
        within(column).getByLabelText("Joined from"),
        "2024-01-05",
      );
      await expectLastFilters(fetcher, {
        columns: { joined: { operator: "between", from: "2024-01-05" } },
      });

      await user.type(within(column).getByLabelText("Joined to"), "2024-01-09");
      await expectLastFilters(fetcher, {
        columns: {
          joined: { operator: "between", from: "2024-01-05", to: "2024-01-09" },
        },
      });
    });

    it("compares a single day with Is / Before / After and friends", async () => {
      const user = userEvent.setup();
      const fetcher = await renderMembers();
      const column = await addFilter(user, "Joined");
      await user.type(
        within(column).getByLabelText("Joined from"),
        "2024-01-05",
      );
      await expectLastFilters(fetcher, {
        columns: { joined: { operator: "between", from: "2024-01-05" } },
      });

      await chooseOperator(user, "Joined", "Before");
      await expectLastFilters(fetcher, {
        columns: { joined: { operator: "lt", value: "2024-01-05" } },
      });
      await user.click(valueButton("Joined"));
      expect(within(editor("Joined")).getByLabelText("Joined")).toHaveValue(
        "2024-01-05",
      );
      await user.keyboard("{Escape}");

      await chooseOperator(user, "Joined", "On or after");
      await expectLastFilters(fetcher, {
        columns: { joined: { operator: "gte", value: "2024-01-05" } },
      });

      await chooseOperator(user, "Joined", "Is");
      await expectLastFilters(fetcher, {
        columns: { joined: { operator: "eq", value: "2024-01-05" } },
      });
    });
  });

  describe("select", () => {
    it("sends the chosen values, back on page 1, and can be flipped to none-of", async () => {
      const user = userEvent.setup();
      const fetcher = await renderMembers();
      await goToPage(user, 3, "Member 21");

      const column = await addFilter(user, "Role");
      expect(
        within(column)
          .getAllByRole("checkbox")
          .map((box) => box.closest("label")?.textContent),
      ).toEqual(["Admin", "Member", "Viewer"]);
      await user.click(within(column).getByRole("checkbox", { name: "Admin" }));
      await user.click(
        within(column).getByRole("checkbox", { name: "Viewer" }),
      );
      await expectLastFilters(fetcher, {
        columns: { role: { operator: "in", values: ["admin", "viewer"] } },
      });
      expect(valueButton("Role")).toHaveTextContent("Admin, Viewer");

      await chooseOperator(user, "Role", "Is none of");
      await expectLastFilters(fetcher, {
        columns: { role: { operator: "notIn", values: ["admin", "viewer"] } },
      });
      expect(operatorButton("Role")).toHaveTextContent("is none of");

      // Deselecting drops back to a single value.
      await user.click(valueButton("Role"));
      await user.click(
        within(editor("Role")).getByRole("checkbox", { name: "Admin" }),
      );
      await expectLastFilters(fetcher, {
        columns: { role: { operator: "notIn", values: ["viewer"] } },
      });
    });
  });

  it("returns to page 1 when only the operator changes on an active filter", async () => {
    const user = userEvent.setup();
    const fetcher = await renderMembers();
    const column = await addFilter(user, "Age");
    await user.type(
      within(column).getByRole("spinbutton", { name: "Age" }),
      "30",
    );
    await expectLastFilters(fetcher, {
      columns: { age: { operator: "eq", value: 30 } },
    });
    await user.keyboard("{Escape}");
    await goToPage(user, 2, "Member 11");

    await chooseOperator(user, "Age", "Greater than");

    await expectLastFilters(fetcher, {
      columns: { age: { operator: "gt", value: 30 } },
    });
  });

  describe("empty state", () => {
    // Nothing matches once any search or filter applies.
    function noMatchFetcher() {
      return jest.fn<
        ReturnType<TableFetcher<Member>>,
        Parameters<TableFetcher<Member>>
      >(async (page, pageSize, _sort, filters) =>
        filters.search || filters.columns
          ? { rows: [], total: 0 }
          : {
              rows: members.slice((page - 1) * pageSize, page * pageSize),
              total: members.length,
            },
      );
    }

    const emptyState = () =>
      screen.findByText("No results found").then((text) => text.parentElement!);

    it("offers Clear filters when Advanced Search filters leave no rows", async () => {
      const user = userEvent.setup();
      const fetcher = await renderMembers(noMatchFetcher());

      await user.type(
        within(await addFilter(user, "Name")).getByRole("textbox", {
          name: "Name",
        }),
        "zzz",
      );
      await user.keyboard("{Escape}");
      await user.click(
        within(await emptyState()).getByRole("button", {
          name: "Clear filters",
        }),
      );

      await expectLastFilters(fetcher, {});
      expect(await screen.findByText("Member 1")).toBeInTheDocument();
      expect(queryChip("Name")).not.toBeInTheDocument();
    });

    it("offers Clear search when only Basic Search leaves no rows", async () => {
      const user = userEvent.setup();
      const fetcher = await renderMembers(noMatchFetcher());
      const search = screen.getByRole("searchbox", { name: "Search" });

      await user.type(search, "zzz");
      await user.click(
        within(await emptyState()).getByRole("button", {
          name: "Clear search",
        }),
      );

      await expectLastFilters(fetcher, {});
      expect(search).toHaveValue("");
    });

    it("offers Clear search and filters when both are applied", async () => {
      const user = userEvent.setup();
      const fetcher = await renderMembers(noMatchFetcher());

      await user.type(
        within(await addFilter(user, "Name")).getByRole("textbox", {
          name: "Name",
        }),
        "zzz",
      );
      await user.keyboard("{Escape}");
      await user.type(screen.getByRole("searchbox", { name: "Search" }), "q");
      await user.click(
        within(await emptyState()).getByRole("button", {
          name: "Clear search and filters",
        }),
      );

      await expectLastFilters(fetcher, {});
      expect(screen.getByRole("searchbox", { name: "Search" })).toHaveValue("");
      expect(queryChip("Name")).not.toBeInTheDocument();
    });
  });

  it("combines with Basic Search: both apply at once, on page 1", async () => {
    const user = userEvent.setup();
    const fetcher = await renderMembers();
    await goToPage(user, 2, "Member 11");

    await user.type(screen.getByRole("searchbox", { name: "Search" }), "mem");
    await expectLastFilters(fetcher, { search: "mem" });

    const nameEditor = await addFilter(user, "Name");
    await user.type(
      within(nameEditor).getByRole("textbox", { name: "Name" }),
      "1",
    );
    await expectLastFilters(fetcher, {
      search: "mem",
      columns: { name: { operator: "contains", value: "1" } },
    });

    // A select filter joins them too — again from a later page.
    await user.keyboard("{Escape}");
    await goToPage(user, 2, "Member 11");
    const roleEditor = await addFilter(user, "Role");
    await user.click(
      within(roleEditor).getByRole("checkbox", { name: "Admin" }),
    );
    await expectLastFilters(fetcher, {
      search: "mem",
      columns: {
        name: { operator: "contains", value: "1" },
        role: { operator: "in", values: ["admin"] },
      },
    });
  });

  describe("keyboard and focus", () => {
    it("closes a popup when focus tabs out of it", async () => {
      const user = userEvent.setup();
      await renderMembers();
      await addFilter(user, "Name");
      expect(editor("Name")).toBeVisible();

      await user.tab(); // out of the editor's input
      await user.tab();

      expect(queryEditor("Name")).not.toBeInTheDocument();
    });

    it("moves through the operator menu with the arrow keys and returns focus after choosing", async () => {
      const user = userEvent.setup();
      await renderMembers();
      await addFilter(user, "Name");
      await user.keyboard("{Escape}");

      await user.click(operatorButton("Name"));
      // The current operator has focus.
      expect(
        screen.getByRole("menuitemradio", { name: "Contains" }),
      ).toHaveFocus();

      await user.keyboard("{ArrowDown}");
      expect(
        screen.getByRole("menuitemradio", { name: "Equals" }),
      ).toHaveFocus();
      await user.keyboard("{End}");
      expect(
        screen.getByRole("menuitemradio", { name: "Ends with" }),
      ).toHaveFocus();
      await user.keyboard("{ArrowDown}"); // wraps
      expect(
        screen.getByRole("menuitemradio", { name: "Contains" }),
      ).toHaveFocus();
      await user.keyboard("{ArrowUp}");
      expect(
        screen.getByRole("menuitemradio", { name: "Ends with" }),
      ).toHaveFocus();

      await user.keyboard("{Enter}");
      expect(operatorButton("Name")).toHaveTextContent("ends with");
      expect(operatorButton("Name")).toHaveFocus();

      await user.click(operatorButton("Name"));
      await user.keyboard("{Escape}");
      expect(screen.queryByRole("menu")).not.toBeInTheDocument();
      expect(operatorButton("Name")).toHaveFocus();
    });

    it("hands focus back to Add filter after a chip is removed or filters are cleared", async () => {
      const user = userEvent.setup();
      await renderMembers();
      await addFilter(user, "Name");
      await addFilter(user, "Age");

      await user.click(
        screen.getByRole("button", { name: "Remove Name filter" }),
      );
      expect(addButton()).toHaveFocus();

      await user.click(screen.getByRole("button", { name: "Clear filters" }));
      expect(addButton()).toHaveFocus();
    });

    it("opens the value editor again when a removed column is re-added", async () => {
      const user = userEvent.setup();
      await renderMembers();
      await addFilter(user, "Name");
      await user.keyboard("{Escape}");
      await user.click(
        screen.getByRole("button", { name: "Remove Name filter" }),
      );

      await addFilter(user, "Name");

      expect(editor("Name")).toBeVisible();
    });
  });

  describe("editing and removing", () => {
    it("reopens the value editor from the chip, with the current value", async () => {
      const user = userEvent.setup();
      const fetcher = await renderMembers();
      const column = await addFilter(user, "Name");
      await user.type(
        within(column).getByRole("textbox", { name: "Name" }),
        "ali",
      );
      await expectLastFilters(fetcher, {
        columns: { name: { operator: "contains", value: "ali" } },
      });

      await user.keyboard("{Escape}");
      expect(queryEditor("Name")).not.toBeInTheDocument();
      expect(valueButton("Name")).toHaveTextContent("ali");

      await user.click(valueButton("Name"));
      expect(
        within(editor("Name")).getByRole("textbox", { name: "Name" }),
      ).toHaveValue("ali");
    });

    it("drops the filter when its value is emptied", async () => {
      const user = userEvent.setup();
      const fetcher = await renderMembers();
      const column = await addFilter(user, "Name");
      const input = within(column).getByRole("textbox", { name: "Name" });
      await user.type(input, "ali");
      await expectLastFilters(fetcher, {
        columns: { name: { operator: "contains", value: "ali" } },
      });

      await user.clear(input);

      await expectLastFilters(fetcher, {});
      // The chip stays so a value can be typed again.
      expect(queryChip("Name")).toBeInTheDocument();
    });

    it("removes a chip with its × button, dropping that filter", async () => {
      const user = userEvent.setup();
      const fetcher = await renderMembers();
      const nameEditor = await addFilter(user, "Name");
      await user.type(
        within(nameEditor).getByRole("textbox", { name: "Name" }),
        "ali",
      );
      const roleEditor = await addFilter(user, "Role");
      await user.click(
        within(roleEditor).getByRole("checkbox", { name: "Admin" }),
      );
      await expectLastFilters(fetcher, {
        columns: {
          name: { operator: "contains", value: "ali" },
          role: { operator: "in", values: ["admin"] },
        },
      });

      await user.click(
        screen.getByRole("button", { name: "Remove Name filter" }),
      );

      await expectLastFilters(fetcher, {
        columns: { role: { operator: "in", values: ["admin"] } },
      });
      expect(queryChip("Name")).not.toBeInTheDocument();
      // ...and the column can be added again.
      await user.click(addButton());
      expect(
        within(addMenu()).getByRole("button", { name: /^Name/ }),
      ).toBeVisible();
    });

    it("clears every filter at once, keeping Basic Search", async () => {
      const user = userEvent.setup();
      const fetcher = await renderMembers();
      await user.type(screen.getByRole("searchbox", { name: "Search" }), "mem");
      const nameEditor = await addFilter(user, "Name");
      await user.type(
        within(nameEditor).getByRole("textbox", { name: "Name" }),
        "1",
      );
      await addFilter(user, "Age");
      await expectLastFilters(fetcher, {
        search: "mem",
        columns: { name: { operator: "contains", value: "1" } },
      });

      await user.click(screen.getByRole("button", { name: "Clear filters" }));

      await expectLastFilters(fetcher, { search: "mem" });
      expect(queryChip("Name")).not.toBeInTheDocument();
      expect(queryChip("Age")).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "Clear filters" }),
      ).not.toBeInTheDocument();
    });
  });
});

describe("Table row selection", () => {
  const onSuspend = jest.fn<void, [string[]]>();
  const bulkActions = [
    { id: "suspend", label: "Suspend", onAction: onSuspend },
  ];

  beforeEach(() => onSuspend.mockClear());

  function renderSelectable(
    fetcher: TableFetcher<Row>,
    cols: TableColumn<Row>[] = columns,
  ) {
    return render(
      <Table
        columns={cols}
        fetcher={fetcher}
        getRowId={(r) => r.id}
        bulkActions={bulkActions}
        {...SMALL_PAGES}
      />,
    );
  }

  // `columns[0]` with extra capabilities (a spread would lose its accessor-only typing).
  const nameColumn = (extra: {
    sortable?: boolean;
    searchable?: boolean;
    filter?: TableColumnFilter;
  }): TableColumn<Row> =>
    ({
      id: "name",
      header: "Name",
      type: "text",
      accessor: (r) => r.name,
      ...extra,
    }) as TableColumn<Row>;

  const rowCheckboxes = () =>
    screen.getAllByRole("checkbox", { name: /^Select row / });
  const selectAll = () =>
    screen.getByRole("checkbox", { name: "Select all rows on this page" });
  const toolbar = () => screen.queryByRole("toolbar", { name: "Bulk actions" });

  it("renders no checkbox column when the Table has no Bulk Action", async () => {
    renderTable(async () => ({ rows, total: 2 }));

    await screen.findByText("Ada");
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    expect(screen.getByRole("grid")).toHaveAttribute("aria-colcount", "2");
  });

  it("adds a checkbox column when the Table has a Bulk Action", async () => {
    renderSelectable(async () => ({ rows, total: 2 }));

    await screen.findByText("Ada");
    expect(rowCheckboxes()).toHaveLength(2);
    expect(selectAll()).not.toBeChecked();
    expect(screen.getByRole("grid")).toHaveAttribute("aria-colcount", "3");
    expect(toolbar()).not.toBeInTheDocument();
  });

  it("selects and deselects individual rows, showing the toolbar while any is selected", async () => {
    const user = userEvent.setup();
    renderSelectable(async () => ({ rows, total: 2 }));
    await screen.findByText("Ada");

    await user.click(rowCheckboxes()[0]);
    expect(rowCheckboxes()[0]).toBeChecked();
    expect(rowCheckboxes()[1]).not.toBeChecked();
    expect(toolbar()).toHaveTextContent("1 selected");

    await user.click(rowCheckboxes()[1]);
    expect(toolbar()).toHaveTextContent("2 selected");
    expect(selectAll()).toBeChecked();

    await user.click(rowCheckboxes()[0]);
    await user.click(rowCheckboxes()[1]);
    expect(toolbar()).not.toBeInTheDocument();
  });

  it("marks select-all as mixed while only some rows are selected", async () => {
    const user = userEvent.setup();
    renderSelectable(async () => ({ rows, total: 2 }));
    await screen.findByText("Ada");

    await user.click(rowCheckboxes()[0]);

    expect(selectAll()).toHaveAttribute("aria-checked", "mixed");
  });

  it("select all selects only the rows on the current page, and toggles them back off", async () => {
    const user = userEvent.setup();
    renderSelectable(pagedFetcher());
    await screen.findByText("Person 1");

    await user.click(selectAll());
    expect(rowCheckboxes()).toHaveLength(10);
    expect(rowCheckboxes().every((c) => (c as HTMLInputElement).checked)).toBe(
      true,
    );
    expect(toolbar()).toHaveTextContent("10 selected");

    await user.click(selectAll());
    expect(toolbar()).not.toBeInTheDocument();
  });

  it("calls the Bulk Action with the selected rows' ids", async () => {
    const user = userEvent.setup();
    renderSelectable(async () => ({ rows, total: 2 }));
    await screen.findByText("Ada");

    await user.click(rowCheckboxes()[1]);
    await user.click(
      within(toolbar()!).getByRole("button", { name: "Suspend" }),
    );

    expect(onSuspend).toHaveBeenCalledTimes(1);
    expect(onSuspend).toHaveBeenCalledWith(["2"]);
  });

  it("passes ids in page order, whatever order they were selected in", async () => {
    const user = userEvent.setup();
    renderSelectable(async () => ({ rows, total: 2 }));
    await screen.findByText("Ada");

    await user.click(rowCheckboxes()[1]);
    await user.click(rowCheckboxes()[0]);
    await user.click(screen.getByRole("button", { name: "Suspend" }));

    expect(onSuspend).toHaveBeenCalledWith(["1", "2"]);
  });

  it("renders no checkbox column when bulkActions is empty", async () => {
    render(
      <Table
        columns={columns}
        fetcher={async () => ({ rows, total: 2 })}
        getRowId={(r) => r.id}
        bulkActions={[]}
      />,
    );

    await screen.findByText("Ada");
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  });

  it("passes every selected id when select all is used", async () => {
    const user = userEvent.setup();
    renderSelectable(pagedFetcher());
    await screen.findByText("Person 1");

    await user.click(selectAll());
    await user.click(screen.getByRole("button", { name: "Suspend" }));

    expect(onSuspend).toHaveBeenCalledWith(
      Array.from({ length: 10 }, (_, i) => String(i + 1)),
    );
  });

  it("clears the selection when the page changes", async () => {
    const user = userEvent.setup();
    renderSelectable(pagedFetcher());
    await screen.findByText("Person 1");

    await user.click(rowCheckboxes()[0]);
    await user.click(screen.getByRole("button", { name: "Page 2" }));
    await screen.findByText("Person 11");

    expect(toolbar()).not.toBeInTheDocument();
    expect(rowCheckboxes().some((c) => (c as HTMLInputElement).checked)).toBe(
      false,
    );

    // Returning doesn't resurrect the old selection.
    await user.click(screen.getByRole("button", { name: "Page 1" }));
    await screen.findByText("Person 1");
    expect(toolbar()).not.toBeInTheDocument();
  });

  it("clears the selection when the page size changes", async () => {
    const user = userEvent.setup();
    renderSelectable(pagedFetcher());
    await screen.findByText("Person 1");

    await user.click(rowCheckboxes()[0]);
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Rows per page" }),
      "25",
    );

    await waitFor(() => expect(toolbar()).not.toBeInTheDocument());
  });

  it("clears the selection when the sort changes", async () => {
    const user = userEvent.setup();
    renderSelectable(pagedFetcher(), [
      nameColumn({ sortable: true }),
      columns[1],
    ]);
    await screen.findByText("Person 1");

    await user.click(rowCheckboxes()[0]);
    await user.click(screen.getByRole("columnheader", { name: "Name" }));

    await waitFor(() => expect(toolbar()).not.toBeInTheDocument());
  });

  it("clears the selection when Basic Search changes", async () => {
    const user = userEvent.setup();
    renderSelectable(pagedFetcher(), [
      nameColumn({ searchable: true }),
      columns[1],
    ]);
    await screen.findByText("Person 1");

    await user.click(rowCheckboxes()[0]);
    await user.type(screen.getByRole("searchbox", { name: "Search" }), "x");

    // Right away, not once typing settles: a Bulk Action can't be aimed at
    // rows the pending search is about to replace.
    expect(toolbar()).not.toBeInTheDocument();
  });

  it("clears the selection when Advanced Search filters change", async () => {
    const user = userEvent.setup();
    renderSelectable(pagedFetcher(), [
      nameColumn({ filter: { kind: "text" } }),
      columns[1],
    ]);
    await screen.findByText("Person 1");

    await user.click(rowCheckboxes()[0]);
    await user.click(screen.getByRole("button", { name: "Add filter" }));
    await user.click(
      within(
        screen.getByRole("group", { name: "Add filter options" }),
      ).getByRole("button", { name: /^Name/ }),
    );
    await user.type(
      within(screen.getByRole("group", { name: "Name value" })).getByRole(
        "textbox",
      ),
      "Person",
    );

    await waitFor(() => expect(toolbar()).not.toBeInTheDocument());
  });
});

describe("Table view state", () => {
  const viewColumns: TableColumn<Row>[] = [
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
  ];

  it("starts from the given view: page, size, sort, search and filters", async () => {
    const fetcher = pagedFetcher();
    render(
      <Table
        columns={viewColumns}
        fetcher={fetcher}
        getRowId={(r) => r.id}
        {...SMALL_PAGES}
        initialView={{
          page: 2,
          pageSize: 25,
          sort: { columnId: "age", direction: "desc" },
          filters: {
            search: "person",
            columns: { age: { operator: "gte", value: 30 } },
          },
        }}
      />,
    );

    // The given view is the first fetched, never the default one.
    await waitFor(() =>
      expect(fetcher.mock.calls[0]).toEqual([
        2,
        25,
        { columnId: "age", direction: "desc" },
        { search: "person", columns: { age: { operator: "gte", value: 30 } } },
      ]),
    );
    expect(screen.getByRole("searchbox", { name: "Search" })).toHaveValue(
      "person",
    );
    expect(screen.getByRole("columnheader", { name: "Age" })).toHaveAttribute(
      "aria-sort",
      "descending",
    );
    expect(
      screen.getByRole("group", { name: "Age filter" }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole("combobox", { name: "Rows per page" }),
    ).toHaveValue("25");
  });

  it("falls back to the default page size when the given one isn't on offer", async () => {
    const fetcher = pagedFetcher();
    render(
      <Table
        columns={viewColumns}
        fetcher={fetcher}
        getRowId={(r) => r.id}
        {...SMALL_PAGES}
        initialView={{ page: 1, pageSize: 7, sort: null, filters: {} }}
      />,
    );

    await waitFor(() => expect(fetcher).toHaveBeenCalledWith(1, 10, null, {}));
  });

  it("lands on the last page when the given page is past the end", async () => {
    const fetcher = pagedFetcher();
    const onViewChange = jest.fn();
    render(
      <Table
        columns={viewColumns}
        fetcher={fetcher}
        getRowId={(r) => r.id}
        {...SMALL_PAGES}
        initialView={{ page: 9, pageSize: 10, sort: null, filters: {} }}
        onViewChange={onViewChange}
      />,
    );

    expect(await screen.findByText("Person 25")).toBeInTheDocument();
    expect(fetcher).toHaveBeenLastCalledWith(3, 10, null, {});
    expect(screen.getByRole("button", { name: "Page 3" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(onViewChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ page: 3 }),
    );
  });

  it("reports each new view as the page, sort and search change", async () => {
    const user = userEvent.setup();
    const onViewChange = jest.fn();
    render(
      <Table
        columns={viewColumns}
        fetcher={pagedFetcher()}
        getRowId={(r) => r.id}
        {...SMALL_PAGES}
        onViewChange={onViewChange}
      />,
    );
    await screen.findByText("Person 1");

    await user.click(screen.getByRole("button", { name: "Page 2" }));
    await waitFor(() =>
      expect(onViewChange).toHaveBeenLastCalledWith({
        page: 2,
        pageSize: 10,
        sort: null,
        filters: {},
      }),
    );

    await user.click(screen.getByRole("columnheader", { name: "Name" }));
    await waitFor(() =>
      expect(onViewChange).toHaveBeenLastCalledWith({
        page: 1,
        pageSize: 10,
        sort: { columnId: "name", direction: "asc" },
        filters: {},
      }),
    );

    await user.type(screen.getByRole("searchbox", { name: "Search" }), "ada");
    await waitFor(() =>
      expect(onViewChange).toHaveBeenLastCalledWith({
        page: 1,
        pageSize: 10,
        sort: { columnId: "name", direction: "asc" },
        filters: { search: "ada" },
      }),
    );
    // Only settled views are reported, not each keystroke.
    const searches = onViewChange.mock.calls
      .map(([view]) => view.filters.search)
      .filter(Boolean);
    expect(searches).toEqual(["ada"]);
  });
});
