// Place search over the static gazetteer: pure functions, no DOM, no network.
// A place (postcode, street, station or area name) maps to one or more areas, largest share first.

import type { Areas, Gazetteer, Index, Kind, Place, Row, Share, StreetsFile } from "./types.ts";

const PER_PLACE = 6; // areas listed per place; the rest become "+N more areas"
const LIMITS: Record<Kind, number> = { postcode: 3, station: 4, street: 3, area: 8 };

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
  areas: list.filter(([id]) => id in areas).map(([id, pct]) => ({ id, pct })),
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

// One row per area of a place, so the dropdown itself is the pick-an-area step.
// pct is null for a place in a single area; more is set on the last row only.
const placeRows = (place: Place): Row[] => {
  const shown = place.areas.slice(0, PER_PLACE);
  return shown.map(({ id, pct }, i) => ({
    place,
    id,
    pct: place.areas.length > 1 ? pct : null,
    more: i === shown.length - 1 ? place.areas.length - shown.length : 0,
  }));
};

const hits = (ns: string[], test: (k: string, n: string) => boolean) => (p: Place) => p.keys.some((k) => ns.some((n) => test(k, n)));
const closest = (ns: string[]) => {
  const prefix = hits(ns, (k, n) => k.startsWith(n));
  return (a: Place, b: Place) => Number(prefix(b)) - Number(prefix(a)) || a.keys[0].length - b.keys[0].length;
};

export function searchPlaces(index: Index, text: string) {
  const ns = foldBoth(text);
  if (ns[0].length < 2) return [];
  const take = (kind: Kind, places: Place[]) => places.slice(0, LIMITS[kind]);
  if (/^\d+$/.test(ns[0])) return take("postcode", index.postcode.filter(hits(ns, (k, n) => k.startsWith(n))));
  const matching = (places: Place[]) => places.filter(hits(ns, (k, n) => k.includes(n)));
  return [
    ...take("station", matching(index.station)),
    ...take("street", matching(index.street).sort(closest(ns))),
    ...take("area", matching(index.area)),
  ];
}

export const searchRows = (index: Index, text: string) => searchPlaces(index, text).flatMap(placeRows);
