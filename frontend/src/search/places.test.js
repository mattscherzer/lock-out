import { describe, expect, it } from "vitest";
import { buildIndex, fold, parseQuery, searchPlaces, searchRows } from "./places.js";

const areas = {
  A1: { name: "Stülerstraße", bzr_name: "Tiergarten Süd" },
  A2: { name: "Alexanderplatz", bzr_name: "Mitte" },
  A3: { name: "Boxhagener Platz", bzr_name: "Friedrichshain" },
};
const gazetteer = {
  plz: { 10115: [["A2", 70], ["A1", 30]], 10245: [["GONE", 100]] },
  streets: { "Frankfurter Allee": [["A3", 60], ["A2", 40]], "Invalidenstraße": [["A2", 100]] },
  stations: [["Ostbahnhof", "S", "A3", 52.5, 13.4]],
};
const index = buildIndex(gazetteer, areas);
const labels = (q) => searchPlaces(index, q).map((p) => p.label);

describe("fold", () => {
  it("folds case, umlauts, ß and 'str.'", () => {
    expect(fold("Invalidenstr.")).toBe("invalidenstrasse");
    expect(fold("Stülerstraße")).toBe("stulerstrasse");
  });
});

describe("parseQuery", () => {
  it("splits a trailing house number off a street", () => {
    expect(parseQuery("Invalidenstraße 43a")).toEqual({ text: "Invalidenstraße", houseNumber: true });
  });
  it("leaves postcodes and plain names alone", () => {
    expect(parseQuery("10115")).toEqual({ text: "10115", houseNumber: false });
    expect(parseQuery("Frankfurter Allee")).toEqual({ text: "Frankfurter Allee", houseNumber: false });
  });
});

describe("searchPlaces", () => {
  it("finds a street spanning several areas, largest share first", () => {
    const [street] = searchPlaces(index, "frankfurter");
    expect(street.kind).toBe("street");
    expect(street.areas).toEqual([{ id: "A3", pct: 60 }, { id: "A2", pct: 40 }]);
  });
  it("finds a station as a single area", () => {
    expect(searchPlaces(index, "ostbahnhof")[0]).toMatchObject({ kind: "S station", areas: [{ id: "A3", pct: 100 }] });
  });
  it("matches a postcode by prefix", () => {
    expect(labels("101")).toEqual(["10115"]);
  });
  it("drops places whose areas are all unknown to the map", () => {
    expect(labels("10245")).toEqual([]);
  });
  it("still finds areas by area or district name", () => {
    expect(labels("friedrichshain")).toEqual(["Boxhagener Platz"]);
    expect(labels("alexander")).toEqual(["Alexanderplatz"]);
  });
  it("lists a multi-area street as one row per area with its share", () => {
    const rows = searchRows(index, "frankfurter");
    expect(rows.map(({ id, pct, more }) => [id, pct, more])).toEqual([["A3", 60, 0], ["A2", 40, 0]]);
  });
  it("gives a single-area place no share, and a station its coordinates", () => {
    const [row] = searchRows(index, "ostbahnhof");
    expect(row.pct).toBeNull();
    expect(row.place.ll).toEqual([52.5, 13.4]);
  });
  it("caps the areas per place and counts the rest on the last row", () => {
    const wide = Object.fromEntries(Array.from({ length: 8 }, (_, i) => [`W${i}`, { name: `W${i}`, bzr_name: "x" }]));
    const idx = buildIndex({ plz: { 10999: Object.keys(wide).map((id) => [id, 10]) }, streets: {}, stations: [] }, wide);
    const rows = searchRows(idx, "10999");
    expect(rows).toHaveLength(6);
    expect(rows.map((r) => r.more)).toEqual([0, 0, 0, 0, 0, 2]);
  });
  it("returns nothing for a one-letter query", () => {
    expect(labels("a")).toEqual([]);
  });
});
