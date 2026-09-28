import {
  getRedirectUrl,
  unstable_doesMiddlewareMatch,
} from "next/experimental/testing/server";
import { NextRequest } from "next/server";

import { db, destroyPool } from "./db";
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
} from "./modules/auth/cookies";
import { hashToken } from "./modules/auth/tokens";
import { authCaller } from "./trpc/auth-caller";
import { config, proxy } from "./proxy";

const ORIGIN = "http://localhost:3000";

function request(path: string, accessToken?: string) {
  const req = new NextRequest(new URL(path, ORIGIN));
  if (accessToken) req.cookies.set(ACCESS_TOKEN_COOKIE, accessToken);
  return req;
}

/** Where the response redirects to, as a path, or `null` if it lets the request through. */
async function redirectOf(req: NextRequest) {
  const url = getRedirectUrl(await proxy(req));
  return url && url.replace(ORIGIN, "");
}

let accessToken: string;

describe("proxy (integration)", () => {
  beforeAll(async () => {
    await db.migrate.rollback(undefined, true);
    await db.migrate.latest();
    ({ accessToken } = await authCaller().signIn({
      username: "admin",
      password: "local-dev-admin-password",
    }));
  });
  afterAll(async () => {
    await destroyPool();
  });

  describe("without a Session", () => {
    it("sends a page request to sign in, remembering where it was going", async () => {
      await expect(
        redirectOf(request("/users?page=2&sort=name")),
      ).resolves.toBe(
        `/sign-in?returnTo=${encodeURIComponent("/users?page=2&sort=name")}`,
      );
    });

    it("treats an unrecognised access token as no Session", async () => {
      await expect(redirectOf(request("/users", "forged"))).resolves.toBe(
        `/sign-in?returnTo=${encodeURIComponent("/users")}`,
      );
    });

    it("lets the sign-in page through", async () => {
      await expect(redirectOf(request("/sign-in"))).resolves.toBeNull();
    });

    it("answers an API request with 401, not a redirect", async () => {
      const response = await proxy(request("/api/trpc/users.list"));

      expect(response.status).toBe(401);
      expect(getRedirectUrl(response)).toBeNull();
    });
  });

  describe("with a Session", () => {
    it("lets a page request through", async () => {
      await expect(
        redirectOf(request("/users", accessToken)),
      ).resolves.toBeNull();
    });

    it("lets an API request through", async () => {
      const response = await proxy(
        request("/api/trpc/users.list", accessToken),
      );

      expect(response.status).toBe(200);
      expect(getRedirectUrl(response)).toBeNull();
    });

    it("sends the sign-in page on to where the User was going", async () => {
      await expect(
        redirectOf(
          request("/sign-in?returnTo=%2Fusers%3Fpage%3D2", accessToken),
        ),
      ).resolves.toBe("/users?page=2");
    });

    it.each([
      ["none", "/sign-in"],
      ["another site", "/sign-in?returnTo=%2F%2Fevil.example"],
      ["an absolute URL", "/sign-in?returnTo=https%3A%2F%2Fevil.example"],
      ["a backslash trick", "/sign-in?returnTo=%2F%5Cevil.example"],
      ["the sign-in page itself", "/sign-in?returnTo=%2Fsign-in"],
    ])(
      "sends the sign-in page to Overview when returnTo is %s",
      async (_, path) => {
        await expect(redirectOf(request(path, accessToken))).resolves.toBe("/");
      },
    );
  });

  describe("with an expired access token", () => {
    /** A fresh Session whose access tokens have all expired. */
    async function staleSession() {
      const tokens = await authCaller().signIn({
        username: "admin",
        password: "local-dev-admin-password",
      });
      await db("session_access_tokens")
        .whereIn(
          "session_id",
          db("sessions")
            .where({ refresh_token_hash: hashToken(tokens.refreshToken) })
            .select("id"),
        )
        .update({ expires_at: new Date(Date.now() - 1000) });
      return tokens;
    }

    function staleRequest(
      path: string,
      tokens: { accessToken?: string; refreshToken: string },
    ) {
      const req = request(path, tokens.accessToken);
      req.cookies.set(REFRESH_TOKEN_COOKIE, tokens.refreshToken);
      return req;
    }

    /** The cookies the rest of this request (pages, Server Components) sees. */
    function forwardedCookies(response: Response) {
      const header = response.headers.get("x-middleware-request-cookie") ?? "";
      return Object.fromEntries(
        header.split("; ").map((pair) => pair.split("=") as [string, string]),
      );
    }

    it("refreshes the Session and lets the request through with the new tokens", async () => {
      const stale = await staleSession();

      const response = await proxy(staleRequest("/users", stale));

      expect(getRedirectUrl(response)).toBeNull();
      const access = response.cookies.get(ACCESS_TOKEN_COOKIE)!;
      const refresh = response.cookies.get(REFRESH_TOKEN_COOKIE)!;
      expect(access.value).not.toBe(stale.accessToken);
      expect(refresh.value).not.toBe(stale.refreshToken);
      expect(access).toMatchObject({
        httpOnly: true,
        sameSite: "lax",
        path: "/",
      });
      await expect(
        authCaller().validate({ accessToken: access.value }),
      ).resolves.not.toBeNull();
      // The page rendered for this very request sees the new tokens too.
      expect(forwardedCookies(response)).toMatchObject({
        [ACCESS_TOKEN_COOKIE]: access.value,
        [REFRESH_TOKEN_COOKIE]: refresh.value,
      });
    });

    it("refreshes an API request too, so the procedure sees the new access token", async () => {
      const stale = await staleSession();

      const response = await proxy(staleRequest("/api/trpc/users.list", stale));

      expect(response.status).toBe(200);
      const access = response.cookies.get(ACCESS_TOKEN_COOKIE)!.value;
      expect(forwardedCookies(response)[ACCESS_TOKEN_COOKIE]).toBe(access);
    });

    it("refreshes when the browser has already dropped the access cookie", async () => {
      const { refreshToken } = await staleSession();

      const response = await proxy(staleRequest("/users", { refreshToken }));

      expect(getRedirectUrl(response)).toBeNull();
      expect(response.cookies.get(ACCESS_TOKEN_COOKIE)).toBeDefined();
    });

    it("sends the sign-in page on once refreshed", async () => {
      const stale = await staleSession();

      const response = await proxy(
        staleRequest("/sign-in?returnTo=%2Froles", stale),
      );

      expect(getRedirectUrl(response)?.replace(ORIGIN, "")).toBe("/roles");
      expect(response.cookies.get(ACCESS_TOKEN_COOKIE)).toBeDefined();
    });

    it("sends the request to sign in when the Session can't be refreshed", async () => {
      await expect(
        redirectOf(staleRequest("/users", { refreshToken: "revoked" })),
      ).resolves.toBe(`/sign-in?returnTo=${encodeURIComponent("/users")}`);
    });
  });

  it("runs on pages but not on static assets", () => {
    const runsOn = (url: string) =>
      unstable_doesMiddlewareMatch({ config, url });

    expect(runsOn("/users")).toBe(true);
    expect(runsOn("/api/trpc/users.list")).toBe(true);
    expect(runsOn("/")).toBe(true);
    expect(runsOn("/_next/static/chunks/app.js")).toBe(false);
    expect(runsOn("/_next/image?url=x")).toBe(false);
    expect(runsOn("/favicon.ico")).toBe(false);
    expect(runsOn("/robots.txt")).toBe(false);
  });
});
