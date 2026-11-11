import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { expect, it } from "vitest";

const SRC = import.meta.dirname;
const FEATURES = ["map", "search", "answer"];
const ALL = ["app", ...FEATURES, "advice", "controls"];
// folder -> top-level folders it must not import
const FORBIDDEN: Record<string, string[]> = {
  domain: ALL,
  data: ALL,
  advice: ["app"],
  controls: ["app"],
  ...Object.fromEntries(FEATURES.map((f) => [f, ["app", ...FEATURES.filter((o) => o !== f)]])),
};

const files = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? files(join(dir, e.name)) : /\.tsx?$/.test(e.name) ? [join(dir, e.name)] : [],
  );
const IMPORT = /^\s*import\s+(type\s+)?(?:[^"';]*?\sfrom\s+)?["']([^"']+)["']/gm;

it("imports respect the dependency rule and only src/map imports leaflet as a value", () => {
  const violations: string[] = [];
  for (const file of files(SRC)) {
    const rel = relative(SRC, file);
    const home = rel.split("/")[0];
    for (const [, typeOnly, spec] of readFileSync(file, "utf8").matchAll(IMPORT)) {
      if (spec.startsWith(".")) {
        const target = relative(SRC, resolve(dirname(file), spec)).split("/")[0];
        if (FORBIDDEN[home]?.includes(target))
          violations.push(`${rel} imports ${spec} (${home}/ must not import ${target}/)`);
      } else if (spec === "leaflet" && !typeOnly && home !== "map") {
        violations.push(`${rel} imports leaflet as a value (only map/ may)`);
      }
    }
  }
  expect(violations).toEqual([]);
});
