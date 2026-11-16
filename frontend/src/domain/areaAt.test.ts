import type { FeatureCollection } from "geojson";
import { expect, it } from "vitest";
import { buildAreaFinder } from "./areaAt.ts";

const ring = (x: number, y: number, size: number) => [
  [x, y],
  [x + size, y],
  [x + size, y + size],
  [x, y + size],
  [x, y],
];
// [lon, lat] as in GeoJSON: "a" is 13..13.1 / 52..52.1, "b" sits against its east edge, "donut" has a hole, "pair" is a MultiPolygon
const areas: FeatureCollection = {
  type: "FeatureCollection",
  features: [
    { type: "Feature", properties: { id: "a" }, geometry: { type: "Polygon", coordinates: [ring(13, 52, 0.1)] } },
    { type: "Feature", properties: { id: "b" }, geometry: { type: "Polygon", coordinates: [ring(13.1, 52, 0.1)] } },
    { type: "Feature", properties: { id: "donut" }, geometry: { type: "Polygon", coordinates: [ring(14, 52, 0.4), ring(14.1, 52.1, 0.2)] } },
    { type: "Feature", properties: { id: "pair" }, geometry: { type: "MultiPolygon", coordinates: [[ring(15, 52, 0.1)], [ring(15.5, 52, 0.1)]] } },
    { type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [ring(16, 52, 0.1)] } },
  ], // prettier-ignore
};
const at = buildAreaFinder(areas);

it("finds the area that contains the position (latitude first)", () => {
  expect(at(52.05, 13.05)).toBe("a");
  expect(at(52.05, 13.15)).toBe("b");
});

it("returns null outside every area, in a gap and for a swapped or invalid position", () => {
  expect(at(52.05, 12.9)).toBeNull(); // west of everything
  expect(at(52.05, 13.35)).toBeNull(); // gap between "b" and "donut"
  expect(at(52.5, 13.05)).toBeNull(); // north of "a"
  expect(at(13.05, 52.05)).toBeNull(); // longitude and latitude swapped
  expect(at(Number.NaN, 13.05)).toBeNull();
  expect(at(52.05, Number.POSITIVE_INFINITY)).toBeNull();
});

it("treats a point on a border as inside, and gives a shared border to the first area", () => {
  expect(at(52.05, 13)).toBe("a"); // west edge of "a"
  expect(at(52, 13.05)).toBe("a"); // south edge
  expect(at(52, 13)).toBe("a"); // corner
  expect(at(52.05, 13.1)).toBe("a"); // edge shared with "b"
});

it("leaves out the holes of a polygon", () => {
  expect(at(52.05, 14.05)).toBe("donut");
  expect(at(52.2, 14.2)).toBeNull(); // inside the hole
  expect(at(52.1, 14.2)).toBe("donut"); // on the hole's edge: still the ring
});

it("matches every part of a MultiPolygon", () => {
  expect(at(52.05, 15.05)).toBe("pair");
  expect(at(52.05, 15.55)).toBe("pair");
  expect(at(52.05, 15.3)).toBeNull();
});

it("skips features without an id and survives an empty collection", () => {
  expect(at(52.05, 16.05)).toBeNull();
  expect(buildAreaFinder({ type: "FeatureCollection", features: [] })(52, 13)).toBeNull();
});
