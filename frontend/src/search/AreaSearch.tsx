import { ArrowLeft, ChevronDown, LoaderCircle, Mail, MapPin, Road, Search, TrainFront, VectorPolygon, X } from "lucide-react";
import { useEffect, useEffectEvent, useId, useRef, useState, useSyncExternalStore } from "react";
import "./AreaSearch.css";
import { bezirkLabel, buildRows, EXAMPLES, isPlainStreet, LOADING_DELAY_MS, MAX_ROWS, parseQuery, placeKey, searchPlaces } from "./places.ts";
import type { Areas, Index, Kind, Place, Row } from "./types.ts";

// How the area was found; null when the user picked an area by name.
export type Context = { kind: Kind; label: string; pct: number | null; ll?: [number, number] };
type Props = {
  index: Index;
  areas: Areas;
  selected: string | null;
  onSelect: (id: string, context: Context | null) => void;
  onClear: () => void;
  closeSignal?: number; // changing it closes the list, e.g. on a tap on the map
  loadStreets?: () => Promise<unknown>; // must reject on failure; retried on the next focus
};

const kindWord = (place: Place) => (place.sub ? `${place.sub} station` : place.type ?? { postcode: "Postcode", station: "Station", street: "Street", area: "Area" }[place.kind]); // type: Water, Square, Motorway...

// Outline glyph per kind; one pin for the other named places (square, water, motorway, forest). The type is also written in words, so the glyph is never the only signal.
const glyph = (place: Place) => {
  if (place.kind === "area") return VectorPolygon;
  if (place.kind === "postcode") return Mail;
  if (place.kind === "station") return TrainFront;
  return isPlainStreet(place) ? Road : MapPin;
};

const exampleGlyph = { Street: Road, Postcode: Mail, Station: TrainFront, Area: VectorPolygon, Water: MapPin }; // keyed by EXAMPLES' word

const rowKey = (r: Row) => (r.type === "area" ? `${placeKey(r.place)}|${r.id}` : `${r.type}|${placeKey(r.place)}`); // a place spans several areas
const WIDE = "(min-width: 600px)"; // tablet and desktop: more rows
const subscribeWide = (cb: () => void) => {
  const m = window.matchMedia?.(WIDE);
  m?.addEventListener("change", cb);
  return () => m?.removeEventListener("change", cb);
};
// the place of the picked row first so Enter keeps it, then places in the same area
const rank = (p: Place, selected: string, picked?: string) => (placeKey(p) === picked ? 0 : p.areas.some((a) => a.id === selected) ? (p.kind === "area" ? 1 : 2) : 3);

// shortcut: matches the typed text literally, so "muller" does not bold the "Mü" of "Müller"; fold-aware offsets if it matters.
function Bold({ text, part }: { text: string; part: string }) {
  const at = part ? text.toLowerCase().indexOf(part.toLowerCase()) : -1;
  if (at < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, at)}
      <b>{text.slice(at, at + part.length)}</b>
      {text.slice(at + part.length)}
    </>
  );
}

export function AreaSearch({ index, areas, selected, onSelect, onClear, closeSignal, loadStreets }: Props) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const justFocused = useRef(false);
  const retrying = useRef(false); // focus returning from Try again must not select the typed text
  const loading = useRef<Promise<void>>(undefined);
  const [draft, setDraft] = useState<string | null>(null); // what the user typed; null: the field shows the selected area
  const [chosen, setChosen] = useState<{ id: string; query: string; place: string }>(); // the area picked, the place it came from (placeKey) and the query that found it
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<number | null>(null); // null: the picked row, else the first
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set()); // places showing all their areas
  const limit = useSyncExternalStore(subscribeWide, () => (window.matchMedia?.(WIDE).matches ?? true) ? MAX_ROWS.wide : MAX_ROWS.mobile, () => MAX_ROWS.wide);
  const [streetsLoading, setStreetsLoading] = useState(false);
  const [streetsError, setStreetsError] = useState(false);
  const [slow, setSlow] = useState(false); // loading has lasted past LOADING_DELAY_MS
  const [, setLoaded] = useState(0); // bumped when street data arrives: addStreets fills index in place, so rerender to search again

  // the soft keyboard overlays the page instead of resizing it, so size the full-screen panel to the visible area
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const root = document.documentElement.style;
    const fit = () => {
      root.setProperty("--vv-covered", `${Math.max(0, window.innerHeight - vv.offsetTop - vv.height)}px`); // keyboard and Safari's floating bars
      root.setProperty("--vv-top", `${vv.offsetTop}px`);
    };
    fit();
    vv.addEventListener("resize", fit);
    vv.addEventListener("scroll", fit);
    return () => {
      vv.removeEventListener("resize", fit);
      vv.removeEventListener("scroll", fit);
      root.removeProperty("--vv-top");
      root.removeProperty("--vv-covered");
    };
  }, []);

  const selectedName = selected ? areas[selected]?.name ?? "" : "";
  const text = draft ?? selectedName;
  // a new selection (a pick, or a click on the map) replaces any draft; a pick from elsewhere forgets what found the last one
  useEffect(() => {
    setDraft(null);
    setChosen((c) => (c?.id === selected ? c : undefined));
  }, [selected]);

  const close = () => {
    setOpen(false);
    setDraft((d) => (selected ? null : d)); // an abandoned edit keeps the previous selection; with none, the draft stays
  };
  const closeFromOutside = useEffectEvent(close);
  useEffect(() => {
    if (closeSignal) closeFromOutside();
  }, [closeSignal]);

  // field still shows the selection: list the results of the query that found it, so a different pick needs no retyping
  const showingSelection = draft === null && !!selected;
  const searchText = showingSelection && chosen?.id === selected ? chosen.query : text;
  const { text: query, houseNumber } = parseQuery(searchText);
  const places = query.trim() ? searchPlaces(index, query) : [];
  if (showingSelection) places.sort((a, b) => rank(a, selected, chosen?.place) - rank(b, selected, chosen?.place));
  const { rows: all, overflow } = buildRows(places, limit, expanded);
  const rows = all.filter((r) => r.type !== "label"); // options; label rows are rendered between them
  const picked = showingSelection ? rows.findIndex((r) => r.type === "area" && r.id === selected && placeKey(r.place) === chosen?.place) : -1;
  const empty = open && !query.trim(); // nothing typed: offer the examples
  const count = empty ? EXAMPLES.length : rows.length; // options in the listbox
  const current = Math.min(active ?? Math.max(picked, 0), count - 1);
  const shown = open && !!query.trim();
  const tooShort = query.trim().length < 2; // searchPlaces needs two characters

  useEffect(() => {
    if (!streetsLoading) return;
    const t = setTimeout(() => setSlow(true), LOADING_DELAY_MS);
    return () => {
      clearTimeout(t);
      setSlow(false);
    };
  }, [streetsLoading]);

  // keep the highlighted row in view while arrowing through a long list
  useEffect(() => {
    if ((shown || empty) && count) document.getElementById(`${id}-${current}`)?.scrollIntoView?.({ block: "nearest" });
  });
  // after a keyboard pick or Esc the field shows the area name selected, so typing replaces it
  const reselect = useRef(false);
  useEffect(() => {
    if (reselect.current && document.activeElement === input.current) input.current?.select();
    reselect.current = false;
  });

  const choose = (r: Row, pointer = false) => {
    if (r.type === "more") return setExpanded((e) => new Set(e).add(placeKey(r.place)));
    if (r.type !== "area") return;
    setChosen({ id: r.id, query: searchText, place: placeKey(r.place) });
    setDraft(null);
    setOpen(false);
    setActive(null);
    onSelect(r.id, r.place.kind === "area" ? null : { kind: r.place.kind, label: r.place.label, pct: r.pct, ll: r.place.ll });
    if (!pointer) reselect.current = true;
    if (pointer) input.current?.blur(); // a tap must not leave the soft keyboard over the map; Enter keeps focus for the keyboard user
  };

  const onFocus = () => {
    justFocused.current = true;
    if (!retrying.current) input.current?.select();
    retrying.current = false;
    setActive(null);
    setOpen(true);
    loadNow();
  };

  const loadNow = () => {
    if (!loadStreets || loading.current) return;
    setStreetsLoading(true);
    setStreetsError(false);
    loading.current = loadStreets().then(
      () => {
        setStreetsLoading(false);
        setLoaded((n) => n + 1);
      },
      () => {
        setStreetsLoading(false);
        setStreetsError(true);
        loading.current = undefined;
      },
    );
  };

  // the button unmounts once the load starts: hand focus back to the field so the keyboard user stays in the search
  const retry = () => {
    loadNow();
    retrying.current = true;
    input.current?.focus();
  };

  const pickExample = (label: string) => {
    setDraft(label);
    setActive(null);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      reselect.current = !!selected;
      return close();
    }
    const step = { ArrowDown: 1, ArrowUp: -1 }[e.key];
    if (step && !open) {
      e.preventDefault();
      return setOpen(true);
    }
    if (!(shown || empty) || !count) return;
    if (step) {
      e.preventDefault();
      setActive((current + step + count) % count);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (empty) pickExample(EXAMPLES[current].label);
      else choose(rows[current]);
    }
  };

  const status = !shown ? "" : tooShort ? "Keep typing" : streetsError ? "" : streetsLoading ? "Searching" : rows.length ? `${rows.length} ${rows.length === 1 ? "result" : "results"}` : "No results";

  return (
    <div className="area-search" onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && close()} data-open={open || undefined} data-list={open || undefined}>
      <div className="area-search-field">
        <button type="button" className="area-search-back" aria-label="Close search" onMouseDown={(e) => e.preventDefault()} onClick={() => { close(); input.current?.blur(); }}>
          <ArrowLeft aria-hidden size={22} />
        </button>
        <span className="area-search-icon" onClick={() => input.current?.focus()}>
          <Search aria-hidden size={22} />
        </span>
        <input
          ref={input}
          type="text"
          role="combobox"
          aria-expanded={(shown || empty) && count > 0}
          aria-controls={`${id}-list`}
          aria-autocomplete="list"
          aria-activedescendant={(shown || empty) && count ? `${id}-${current}` : undefined}
          aria-label="Search area, street, station or postcode"
          placeholder="Street, postcode, area or station"
          autoComplete="off"
          spellCheck={false}
          value={text}
          onChange={(e) => {
            setDraft(e.target.value);
            setActive(null);
            setOpen(true);
          }}
          onFocus={onFocus}
          onMouseUp={(e) => {
            if (justFocused.current) e.preventDefault(); // keep the select-all from onFocus
            justFocused.current = false;
          }}
          onClick={() => setOpen(true)}
          onBlur={() => (justFocused.current = false)}
          onKeyDown={onKeyDown}
        />
        {slow && streetsLoading && <span className="area-search-spinner" aria-hidden><LoaderCircle size={22} /></span>}
        {text && !(slow && streetsLoading) && (
          <button
            type="button"
            className="area-search-clear"
            aria-label="Clear search"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              setDraft("");
              setActive(null);
              setOpen(true);
              onClear();
              input.current?.focus();
            }}
          >
            <X aria-hidden size={22} />
          </button>
        )}
      </div>
      <div className="area-search-panel" hidden={!open}>
        {houseNumber && <p className="area-search-note">House numbers aren't searchable yet, showing the street.</p>}
        {shown && tooShort && <p className="area-search-note">Type at least two characters.</p>}
        {shown && !tooShort && streetsError && (
          <div className="area-search-note area-search-error" role="alert">
            <p className="title-sm">{rows.length ? "Street search isn't available right now" : "Search isn't responding"}</p>
            <p>We kept what you typed. Check your connection and try again.</p>
            <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={retry}>Try again</button>
          </div>
        )}
        {shown && !tooShort && !rows.length && streetsLoading && slow && (
          <ul className="area-search-skeleton" aria-hidden>
            {[0, 1, 2].map((i) => (
              <li key={i}><span /><span><i /><i /></span></li>
            ))}
          </ul>
        )}
        {empty && <p className="area-search-note area-search-label">Try searching for</p>}
        {shown && !tooShort && !rows.length && !streetsLoading && !streetsError && (
          <div className="area-search-note area-search-empty">
            <p className="title-sm">‘{query.trim()}’ not found</p>
            <p>lock-out covers Berlin only. Try a Berlin street, postcode, area or station.</p>
          </div>
        )}
        <ul id={`${id}-list`} role="listbox" aria-label={empty ? "Examples" : "Areas"} hidden={!count} onMouseDown={(e) => e.preventDefault()}>
          {empty && EXAMPLES.map((ex, i) => {
            const Glyph = exampleGlyph[ex.word as keyof typeof exampleGlyph];
            return (
              <li key={ex.label} id={`${id}-${i}`} role="option" aria-selected={i === current} className="area-search-option" onClick={() => pickExample(ex.label)} onMouseMove={() => setActive(i)}>
                <span className="area-search-glyph"><Glyph aria-hidden size={18} strokeWidth={1.8} /></span>
                <span className="area-search-text">
                  <span className="area-search-name">{ex.label}</span>
                  <span className="area-search-sub">{ex.word}</span>
                </span>
              </li>
            );
          })}
          {!empty && all.map((r) => {
            const area = r.type === "area" ? areas[r.id] : undefined;
            const Glyph = glyph(r.place);
            const name = r.place.bezirk ? `${r.place.label} (${bezirkLabel(r.place.bezirk)})` : r.place.label;
            const key = rowKey(r);
            if (r.type === "label")
              return (
                <li key={key} role="presentation" className="area-search-option area-search-parent" title={name}>
                  <span className="area-search-glyph"><Glyph aria-hidden size={18} strokeWidth={1.8} /></span>
                  <span className="area-search-text">
                    <span className="area-search-name"><Bold text={name} part={query.trim()} /></span>
                    <span className="area-search-sub">{kindWord(r.place)} · in {r.place.areas.length} areas</span>
                  </span>
                </li>
              );
            const i = rows.indexOf(r);
            const common = { id: `${id}-${i}`, role: "option", "aria-selected": i === current, onClick: () => choose(r, true), onMouseMove: () => setActive(i) } as const;
            if (r.type === "more")
              return (
                <li key={key} {...common} className="area-search-option area-search-more">
                  +{r.n} more areas for {name}
                  <ChevronDown aria-hidden size={16} strokeWidth={2} />
                </li>
              );
            const child = r.pct != null; // under a label row the area is the subject
            const full = child ? area!.name : name;
            const sub = child || r.place.kind === "area" ? `Area · ${bezirkLabel(area!.bzr_name)}` : `${kindWord(r.place)} · ${area!.name} · ${bezirkLabel(area!.bzr_name)}`;
            return (
              <li key={key} {...common} title={full} aria-label={child ? `${full}, ${sub}, in ${name}, ${r.pct}%` : undefined} className={child ? "area-search-option area-search-child" : "area-search-option"}>
                {!child && <span className="area-search-glyph"><Glyph aria-hidden size={18} strokeWidth={1.8} /></span>}
                <span className="area-search-text">
                  <span className="area-search-name"><Bold text={full} part={query.trim()} /></span>
                  <span className="area-search-sub">{sub}</span>
                </span>
                {child && (
                  <>
                    <span className="area-search-bar" aria-hidden><span style={{ width: `${r.pct}%` }} /></span>
                    <span className="area-search-pct">{r.pct}%</span>
                  </>
                )}
              </li>
            );
          })}
        </ul>
        {overflow && <p className="area-search-note">Keep typing to narrow down</p>}
        <div className="area-search-hints" aria-hidden>
          <span>↑ ↓ navigate</span>
          <span>↵ select</span>
          <span>esc close</span>
        </div>
      </div>
      <div className="sr-only" role="status" aria-live="polite">{status}</div>
    </div>
  );
}
