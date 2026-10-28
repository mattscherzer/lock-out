import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./styles/index.css";
import { buildIndex } from "./search/places.js";
import { createSearchBox } from "./search/searchBox.js";

const getJson = (name) =>
  fetch(`${import.meta.env.BASE_URL}${name}`).then((res) => {
    if (!res.ok) throw new Error(`${name}: HTTP ${res.status}`);
    return res.json();
  });

const BRAND = "#2563EB";
const EMPTY_GAZETTEER = { plz: {}, streets: {}, stations: [] };

// Search is optional: a missing or malformed gazetteer (null here) leaves area-name search, not a broken map.
const loadGazetteer = () =>
  getJson("gazetteer.json")
    .then((g) => {
      if (!g.plz || !g.streets || !g.stations) throw new Error("gazetteer.json: unexpected shape");
      return g;
    })
    .catch((err) => {
      console.error("Street and station search unavailable:", err);
      return null;
    });

// CC-BY: the gazetteer's sources must be credited next to the map
const SEARCH_ATTRIBUTION = "Search: Amt für Statistik Berlin-Brandenburg (CC-BY 3.0), VBB";

const status = document.getElementById("count");
const map = L.map("map").setView([52.52, 13.405], 11);

try {
  const [fixture, areas, gazetteer] = await Promise.all([getJson("lookup_fixture.json"), getJson("areas.geojson"), loadGazetteer()]);
  // Attribution text lives in the fixture metadata so the UI and the data agree on it.
  const { police, osm } = fixture.metadata.attribution;
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: `<a href="https://www.openstreetmap.org/copyright">${osm}</a> | ${police} | ${SEARCH_ATTRIBUTION}`,
  }).addTo(map);

  const polygons = {};
  const layer = L.geoJSON(areas, {
    style: { color: BRAND, weight: 1, fillOpacity: 0.15 },
    onEachFeature: (feature, polygon) => {
      const area = fixture.areas[feature.properties.id];
      // element, not a string: Leaflet would parse a string as HTML
      const label = Object.assign(document.createElement("span"), { textContent: `${area.name} (${area.bzr_name})` });
      polygon.bindTooltip(label);
      polygons[feature.properties.id] = polygon;
    },
  }).addTo(map);

  map.fitBounds(layer.getBounds());
  // pin = "you searched here"; only stations have coordinates
  let pin;
  const showPlace = (id, place) => {
    pin?.remove();
    pin = place.ll
      ? L.circleMarker(place.ll, { radius: 7, color: "#fff", weight: 3, fillColor: BRAND, fillOpacity: 1, interactive: false })
          .bindTooltip(place.label, { permanent: true, direction: "top" })
          .addTo(map)
      : undefined;
    map.fitBounds(polygons[id].getBounds());
  };
  createSearchBox({
    input: document.getElementById("search-input"),
    list: document.getElementById("search-list"),
    index: buildIndex(gazetteer ?? EMPTY_GAZETTEER, fixture.areas),
    areas: fixture.areas,
    onSelect: showPlace,
  });
  const areaCount = layer.getLayers().length;
  status.textContent = `${areaCount} areas${gazetteer ? "" : " · street and station search unavailable"}`;
  status.dataset.count = areaCount; // read by manual/automated checks
} catch (err) {
  status.textContent = "Could not load map data";
  throw err;
}
