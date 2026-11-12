import type { FitBoundsOptions } from "leaflet";
import { useMemo, useReducer, useRef, useState } from "react";
import { higherPx } from "../answer/sheetStops.ts";
import type { AnswerCardHandle } from "../answer/AnswerCard.tsx";
import { AreaAnswer } from "../answer/AreaAnswer.tsx";
import { About } from "../About.tsx";
import type { Gazetteer } from "../data/files.ts";
import { loadStreets, type AppData } from "../data/load.ts";
import { Locate, LocateFixed, LocateOff } from "lucide-react";
import { buildAreaFinder } from "../domain/areaAt.ts";
import { AreaMap, type AreaMapHandle } from "../map/AreaMap.tsx";
import { Legend } from "../map/Legend.tsx";
import { LegendMenu } from "../map/LegendMenu.tsx";
import { useLegendTight } from "../map/useLegendTight.ts";
import { AreaSearch, type AreaSearchHandle } from "../search/AreaSearch.tsx";
import { hasGeolocation } from "../search/location.ts";
import { buildIndex, streetPlaces } from "../search/places.ts";
import type { Context, Place } from "../search/types.ts";
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
const flyPadding = (cardWidth: number): FitBoundsOptions =>
  !phone()
    ? { paddingTopLeft: [cardWidth, 0] }
    : { paddingTopLeft: [0, SEARCH_CLEARANCE_PX], paddingBottomRight: [0, higherPx()] };

export function App({ lookup, areas, gazetteer }: AppData) {
  const [state, dispatch] = useReducer(reduce, initialSelection);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [blocked, setBlocked] = useState(false); // the location permission is denied
  const [me, setMe] = useState<[number, number] | null>(null); // where the user was last located; stays until the next fix
  const [streetsFailed, setStreetsFailed] = useState(false);
  const [streets, setStreets] = useState<Place[]>([]);
  const map = useRef<AreaMapHandle>(null);
  const search = useRef<AreaSearchHandle>(null);
  const answer = useRef<AnswerCardHandle>(null);
  const legend = useRef<HTMLDivElement>(null);
  const base = useMemo(
    () => buildIndex(gazetteer ?? EMPTY_GAZETTEER, lookup.areas),
    [gazetteer, lookup],
  );
  const areaAt = useMemo(() => buildAreaFinder(areas), [areas]);
  const index = useMemo(() => ({ ...base, street: streets }), [base, streets]);
  const status = [
    gazetteer ? null : STRINGS.status.noPostcodeSearch,
    streetsFailed ? STRINGS.status.noStreetSearch : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const tight = useLegendTight(legend);

  // streets are the bulk of the lookup: fetched when the user first focuses the search, not before the map
  const searchStreets = () =>
    loadStreets()
      .then((file) => setStreets(streetPlaces(file, lookup.areas)))
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
        me={me}
        onSelect={(id) => choose(id, null)}
        onMapClick={() => search.current?.close()}
        onAbout={() => setAboutOpen(true)}
        flyPadding={() => flyPadding(answer.current!.width())}
      />
      <div id="status" className={STATUS} aria-live="polite">
        {status}
      </div>
      {hasGeolocation() && (
        <div className="leaflet-bar locate-control">
          <a
            role="button"
            href="#locate"
            aria-label={STRINGS.search.location.mapButton}
            onClick={(e) => {
              e.preventDefault();
              search.current?.locate();
            }}
          >
            {blocked ? (
              <LocateOff aria-hidden size={18} />
            ) : me ? (
              <LocateFixed aria-hidden size={18} />
            ) : (
              <Locate aria-hidden size={18} />
            )}
          </a>
        </div>
      )}
      <div
        ref={legend}
        data-tight={tight || undefined}
        className="absolute bottom-(--map-controls-bottom) left-2 z-map-controls transition-transform duration-base ease-standard max-[599px]:data-[tight]:invisible min-[600px]:left-1/2 min-[600px]:w-max min-[600px]:-translate-x-1/2 max-[599px]:[body:has(.answer-card[data-open])_&]:invisible min-[600px]:[body:has(.answer-card[data-open]:not([data-collapsed]))_&]:translate-x-[calc(50vw-100%-var(--map-controls-inset)-var(--control-sm)-var(--space-2))]"
      >
        <Legend />
      </div>
      <div
        data-tight={tight || undefined}
        className="absolute top-[calc(var(--space-16)+var(--space-4))] right-4 z-map-controls hidden max-[599px]:data-[tight]:block max-[599px]:[body:has(.answer-card[data-open])_&]:block"
      >
        <LegendMenu />
      </div>
      <div onFocus={() => state.cardOpen && answer.current?.lower()}>
        <AreaSearch
          ref={search}
          index={index}
          areas={lookup.areas}
          selected={state.selected}
          onSelect={choose}
          onClear={() => dispatch({ type: "clear" })}
          onHighlight={(id) => dispatch({ type: "highlight", id })}
          loadStreets={searchStreets}
          locate={areaAt}
          onLocated={setMe}
          located={!!me}
          onDenied={setBlocked}
        />
      </div>
      <div>
        <AreaAnswer
          ref={answer}
          record={record}
          areaId={state.selected}
          lookup={lookup}
          open={state.selected !== null && state.cardOpen}
          onAbout={() => setAboutOpen(true)}
          onClose={() => {
            dispatch({ type: "closeCard" });
            // desktop: back to the field, which shows the still-selected area. Not on a phone: focusing opens the full-screen search and hides the map.
            if (!phone()) search.current?.focus();
          }}
        />
      </div>
      <div>
        <About
          attribution={lookup.metadata.attribution}
          open={aboutOpen}
          onClose={() => setAboutOpen(false)}
        />
      </div>
    </>
  );
}
