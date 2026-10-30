import { ArrowLeft, Mail, MapPin, Road, Search, TrainFront, VectorPolygon, X } from "lucide-react";
import { useEffect, useEffectEvent, useId, useRef, useState } from "react";
import "./AreaSearch.css";
import { parseQuery, searchRows } from "./places.ts";
import type { Areas, Index, Kind, Row } from "./types.ts";

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

const kindWord = ({ place }: Row) => (place.sub ? `${place.sub} station` : place.type ?? { postcode: "Postcode", station: "Station", street: "Street", area: "Area" }[place.kind]); // type: Water, Square, Motorway...

// Outline glyph per kind; one pin for the other named places (square, water, motorway, forest). The type is also written in words, so the glyph is never the only signal.
const glyph = ({ place }: Row) => {
  if (place.kind === "area") return VectorPolygon;
  if (place.kind === "postcode") return Mail;
  if (place.kind === "station") return TrainFront;
  return !place.type || place.type === "Street" ? Road : MapPin;
};

const rowKey = ({ place, id }: Row) => `${place.kind}|${place.label}|${place.bezirk}|${place.type}|${id}`; // a place spans several areas, and one name can repeat per Bezirk and type
const rank = (r: Row, selected: string, picked?: string) => (rowKey(r) === picked ? 0 : r.id === selected ? (r.place.kind === "area" ? 1 : 2) : 3);

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
  const loading = useRef<Promise<void>>(undefined);
  const [draft, setDraft] = useState<string | null>(null); // what the user typed; null: the field shows the selected area
  const [chosen, setChosen] = useState<{ id: string; query: string; key: string }>(); // the row picked, and the query that found it
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [streetsLoading, setStreetsLoading] = useState(false);
  const [, setLoaded] = useState(0); // bumped when street data arrives: addStreets fills index in place, so rerender to search again

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
  const rows = query.trim() ? searchRows(index, query) : [];
  // the picked row first so Enter keeps it, then the rest of its area
  if (showingSelection) rows.sort((a, b) => rank(a, selected, chosen?.key) - rank(b, selected, chosen?.key));
  const current = Math.min(active, rows.length - 1);
  const shown = open && !!query.trim();
  const tooShort = query.trim().length < 2; // searchPlaces needs two characters

  // keep the highlighted row in view while arrowing through a long list
  useEffect(() => {
    if (shown && rows.length) document.getElementById(`${id}-${current}`)?.scrollIntoView?.({ block: "nearest" });
  });
  // after a keyboard pick or Esc the field shows the area name selected, so typing replaces it
  const reselect = useRef(false);
  useEffect(() => {
    if (reselect.current && document.activeElement === input.current) input.current?.select();
    reselect.current = false;
  });

  const choose = (r: Row, pointer = false) => {
    setChosen({ id: r.id, query: searchText, key: rowKey(r) });
    setDraft(null);
    setOpen(false);
    setActive(0);
    onSelect(r.id, r.place.kind === "area" ? null : { kind: r.place.kind, label: r.place.label, pct: r.pct, ll: r.place.ll });
    if (!pointer) reselect.current = true;
    if (pointer) input.current?.blur(); // a tap must not leave the soft keyboard over the map; Enter keeps focus for the keyboard user
  };

  const onFocus = () => {
    justFocused.current = true;
    input.current?.select();
    setActive(0);
    setOpen(true);
    if (!loadStreets || loading.current) return;
    setStreetsLoading(true);
    loading.current = loadStreets().then(
      () => {
        setStreetsLoading(false);
        setLoaded((n) => n + 1);
      },
      () => {
        setStreetsLoading(false);
        loading.current = undefined;
      },
    );
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      reselect.current = !!selected;
      return close();
    }
    const step = { ArrowDown: 1, ArrowUp: -1 }[e.key];
    if (step && !open && query.trim()) {
      e.preventDefault();
      return setOpen(true);
    }
    if (!shown || !rows.length) return;
    if (step) {
      e.preventDefault();
      setActive((current + step + rows.length) % rows.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      choose(rows[current]);
    }
  };

  const status = !shown ? "" : tooShort ? "Keep typing" : streetsLoading ? "Searching" : rows.length ? `${rows.length} ${rows.length === 1 ? "result" : "results"}` : "No results";

  return (
    <div className="area-search" data-open={open || undefined} data-list={shown || undefined}>
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
          aria-expanded={shown && rows.length > 0}
          aria-controls={`${id}-list`}
          aria-autocomplete="list"
          aria-activedescendant={shown && rows.length ? `${id}-${current}` : undefined}
          aria-label="Search area, street, station or postcode"
          placeholder="Area, street, station, postcode…"
          autoComplete="off"
          spellCheck={false}
          value={text}
          onChange={(e) => {
            setDraft(e.target.value);
            setActive(0);
            setOpen(true);
          }}
          onFocus={onFocus}
          onMouseUp={(e) => {
            if (justFocused.current) e.preventDefault(); // keep the select-all from onFocus
            justFocused.current = false;
          }}
          onClick={() => setOpen(true)}
          onBlur={() => {
            justFocused.current = false;
            close();
          }}
          onKeyDown={onKeyDown}
        />
        {text && (
          <button
            type="button"
            className="area-search-clear"
            aria-label="Clear search"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              setDraft("");
              setActive(0);
              onClear();
              input.current?.focus();
            }}
          >
            <X aria-hidden size={22} />
          </button>
        )}
      </div>
      <div className="area-search-panel" hidden={!shown}>
        {houseNumber && <p className="area-search-note">House numbers aren't searchable yet, showing the street.</p>}
        {tooShort && <p className="area-search-note">Type at least two characters.</p>}
        {!tooShort && !rows.length && !streetsLoading && (
          <div className="area-search-note area-search-empty">
            <p className="title-sm">‘{query.trim()}’ not found</p>
            <p>lock-out covers Berlin only. Try a Berlin street, postcode, area or station.</p>
          </div>
        )}
        <ul id={`${id}-list`} role="listbox" aria-label="Areas" hidden={!rows.length} onMouseDown={(e) => e.preventDefault()}>
          {rows.map((r, i) => {
            const area = areas[r.id];
            const Glyph = glyph(r);
            const name = r.place.bezirk ? `${r.place.label} (${r.place.bezirk})` : r.place.kind === "area" ? area.name : r.place.label;
            return (
              <li key={rowKey(r)} id={`${id}-${i}`} role="option" aria-selected={i === current} className="area-search-option" onClick={() => choose(r, true)} onMouseMove={() => setActive(i)}>
                <span className="area-search-glyph"><Glyph aria-hidden size={18} strokeWidth={1.8} /></span>
                <span className="area-search-text">
                  <span className="area-search-name"><Bold text={name} part={query.trim()} /></span>
                  <span className="area-search-sub">{r.place.kind === "area" ? `Area · ${area.bzr_name}` : `${kindWord(r)} · ${area.name} · ${area.bzr_name}`}</span>
                </span>
                {r.pct != null && r.pct < 100 && <span className="area-search-pct">{r.pct}%</span>}
              </li>
            );
          })}
        </ul>
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
