import { readFileSync } from "node:fs";
import { join } from "node:path";

const layoutSource = readFileSync(join(__dirname, "layout.tsx"), "utf-8");
const globalsCssSource = readFileSync(
  join(__dirname, "globals.css"),
  "utf-8",
);

describe("root layout fonts", () => {
  it("does not load Geist via next/font/google", () => {
    expect(layoutSource).not.toMatch(/next\/font\/google/);
    expect(layoutSource).not.toMatch(/Geist/);
  });

  it("does not define CSS variables for the removed Geist fonts", () => {
    expect(globalsCssSource).not.toMatch(/--font-geist-sans/);
    expect(globalsCssSource).not.toMatch(/--font-geist-mono/);
  });

  it("applies a system font stack for --font-sans", () => {
    const match = globalsCssSource.match(/--font-sans:\s*([^;]+);/);
    expect(match).not.toBeNull();
    expect(match?.[1]).toContain("system-ui");
  });
});
