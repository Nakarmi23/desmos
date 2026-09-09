import { createCaller } from "../caller";
import { createContextInner } from "../context";

describe("health.check", () => {
  it("returns an ok status with a timestamp", async () => {
    const caller = createCaller(await createContextInner());

    const result = await caller.health.check();

    expect(result.status).toBe("ok");
    expect(result.timestamp).toBeInstanceOf(Date);
  });
});
