import {
  getRedirectUrl,
  unstable_doesMiddlewareMatch,
} from "next/experimental/testing/server";
import { NextRequest } from "next/server";

import { db, destroyPool } from "./db";
import { ACCESS_TOKEN_COOKIE } from "./modules/auth/cookies";
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
  });

  describe("with a Session", () => {
    it("lets a page request through", async () => {
      await expect(
        redirectOf(request("/users", accessToken)),
      ).resolves.toBeNull();
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

  it("runs on pages but not on static assets", () => {
    const runsOn = (url: string) =>
      unstable_doesMiddlewareMatch({ config, url });

    expect(runsOn("/users")).toBe(true);
    expect(runsOn("/")).toBe(true);
    expect(runsOn("/_next/static/chunks/app.js")).toBe(false);
    expect(runsOn("/_next/image?url=x")).toBe(false);
    expect(runsOn("/favicon.ico")).toBe(false);
    expect(runsOn("/robots.txt")).toBe(false);
  });
});
