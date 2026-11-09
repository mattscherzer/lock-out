import { afterEach, expect, it, vi } from "vitest";
import { palette, setPalette, subscribePalette } from "./palette.ts";

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
  delete document.documentElement.dataset.palette;
});

it("sets and clears the attribute", () => {
  setPalette(true);
  expect(document.documentElement.dataset.palette).toBe("cb");
  expect(palette()).toBe(true);
  setPalette(false);
  expect(document.documentElement.dataset.palette).toBeUndefined();
  expect(palette()).toBe(false);
});

it("notifies subscribers until they unsubscribe", () => {
  const fn = vi.fn();
  const off = subscribePalette(fn);
  setPalette(true);
  expect(fn).toHaveBeenCalledTimes(1);
  off();
  setPalette(false);
  expect(fn).toHaveBeenCalledTimes(1);
});

it("still applies the palette when storage throws", () => {
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new Error("blocked");
  });
  setPalette(true);
  expect(palette()).toBe(true);
});
