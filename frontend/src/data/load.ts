import type { FeatureCollection } from "geojson";
import type { Lookup } from "../domain/lookup.ts";
import type { Gazetteer, StreetsFile } from "./files.ts";

const getJson = <T>(name: string): Promise<T> =>
  fetch(`${import.meta.env.BASE_URL}${name}`).then((res) => {
    if (!res.ok) throw new Error(`${name}: HTTP ${res.status}`);
    return res.json();
  });

// Search is optional: a missing or malformed gazetteer (null here) leaves area-name search, not a broken map.
const loadGazetteer = () =>
  getJson<Gazetteer>("gazetteer.json")
    .then((g) => {
      if (!g.plz || !g.stations) throw new Error("gazetteer.json: unexpected shape");
      return g;
    })
    .catch((err) => {
      console.error("Street and station search unavailable:", err);
      return null;
    });

export type AppData = { lookup: Lookup; areas: FeatureCollection; gazetteer: Gazetteer | null };

export const loadAppData = async (): Promise<AppData> => {
  const [lookup, areas, gazetteer] = await Promise.all([
    getJson<Lookup>("lookup_schema_v1.json"),
    getJson<FeatureCollection>("areas.geojson"),
    loadGazetteer(),
  ]);
  // the map and the card read these by id: fail here, with a message, not in a render
  if (!lookup.metadata?.attribution) throw new Error("lookup: metadata.attribution is missing");
  for (const { properties } of areas.features)
    if (!(properties?.id in lookup.areas))
      throw new Error(`areas.geojson: feature ${properties?.id} has no record in the lookup`);
  return { lookup, areas, gazetteer };
};

export const loadStreets = () => getJson<StreetsFile>("gazetteer_streets.json");
