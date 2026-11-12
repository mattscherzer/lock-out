import L from "leaflet";
import type { FeatureCollection } from "geojson";
import { useEffect, useEffectEvent, useImperativeHandle, useRef, type Ref } from "react";
import { kindOf } from "../domain/kind.ts";
import type { Lookup } from "../domain/lookup.ts";
import { STRINGS } from "../strings.ts";
import { addHatch, areaStyle, emphasisOf, num } from "./mapStyle.ts";
import { tintBasemap } from "./tint.ts";

const BERLIN_CENTRE: L.LatLngTuple = [52.52, 13.405];
const START_ZOOM = 11;
const PIN_RADIUS = 7;
const PIN_RING_WEIGHT = 3;
const ME_RADIUS = 8;
const ME_RING_WEIGHT = 3;

// a hover tooltip would stay open after the map moves
const closeTooltips = (polygons: Record<string, L.Polygon>) =>
  Object.values(polygons).forEach((polygon) => polygon.closeTooltip());

export type AreaMapHandle = { flyTo: (id: string) => void };

type Props = {
  ref: Ref<AreaMapHandle>;
  areas: FeatureCollection;
  lookup: Lookup;
  active: string | null; // the area whose card is open
  selected: string | null;
  highlighted: string | null; // the area under the arrow keys or pointer in the open search list
  pin: { ll: [number, number]; label: string } | null; // "you searched here"
  me: [number, number] | null; // the device position, shown as a dot
  onSelect: (id: string) => void;
  onMapClick: () => void;
  onAbout: () => void;
  flyPadding: () => L.FitBoundsOptions;
};

export function AreaMap(props: Props) {
  const { ref, areas, lookup, active, selected, highlighted, pin, me } = props;
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map>(undefined);
  const polygons = useRef<Record<string, L.Polygon>>({});
  const hovered = useRef<string | null>(null);
  const opened = useRef<string | null>(null);
  const touched = useRef<(string | null)[]>([]);
  const restyle = useEffectEvent((id: string) =>
    polygons.current[id].setStyle(
      areaStyle(
        kindOf(lookup.areas[id]),
        emphasisOf(id, { active, highlighted, hovered: hovered.current }),
      ),
    ),
  );
  const select = useEffectEvent(props.onSelect);
  const mapClick = useEffectEvent(props.onMapClick);
  const about = useEffectEvent(props.onAbout);

  useEffect(() => {
    const renderer = L.svg();
    addHatch(renderer);
    const m = L.map(container.current!, { zoomControl: false, renderer }).setView(
      BERLIN_CENTRE,
      START_ZOOM,
    );
    map.current = m;
    tintBasemap(m);
    m.createPane("me").style.zIndex = "450"; // above the areas, whose selected one is brought to front
    L.control.zoom({ position: "bottomright" }).addTo(m);
    // Attribution text lives in the lookup metadata so the UI and the data agree on it.
    const { police, osm } = lookup.metadata.attribution;
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: `<a href="https://www.openstreetmap.org/copyright">${osm}</a> | ${police} | ${STRINGS.map.searchAttribution} | <a href="#about" data-about>${STRINGS.about.title}</a>`,
    }).addTo(m);
    m.attributionControl.getContainer()!.addEventListener("click", (e) => {
      if (!(e.target as Element).closest("[data-about]")) return;
      e.preventDefault();
      about();
    });

    const byId: Record<string, L.Polygon> = {};
    polygons.current = byId;
    const layer = L.geoJSON(areas, {
      style: (feature) => areaStyle(kindOf(lookup.areas[feature!.properties.id as string]), "rest"),
      onEachFeature: (feature, polygon) => {
        const id = feature.properties.id as string;
        const area = lookup.areas[id];
        // element, not a string: Leaflet would parse a string as HTML
        const label = Object.assign(document.createElement("span"), {
          textContent: `${area.name} (${area.bzr_name})`,
        });
        polygon.bindTooltip(label, { className: "body-md" });
        byId[id] = polygon as L.Polygon;
        polygon.on("click", () => select(id));
        polygon.on("mouseover", () => {
          hovered.current = id;
          restyle(id);
        });
        polygon.on("mouseout", () => {
          hovered.current = null;
          restyle(id);
        });
      },
    }).addTo(m);
    m.fitBounds(layer.getBounds());
    // a tap on the map closes the list; a tap on an area also selects it
    m.on("click", () => mapClick());
    return () => {
      m.remove();
      map.current = undefined;
    };
  }, [areas, lookup]);

  useEffect(() => {
    // closing the card by Esc or a swipe fires no mouseout, so the area would stay in hover style
    if (!active && hovered.current === opened.current) hovered.current = null;
    opened.current = active;
    // only the areas that changed: a highlight moves with every arrow key
    for (const id of new Set([...touched.current, selected, highlighted])) if (id) restyle(id);
    touched.current = [selected, highlighted];
  }, [active, selected, highlighted]);

  useEffect(() => {
    if (selected) polygons.current[selected].bringToFront();
    closeTooltips(polygons.current);
  }, [selected]);

  useEffect(() => {
    if (!pin) return;
    const marker = L.circleMarker(pin.ll, {
      radius: PIN_RADIUS,
      weight: PIN_RING_WEIGHT,
      className: "search-pin",
      fillOpacity: 1,
      interactive: false,
    })
      .bindTooltip(pin.label, { permanent: true, direction: "top", className: "body-md" })
      .addTo(map.current!);
    return () => {
      marker.remove();
    };
  }, [pin]);

  useEffect(() => {
    if (!me) return;
    const dot = L.circleMarker(me, {
      pane: "me",
      radius: ME_RADIUS,
      weight: ME_RING_WEIGHT,
      className: "my-location",
      fillOpacity: 1,
      interactive: false,
    }).addTo(map.current!);
    return () => {
      dot.remove();
    };
  }, [me]);

  useImperativeHandle(ref, () => ({
    // a fly (zoom out, pan, zoom in) reads smoother than a straight jump; the motion token is 0 under reduced motion
    flyTo(id) {
      const ms = num("--duration-slow");
      closeTooltips(polygons.current);
      map.current!.flyToBounds(polygons.current[id].getBounds(), {
        ...props.flyPadding(),
        duration: ms / 1000,
        animate: ms > 0,
      });
    },
  }));

  // own stacking context: Leaflet's controls stay below the search (z-search)
  return <div ref={container} className="z-0 h-full" />;
}
