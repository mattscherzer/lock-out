import type { FitBoundsOptions } from "leaflet";
import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { higherPx } from "../answer/sheetStops.ts";
import { AreaAnswer } from "../answer/AreaAnswer.tsx";
import { About } from "../About.tsx";
import { loadStreets, type AppData } from "../data/load.ts";
import { AreaMap, type AreaMapHandle } from "../map/AreaMap.tsx";
import { Legend } from "../map/Legend.tsx";
import { LegendMenu } from "../map/LegendMenu.tsx";
import { watchLegendFit } from "../map/watchLegendFit.ts";
import { AreaSearch } from "../search/AreaSearch.tsx";
import { addStreets, buildIndex } from "../search/places.ts";
import type { Context, Gazetteer } from "../search/types.ts";
import { STRINGS } from "../strings.ts";
import { phone } from "../viewport.ts";
import { initialSelection, selection as reduce } from "./selection.ts";

const SEARCH_CLEARANCE_PX = 110;
const EMPTY_GAZETTEER: Gazetteer = { plz: {}, stations: [] };

const STATUS = "absolute bottom-6 left-2 z-map-controls rounded-xs px-2 py-1 empty:hidden";

export const LoadError = () => (
  <div id="status" className={STATUS} aria-live="polite">
    {STRINGS.status.loadError}
  </div>
);

// keep the area clear of the side panel (desktop) or the sheet and the search above it (phone, sheet at its opening height)
const flyPadding = (): FitBoundsOptions =>
  !phone()
    ? { paddingTopLeft: [document.querySelector<HTMLElement>(".answer-card")!.offsetWidth, 0] }
    : { paddingTopLeft: [0, SEARCH_CLEARANCE_PX], paddingBottomRight: [0, higherPx()] };

export function App({ lookup, areas, gazetteer }: AppData) {
  const [state, dispatch] = useReducer(reduce, initialSelection);
  const [closeSignal, setCloseSignal] = useState(0);
  const [lowerSignal, setLowerSignal] = useState(0); // focusing the search lowers the phone sheet out of the way
  const [aboutOpen, setAboutOpen] = useState(false);
  const [streetsFailed, setStreetsFailed] = useState(false);
  const map = useRef<AreaMapHandle>(null);
  const index = useMemo(
    () => buildIndex(gazetteer ?? EMPTY_GAZETTEER, lookup.areas),
    [gazetteer, lookup],
  );
  const status = [
    gazetteer ? null : STRINGS.status.noPostcodeSearch,
    streetsFailed ? STRINGS.status.noStreetSearch : null,
  ]
    .filter(Boolean)
    .join(" · ");

  useEffect(watchLegendFit, []);

  // streets are the bulk of the lookup: fetched when the user first focuses the search, not before the map
  const searchStreets = () =>
    loadStreets()
      .then((file) => addStreets(index, file, lookup.areas))
      .then(() => setStreetsFailed(false))
      .catch((err) => {
        console.error("Street search unavailable:", err);
        setStreetsFailed(true);
        throw err; // the search box retries on the next focus
      });

  const choose = (id: string, context: Context | null) => {
    dispatch({ type: "select", id, context });
    map.current!.flyTo(id); // an imperative call, not an effect on `selected`: picking the same area again must still fly
  };
  const pin = useMemo(
    () => (state.pin?.ll ? { ll: state.pin.ll, label: state.pin.label } : null),
    [state.pin],
  );
  const record = state.selected ? lookup.areas[state.selected] : null;

  return (
    <>
      <AreaMap
        ref={map}
        areas={areas}
        lookup={lookup}
        active={state.cardOpen ? state.selected : null}
        selected={state.selected}
        highlighted={state.highlighted}
        pin={pin}
        onSelect={(id) => choose(id, null)}
        onMapClick={() => setCloseSignal((n) => n + 1)}
        onAbout={() => setAboutOpen(true)}
        flyPadding={flyPadding}
      />
      <div id="status" className={STATUS} aria-live="polite">
        {status}
      </div>
      <div
        id="legend"
        className="absolute bottom-(--map-controls-bottom) left-2 z-map-controls transition-transform duration-base ease-standard min-[600px]:left-1/2 min-[600px]:w-max min-[600px]:-translate-x-1/2 max-[599px]:[body:has(.answer-card[data-open])_&]:invisible min-[600px]:[body:has(.answer-card[data-open]:not([data-collapsed]))_&]:translate-x-[calc(50vw-100%-var(--map-controls-inset)-var(--control-sm)-var(--space-2))] max-[599px]:[body[data-legend-tight]_&]:invisible"
      >
        <Legend />
      </div>
      <div
        id="legend-menu"
        className="absolute top-[calc(var(--space-16)+var(--space-4))] right-4 z-map-controls hidden max-[599px]:[body:has(.answer-card[data-open])_&]:block max-[599px]:[body[data-legend-tight]_&]:block"
      >
        <LegendMenu />
      </div>
      <div id="search" onFocus={() => state.cardOpen && setLowerSignal((n) => n + 1)}>
        <AreaSearch
          index={index}
          areas={lookup.areas}
          selected={state.selected}
          onSelect={choose}
          onClear={() => dispatch({ type: "clear" })}
          onHighlight={(id) => dispatch({ type: "highlight", id })}
          closeSignal={closeSignal}
          loadStreets={searchStreets}
        />
      </div>
      <div id="answer">
        <AreaAnswer
          record={record}
          areaId={state.selected}
          lookup={lookup}
          open={state.selected !== null && state.cardOpen}
          lowerSignal={lowerSignal}
          onAbout={() => setAboutOpen(true)}
          onClose={() => {
            dispatch({ type: "closeCard" });
            // desktop: back to the field, which shows the still-selected area. Not on a phone: focusing opens the full-screen search and hides the map.
            if (!phone()) document.querySelector<HTMLInputElement>("#search input")?.focus();
          }}
        />
      </div>
      <div id="about">
        <About
          attribution={lookup.metadata.attribution}
          open={aboutOpen}
          onClose={() => setAboutOpen(false)}
        />
      </div>
    </>
  );
}
