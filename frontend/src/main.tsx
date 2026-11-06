import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./styles/index.css";
import "./map/map.css";
import type { FeatureCollection } from "geojson";
import { createRoot } from "react-dom/client";
import { higherPx } from "./answer/AnswerCard.tsx";
import { AreaAnswer } from "./answer/AreaAnswer.tsx";
import { kindOf } from "./answer/kind.ts";
import { Legend } from "./map/Legend.tsx";
import { addHatch, areaStyle, type Emphasis } from "./map/mapStyle.ts";
import { tintBasemap } from "./map/tint.ts";
import { mountAbout } from "./mountAbout.tsx";
import { AreaSearch, type Context } from "./search/AreaSearch.tsx";
import { addStreets, buildIndex } from "./search/places.ts";
import type { Fixture, Gazetteer, StreetsFile } from "./search/types.ts";

const getJson = <T,>(name: string): Promise<T> =>
  fetch(`${import.meta.env.BASE_URL}${name}`).then((res) => {
    if (!res.ok) throw new Error(`${name}: HTTP ${res.status}`);
    return res.json();
  });

const BRAND = "#2563EB";
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
const renderer = L.svg();
addHatch(renderer);
const map = L.map("map", { zoomControl: false, renderer }).setView([52.52, 13.405], 11);
tintBasemap(map);
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
    attribution: `<a href="https://www.openstreetmap.org/copyright">${osm}</a> | ${police} | ${SEARCH_ATTRIBUTION} | <a href="#about" data-about>About the data</a>`,
  }).addTo(map);

  const polygons: Record<string, L.Polygon> = {};
  let selected: string | null = null;
  const emphasise = (id: string, emphasis: Emphasis) =>
    polygons[id].setStyle(areaStyle(kindOf(fixture.areas[id]), emphasis));
  const layer = L.geoJSON(areas, {
    style: (feature) => areaStyle(kindOf(fixture.areas[feature!.properties.id as string]), "rest"),
    onEachFeature: (feature, polygon) => {
      const area = fixture.areas[feature.properties.id as string];
      // element, not a string: Leaflet would parse a string as HTML
      const label = Object.assign(document.createElement("span"), {
        textContent: `${area.name} (${area.bzr_name})`,
      });
      polygon.bindTooltip(label, { className: "body-md" });
      polygons[feature.properties.id as string] = polygon as L.Polygon;
    },
  }).addTo(map);

  map.fitBounds(layer.getBounds());
  let closeSignal = 0;
  let cardOpen = false;
  let lowerSignal = 0; // focusing the search lowers the phone sheet out of the way
  const notes = new Set(gazetteer ? [] : ["station and postcode search unavailable"]);
  const showStatus = () => (status.textContent = [...notes].join(" · "));
  const index = buildIndex(gazetteer ?? EMPTY_GAZETTEER, fixture.areas);
  // streets are the bulk of the lookup: fetched when the user first focuses the search, not before the map
  const loadStreets = () =>
    getJson<StreetsFile>("gazetteer_streets.json")
      .then((file) => addStreets(index, file, fixture.areas))
      .then(() => notes.delete("street search unavailable"))
      .catch((err) => {
        console.error("Street search unavailable:", err);
        notes.add("street search unavailable");
        throw err; // the search box retries on the next focus
      })
      .finally(showStatus);
  // keep the area clear of the side panel (desktop) or the sheet and the search above it (phone, sheet at its opening height)
  const flyPadding = () =>
    innerWidth >= 600
      ? {
          paddingTopLeft: L.point(
            document.querySelector<HTMLElement>(".answer-card")!.offsetWidth,
            0,
          ),
        }
      : { paddingTopLeft: L.point(0, 110), paddingBottomRight: L.point(0, higherPx()) };
  const searchRoot = createRoot(document.getElementById("search")!);
  const cardRoot = createRoot(document.getElementById("answer")!);
  const openAbout = mountAbout(
    document.getElementById("about")!,
    map,
    fixture.metadata.attribution,
  );
  const renderCard = () => {
    const record = selected ? fixture.areas[selected] : null;
    cardRoot.render(
      <AreaAnswer
        record={record}
        areaId={selected}
        fixture={fixture}
        open={selected !== null && cardOpen}
        lowerSignal={lowerSignal}
        onAbout={openAbout}
        onClose={() => {
          cardOpen = false;
          renderCard();
          // desktop: back to the field, which shows the still-selected area. Not on a phone: focusing opens the full-screen search and hides the map.
          if (innerWidth >= 600) document.querySelector<HTMLInputElement>("#search input")?.focus();
        }}
      />,
    );
  };
  // a fly (zoom out, pan, zoom in) reads smoother than a straight jump; the motion token is 0 under reduced motion
  const fly = (id: string, options: L.FitBoundsOptions = {}) => {
    const ms = parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue("--duration-slow"),
    );
    map.flyToBounds(polygons[id].getBounds(), {
      ...flyPadding(),
      ...options,
      duration: ms / 1000,
      animate: ms > 0,
    });
  };
  const renderSearch = () =>
    searchRoot.render(
      <AreaSearch
        index={index}
        areas={fixture.areas}
        selected={selected}
        onSelect={(id, context) => {
          select(id, context);
          fly(id);
        }}
        onClear={() => select(null, null)}
        closeSignal={closeSignal}
        loadStreets={loadStreets}
      />,
    );

  // pin = "you searched here"; only stations have coordinates
  let pin: L.CircleMarker | undefined;
  const select = (id: string | null, context: Context | null) => {
    if (selected) emphasise(selected, "rest");
    Object.values(polygons).forEach((polygon) => polygon.closeTooltip()); // a hover tooltip would stay open after the map moves
    pin?.remove();
    pin = context?.ll
      ? L.circleMarker(context.ll, {
          radius: 7,
          color: "#fff",
          weight: 3,
          fillColor: BRAND,
          fillOpacity: 1,
          interactive: false,
        })
          .bindTooltip(context.label, { permanent: true, direction: "top", className: "body-md" })
          .addTo(map)
      : undefined;
    selected = id;
    if (id) {
      emphasise(id, "selected");
      polygons[id].bringToFront();
    }
    cardOpen = id !== null;
    renderSearch();
    renderCard();
  };
  // a tap on the map closes the list; a tap on an area also selects it
  map.on("click", () => {
    closeSignal++;
    renderSearch();
  });
  Object.entries(polygons).forEach(([id, polygon]) => {
    polygon.on("click", () => {
      select(id, null);
      fly(id);
    });
    polygon.on("mouseover", () => id !== selected && emphasise(id, "hover"));
    polygon.on("mouseout", () => id !== selected && emphasise(id, "rest"));
  });
  createRoot(document.getElementById("legend")!).render(<Legend />);
  document.getElementById("search")!.addEventListener("focusin", () => {
    if (!cardOpen) return;
    lowerSignal++;
    renderCard();
  });
  renderSearch();
  renderCard();
  showStatus();
} catch (err) {
  status.textContent = "Could not load map data";
  throw err;
}
