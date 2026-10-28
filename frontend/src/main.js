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

// Search is optional: without the gazetteer it still finds areas by name.
const loadGazetteer = () =>
  getJson("gazetteer.json").catch((err) => {
    console.warn("Place search limited to area names:", err);
    return { plz: {}, streets: {}, stations: [] };
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
    style: { color: "#2563EB", weight: 1, fillOpacity: 0.15 },
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
      ? L.circleMarker(place.ll, { radius: 7, color: "#fff", weight: 3, fillColor: "#2563EB", fillOpacity: 1, interactive: false })
          .bindTooltip(place.label, { permanent: true, direction: "top" })
          .addTo(map)
      : undefined;
    map.fitBounds(polygons[id].getBounds());
  };
  createSearchBox({
    input: document.getElementById("search-input"),
    list: document.getElementById("search-list"),
    index: buildIndex(gazetteer, fixture.areas),
    areas: fixture.areas,
    onSelect: showPlace,
  });
  const areaCount = layer.getLayers().length;
  status.textContent = `${areaCount} areas`;
  status.dataset.count = areaCount; // read by manual/automated checks
} catch (err) {
  status.textContent = "Could not load map data";
  throw err;
}
