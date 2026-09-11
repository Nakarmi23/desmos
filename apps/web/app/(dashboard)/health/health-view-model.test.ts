import { toHealthViewModel } from "./health-view-model";

describe("toHealthViewModel", () => {
  it("returns a loading view while the query is in flight", () => {
    expect(
      toHealthViewModel({ isPending: true, isError: false, data: undefined }),
    ).toEqual({ kind: "loading" });
  });

  it("returns an error view once the query has failed", () => {
    expect(
      toHealthViewModel({ isPending: false, isError: true, data: undefined }),
    ).toEqual({ kind: "error" });
  });

  it("returns an error view when the query settles without data", () => {
    expect(
      toHealthViewModel({ isPending: false, isError: false, data: undefined }),
    ).toEqual({ kind: "error" });
  });

  it("returns a success view with the checked result once data arrives", () => {
    const timestamp = new Date("2026-01-01T12:34:56.000Z");

    expect(
      toHealthViewModel({
        isPending: false,
        isError: false,
        data: { status: "ok", timestamp },
      }),
    ).toEqual({
      kind: "success",
      status: "ok",
      checkedAt: timestamp.toLocaleTimeString(),
    });
  });
});
