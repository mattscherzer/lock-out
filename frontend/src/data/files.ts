export type Share = [id: string, pct: number];
export type Station = [name: string, kind: string, id: string, lat: number, lon: number];
export type Gazetteer = { plz: Record<string, Share[]>; stations: Station[] };
// gazetteer_streets.json: shares are [index into ids, pct]; streets nest as bezirk -> street type -> name.
export type StreetsFile = {
  ids: string[];
  streets: Record<string, Record<string, Record<string, [number, number][]>>>;
};
