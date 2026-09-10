import { readFileSync } from "node:fs";
import { join } from "node:path";

// The font choice isn't observable from rendered output here — it lives in
// `layout.tsx`'s imports and the `@theme` block of `globals.css` — so these
// regression guards read both sources as text.
const layoutSource = readFileSync(join(__dirname, "layout.tsx"), "utf-8");
const globalsCssSource = readFileSync(join(__dirname, "globals.css"), "utf-8");

/** Value of the first `<property>: ...;` declaration in `globals.css`. */
function cssValue(property: string): string | undefined {
  const match = globalsCssSource.match(new RegExp(`${property}:\\s*([^;]+);`));
  return match?.[1].replace(/\s+/g, " ").trim();
}

describe("root layout fonts", () => {
  it("does not load Geist via next/font/google", () => {
    expect(layoutSource).not.toMatch(/next\/font\/google/);
    expect(layoutSource).not.toMatch(/Geist/);
  });

  it("does not define CSS variables for the removed Geist fonts", () => {
    expect(globalsCssSource).not.toMatch(/--font-geist-sans/);
    expect(globalsCssSource).not.toMatch(/--font-geist-mono/);
  });

  it("defines system font stacks for --font-sans and --font-mono", () => {
    expect(cssValue("--font-sans")).toContain("system-ui");
    expect(cssValue("--font-mono")).toContain("ui-monospace");
  });

  it("uses --font-sans as the body font", () => {
    expect(cssValue("font-family")).toBe("var(--font-sans)");
  });
});
