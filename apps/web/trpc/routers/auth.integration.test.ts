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

/** Every access token of the User's Sessions, expired as of now. */
async function expireAccessTokens(userId: string) {
  await db("session_access_tokens")
    .whereIn(
      "session_id",
      db("sessions").where({ user_id: userId }).select("id"),
    )
    .update({ expires_at: ago(1) });
}

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
      await expireAccessTokens(userId);

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

  describe("refresh", () => {
    const refresh = (refreshToken: string) =>
      authCaller().refresh({ refreshToken });
    const validate = (accessToken: string) =>
      authCaller().validate({ accessToken });

    /** A fresh User, signed in: their id and Session tokens. */
    async function signedIn(username: string) {
      const userId = await createUser(username);
      const tokens = await signIn({ username, password: PASSWORD });
      return { userId, ...tokens };
    }

    it("swaps the Session's tokens for a new pair", async () => {
      const { userId, accessToken, refreshToken } =
        await signedIn("refreshing");

      const next = await refresh(refreshToken);

      expect(next).toEqual({
        accessToken: expect.any(String),
        accessTokenExpiresAt: expect.any(Date),
        refreshToken: expect.any(String),
        refreshTokenExpiresAt: expect.any(Date),
      });
      expect(next!.accessToken).not.toBe(accessToken);
      expect(next!.refreshToken).not.toBe(refreshToken);
      await expect(validate(next!.accessToken)).resolves.toEqual({ userId });
      // The old access token lives out its 15 minutes, so requests already
      // in flight with it don't fail.
      await expect(validate(accessToken)).resolves.toEqual({ userId });
    });

    it("rejects a token no Session has", async () => {
      await expect(refresh("not-a-real-token")).resolves.toBeNull();
    });

    it("tolerates the replaced token within 30 seconds with an access token only, keeping the replacement", async () => {
      const { userId, refreshToken } = await signedIn("parallel-tabs");
      const winner = (await refresh(refreshToken))!;

      const again = await refresh(refreshToken);

      expect(again).toEqual({
        accessToken: expect.any(String),
        accessTokenExpiresAt: expect.any(Date),
      });
      await expect(validate(again!.accessToken)).resolves.toEqual({ userId });
      // The parallel refresh didn't cancel the winner's tokens.
      await expect(validate(winner.accessToken)).resolves.toEqual({ userId });
      await expect(refresh(winner.refreshToken!)).resolves.toHaveProperty(
        "refreshToken",
      );
    });

    it("lets simultaneous refreshes with one token all succeed", async () => {
      const { refreshToken } = await signedIn("simultaneous");

      const results = await Promise.all([
        refresh(refreshToken),
        refresh(refreshToken),
        refresh(refreshToken),
      ]);

      expect(results).toEqual([
        expect.objectContaining({ accessToken: expect.any(String) }),
        expect.objectContaining({ accessToken: expect.any(String) }),
        expect.objectContaining({ accessToken: expect.any(String) }),
      ]);
    });

    it("revokes the Session when the replaced token turns up after 30 seconds", async () => {
      const { userId, refreshToken } = await signedIn("stolen-token");
      const current = (await refresh(refreshToken))!;
      await db("sessions")
        .where({ user_id: userId })
        .update({ refresh_token_rotated_at: ago(31_000) });

      await expect(refresh(refreshToken)).resolves.toBeNull();

      // Every token of that Session is dead, the legitimate ones included.
      await expect(validate(current.accessToken)).resolves.toBeNull();
      await expect(refresh(current.refreshToken!)).resolves.toBeNull();
    });

    it("counts idleness from the last refresh, not the last request", async () => {
      const { userId, accessToken, refreshToken } = await signedIn("in-use");
      const nearlyIdle = ago(7 * DAY_MS - MINUTE_MS);
      await db("sessions")
        .where({ user_id: userId })
        .update({ last_used_at: nearlyIdle });
      const lastUsed = async () =>
        (await db("sessions").where({ user_id: userId }).first("last_used_at"))
          .last_used_at as Date;

      await validate(accessToken);
      expect(await lastUsed()).toEqual(nearlyIdle);

      await expect(refresh(refreshToken)).resolves.not.toBeNull();
      expect((await lastUsed()).getTime()).toBeGreaterThan(
        Date.now() - MINUTE_MS,
      );
    });

    it.each([
      ["unrefreshed for 7 days", { last_used_at: ago(7 * DAY_MS + MINUTE_MS) }],
      ["30 days old", { created_at: ago(30 * DAY_MS + MINUTE_MS) }],
    ])("refuses a Session %s", async (_, backdated) => {
      const { userId, refreshToken } = await signedIn(
        `ended-${Object.keys(backdated)[0]}`,
      );
      await db("sessions").where({ user_id: userId }).update(backdated);

      await expect(refresh(refreshToken)).resolves.toBeNull();
    });

    it("never lets a refresh token outlive the Session's 30 days", async () => {
      const { userId, refreshToken } = await signedIn("nearly-old");
      const createdAt = ago(29 * DAY_MS);
      await db("sessions")
        .where({ user_id: userId })
        .update({ created_at: createdAt });

      const next = (await refresh(refreshToken))!;

      expect(next.refreshTokenExpiresAt).toEqual(
        new Date(createdAt.getTime() + 30 * DAY_MS),
      );
    });

    it("refuses once the User is Suspended", async () => {
      const { userId, refreshToken } = await signedIn("suspended-later");
      await db("users").where({ id: userId }).update({ status: "suspended" });

      await expect(refresh(refreshToken)).resolves.toBeNull();
    });

    it("refuses once the User holds no Roles", async () => {
      const { userId, refreshToken } = await signedIn("roles-removed");
      await db("user_roles").where({ user_id: userId }).delete();

      await expect(refresh(refreshToken)).resolves.toBeNull();
    });
  });

  describe("signOut", () => {
    const signOut = (refreshToken: string) =>
      authCaller().signOut({ refreshToken });
    const validate = (accessToken: string) =>
      authCaller().validate({ accessToken });

    it("ends only the Session it's given; the User's others keep working", async () => {
      const userId = await createUser("two-browsers");
      const credentials = { username: "two-browsers", password: PASSWORD };
      const laptop = await signIn(credentials);
      const phone = await signIn(credentials);

      await signOut(laptop.refreshToken);

      await expect(validate(laptop.accessToken)).resolves.toBeNull();
      await expect(
        authCaller().refresh({ refreshToken: laptop.refreshToken }),
      ).resolves.toBeNull();
      await expect(validate(phone.accessToken)).resolves.toEqual({ userId });
    });

    it("ends the Session from the refresh token it just replaced, too", async () => {
      await createUser("mid-refresh");
      const session = await signIn({
        username: "mid-refresh",
        password: PASSWORD,
      });
      const next = (await authCaller().refresh({
        refreshToken: session.refreshToken,
      }))!;

      await signOut(session.refreshToken);

      await expect(validate(next.accessToken)).resolves.toBeNull();
    });

    it("ends the Session from its access token when there's no refresh token", async () => {
      await createUser("access-only");
      const credentials = { username: "access-only", password: PASSWORD };
      const session = await signIn(credentials);
      const other = await signIn(credentials);

      await authCaller().signOut({ accessToken: session.accessToken });

      await expect(validate(session.accessToken)).resolves.toBeNull();
      await expect(
        authCaller().refresh({ refreshToken: session.refreshToken }),
      ).resolves.toBeNull();
      await expect(validate(other.accessToken)).resolves.not.toBeNull();
    });

    it("does nothing for a token no Session has", async () => {
      await expect(signOut("not-a-real-token")).resolves.toBeUndefined();
    });
  });
});
