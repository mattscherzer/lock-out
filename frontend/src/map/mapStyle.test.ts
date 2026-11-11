import { beforeEach, expect, it } from "vitest";
import { areaStyle, emphasisOf, HATCH_ID, HATCH_LIFTED_ID } from "./mapStyle.ts";

beforeEach(() => {
  const tokens = {
    "--map-fill-light": "0.3",
    "--map-fill-dark": "0.2",
    "--map-fill-boost": "0.32",
    "--map-fill-max": "0.9",
    "--map-stroke-light": "1",
    "--map-stroke-dark": "0.7",
    "--dash-limited": "4 2.5",
  };
  for (const [k, v] of Object.entries(tokens)) document.documentElement.style.setProperty(k, v);
  delete document.documentElement.dataset.theme;
});

it("rests at the light fill, lifts by the boost on hover and selection", () => {
  expect(areaStyle("high", "rest").fillOpacity).toBe(0.3);
  expect(areaStyle("high", "hover").fillOpacity).toBeCloseTo(0.62);
  expect(areaStyle("high", "selected")).toMatchObject({
    weight: 2,
    fillOpacity: expect.closeTo(0.62),
  });
  expect(areaStyle("high", "rest").weight).toBe(1);
});

it("caps the lifted fill and uses the dark values in the dark theme", () => {
  document.documentElement.style.setProperty("--map-fill-boost", "0.9");
  expect(areaStyle("low", "hover").fillOpacity).toBe(0.9);
  document.documentElement.dataset.theme = "dark";
  expect(areaStyle("low", "rest")).toMatchObject({ fillOpacity: 0.2, opacity: 0.7 });
});

it("draws limited-data areas hatched and dashed, never a flat fill", () => {
  expect(areaStyle("limited", "rest")).toMatchObject({
    fillColor: `url(#${HATCH_ID})`,
    dashArray: "4 2.5",
    className: "stroke-risk-no-data",
  });
  expect(areaStyle("medium", "rest").dashArray).toBeUndefined();
  expect(areaStyle("limited", "selected").fillColor).toBe(`url(#${HATCH_LIFTED_ID})`);
  expect(areaStyle("limited", "hover").fillColor).toBe(`url(#${HATCH_LIFTED_ID})`);
});

const none = { active: null, highlighted: null, hovered: null };

it("emphasis is selected only for the active area", () => {
  expect(emphasisOf("a", { ...none, active: "a" })).toBe("selected");
  expect(emphasisOf("b", { ...none, active: "a" })).toBe("rest");
});

it("an inactive selection has no emphasis", () => {
  expect(emphasisOf("a", none)).toBe("rest");
});

it("emphasis lifts the highlighted or hovered area", () => {
  expect(emphasisOf("a", { ...none, highlighted: "a" })).toBe("hover");
  expect(emphasisOf("b", { ...none, hovered: "b" })).toBe("hover");
});

it("a highlight or hover never overrides the active area", () => {
  expect(emphasisOf("a", { active: "a", highlighted: "a", hovered: "a" })).toBe("selected");
});
