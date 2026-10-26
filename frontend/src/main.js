import L from "leaflet";
import "leaflet/dist/leaflet.css";

const getJson = (name) =>
  fetch(`${import.meta.env.BASE_URL}${name}`).then((res) => {
    if (!res.ok) throw new Error(`${name}: HTTP ${res.status}`);
    return res.json();
  });

const status = document.getElementById("count");
const map = L.map("map").setView([52.52, 13.405], 11);

try {
  const [fixture, areas] = await Promise.all([getJson("lookup_fixture.json"), getJson("areas.geojson")]);
  // Attribution text lives in the fixture metadata so the UI and the data agree on it.
  const { police, osm } = fixture.metadata.attribution;
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: `<a href="https://www.openstreetmap.org/copyright">${osm}</a> | ${police}`,
  }).addTo(map);

  const layer = L.geoJSON(areas, {
    style: { color: "#2563EB", weight: 1, fillOpacity: 0.15 },
    onEachFeature: (feature, polygon) => {
      const area = fixture.areas[feature.properties.id];
      // element, not a string: Leaflet would parse a string as HTML
      const label = Object.assign(document.createElement("span"), { textContent: `${area.name} (${area.bzr_name})` });
      polygon.bindTooltip(label);
    },
  }).addTo(map);

  map.fitBounds(layer.getBounds());
  const areaCount = layer.getLayers().length;
  status.textContent = `${areaCount} areas`;
  status.dataset.count = areaCount; // read by manual/automated checks
} catch (err) {
  status.textContent = "Could not load map data";
  throw err;
}
