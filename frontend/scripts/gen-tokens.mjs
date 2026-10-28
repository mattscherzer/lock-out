// Generates src/styles/tokens.css from docs/design-system/tokens.json (the single source of truth).
// `node scripts/gen-tokens.mjs` writes it, `--check` exits 1 if the committed file is stale.
import { readFileSync, writeFileSync } from "node:fs";

const src = new URL("../../docs/design-system/tokens.json", import.meta.url);
const out = new URL("../src/styles/tokens.css", import.meta.url);
const t = JSON.parse(readFileSync(src, "utf8"));

const kebab = (s) => s.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
const light = [];
const dark = [];
const theme = [];

// value is a string, or {light, dark}; dark is only emitted when it differs.
const add = (name, value) => {
  const v = typeof value === "object" ? value : { light: value };
  light.push(`  --${name}: ${v.light};`);
  if (v.dark && v.dark !== v.light) dark.push(`  --${name}: ${v.dark};`);
};

for (const k of t.color.tokens) {
  add(k.name, k.value);
  theme.push(`  --color-${k.name}: var(--${k.name});`);
}
for (const g of ["shadow", "spacing", "radius", "borderWidth", "size", "opacity", "mapStyle", "zIndex", "timing"]) {
  for (const k of t[g].tokens) {
    add(k.name, k.value);
    if (g === "shadow" && k.name !== "focus-ring") theme.push(`  --shadow-${k.name}: var(--${k.name});`);
    if (g === "radius") theme.push(`  --${k.name}: ${k.value};`); // same name as Tailwind's radius namespace: literal, a var() would point at itself
  }
}
for (const [name, stack] of Object.entries(t.type.families)) {
  add(`font-${name}`, stack);
  theme.push(`  --font-${name}: ${stack};`);
}
for (const group of t.type.groups) {
  for (const { name, usage, ...s } of group.styles) {
    for (const [prop, v] of Object.entries(s)) add(`${name}-${kebab(prop)}`, String(v));
    add(`${name}-family`, `var(--font-${group.family})`);
  }
}

const css = `/* LockOut Plum: generated from docs/design-system/tokens.json by scripts/gen-tokens.mjs. Do not edit. */
:root {
${light.join("\n")}
}

[data-theme="dark"] {
${dark.join("\n")}
}

/* Tailwind utilities (bg-primary, rounded-md, shadow-elevation-2, font-display) read the vars above, so themes switch without regenerating. */
@theme inline {
  --color-*: initial;
${theme.join("\n")}
}
`;

if (process.argv.includes("--check")) {
  let current = "";
  try { current = readFileSync(out, "utf8"); } catch {}
  if (current !== css) {
    console.error("tokens.css is out of date: run `npm run tokens`");
    process.exit(1);
  }
} else {
  writeFileSync(out, css);
}
