// eslint-disable-next-line @typescript-eslint/no-require-imports -- Jest loads this file directly via CommonJS require
const baseConfig = require("./jest.config.js");

/** @type {import("jest").Config} **/
module.exports = {
  ...baseConfig,
  displayName: "dom",
  testEnvironment: "jsdom",
  // Mirrors the `@/*` alias from tsconfig.json, which ts-jest compiles but
  // doesn't resolve at runtime.
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  setupFilesAfterEnv: ["<rootDir>/jest.dom.setup.ts"],
  // Component tests live in `*.dom.test.tsx` files and only run here. Don't
  // inherit the base suite's dom exclusion — these are exactly the files we
  // want to match.
  testPathIgnorePatterns: ["/node_modules/"],
  testMatch: ["**/*.dom.test.[tj]s?(x)"],
};
