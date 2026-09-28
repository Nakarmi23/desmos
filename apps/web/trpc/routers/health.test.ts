import { anonymousCaller, signedInCaller } from "../test-callers";

describe("health.check", () => {
  it("returns an ok status with a timestamp", async () => {
    const caller = await signedInCaller();

    const result = await caller.health.check();

    expect(result.status).toBe("ok");
    expect(result.timestamp).toBeInstanceOf(Date);
  });

  it("rejects a caller who isn't signed in", async () => {
    const caller = await anonymousCaller();

    await expect(caller.health.check()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });
});
