import { describe, expect, it } from "vitest";
import type { Context } from "../search/types.ts";
import { initialSelection, selection } from "./selection.ts";

const ctx: Context = { kind: "station", label: "Ostkreuz", pct: null, ll: [52.5, 13.4] };
const open = selection(initialSelection, { type: "select", id: "a", context: ctx });

describe("selection", () => {
  it("select opens the card and sets the pin", () => {
    expect(open).toMatchObject({ selected: "a", cardOpen: true, pin: ctx });
  });

  it("selecting by name replaces the pin with null", () => {
    expect(selection(open, { type: "select", id: "b", context: null })).toMatchObject({
      selected: "b",
      pin: null,
    });
  });

  it("clear drops the selection, the card and the pin", () => {
    expect(selection(open, { type: "clear" })).toMatchObject({
      selected: null,
      cardOpen: false,
      pin: null,
    });
  });

  it("closeCard keeps the selection and the pin", () => {
    expect(selection(open, { type: "closeCard" })).toMatchObject({
      selected: "a",
      cardOpen: false,
      pin: ctx,
    });
  });

  it("highlight only sets the highlighted area", () => {
    expect(selection(open, { type: "highlight", id: "b" })).toEqual({ ...open, highlighted: "b" });
  });
});
