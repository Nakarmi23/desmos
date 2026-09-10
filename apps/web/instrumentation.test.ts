const ORIGINAL_NEXT_RUNTIME = process.env.NEXT_RUNTIME;

function mockDb(raw: jest.Mock) {
  jest.doMock("./db", () => ({
    db: { raw },
    registerShutdownHandlers: jest.fn(),
  }));
}

describe("register", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  afterEach(() => {
    if (ORIGINAL_NEXT_RUNTIME === undefined) {
      delete process.env.NEXT_RUNTIME;
    } else {
      process.env.NEXT_RUNTIME = ORIGINAL_NEXT_RUNTIME;
    }
  });

  it("does nothing outside the Node.js runtime", async () => {
    process.env.NEXT_RUNTIME = "edge";
    mockDb(jest.fn());

    const { register } = await import("./instrumentation");
    await register();

    const { db, registerShutdownHandlers } = (await import(
      "./db"
    )) as unknown as {
      db: { raw: jest.Mock };
      registerShutdownHandlers: jest.Mock;
    };
    expect(db.raw).not.toHaveBeenCalled();
    expect(registerShutdownHandlers).not.toHaveBeenCalled();
  });

  it("registers shutdown handlers and checks connectivity in the Node.js runtime", async () => {
    process.env.NEXT_RUNTIME = "nodejs";
    mockDb(jest.fn().mockResolvedValue(undefined));

    const { register } = await import("./instrumentation");
    await register();

    const { db, registerShutdownHandlers } = (await import(
      "./db"
    )) as unknown as {
      db: { raw: jest.Mock };
      registerShutdownHandlers: jest.Mock;
    };
    expect(registerShutdownHandlers).toHaveBeenCalledTimes(1);
    expect(db.raw).toHaveBeenCalledWith("select 1");
  });

  it("propagates a connectivity failure so boot fails loudly", async () => {
    process.env.NEXT_RUNTIME = "nodejs";
    mockDb(jest.fn().mockRejectedValue(new Error("connection refused")));

    const { register } = await import("./instrumentation");

    await expect(register()).rejects.toThrow("connection refused");
  });
});
