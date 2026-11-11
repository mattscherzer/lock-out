export type PlaceKind = "postcode" | "station" | "street" | "area";
export type Place = {
  label: string;
  kind: PlaceKind;
  keys: string[];
  areas: { id: string; pct: number }[];
  sub?: string;
  ll?: [number, number];
  detail?: string;
  type?: string; // street type, e.g. "Water"; streets only
  bezirk?: string; // streets only: one name can exist in several Bezirke
};
// label: not selectable, heads the areas of one place; more: expands the areas past the cap
export type Row =
  | { type: "label"; place: Place }
  | { type: "area"; place: Place; id: string; pct: number | null }
  | { type: "more"; place: Place; n: number };
export type Index = Record<PlaceKind, Place[]>;

// How the area was found; null when the user picked an area by name.
export type Context = { kind: PlaceKind; label: string; pct: number | null; ll?: [number, number] };
