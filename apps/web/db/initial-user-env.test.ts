import { parseInitialUserEnv } from "./initial-user-env";

const STRONG_PASSWORD = "correct-horse-battery-staple";

const PROD_ENV = {
  NODE_ENV: "production",
  INITIAL_ADMIN_USERNAME: "root",
  INITIAL_ADMIN_PASSWORD: STRONG_PASSWORD,
  INITIAL_ADMIN_NAME: "Site Owner",
  INITIAL_ADMIN_EMAIL: "owner@example.com",
} as const;

describe("parseInitialUserEnv", () => {
  it("parses a fully-specified production env", () => {
    expect(parseInitialUserEnv(PROD_ENV)).toEqual({
      username: "root",
      password: STRONG_PASSWORD,
      name: "Site Owner",
      email: "owner@example.com",
    });
  });

  it("makes the email optional", () => {
    expect(
      parseInitialUserEnv({ ...PROD_ENV, INITIAL_ADMIN_EMAIL: undefined })
        .email,
    ).toBeNull();
    expect(
      parseInitialUserEnv({ ...PROD_ENV, INITIAL_ADMIN_EMAIL: "" }).email,
    ).toBeNull();
  });

  it.each(["development", "test", undefined])(
    "defaults %s to the local admin account, without an email",
    (nodeEnv) => {
      expect(parseInitialUserEnv({ NODE_ENV: nodeEnv })).toEqual({
        username: "admin",
        password: "local-dev-admin-password",
        name: "Administrator",
        email: null,
      });
    },
  );

  it("lets explicit values override the dev/test defaults", () => {
    const parsed = parseInitialUserEnv({
      NODE_ENV: "development",
      INITIAL_ADMIN_USERNAME: "me",
    });
    expect(parsed.username).toBe("me");
    expect(parsed.name).toBe("Administrator");
  });

  it("has no production defaults, naming every missing var", () => {
    const parse = () => parseInitialUserEnv({ NODE_ENV: "production" });

    expect(parse).toThrow(/Invalid Initial User configuration/);
    expect(parse).toThrow(/INITIAL_ADMIN_USERNAME/);
    expect(parse).toThrow(/INITIAL_ADMIN_PASSWORD/);
    expect(parse).toThrow(/INITIAL_ADMIN_NAME/);
  });

  it("rejects a password under 24 characters in every environment", () => {
    const short = "a".repeat(23);
    for (const env of [
      { ...PROD_ENV, INITIAL_ADMIN_PASSWORD: short },
      { NODE_ENV: "development", INITIAL_ADMIN_PASSWORD: short },
    ]) {
      expect(() => parseInitialUserEnv(env)).toThrow(/INITIAL_ADMIN_PASSWORD/);
      expect(() => parseInitialUserEnv(env)).toThrow(/24/);
    }
    expect(
      parseInitialUserEnv({
        ...PROD_ENV,
        INITIAL_ADMIN_PASSWORD: "a".repeat(24),
      }).password,
    ).toHaveLength(24);
  });

  it("rejects a malformed email", () => {
    expect(() =>
      parseInitialUserEnv({ ...PROD_ENV, INITIAL_ADMIN_EMAIL: "not-an-email" }),
    ).toThrow(/INITIAL_ADMIN_EMAIL/);
  });

  it("rejects an empty username or name", () => {
    expect(() =>
      parseInitialUserEnv({ ...PROD_ENV, INITIAL_ADMIN_USERNAME: "" }),
    ).toThrow(/INITIAL_ADMIN_USERNAME/);
    expect(() =>
      parseInitialUserEnv({ ...PROD_ENV, INITIAL_ADMIN_NAME: "  " }),
    ).toThrow(/INITIAL_ADMIN_NAME/);
  });
});
