// eslint-disable-next-line @typescript-eslint/no-require-imports -- Jest loads this file directly via CommonJS require
const baseConfig = require("./jest.config.js");

/** @type {import("jest").Config} **/
module.exports = {
  ...baseConfig,
  // Integration tests (DB-backed, etc.) live in `*.integration.test.ts` files
  // and only run here. Don't inherit the base suite's integration exclusion —
  // these are exactly the files we want to match.
  testPathIgnorePatterns: ["/node_modules/"],
  testMatch: ["**/*.integration.test.[tj]s?(x)"],
};
