import { readFileSync } from "node:fs";
import { afterEach, expect, it, vi } from "vitest";
import { PALETTE_KEY, readPalette, writePalette } from "./palette.ts";

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
  delete document.documentElement.dataset.palette;
});

it("stores and restores the choice", () => {
  writePalette(true);
  expect(document.documentElement.dataset.palette).toBe("cb");
  expect(readPalette()).toBe(true);
  writePalette(false);
  expect(document.documentElement.dataset.palette).toBeUndefined();
  expect(readPalette()).toBe(false);
});

it("still applies the palette when storage throws", () => {
  vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
    throw new Error("blocked");
  });
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new Error("blocked");
  });
  expect(readPalette()).toBe(false);
  writePalette(true);
  expect(document.documentElement.dataset.palette).toBe("cb");
});

it("uses the same key as the inline script in index.html", () => {
  expect(readFileSync("index.html", "utf8")).toContain(`getItem("${PALETTE_KEY}") === "cb"`);
});
