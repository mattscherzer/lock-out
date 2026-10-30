// Place search over the static gazetteer: pure functions, no DOM, no network.
// A place (postcode, street, station or area name) maps to one or more areas, largest share first.

import type { Areas, Gazetteer, Index, Kind, Place, Row, Share, StreetsFile } from "./types.ts";

// Proposals to tune after the usability test (#67).
export const MAX_AREAS_PER_RESULT = 3; // the rest sit behind one "+N more areas" row
export const MAX_ROWS = { mobile: 8, wide: 10 };

// "01 - Mitte" -> "Mitte"
export const bezirkLabel = (s: string) => s.replace(/^\d+\s*-\s*/, "");

const UMLAUTS: Record<string, string> = { ä: "ae", ö: "oe", ü: "ue" };

// Plain fold drops diacritics ("müller" -> "muller"); expanded writes umlauts out ("mueller").
export const fold = (s: string, expandUmlauts = false) =>
  (expandUmlauts ? s.toLowerCase().replace(/[äöü]/g, (c) => UMLAUTS[c]) : s.toLowerCase())
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ß/g, "ss")
    .replace(/str\./g, "strasse")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

// English speakers type "muller", Germans "mueller": both must find "Müller". A place keeps both forms
// and a query matches against either, so "neue" still doesn't match "Neukölln".
const foldBoth = (s: string) => [...new Set([fold(s), fold(s, true)])];

// "Invalidenstraße 43": there is no house-number data, so search the street part and say so.
export function parseQuery(q: string) {
  const m = q.trim().match(/^(.*\D)\s+\d+(?:\s*[-/]\s*\d+)?\s*[a-z]?$/i);
  return m ? { text: m[1], houseNumber: true } : { text: q, houseNumber: false };
}

const placeIn = (areas: Areas, label: string, kind: Kind, list: Share[], extra: Partial<Place> = {}): Place => ({
  label,
  kind,
  keys: foldBoth(label),
  areas: list.filter(([id]) => id in areas).map(([id, pct]) => ({ id, pct })).sort((a, b) => b.pct - a.pct), // largest share first; the file does not guarantee it
  ...extra,
});
const kept = (places: Place[]) => places.filter((p) => p.areas.length > 0);

// areas: id -> {name, bzr_name}. Gazetteer ids unknown to the map are dropped.
// Streets come separately (addStreets) because their file is fetched on the first search.
export function buildIndex(gazetteer: Gazetteer, areas: Areas): Index {
  const place = (label: string, kind: Kind, list: Share[], extra: Partial<Place> = {}) => placeIn(areas, label, kind, list, extra);
  const byName = Object.entries(areas)
    .map(([id, a]) => place(a.name, "area", [[id, 100]], { keys: foldBoth(`${a.name} ${a.bzr_name}`), detail: a.bzr_name }))
    .sort((a, b) => a.label.localeCompare(b.label, "de"));
  return {
    postcode: kept(Object.entries(gazetteer.plz).map(([plz, list]) => place(plz, "postcode", list))),
    station: kept(gazetteer.stations.map(([name, kind, id, lat, lon]) => place(name, "station", [[id, 100]], { sub: kind, ll: [lat, lon] }))),
    street: [],
    area: byName,
  };
}

// file: the fetched gazetteer_streets.json. An entry's areas are [[index into ids, pct], ...].
// Fills index.street in place.
export function addStreets(index: Index, file: StreetsFile | null | undefined, areas: Areas) {
  const { ids, streets } = file ?? {};
  if (!Array.isArray(ids) || !streets) throw new Error("gazetteer_streets.json: unexpected shape");
  const places: Place[] = [];
  for (const [bezirk, types] of Object.entries(streets))
    for (const [type, names] of Object.entries(types))
      for (const [name, coded] of Object.entries(names)) {
        places.push(placeIn(areas, name, "street", coded.map(([i, pct]): Share => [ids[i], pct]), { type, bezirk }));
      }
  index.street = kept(places);
}

export const placeKey = (p: Place) => `${p.kind}|${p.label}|${p.bezirk}|${p.type}|${p.ll}`; // one name can repeat per Bezirk and type, and per station

// Rows for the dropdown: a place in several areas gets a label row, then one row per area (largest share first)
// and, past MAX_AREAS_PER_RESULT, a "+N more" row until its key is in expanded. overflow: results were cut at limit.
export function buildRows(places: Place[], limit: number, expanded: ReadonlySet<string> = new Set()) {
  const rows: Row[] = [];
  let extra = 0; // rows an expanded place adds beyond its cap: asking for all areas must not cut them
  for (const place of places.slice(0, limit)) { // each place gives at least one row, so this only trims work; the cut below is the cap
    const multi = place.areas.length > 1;
    const open = expanded.has(placeKey(place));
    const shown = open ? place.areas : place.areas.slice(0, MAX_AREAS_PER_RESULT);
    if (open) extra += Math.max(0, shown.length - MAX_AREAS_PER_RESULT);
    if (multi) rows.push({ type: "label", place });
    for (const { id, pct } of shown) rows.push({ type: "area", place, id, pct: multi ? pct : null });
    if (shown.length < place.areas.length) rows.push({ type: "more", place, n: place.areas.length - shown.length });
  }
  const cut = rows.slice(0, limit + extra);
  if (cut.at(-1)?.type === "label") cut.pop(); // a label with nothing under it
  return { rows: cut, overflow: places.length > limit || rows.length > limit + extra };
}

const hits = (ns: string[], test: (k: string, n: string) => boolean) => (p: Place) => p.keys.some((k) => ns.some((n) => test(k, n)));
// Open: prefix matches first, then area, station, street, other named places, postcode; shorter names first.
export const isPlainStreet = (p: Place) => p.kind === "street" && (!p.type || p.type === "Street");
const kindOrder = (p: Place) => (p.kind === "area" ? 0 : p.kind === "station" ? 1 : isPlainStreet(p) ? 2 : p.kind === "street" ? 3 : 4);
export function sortPlaces(places: Place[], ns: string[]) {
  const prefix = hits(ns, (k, n) => k.startsWith(n));
  return places
    .map((p) => ({ p, pre: Number(!prefix(p)) }))
    .sort((a, b) => a.pre - b.pre || kindOrder(a.p) - kindOrder(b.p) || a.p.keys[0].length - b.p.keys[0].length)
    .map(({ p }) => p);
}

export function searchPlaces(index: Index, text: string) {
  const ns = foldBoth(text);
  if (ns[0].length < 2) return [];
  if (/^\d+$/.test(ns[0])) return sortPlaces(index.postcode.filter(hits(ns, (k, n) => k.startsWith(n))), ns);
  const matching = (places: Place[]) => places.filter(hits(ns, (k, n) => k.includes(n)));
  return sortPlaces([...matching(index.area), ...matching(index.station), ...matching(index.street)], ns);
}
