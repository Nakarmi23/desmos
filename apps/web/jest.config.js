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
  testEnvironment: "node",
  transform: {
    "^.+\\.[tj]sx?$": tsJestTransformCfg["^.+\\.tsx?$"],
  },
  transformIgnorePatterns: [
    "node_modules/\\.pnpm/(?!(superjson|copy-anything)@)",
  ],
};
