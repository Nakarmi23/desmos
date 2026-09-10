const ORIGINAL_NEXT_RUNTIME = process.env.NEXT_RUNTIME;

type DbMocks = {
  raw: jest.Mock;
  registerShutdownHandlers: jest.Mock;
};

/**
 * Replaces `./db` so importing `instrumentation` never builds a real Knex pool.
 * Returns the very mocks the module under test will receive, so assertions
 * don't have to re-import and cast the mocked module.
 */
function mockDb(raw: jest.Mock): DbMocks {
  const registerShutdownHandlers = jest.fn();
  jest.doMock("./db", () => ({ db: { raw }, registerShutdownHandlers }));
  return { raw, registerShutdownHandlers };
}

describe("register", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  afterEach(() => {
    // Assigning `undefined` to a process.env key stores the string
    // "undefined", so an originally-unset var has to be deleted instead.
    if (ORIGINAL_NEXT_RUNTIME === undefined) {
      delete process.env.NEXT_RUNTIME;
    } else {
      process.env.NEXT_RUNTIME = ORIGINAL_NEXT_RUNTIME;
    }
  });

  it("does nothing outside the Node.js runtime", async () => {
    process.env.NEXT_RUNTIME = "edge";
    const { raw, registerShutdownHandlers } = mockDb(jest.fn());

    const { register } = await import("./instrumentation");
    await register();

    expect(raw).not.toHaveBeenCalled();
    expect(registerShutdownHandlers).not.toHaveBeenCalled();
  });

  it("registers shutdown handlers and checks connectivity in the Node.js runtime", async () => {
    process.env.NEXT_RUNTIME = "nodejs";
    const { raw, registerShutdownHandlers } = mockDb(
      jest.fn().mockResolvedValue(undefined),
    );

    const { register } = await import("./instrumentation");
    await register();

    expect(registerShutdownHandlers).toHaveBeenCalledTimes(1);
    expect(raw).toHaveBeenCalledWith("select 1");
  });

  it("propagates a connectivity failure so boot fails loudly", async () => {
    process.env.NEXT_RUNTIME = "nodejs";
    mockDb(jest.fn().mockRejectedValue(new Error("connection refused")));

    const { register } = await import("./instrumentation");

    await expect(register()).rejects.toThrow("connection refused");
  });
});
