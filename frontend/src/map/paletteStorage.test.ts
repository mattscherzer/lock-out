import { readFileSync } from "node:fs";
import { afterEach, expect, it, vi } from "vitest";
import { PALETTE_KEY, rememberPalette } from "./paletteStorage.ts";

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

it("stores the choice and clears it again", () => {
  rememberPalette(true);
  expect(localStorage.getItem(PALETTE_KEY)).toBe("cb");
  rememberPalette(false);
  expect(localStorage.getItem(PALETTE_KEY)).toBeNull();
});

it("does not throw when storage is blocked", () => {
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new Error("blocked");
  });
  expect(() => rememberPalette(true)).not.toThrow();
});

it("uses the same key as the inline script in index.html", () => {
  expect(readFileSync("index.html", "utf8")).toContain(`getItem("${PALETTE_KEY}") === "cb"`);
});
