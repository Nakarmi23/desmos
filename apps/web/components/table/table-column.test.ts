import { resolveColumnAlign } from "./table-column";

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
