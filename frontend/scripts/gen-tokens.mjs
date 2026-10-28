// Generates src/styles/tokens.css from docs/design-system/tokens.json (the single source of truth).
// `node scripts/gen-tokens.mjs` writes it, `--check` exits 1 if the committed file is stale.
import { readFileSync, realpathSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const kebab = (s) => s.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

export function generate(t) {
  const light = ["  color-scheme: light;"];
  const dark = ["  color-scheme: dark;"];
  const theme = [];
  const types = [];

  // value is a string, or {light, dark}; dark is only emitted when it differs.
  const add = (name, value) => {
    const v = typeof value === "object" && value !== null ? value : { light: value };
    light.push(`  --${name}: ${v.light};`);
    if (v.dark && v.dark !== v.light) dark.push(`  --${name}: ${v.dark};`);
  };

  for (const k of t.color.tokens) {
    if (!k.value.dark) throw new Error(`colour ${k.name} has no dark value`);
    add(k.name, k.value);
    theme.push(`  --color-${k.name}: var(--${k.name});`);
  }
  for (const [g, { tokens }] of Object.entries(t)) {
    if (g === "color" || !Array.isArray(tokens)) continue;
    for (const k of tokens) {
      add(k.name, k.value);
      if (g === "shadow" && k.name !== "focus-ring") theme.push(`  --shadow-${k.name}: var(--${k.name});`);
      // same name as Tailwind's radius namespace: literal, a var() would point at itself
      if (g === "radius") theme.push(`  --${k.name}: ${k.value};`);
    }
  }
  for (const [name, stack] of Object.entries(t.type.families)) {
    add(`font-${name}`, stack);
    theme.push(`  --font-${name}: ${stack};`);
  }
  for (const group of t.type.groups) {
    for (const { name, usage, ...s } of group.styles) {
      const props = Object.keys(s).map(kebab);
      for (const [prop, v] of Object.entries(s)) add(`${name}-${kebab(prop)}`, String(v));
      const decls = props.map((p) => `${p}: var(--${name}-${p});`);
      // shortcut: tokens.json only mentions tabular-nums in prose, so it is keyed on the name; add a field there if a second numeric style appears
      if (name === "data-md") decls.push("font-variant-numeric: tabular-nums;");
      // Leaflet's attribution control is the credit line, so it shares the attribution-sm rule
      const sel = name === "attribution-sm" ? ".attribution-sm, .leaflet-control-attribution" : `.${name}`;
      types.push(`  ${sel} { font-family: var(--font-${group.family}); ${decls.join(" ")} }`);
    }
  }

  return `/* LockOut Plum: generated from docs/design-system/tokens.json by scripts/gen-tokens.mjs. Do not edit. */
:root {
${light.join("\n")}
}

[data-theme="dark"] {
${dark.join("\n")}
}

/* Unlayered like the :root above, and after it, so it wins. */
@media (prefers-reduced-motion: reduce) {
  :root { --duration-fast: 0ms; --duration-base: 0ms; --duration-slow: 0ms; }
}

@layer components {
${types.join("\n")}
}

/* Tailwind utilities (bg-primary, rounded-md, shadow-elevation-2, font-display) read the vars above, so themes switch without regenerating. */
@theme inline {
  --color-*: initial;
${theme.join("\n")}
}
`;
}

const src = new URL("../../docs/design-system/tokens.json", import.meta.url);
const out = new URL("../src/styles/tokens.css", import.meta.url);

// realpath: node resolves symlinks in import.meta.url but not in argv[1], and a skipped --check would pass silently
if (realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const css = generate(JSON.parse(readFileSync(src, "utf8")));
  if (process.argv.includes("--check")) {
    let current = "";
    try {
      current = readFileSync(out, "utf8").replace(/\r\n/g, "\n");
    } catch (e) {
      if (e.code !== "ENOENT") throw e;
    }
    if (current !== css) {
      console.error("tokens.css is out of date: run `npm run tokens`");
      process.exit(1);
    }
  } else {
    writeFileSync(out, css);
  }
}
