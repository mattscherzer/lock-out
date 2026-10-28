import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { generate } from "./gen-tokens.mjs";

const tokens = JSON.parse(readFileSync(new URL("../../docs/design-system/tokens.json", import.meta.url), "utf8"));
const script = fileURLToPath(new URL("./gen-tokens.mjs", import.meta.url));

const fixture = {
  color: { tokens: [{ name: "primary", value: { light: "#111", dark: "#eee" } }, { name: "same", value: { light: "#222", dark: "#222" } }] },
  shadow: { tokens: [{ name: "elevation-1", value: { light: "a", dark: "b" } }, { name: "focus-ring", value: "ring" }] },
  radius: { tokens: [{ name: "radius-md", value: "12px" }] },
  timing: { tokens: [{ name: "duration-fast", value: "100ms" }, { name: "easing-standard", value: "cubic-bezier(0.2, 0, 0, 1)" }] },
  size: { tokens: [{ name: "tap-target", value: "44px" }, { name: "content-max", value: "1120px" }] },
  zIndex: { tokens: [{ name: "z-sheet", value: "1000" }] },
  type: {
    families: { sans: "Sans, sans-serif" },
    groups: [{ name: "Data", family: "sans", styles: [{ name: "data-md", fontSize: "13px", letterSpacing: "1px" }] }],
  },
};

test("tokens.css is in sync with tokens.json", () => {
  const current = readFileSync(new URL("../src/styles/tokens.css", import.meta.url), "utf8").replace(/\r\n/g, "\n");
  assert.equal(current, generate(tokens));
});

test("--check runs when the script is started from the CLI", () => {
  execFileSync("node", [script, "--check"]);
});

test("light on :root, only differing dark values under data-theme", () => {
  const [root, dark] = generate(fixture).split('[data-theme="dark"]');
  assert.match(root, /--primary: #111;/);
  assert.match(dark, /--primary: #eee;/);
  assert.doesNotMatch(dark, /--same:/);
});

test("theme mapping: colour vars, literal radius, no focus-ring utility", () => {
  const css = generate(fixture);
  assert.match(css, /--color-primary: var\(--primary\);/);
  assert.match(css, /--radius-md: 12px;/);
  assert.doesNotMatch(css, /--shadow-focus-ring/);
  assert.match(css, /--color-\*: initial;/);
});

test("sizes, z-index, easing and duration map to Tailwind namespaces", () => {
  const css = generate(fixture);
  assert.match(css, /--spacing-tap-target: var\(--tap-target\);/);
  assert.match(css, /--container-content-max: var\(--content-max\);/);
  assert.match(css, /--z-index-sheet: var\(--z-sheet\);/);
  assert.match(css, /--ease-standard: var\(--easing-standard\);/);
  assert.match(css, /--transition-duration-fast: var\(--duration-fast\);/);
});

test("type styles become kebab-cased vars and a class with only the props the style has", () => {
  const css = generate(fixture);
  assert.match(css, /--data-md-font-size: 13px;/);
  assert.match(css, /\.data-md \{ font-family: var\(--font-sans\); font-size: var\(--data-md-font-size\); letter-spacing: var\(--data-md-letter-spacing\); font-variant-numeric: tabular-nums; \}/);
});

test("reduced motion override is outside any @layer", () => {
  const css = generate(fixture);
  const at = css.indexOf("prefers-reduced-motion");
  assert.ok(at > css.indexOf(":root {") && css.slice(0, at).split("@layer").length === 1);
});

test("a colour without a dark value is rejected", () => {
  assert.throws(() => generate({ ...fixture, color: { tokens: [{ name: "x", value: { light: "#fff" } }] } }), /no dark value/);
});

test("every real type style gets a class", () => {
  const css = generate(tokens);
  for (const g of tokens.type.groups) for (const s of g.styles) assert.match(css, new RegExp(`^  (\\S+, )?\\.${s.name}( \\{|,)`, "m"), s.name);
});
