import { afterEach, describe, expect, it } from "vitest";
import { CLOSED, FULL_GAP_PX, higherPx, loweredPx, settle, stopOffsets } from "./sheetStops.ts";

const height = window.innerHeight;
afterEach(() => {
  window.innerHeight = height;
});

describe("settle", () => {
  it("picks the nearest stop", () => {
    expect(settle([600, 300, 16, 700], 330)).toBe(1);
    expect(settle([600, 300, 16, 700], 100)).toBe(2);
  });

  it("settles on CLOSED past the last stop", () => {
    expect(settle([600, 300, 16, 700], 900)).toBe(CLOSED);
  });
});

describe("stopOffsets", () => {
  it("lists lowered, higher, full, closed", () => {
    window.innerHeight = 800;
    expect(stopOffsets(780)).toEqual([780 - loweredPx(), 780 - higherPx(), FULL_GAP_PX, 780]);
  });

  it("never inverts lowered and higher on a short landscape viewport", () => {
    window.innerHeight = 300;
    expect(higherPx()).toBeGreaterThan(loweredPx());
  });
});
