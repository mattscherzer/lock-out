import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const css = readFileSync(new URL("../src/styles/tokens.css", import.meta.url), "utf8");
const tokens = JSON.parse(readFileSync(new URL("../../docs/design-system/tokens.json", import.meta.url), "utf8"));
const script = new URL("./gen-tokens.mjs", import.meta.url).pathname;

test("tokens.css is in sync with tokens.json", () => {
  execFileSync("node", [script, "--check"]);
});

test("every colour is a custom property and dark values sit under data-theme", () => {
  const [root, dark] = css.split('[data-theme="dark"]');
  for (const { name, value } of tokens.color.tokens) {
    assert.ok(root.includes(`--${name}: ${value.light};`), name);
    assert.ok(dark.includes(`--${name}: ${value.dark};`), `${name} dark`);
  }
});
