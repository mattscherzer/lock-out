// Place search over the static gazetteer: pure functions, no DOM, no network.
// A place (postcode, street, station or area name) maps to one or more areas, largest share first.

const PER_PLACE = 6; // areas listed per place; the rest become "+N more areas"
const LIMITS = { postcode: 3, station: 4, street: 3, area: 8 };

export const fold = (s) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ß/g, "ss")
    .replace(/str\./g, "strasse")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

// "Invalidenstraße 43": there is no house-number data, so search the street part and say so.
export function parseQuery(q) {
  const m = q.trim().match(/^(.*\D)\s+\d+(?:\s*[-/]\s*\d+)?\s*[a-z]?$/i);
  return m ? { text: m[1], houseNumber: true } : { text: q, houseNumber: false };
}

// areas: id -> {name, bzr_name}. Gazetteer ids unknown to the map are dropped.
export function buildIndex(gazetteer, areas) {
  const place = (label, kind, list, extra = {}) => ({
    label,
    kind,
    key: fold(label),
    areas: list.filter(([id]) => id in areas).map(([id, pct]) => ({ id, pct })),
    ...extra,
  });
  const kept = (places) => places.filter((p) => p.areas.length > 0);
  const byName = Object.entries(areas)
    .map(([id, a]) => place(a.name, "area", [[id, 100]], { key: fold(`${a.name} ${a.bzr_name}`), detail: a.bzr_name }))
    .sort((a, b) => a.label.localeCompare(b.label, "de"));
  return {
    postcode: kept(Object.entries(gazetteer.plz).map(([plz, list]) => place(plz, "postcode", list))),
    station: kept(gazetteer.stations.map(([name, kind, id, lat, lon]) => place(name, "station", [[id, 100]], { sub: kind, ll: [lat, lon] }))),
    street: kept(Object.entries(gazetteer.streets).map(([name, list]) => place(name, "street", list))),
    area: byName,
  };
}

// One row per area of a place, so the dropdown itself is the pick-an-area step.
// pct is null for a place in a single area; more is set on the last row only.
const placeRows = (place) => {
  const shown = place.areas.slice(0, PER_PLACE);
  return shown.map(({ id, pct }, i) => ({
    place,
    id,
    pct: place.areas.length > 1 ? pct : null,
    more: i === shown.length - 1 ? place.areas.length - shown.length : 0,
  }));
};

const closest = (n) => (a, b) => Number(b.key.startsWith(n)) - Number(a.key.startsWith(n)) || a.key.length - b.key.length;

export function searchPlaces(index, text) {
  const n = fold(text);
  if (n.length < 2) return [];
  const take = (kind, places) => places.slice(0, LIMITS[kind]);
  if (/^\d+$/.test(n)) return take("postcode", index.postcode.filter((p) => p.key.startsWith(n)));
  const matching = (places) => places.filter((p) => p.key.includes(n));
  return [
    ...take("station", matching(index.station)),
    ...take("street", matching(index.street).sort(closest(n))),
    ...take("area", matching(index.area)),
  ];
}

export const searchRows = (index, text) => searchPlaces(index, text).flatMap(placeRows);
