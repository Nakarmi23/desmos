import {
  defaultFilterValue,
  FILTER_OPERATORS,
  summarizeValue,
  withOperator,
} from "./filter-operators";

describe("FILTER_OPERATORS", () => {
  it("offers the operators appropriate to each data type", () => {
    const labels = (kind: keyof typeof FILTER_OPERATORS) =>
      FILTER_OPERATORS[kind].map((o) => o.label);

    expect(labels("text")).toEqual([
      "Contains",
      "Equals",
      "Starts with",
      "Ends with",
    ]);
    expect(labels("number")).toEqual([
      "Equals",
      "Does not equal",
      "Less than",
      "Less than or equal to",
      "Greater than",
      "Greater than or equal to",
      "Between",
    ]);
    expect(labels("date")).toEqual([
      "Between",
      "Is",
      "Before",
      "On or before",
      "After",
      "On or after",
    ]);
    expect(labels("select")).toEqual(["Is any of", "Is none of"]);
  });
});

describe("defaultFilterValue", () => {
  it("starts empty on the first operator of each type", () => {
    expect(defaultFilterValue("text")).toEqual({
      operator: "contains",
      value: "",
    });
    expect(defaultFilterValue("number")).toEqual({ operator: "eq", value: "" });
    expect(defaultFilterValue("date")).toEqual({ operator: "between" });
    expect(defaultFilterValue("select")).toEqual({
      operator: "in",
      values: [],
    });
  });
});

describe("withOperator", () => {
  it("keeps the value when moving between single-value operators", () => {
    expect(withOperator({ operator: "lt", value: 5 }, "gte")).toEqual({
      operator: "gte",
      value: 5,
    });
  });

  it("turns a single value into the lower bound of a range and back", () => {
    const range = withOperator(
      { operator: "gte", value: "2024-01-01" },
      "between",
    );
    expect(range).toEqual({ operator: "between", from: "2024-01-01" });
    expect(withOperator(range, "lt")).toEqual({
      operator: "lt",
      value: "2024-01-01",
    });
  });

  it("falls back to the upper bound when the lower one is blank", () => {
    expect(
      withOperator({ operator: "between", from: "", to: 9 }, "lt"),
    ).toEqual({ operator: "lt", value: 9 });
  });

  it("keeps selections across in / notIn", () => {
    expect(
      withOperator({ operator: "in", values: ["a", "b"] }, "notIn"),
    ).toEqual({ operator: "notIn", values: ["a", "b"] });
  });

  it("starts fresh when there was no value", () => {
    expect(withOperator(undefined, "eq")).toEqual({
      operator: "eq",
      value: "",
    });
  });
});

describe("summarizeValue", () => {
  const options = [
    { value: "admin", label: "Admin" },
    { value: "viewer", label: "Viewer" },
  ];

  it("is empty when the filter isn't active", () => {
    expect(summarizeValue("text", { operator: "contains", value: " " })).toBe(
      "",
    );
    expect(summarizeValue("select", { operator: "in", values: [] })).toBe("");
    expect(summarizeValue("date", undefined)).toBe("");
  });

  it("describes just the value (the operator has its own chip segment)", () => {
    expect(
      summarizeValue("text", { operator: "startsWith", value: "al" }),
    ).toBe("al");
    expect(summarizeValue("number", { operator: "lte", value: 30 })).toBe("30");
    expect(
      summarizeValue("date", { operator: "lt", value: "2024-01-01" }),
    ).toBe("2024-01-01");
  });

  it("describes ranges, open-ended or not", () => {
    expect(
      summarizeValue("number", { operator: "between", from: 1, to: 9 }),
    ).toBe("1 – 9");
    expect(summarizeValue("number", { operator: "between", from: 1 })).toBe(
      "≥ 1",
    );
    expect(summarizeValue("number", { operator: "between", to: 9 })).toBe(
      "≤ 9",
    );
    expect(
      summarizeValue("date", { operator: "between", from: "2024-01-01" }),
    ).toBe("from 2024-01-01");
    expect(
      summarizeValue("date", { operator: "between", to: "2024-02-01" }),
    ).toBe("until 2024-02-01");
  });

  it("lists selected option labels alphabetically", () => {
    expect(
      summarizeValue(
        "select",
        { operator: "in", values: ["viewer", "admin"] },
        options,
      ),
    ).toBe("Admin, Viewer");
    expect(
      summarizeValue(
        "select",
        { operator: "notIn", values: ["admin"] },
        options,
      ),
    ).toBe("Admin");
  });
});
