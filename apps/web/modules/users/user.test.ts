import { toUserSort } from "./user";

describe("toUserSort", () => {
  it("keeps a sort on a column users.list can sort by", () => {
    expect(toUserSort({ columnId: "email", direction: "desc" })).toEqual({
      columnId: "email",
      direction: "desc",
    });
  });

  it("drops a sort on any other column, and keeps no sort as none", () => {
    expect(toUserSort({ columnId: "roles", direction: "asc" })).toBeNull();
    expect(toUserSort(null)).toBeNull();
  });
});
