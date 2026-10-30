import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./styles/index.css";
import type { FeatureCollection } from "geojson";
import { createRoot } from "react-dom/client";
import { AreaSearch, type Context } from "./search/AreaSearch.tsx";
import { addStreets, buildIndex } from "./search/places.ts";
import type { Fixture, Gazetteer, StreetsFile } from "./search/types.ts";

const getJson = <T,>(name: string): Promise<T> =>
  fetch(`${import.meta.env.BASE_URL}${name}`).then((res) => {
    if (!res.ok) throw new Error(`${name}: HTTP ${res.status}`);
    return res.json();
  });

const BRAND = "#2563EB";
const AREA_STYLE = { color: BRAND, weight: 1, fillOpacity: 0.15 };
const SELECTED_STYLE = { color: BRAND, weight: 3, fillOpacity: 0.4 };
const EMPTY_GAZETTEER: Gazetteer = { plz: {}, stations: [] };

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

// CC-BY: the gazetteer's sources must be credited next to the map
const SEARCH_ATTRIBUTION = "Search: Amt für Statistik Berlin-Brandenburg (CC-BY 3.0), VBB";

const status = document.getElementById("status")!;
const map = L.map("map", { zoomControl: false }).setView([52.52, 13.405], 11);
L.control.zoom({ position: "bottomright" }).addTo(map);

try {
  const [fixture, areas, gazetteer] = await Promise.all([
    getJson<Fixture>("lookup_fixture.json"),
    getJson<FeatureCollection>("areas.geojson"),
    loadGazetteer(),
  ]);
  // Attribution text lives in the fixture metadata so the UI and the data agree on it.
  const { police, osm } = fixture.metadata.attribution;
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: `<a href="https://www.openstreetmap.org/copyright">${osm}</a> | ${police} | ${SEARCH_ATTRIBUTION}`,
  }).addTo(map);

  const polygons: Record<string, L.Polygon> = {};
  const layer = L.geoJSON(areas, {
    style: AREA_STYLE,
    onEachFeature: (feature, polygon) => {
      const area = fixture.areas[feature.properties.id as string];
      // element, not a string: Leaflet would parse a string as HTML
      const label = Object.assign(document.createElement("span"), { textContent: `${area.name} (${area.bzr_name})` });
      polygon.bindTooltip(label);
      polygons[feature.properties.id as string] = polygon as L.Polygon;
    },
  }).addTo(map);

  map.fitBounds(layer.getBounds());
  // pin = "you searched here"; only stations have coordinates
  let pin: L.CircleMarker | undefined;
  let selected: string | null = null;
  let closeSignal = 0;
  const select = (id: string | null, context: Context | null) => {
    if (selected) polygons[selected].setStyle(AREA_STYLE);
    pin?.remove();
    pin = context?.ll
      ? L.circleMarker(context.ll, { radius: 7, color: "#fff", weight: 3, fillColor: BRAND, fillOpacity: 1, interactive: false })
          .bindTooltip(context.label, { permanent: true, direction: "top" })
          .addTo(map)
      : undefined;
    selected = id;
    if (id) polygons[id].setStyle(SELECTED_STYLE).bringToFront();
    renderSearch();
  };
  // a tap on the map closes the list; a tap on an area also selects it
  map.on("click", () => {
    closeSignal++;
    renderSearch();
  });
  Object.entries(polygons).forEach(([id, polygon]) => polygon.on("click", () => select(id, null)));
  const notes = new Set(gazetteer ? [] : ["station and postcode search unavailable"]);
  const showStatus = () => (status.textContent = [...notes].join(" · "));
  const index = buildIndex(gazetteer ?? EMPTY_GAZETTEER, fixture.areas);
  const searchRoot = createRoot(document.getElementById("search")!);
  const renderSearch = () =>
    searchRoot.render(
      <AreaSearch
        index={index}
        areas={fixture.areas}
        selected={selected}
        onSelect={(id, context) => {
          select(id, context);
          map.fitBounds(polygons[id].getBounds());
        }}
        onClear={() => select(null, null)}
        closeSignal={closeSignal}
        // streets are the bulk of the lookup: fetched when the user first focuses the search, not before the map
        loadStreets={() =>
          getJson<StreetsFile>("gazetteer_streets.json")
            .then((file) => addStreets(index, file, fixture.areas))
            .then(() => notes.delete("street search unavailable"))
            .catch((err) => {
              console.error("Street search unavailable:", err);
              notes.add("street search unavailable");
              throw err; // the search box retries on the next focus
            })
                .finally(showStatus)}
      />,
    );
  renderSearch();
  showStatus();
} catch (err) {
  status.textContent = "Could not load map data";
  throw err;
}
