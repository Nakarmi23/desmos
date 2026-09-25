import { getPaginationItems } from "./pagination-items";

describe("getPaginationItems", () => {
  it("lists every page when there are few enough", () => {
    expect(getPaginationItems(1, 1)).toEqual([1]);
    expect(getPaginationItems(3, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(getPaginationItems(4, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it("collapses the far side into an ellipsis near the start", () => {
    expect(getPaginationItems(1, 20)).toEqual([1, 2, 3, 4, 5, "ellipsis", 20]);
    expect(getPaginationItems(3, 20)).toEqual([1, 2, 3, 4, 5, "ellipsis", 20]);
  });

  it("collapses the far side into an ellipsis near the end", () => {
    expect(getPaginationItems(20, 20)).toEqual([
      1,
      "ellipsis",
      16,
      17,
      18,
      19,
      20,
    ]);
  });

  it("collapses both sides in the middle", () => {
    expect(getPaginationItems(10, 20)).toEqual([
      1,
      "ellipsis",
      9,
      10,
      11,
      "ellipsis",
      20,
    ]);
  });

  it("switches layout exactly at the edge boundaries", () => {
    expect(getPaginationItems(4, 8)).toEqual([1, 2, 3, 4, 5, "ellipsis", 8]);
    expect(getPaginationItems(5, 8)).toEqual([1, "ellipsis", 4, 5, 6, 7, 8]);
  });
});
