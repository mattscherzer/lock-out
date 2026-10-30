import { describe, expect, it } from "vitest";
import { addStreets, buildIndex, fold, parseQuery, buildRows, searchPlaces, sortPlaces, bezirkLabel, MAX_AREAS_PER_RESULT, placeKey } from "./places.ts";
import type { Gazetteer, Place, StreetsFile } from "./types.ts";

const areas = {
  A1: { name: "Stülerstraße", bzr_name: "Tiergarten Süd" },
  A2: { name: "Alexanderplatz", bzr_name: "Mitte" },
  A3: { name: "Boxhagener Platz", bzr_name: "Friedrichshain" },
};
const gazetteer: Gazetteer = {
  plz: { 10115: [["A2", 70], ["A1", 30]], 10245: [["GONE", 100]] },
  stations: [["Ostbahnhof", "S", "A3", 52.5, 13.4]],
};
// gazetteer_streets.json shape: areas are [[index into ids, pct], ...]
const IDS = ["A1", "A2", "A3"];
const streetFile = (streets: StreetsFile["streets"]): StreetsFile => ({ ids: IDS, streets });
const indexWith = (streets: StreetsFile["streets"], g: Gazetteer = { plz: {}, stations: [] }) => {
  const idx = buildIndex(g, areas);
  addStreets(idx, streetFile(streets), areas);
  return idx;
};
const index = indexWith({ Friedrichshain: { Street: { "Frankfurter Allee": [[2, 60], [1, 40]] } }, Mitte: { Street: { "Invalidenstraße": [[1, 100]] } } }, gazetteer);
const labels = (q: string) => searchPlaces(index, q).map((p) => p.label);

describe("fold", () => {
  it("folds case, umlauts, ß and 'str.'", () => {
    expect(fold("Invalidenstr.")).toBe("invalidenstrasse");
    expect(fold("Stülerstraße")).toBe("stulerstrasse");
  });
  it("can write umlauts out", () => {
    expect(fold("Müllerstraße", true)).toBe("muellerstrasse");
  });
});

describe("parseQuery", () => {
  it("treats a house-number range or fraction as a house number", () => {
    expect(parseQuery("Hauptstraße 5-6").houseNumber).toBe(true);
    expect(parseQuery("Hauptstraße 5/6")).toEqual({ text: "Hauptstraße", houseNumber: true });
  });
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
    expect(searchPlaces(index, "ostbahnhof")[0]).toMatchObject({ kind: "station", sub: "S", areas: [{ id: "A3", pct: 100 }] });
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
  it("lists a multi-area street as a label row, then one row per area with its share", () => {
    const { rows } = buildRows(searchPlaces(index, "frankfurter"), 10);
    expect(rows.map((r) => [r.type, "id" in r ? r.id : null, "pct" in r ? r.pct : null])).toEqual([["label", null, null], ["area", "A3", 60], ["area", "A2", 40]]);
  });
  it("gives a single-area place no label row and no share, and a station its coordinates", () => {
    const { rows } = buildRows(searchPlaces(index, "ostbahnhof"), 10);
    expect(rows.map((r) => r.type)).toEqual(["area"]);
    expect(rows[0]).toMatchObject({ pct: null, place: { ll: [52.5, 13.4] } });
  });
  it("caps the areas per place with a +N more row, which expands in place", () => {
    const wide = Object.fromEntries(Array.from({ length: 8 }, (_, i) => [`W${i}`, { name: `W${i}`, bzr_name: "x" }]));
    const places = searchPlaces(buildIndex({ plz: { 10999: Object.keys(wide).map((id) => [id, 10]) }, stations: [] }, wide), "10999");
    const { rows } = buildRows(places, 10);
    expect(rows.map((r) => r.type)).toEqual(["label", ...Array(MAX_AREAS_PER_RESULT).fill("area"), "more"]);
    expect(rows.at(-1)).toMatchObject({ n: 5 });
    expect(buildRows(places, 20, new Set([placeKey(places[0])])).rows).toHaveLength(9);
  });
  it("cuts at the row limit, flags overflow, and never ends on a bare label", () => {
    const wide = Object.fromEntries(["W1", "W2"].map((id) => [id, { name: id, bzr_name: "x" }]));
    const idx = buildIndex({ plz: { 10001: [["W1", 60], ["W2", 40]], 10002: [["W1", 60], ["W2", 40]] }, stations: [] }, wide);
    const places = searchPlaces(idx, "1000");
    expect(buildRows(places, 3)).toMatchObject({ overflow: true, rows: [{ type: "label" }, { type: "area" }, { type: "area" }] });
    expect(buildRows(places, 4).rows.at(-1)?.type).toBe("area"); // 4th row would be the second label
    expect(buildRows(places.slice(0, 1), 3).overflow).toBe(false);
  });
  it("trims a place that hits the row limit but keeps its +N more row", () => {
    const ids = ["W1", "W2", "W3", "W4", "W5"];
    const wide = Object.fromEntries(ids.map((id) => [id, { name: id, bzr_name: "x" }]));
    const plz = { 10001: ids.map((id, i) => [id, 50 - i] as [string, number]), 10002: ids.slice(0, 4).map((id, i) => [id, 50 - i] as [string, number]) };
    const { rows, overflow } = buildRows(searchPlaces(buildIndex({ plz, stations: [] }, wide), "1000"), 8);
    expect(rows.map((r) => r.type)).toEqual(["label", "area", "area", "area", "more", "label", "area", "more"]);
    expect(rows.at(-1)).toMatchObject({ n: 3 });
    expect(overflow).toBe(false);
  });
  it("keeps every area of an expanded place even past the row limit", () => {
    const ids = Array.from({ length: 10 }, (_, i) => `W${i}`);
    const wide = Object.fromEntries(ids.map((id) => [id, { name: id, bzr_name: "x" }]));
    const places = searchPlaces(buildIndex({ plz: { 10999: ids.map((id, i) => [id, 50 - i]) }, stations: [] }, wide), "10999");
    const { rows, overflow } = buildRows(places, 8, new Set([placeKey(places[0])]));
    expect(rows.filter((r) => r.type === "area")).toHaveLength(10);
    expect(overflow).toBe(false);
  });
  it("tells same-named stations apart", () => {
    const idx = buildIndex({ plz: {}, stations: [["Warschauer Str.", "S", "A1", 1, 2], ["Warschauer Str.", "S+U", "A2", 3, 4]] }, { A1: { name: "a", bzr_name: "x" }, A2: { name: "b", bzr_name: "x" } });
    const [one, two] = searchPlaces(idx, "warschauer");
    expect(placeKey(one)).not.toBe(placeKey(two));
  });
  it("shows the Bezirk without its number prefix", () => {
    expect(bezirkLabel("01 - Mitte")).toBe("Mitte");
    expect(bezirkLabel("Mitte")).toBe("Mitte");
  });
  it("orders a place's areas by share, whatever the file order", () => {
    const wide = { W1: { name: "W1", bzr_name: "x" }, W2: { name: "W2", bzr_name: "x" }, W3: { name: "W3", bzr_name: "x" } };
    const idx = buildIndex({ plz: { 10001: [["W1", 16], ["W2", 14], ["W3", 60]] }, stations: [] }, wide);
    expect(searchPlaces(idx, "10001")[0].areas.map((a) => a.pct)).toEqual([60, 16, 14]);
  });
  it("returns nothing for a one-letter query", () => {
    expect(labels("a")).toEqual([]);
  });
});

describe("ordering", () => {
  const streets = ["Frankfurter Allee", "Alte Allee", "Allee der Kosmonauten", "Allee Vier"];
  const idx = indexWith({ Mitte: { Street: Object.fromEntries(streets.map((s) => [s, [[0, 100]] as [number, number][]])), Water: { "Allee See": [[0, 100]] } } }, { plz: {}, stations: [["Allee Bahnhof", "S", "A2", 1, 2]] });
  it("puts prefix matches first, then station, street, other named places, shorter names first", () => {
    expect(searchPlaces(idx, "allee").map((p) => p.label)).toEqual(["Allee Bahnhof", "Allee Vier", "Allee der Kosmonauten", "Allee See", "Alte Allee", "Frankfurter Allee"]);
  });
  it("sorts postcodes after everything else", () => {
    const places = [{ kind: "postcode", label: "x", keys: ["x"] }, { kind: "street", label: "x", keys: ["x"] }, { kind: "area", label: "x", keys: ["x"] }] as Place[];
    expect(sortPlaces(places, ["x"]).map((p) => p.kind)).toEqual(["area", "street", "postcode"]);
  });
});

describe("umlaut spellings", () => {
  const idx = indexWith({ Mitte: { Street: { "Müllerstraße": [[0, 100]], "Neukölln Weg": [[1, 100]] } } }, { plz: {}, stations: [["Köln Platz", "S", "A3", 1, 2]] });
  const found = (q: string) => searchPlaces(idx, q).map((p) => p.label);
  it.each(["muller", "mueller", "müller", "MÜLLER"])("%s finds Müllerstraße", (q) => {
    expect(found(q)).toEqual(["Müllerstraße"]);
  });
  it("finds a station by either spelling", () => {
    expect(found("koeln")).toEqual(["Köln Platz"]);
    expect(found("koln")).toEqual(["Köln Platz"]);
  });
  it.each([["Märkisches Ufer", ["markisches", "maerkisches"]], ["Schöneberger Ufer", ["schoneberger", "schoeneberger"]]])(
    "%s is found by both spellings",
    (label, queries) => {
      const i = indexWith({ Mitte: { Street: { [label]: [[0, 100]] } } });
      for (const q of queries) expect(searchPlaces(i, q).map((p) => p.label)).toEqual([label]);
    },
  );
  it("does not merge ue into u", () => {
    expect(found("neue")).toEqual([]);
    expect(found("neuk")).toEqual(["Neukölln Weg"]);
  });
});

describe("streets from gazetteer_streets.json", () => {
  const idx = indexWith({
    Pankow: { Street: { Hauptstraße: [[0, 100]] }, Water: { "Hauptstraße See": [[1, 70], [2, 30]] } },
    Spandau: { Street: { Hauptstraße: [[2, 100]] }, Motorway: { "A 100 BAB Stadtring": [[1, 100]] } },
  });
  it("gives a name used in two Bezirke one place each, with its Bezirk and type", () => {
    const hits = searchPlaces(idx, "hauptstrasse").filter((p) => p.label === "Hauptstraße");
    expect(hits.map((p) => [p.bezirk, p.type, p.areas[0].id])).toEqual([["Pankow", "Street", "A1"], ["Spandau", "Street", "A3"]]);
  });
  it("shows type and Bezirk in the dropdown row", () => {
    const [row] = searchPlaces(idx, "stadtring");
    expect([row.type, row.bezirk]).toEqual(["Motorway", "Spandau"]);
  });
  it("reads index and share pairs into area ids", () => {
    const [lake] = searchPlaces(idx, "hauptstrasse see");
    expect(lake.areas).toEqual([{ id: "A2", pct: 70 }, { id: "A3", pct: 30 }]);
    expect(searchPlaces(idx, "stadtring")[0].areas).toEqual([{ id: "A2", pct: 100 }]);
  });
  it("keeps one place per Bezirk for a name used in five", () => {
    const five = indexWith(Object.fromEntries(["Mitte", "Pankow", "Spandau", "Lichtenberg", "Neukölln"].map((b) => [b, { Street: { Hauptstraße: [[0, 100]] as [number, number][] } }])));
    expect(five.street.map((p) => p.bezirk).sort()).toEqual(["Lichtenberg", "Mitte", "Neukölln", "Pankow", "Spandau"]);
  });
  it.each([[{ streets: {} }], [{ ids: [] }], [null]])("rejects a file of the wrong shape: %j", (file) => {
    expect(() => addStreets(buildIndex({ plz: {}, stations: [] }, areas), file as StreetsFile | null, areas)).toThrow("unexpected shape");
  });
  it("finds nothing before the streets are added", () => {
    expect(searchPlaces(buildIndex({ plz: {}, stations: [] }, areas), "hauptstrasse")).toEqual([]);
  });
});
