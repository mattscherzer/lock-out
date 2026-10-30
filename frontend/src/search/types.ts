export type Share = [id: string, pct: number];
export type Area = { name: string; bzr_name: string };
export type Areas = Record<string, Area>;
export type Station = [name: string, kind: string, id: string, lat: number, lon: number];
export type Gazetteer = { plz: Record<string, Share[]>; stations: Station[] };
// gazetteer_streets.json: shares are [index into ids, pct]; streets nest as bezirk -> street type -> name.
export type StreetsFile = { ids: string[]; streets: Record<string, Record<string, Record<string, [number, number][]>>> };

export type Kind = "postcode" | "station" | "street" | "area";
export type Place = {
  label: string;
  kind: Kind;
  keys: string[];
  areas: { id: string; pct: number }[];
  sub?: string;
  ll?: [number, number];
  detail?: string;
  type?: string; // street type, e.g. "Water"; streets only
  bezirk?: string; // streets only: one name can exist in several Bezirke
};
export type Row = { place: Place; id: string; pct: number | null; more: number };
export type Index = Record<Kind, Place[]>;
