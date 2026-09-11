// eslint-disable-next-line @typescript-eslint/no-require-imports -- Jest loads this file directly via CommonJS require
const { createDefaultPreset } = require("ts-jest");

const tsJestTransformCfg = createDefaultPreset({
  tsconfig: {
    module: "commonjs",
    moduleResolution: "node",
    jsx: "react-jsx",
  },
}).transform;

/** @type {import("jest").Config} **/
module.exports = {
  displayName: "dom",
  testEnvironment: "jsdom",
  transform: {
    "^.+\\.[tj]sx?$": tsJestTransformCfg["^.+\\.tsx?$"],
  },
  transformIgnorePatterns: [
    "node_modules/\\.pnpm/(?!(superjson|copy-anything)@)",
  ],
  // Mirrors the `@/*` alias from tsconfig.json, which ts-jest compiles but
  // doesn't resolve at runtime.
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  setupFilesAfterEnv: ["<rootDir>/jest.dom.setup.ts"],
  // Component tests live in `*.dom.test.tsx` files and only run here. The
  // default `test` suite (jest.config.js) excludes this pattern so it never
  // boots these under `testEnvironment: "node"`.
  testMatch: ["**/*.dom.test.[tj]s?(x)"],
  testPathIgnorePatterns: ["/node_modules/"],
};
