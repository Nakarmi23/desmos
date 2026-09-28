import { db, destroyPool } from "../../db";
import { hashToken } from "../../modules/auth/tokens";
import { hashPassword } from "../../modules/users/password";
import { authCaller } from "../auth-caller";

// The migrated Initial User's dev/test-default credentials.
const ADMIN = { username: "admin", password: "local-dev-admin-password" };

const PASSWORD = "a-test-users-password";

/** A User signing in with `PASSWORD`, holding the Initial Role unless told otherwise. */
async function createUser(
  username: string,
  { status = "active", holdsRole = true } = {},
) {
  const [user] = await db("users")
    .insert({
      name: username,
      username,
      password_hash: await hashPassword(PASSWORD),
      status,
    })
    .returning("id");
  if (holdsRole) {
    const role = await db("roles").where({ is_system: true }).first("id");
    await db("user_roles").insert({ user_id: user.id, role_id: role.id });
  }
  return user.id as string;
}

const MINUTE_MS = 60_000;
const DAY_MS = 24 * 60 * MINUTE_MS;
const ago = (ms: number) => new Date(Date.now() - ms);

const signIn = (input: {
  username: string;
  password: string;
  userAgent?: string;
  ip?: string;
}) => authCaller().signIn(input);

describe("auth (integration)", () => {
  beforeAll(async () => {
    await db.migrate.rollback(undefined, true);
    await db.migrate.latest();
  });
  afterAll(async () => {
    await destroyPool();
  });

  describe("signIn", () => {
    beforeAll(async () => {
      await createUser("suspended", { status: "suspended" });
      await createUser("roleless", { holdsRole: false });
    });

    it("starts a Session for the Initial User with the configured credentials", async () => {
      const before = Date.now();
      const session = await signIn(ADMIN);

      expect(session).toEqual({
        accessToken: expect.any(String),
        accessTokenExpiresAt: expect.any(Date),
        refreshToken: expect.any(String),
        refreshTokenExpiresAt: expect.any(Date),
      });
      expect(session.accessToken).not.toEqual(session.refreshToken);
      // 15 minutes, and 7 days (the idle timeout).
      expect(
        session.accessTokenExpiresAt.getTime() - before,
      ).toBeGreaterThanOrEqual(15 * 60_000);
      expect(session.accessTokenExpiresAt.getTime() - before).toBeLessThan(
        16 * 60_000,
      );
      expect(
        session.refreshTokenExpiresAt.getTime() - before,
      ).toBeGreaterThanOrEqual(7 * 86_400_000);
      expect(session.refreshTokenExpiresAt.getTime() - before).toBeLessThan(
        7 * 86_400_000 + 60_000,
      );
    });

    it("matches the Username regardless of case", async () => {
      await expect(
        signIn({ username: "ADMIN", password: ADMIN.password }),
      ).resolves.toHaveProperty("accessToken");
    });

    it("clears away the User's ended Sessions, keeping live ones", async () => {
      const userId = await createUser("returning");
      const credentials = { username: "returning", password: PASSWORD };
      const live = await signIn(credentials);
      const idle = await signIn(credentials);
      const old = await signIn(credentials);
      const sessionOf = ({ refreshToken }: { refreshToken: string }) =>
        db("sessions").where({ refresh_token_hash: hashToken(refreshToken) });
      await sessionOf(idle).update({
        last_used_at: ago(7 * DAY_MS + MINUTE_MS),
      });
      await sessionOf(old).update({ created_at: ago(30 * DAY_MS + MINUTE_MS) });

      await signIn(credentials);

      expect(await sessionOf(live).first()).toBeDefined();
      expect(await sessionOf(idle).first()).toBeUndefined();
      expect(await sessionOf(old).first()).toBeUndefined();
      expect(await db("sessions").where({ user_id: userId })).toHaveLength(2);
    });

    it.each([
      ["an unknown Username", { username: "nobody", password: ADMIN.password }],
      [
        "a wrong password",
        { username: ADMIN.username, password: "not-the-password" },
      ],
      ["a Suspended User", { username: "suspended", password: PASSWORD }],
      ["a User holding no Roles", { username: "roleless", password: PASSWORD }],
    ])("rejects %s with the generic message", async (_, credentials) => {
      await expect(signIn(credentials)).rejects.toMatchObject({
        code: "UNAUTHORIZED",
        message: "Username or password is incorrect",
      });
    });
  });

  describe("validate", () => {
    const validate = (accessToken: string) =>
      authCaller().validate({ accessToken });

    it("resolves a fresh access token to its Session's User", async () => {
      const userId = await createUser("validating");
      const { accessToken } = await signIn({
        username: "validating",
        password: PASSWORD,
      });

      await expect(validate(accessToken)).resolves.toEqual({ userId });
    });

    it("rejects a token no Session has", async () => {
      await expect(validate("not-a-real-token")).resolves.toBeNull();
    });

    /** A fresh User, signed in: their id and access token. */
    async function signedIn(username: string) {
      const userId = await createUser(username);
      const { accessToken } = await signIn({ username, password: PASSWORD });
      return { userId, accessToken };
    }

    it("rejects an expired access token", async () => {
      const { userId, accessToken } = await signedIn("expired-access");
      await db("sessions")
        .where({ user_id: userId })
        .update({ access_token_expires_at: ago(1) });

      await expect(validate(accessToken)).resolves.toBeNull();
    });

    it("rejects a Session 30 days after Sign in, even with a live access token", async () => {
      const { userId, accessToken } = await signedIn("too-old");
      await db("sessions")
        .where({ user_id: userId })
        .update({ created_at: ago(30 * DAY_MS + MINUTE_MS) });

      await expect(validate(accessToken)).resolves.toBeNull();
    });

    it("ends access on the next request once the User is Suspended", async () => {
      const { userId, accessToken } = await signedIn("gets-suspended");
      await db("users").where({ id: userId }).update({ status: "suspended" });

      await expect(validate(accessToken)).resolves.toBeNull();
    });

    it("ends access on the next request once the User holds no Roles", async () => {
      const { userId, accessToken } = await signedIn("loses-roles");
      await db("user_roles").where({ user_id: userId }).delete();

      await expect(validate(accessToken)).resolves.toBeNull();
    });
  });
});
