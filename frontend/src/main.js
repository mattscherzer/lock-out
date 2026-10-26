import L from "leaflet";
import "leaflet/dist/leaflet.css";

const [fixture, areas] = await Promise.all(
  ["lookup_fixture.json", "areas.geojson"].map((f) => fetch(`${import.meta.env.BASE_URL}${f}`).then((r) => r.json())),
);
const { police, osm } = fixture.metadata.attribution;

const map = L.map("map").setView([52.52, 13.405], 11);
L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: `${osm} | ${police}`,
}).addTo(map);

const layer = L.geoJSON(areas, {
  style: { color: "#2563EB", weight: 1, fillOpacity: 0.15 },
  onEachFeature: (f, l) => {
    const a = fixture.areas[f.properties.id];
    l.bindTooltip(`${a.name} (${a.bzr_name})`);
  },
}).addTo(map);

map.fitBounds(layer.getBounds());
const n = layer.getLayers().length;
const count = document.getElementById("count");
count.textContent = `${n} areas`;
count.dataset.count = n;
