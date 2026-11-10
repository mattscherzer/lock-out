import { ArrowLeft, LoaderCircle, Search, X } from "lucide-react";
import { useEffect, useEffectEvent, useId, useRef, useState, useSyncExternalStore } from "react";
import "./AreaSearch.css";
import {
  buildRows,
  EXAMPLES,
  MAX_ROWS,
  parseQuery,
  placeKey,
  rank,
  searchPlaces,
  statusText,
} from "./places.ts";
import { ExampleRows, ResultRows } from "./ResultRows.tsx";
import { useStreets } from "./useStreets.ts";
import { useVisualViewport } from "./useVisualViewport.ts";
import type { Areas } from "../domain/lookup.ts";
import { STRINGS } from "../strings.ts";
import { WIDE } from "../viewport.ts";
import type { Context, Index, Row } from "./types.ts";

type Props = {
  index: Index;
  areas: Areas;
  selected: string | null;
  onSelect: (id: string, context: Context | null) => void;
  onClear: () => void;
  onHighlight?: (id: string | null) => void; // the area under the pointer or arrow keys in the open list
  closeSignal?: number; // changing it closes the list, e.g. on a tap on the map
  loadStreets?: () => Promise<unknown>; // must reject on failure; retried on the next focus
};

// Write class strings out whole so Tailwind sees them; never build one from state.
const S = STRINGS.search;
const ICON_PX = 22;
const NOTE = "body-sm m-0 px-4 py-3 text-on-surface-variant";
const LABEL = "body-sm m-0 px-4 pt-3 pb-1 font-semibold text-on-surface-variant";
const MESSAGE = "body-sm p-6 text-on-surface-variant";
const MESSAGE_TITLE = "body-lg m-0 mb-1 font-semibold";
const ICON_BOX = "grid size-tap-target flex-none place-items-center text-on-surface-variant";
const SKELETON_ROW = "box-border flex min-h-16 items-center gap-3 px-4 py-2";
const PULSE = "animate-pulse bg-surface-container motion-reduce:animate-none";
const HINTS =
  "body-sm hidden flex-none gap-4 border-t border-outline-variant bg-surface px-4 py-3 text-on-surface-variant min-[900px]:flex";

const subscribeWide = (cb: () => void) => {
  const m = window.matchMedia?.(WIDE);
  m?.addEventListener("change", cb);
  return () => m?.removeEventListener("change", cb);
};
export function AreaSearch({
  index,
  areas,
  selected,
  onSelect,
  onClear,
  onHighlight,
  closeSignal,
  loadStreets,
}: Props) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const justFocused = useRef(false);
  const retrying = useRef(false); // focus returning from Try again must not select the typed text
  const [draft, setDraft] = useState<string | null>(null); // what the user typed; null: the field shows the selected area
  const [chosen, setChosen] = useState<{ id: string; query: string; place: string }>(); // the area picked, the place it came from (placeKey) and the query that found it
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<number | null>(null); // null: the picked row, else the first
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set()); // places showing all their areas
  const limit = useSyncExternalStore(
    subscribeWide,
    () => ((window.matchMedia?.(WIDE).matches ?? true) ? MAX_ROWS.wide : MAX_ROWS.mobile),
    () => MAX_ROWS.wide,
  );
  const {
    loading: streetsLoading,
    error: streetsError,
    slow,
    load: loadNow,
  } = useStreets(loadStreets);
  useVisualViewport();

  const selectedName = selected ? (areas[selected]?.name ?? "") : "";
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
  if (showingSelection)
    places.sort((a, b) => rank(a, selected, chosen?.place) - rank(b, selected, chosen?.place));
  const { rows: all, overflow } = buildRows(places, limit, expanded);
  const rows = all.filter((r) => r.type !== "label"); // options; label rows are rendered between them
  const picked = showingSelection
    ? rows.findIndex(
        (r) => r.type === "area" && r.id === selected && placeKey(r.place) === chosen?.place,
      )
    : -1;
  const empty = open && !query.trim(); // nothing typed: offer the examples
  const count = empty ? EXAMPLES.length : rows.length;
  const current = Math.min(active ?? Math.max(picked, 0), count - 1);
  const shown = open && !!query.trim();
  const row = shown && active !== null ? rows[current] : undefined;
  const highlighted = row?.type === "area" ? row.id : null;
  const emitHighlight = useEffectEvent((id: string | null) => onHighlight?.(id));
  useEffect(() => {
    emitHighlight(highlighted);
    return () => emitHighlight(null);
  }, [highlighted]);
  const tooShort = query.trim().length < 2; // searchPlaces needs two characters

  useEffect(() => {
    if ((shown || empty) && count)
      document.getElementById(`${id}-${current}`)?.scrollIntoView?.({ block: "nearest" });
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
    onSelect(
      r.id,
      r.place.kind === "area"
        ? null
        : { kind: r.place.kind, label: r.place.label, pct: r.pct, ll: r.place.ll },
    );
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

  const status = shown
    ? statusText({ tooShort, error: streetsError, loading: streetsLoading, results: rows.length })
    : "";

  return (
    <div
      className="area-search"
      onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && close()}
      data-open={open || undefined}
      data-list={open || undefined}
    >
      <div className="area-search-field">
        <button
          type="button"
          className="area-search-back"
          aria-label={S.closeLabel}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            close();
            input.current?.blur();
          }}
        >
          <ArrowLeft aria-hidden size={ICON_PX} />
        </button>
        <span className={`area-search-icon ${ICON_BOX}`} onClick={() => input.current?.focus()}>
          <Search aria-hidden size={ICON_PX} />
        </span>
        <input
          ref={input}
          type="text"
          role="combobox"
          className="body-lg font-medium"
          aria-expanded={(shown || empty) && count > 0}
          aria-controls={`${id}-list`}
          aria-autocomplete="list"
          aria-activedescendant={(shown || empty) && count ? `${id}-${current}` : undefined}
          aria-label={S.inputLabel}
          placeholder={S.placeholder}
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
        {slow && streetsLoading && (
          <span className={ICON_BOX} aria-hidden>
            <LoaderCircle className="animate-spin motion-reduce:animate-none" size={ICON_PX} />
          </span>
        )}
        {text && !(slow && streetsLoading) && (
          <button
            type="button"
            className="area-search-clear"
            aria-label={S.clearLabel}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              setDraft("");
              setActive(null);
              setOpen(true);
              onClear();
              input.current?.focus();
            }}
          >
            <X aria-hidden size={ICON_PX} />
          </button>
        )}
      </div>
      <div className="area-search-panel" hidden={!open}>
        {houseNumber && <p className={NOTE}>{S.houseNumber}</p>}
        {shown && tooShort && <p className={NOTE}>{S.tooShort}</p>}
        {shown && !tooShort && streetsError && (
          <div className={`area-search-error ${MESSAGE}`} role="alert">
            <p className={`${MESSAGE_TITLE} text-error`}>
              {rows.length ? S.errorWithRows : S.errorNoRows}
            </p>
            <p className="m-0 mb-1">{S.errorBody}</p>
            <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={retry}>
              {S.retry}
            </button>
          </div>
        )}
        {shown && !tooShort && !rows.length && streetsLoading && slow && (
          <ul className="area-search-skeleton" aria-hidden>
            {[0, 1, 2].map((i) => (
              <li key={i} className={SKELETON_ROW}>
                <span className={`size-9 flex-none rounded-full ${PULSE}`} />
                <span className="flex flex-1 flex-col gap-2">
                  <i className={`block h-3 w-3/5 rounded-full ${PULSE}`} />
                  <i className={`block h-3 w-2/5 rounded-full ${PULSE}`} />
                </span>
              </li>
            ))}
          </ul>
        )}
        {empty && <p className={LABEL}>{S.tryTitle}</p>}
        {shown && !tooShort && !rows.length && !streetsLoading && !streetsError && (
          <div className={MESSAGE}>
            <p className={`${MESSAGE_TITLE} text-on-surface`}>{S.notFound(query.trim())}</p>
            <p className="m-0 mb-1">{S.berlinOnly}</p>
          </div>
        )}
        <ul
          id={`${id}-list`}
          role="listbox"
          aria-label={empty ? S.examplesLabel : S.areasLabel}
          hidden={!count}
          onMouseDown={(e) => e.preventDefault()}
        >
          {empty && (
            <ExampleRows idPrefix={id} current={current} onPick={pickExample} onHover={setActive} />
          )}
          {!empty && (
            <ResultRows
              all={all}
              rows={rows}
              areas={areas}
              idPrefix={id}
              current={current}
              query={query.trim()}
              onChoose={(r) => choose(r, true)}
              onHover={setActive}
            />
          )}
        </ul>
        {overflow && <p className={NOTE}>{S.narrow}</p>}
        <div className={HINTS} aria-hidden>
          <span>{S.hints.navigate}</span>
          <span>{S.hints.select}</span>
          <span>{S.hints.close}</span>
        </div>
      </div>
      <div className="sr-only" role="status" aria-live="polite">
        {status}
      </div>
    </div>
  );
}
