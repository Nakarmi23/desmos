import { parseDbEnv } from "./env";

const PROD_ENV = {
  NODE_ENV: "production",
  DB_HOST: "db.internal",
  DB_PORT: "6543",
  DB_USER: "app",
  DB_PASSWORD: "s3cret",
  DB_NAME: "desmos_prod",
} as const;

describe("parseDbEnv", () => {
  it("parses a fully-specified production env into the expected shape", () => {
    expect(parseDbEnv(PROD_ENV)).toEqual({
      DB_HOST: "db.internal",
      DB_PORT: 6543,
      DB_USER: "app",
      DB_PASSWORD: "s3cret",
      DB_NAME: "desmos_prod",
    });
  });

  it("coerces DB_PORT to a number", () => {
    expect(parseDbEnv(PROD_ENV).DB_PORT).toBe(6543);
  });

  it("defaults development to the docker-compose credentials (database desmos)", () => {
    expect(parseDbEnv({ NODE_ENV: "development" })).toEqual({
      DB_HOST: "localhost",
      DB_PORT: 5432,
      DB_USER: "desmos",
      DB_PASSWORD: "desmos",
      DB_NAME: "desmos",
    });
  });

  it("defaults the test environment to the desmos_test database", () => {
    expect(parseDbEnv({ NODE_ENV: "test" }).DB_NAME).toBe("desmos_test");
  });

  it("treats an unset NODE_ENV as development", () => {
    expect(parseDbEnv({}).DB_NAME).toBe("desmos");
  });

  it("lets explicit values override the dev/test defaults", () => {
    const parsed = parseDbEnv({ NODE_ENV: "development", DB_HOST: "example.com" });
    expect(parsed.DB_HOST).toBe("example.com");
    expect(parsed.DB_USER).toBe("desmos");
  });

  it("throws a descriptive error when a required production var is missing", () => {
    const withoutPassword = { ...PROD_ENV, DB_PASSWORD: undefined };

    expect(() => parseDbEnv(withoutPassword)).toThrow(
      /Invalid database environment configuration/,
    );
    expect(() => parseDbEnv(withoutPassword)).toThrow(/DB_PASSWORD/);
  });

  it("throws when a required production var is empty", () => {
    expect(() => parseDbEnv({ ...PROD_ENV, DB_HOST: "" })).toThrow(/DB_HOST/);
  });

  it("throws a descriptive error when DB_PORT is not a number", () => {
    expect(() => parseDbEnv({ ...PROD_ENV, DB_PORT: "not-a-port" })).toThrow(
      /DB_PORT/,
    );
  });
});
