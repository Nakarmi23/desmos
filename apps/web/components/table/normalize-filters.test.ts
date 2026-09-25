import { normalizeFilters } from "./normalize-filters";

describe("normalizeFilters", () => {
  it("returns an empty object when nothing is set", () => {
    expect(normalizeFilters({ search: "", columns: {} })).toEqual({});
    expect(
      normalizeFilters({
        search: "   ",
        columns: {
          name: { operator: "contains", value: "  " },
          age: { operator: "gt", value: "" },
          role: { operator: "in", values: [] },
          joined: { operator: "between", from: "", to: undefined },
        },
      }),
    ).toEqual({});
  });

  it("trims text and keeps only meaningful values, whatever the operator", () => {
    expect(
      normalizeFilters({
        search: " ada ",
        columns: {
          name: { operator: "startsWith", value: " Al " },
          age: { operator: "lte", value: 30 },
          score: { operator: "eq", value: 0 },
          role: { operator: "notIn", values: ["admin"] },
          joined: { operator: "between", from: "2024-01-01", to: "" },
        },
      }),
    ).toEqual({
      search: "ada",
      columns: {
        name: { operator: "startsWith", value: "Al" },
        age: { operator: "lte", value: 30 },
        score: { operator: "eq", value: 0 },
        role: { operator: "notIn", values: ["admin"] },
        joined: { operator: "between", from: "2024-01-01" },
      },
    });
  });

  it("drops non-finite numbers", () => {
    expect(
      normalizeFilters({
        search: "",
        columns: {
          age: { operator: "eq", value: Number.NaN },
          height: { operator: "between", from: Number.NaN, to: 180 },
        },
      }),
    ).toEqual({ columns: { height: { operator: "between", to: 180 } } });
  });

  it("is order-insensitive so equal filters compare equal", () => {
    const a = normalizeFilters({
      search: "",
      columns: {
        role: { operator: "in", values: ["viewer", "admin"] },
        name: { operator: "contains", value: "x" },
      },
    });
    const b = normalizeFilters({
      search: "",
      columns: {
        name: { operator: "contains", value: "x" },
        role: { operator: "in", values: ["admin", "viewer"] },
      },
    });
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it("treats a different operator on the same value as a different filter", () => {
    const a = normalizeFilters({
      search: "",
      columns: { age: { operator: "lt", value: 5 } },
    });
    const b = normalizeFilters({
      search: "",
      columns: { age: { operator: "lte", value: 5 } },
    });
    expect(JSON.stringify(a)).not.toBe(JSON.stringify(b));
  });
});
