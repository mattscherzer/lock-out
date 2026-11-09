import { readFileSync } from "node:fs";
import { afterEach, expect, it, vi } from "vitest";
import { PALETTE_KEY, palette, writePalette } from "./palette.ts";

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
  delete document.documentElement.dataset.palette;
});

it("sets the attribute and stores the choice", () => {
  writePalette(true);
  expect(document.documentElement.dataset.palette).toBe("cb");
  expect(palette()).toBe(true);
  expect(localStorage.getItem(PALETTE_KEY)).toBe("cb");
  writePalette(false);
  expect(document.documentElement.dataset.palette).toBeUndefined();
  expect(palette()).toBe(false);
  expect(localStorage.getItem(PALETTE_KEY)).toBeNull();
});

it("still applies the palette when storage throws", () => {
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new Error("blocked");
  });
  writePalette(true);
  expect(document.documentElement.dataset.palette).toBe("cb");
});

it("uses the same key as the inline script in index.html", () => {
  expect(readFileSync("index.html", "utf8")).toContain(`getItem("${PALETTE_KEY}") === "cb"`);
});
