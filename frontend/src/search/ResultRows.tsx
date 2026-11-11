import {
  ChevronDown,
  Mail,
  MapPin,
  Road,
  TrainFront,
  VectorPolygon,
  type LucideIcon,
} from "lucide-react";
import type { Areas } from "../domain/lookup.ts";
import { STRINGS } from "../strings.ts";
import { bezirkLabel, EXAMPLES, isPlainStreet, placeKey } from "./places.ts";
import type { Place, Row } from "./types.ts";

const S = STRINGS.search;
const GLYPH_PX = 18;
const GLYPH_STROKE = 1.8;

const kindWord = (place: Place) =>
  place.sub ? S.stationSub(place.sub) : (place.type ?? S.kind[place.kind]); // type: Water, Square, Motorway...

// Outline glyph per kind; one pin for the other named places (square, water, motorway, forest). The type is also written in words, so the glyph is never the only signal.
const glyph = (place: Place) => {
  if (place.kind === "area") return VectorPolygon;
  if (place.kind === "postcode") return Mail;
  if (place.kind === "station") return TrainFront;
  return isPlainStreet(place) ? Road : MapPin;
};

const exampleGlyph: Record<(typeof EXAMPLES)[number]["kind"], LucideIcon> = {
  street: Road,
  postcode: Mail,
  station: TrainFront,
  area: VectorPolygon,
  water: MapPin,
};

// Write class strings out whole so Tailwind sees them; never build one from state.
const OPTION =
  "box-border flex min-h-16 cursor-pointer items-center gap-3 px-4 py-2 aria-selected:bg-surface-container";
const PARENT =
  "area-search-parent box-border flex min-h-14 cursor-default items-center gap-3 px-4 py-2";
const CHILD =
  "box-border flex min-h-tap-target cursor-pointer items-center gap-2 bg-surface py-2 pr-4 pl-16 aria-selected:bg-surface-container";
const MORE =
  "body-md box-border flex min-h-tap-target cursor-pointer items-center gap-2 py-2 pr-4 pl-16 font-semibold text-on-primary-container aria-selected:bg-surface-container";
const GLYPH =
  "grid size-9 flex-none place-items-center rounded-full bg-secondary-container text-on-secondary-container";
const TEXT = "flex min-w-0 flex-1 flex-col";
const NAME = "area-search-name body-lg line-clamp-2 [overflow-wrap:anywhere] [&_b]:font-semibold"; // area-search-name is a test hook, no CSS selects it
const NAME_CHILD =
  "area-search-name body-md line-clamp-2 font-medium [overflow-wrap:anywhere] [&_b]:font-semibold";
const SUB = "mt-0.5 truncate body-sm text-on-surface-variant";
const SUB_CHILD = "body-sm truncate text-on-surface-variant";
const BAR = "h-1.5 w-11 flex-none overflow-hidden rounded-xs bg-outline-variant";
const PCT = "body-sm min-w-9 flex-none text-right font-semibold text-on-primary-container";

const rowKey = (r: Row) =>
  r.type === "area" ? `${placeKey(r.place)}|${r.id}` : `${r.type}|${placeKey(r.place)}`; // a place spans several areas

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

type OptionProps = { id: string; selected: boolean; onClick: () => void; onHover: () => void };

export function ExampleRows({
  idPrefix,
  current,
  onPick,
  onHover,
}: {
  idPrefix: string;
  current: number;
  onPick: (label: string) => void;
  onHover: (i: number) => void;
}) {
  return EXAMPLES.map((ex, i) => {
    const Glyph = exampleGlyph[ex.kind];
    return (
      <li
        key={ex.label}
        id={`${idPrefix}-${i}`}
        role="option"
        aria-selected={i === current}
        className={OPTION}
        onClick={() => onPick(ex.label)}
        onMouseMove={() => onHover(i)}
      >
        <span className={GLYPH}>
          <Glyph aria-hidden size={GLYPH_PX} strokeWidth={GLYPH_STROKE} />
        </span>
        <span className={TEXT}>
          <span className={NAME}>{ex.label}</span>
          <span className={SUB}>{ex.word}</span>
        </span>
      </li>
    );
  });
}

function LabelRow({ place, name, query }: { place: Place; name: string; query: string }) {
  const Glyph = glyph(place);
  return (
    <li role="presentation" className={PARENT} title={name}>
      <span className={GLYPH}>
        <Glyph aria-hidden size={GLYPH_PX} strokeWidth={GLYPH_STROKE} />
      </span>
      <span className={TEXT}>
        <span className={NAME}>
          <Bold text={name} part={query} />
        </span>
        <span className={SUB}>{S.inAreas(kindWord(place), place.areas.length)}</span>
      </span>
    </li>
  );
}

function MoreRow({
  n,
  name,
  id,
  selected,
  onClick,
  onHover,
}: OptionProps & { n: number; name: string }) {
  return (
    <li
      id={id}
      role="option"
      aria-selected={selected}
      onClick={onClick}
      onMouseMove={onHover}
      className={MORE}
    >
      {S.more(n, name)}
      <ChevronDown aria-hidden size={16} strokeWidth={2} />
    </li>
  );
}

function AreaRow({
  row,
  area,
  name,
  query,
  id,
  selected,
  onClick,
  onHover,
}: OptionProps & {
  row: Extract<Row, { type: "area" }>;
  area: Areas[string];
  name: string;
  query: string;
}) {
  const { place, pct } = row;
  const Glyph = glyph(place);
  const child = pct != null; // under a label row the area is the subject
  const full = child ? area.name : name;
  const sub =
    child || place.kind === "area"
      ? S.areaSub(bezirkLabel(area.bzr_name))
      : S.placeSub(kindWord(place), area.name, bezirkLabel(area.bzr_name));
  return (
    <li
      id={id}
      role="option"
      aria-selected={selected}
      onClick={onClick}
      onMouseMove={onHover}
      title={full}
      aria-label={child ? S.rowLabel(full, sub, name, pct) : undefined}
      className={child ? CHILD : OPTION}
    >
      {!child && (
        <span className={GLYPH}>
          <Glyph aria-hidden size={GLYPH_PX} strokeWidth={GLYPH_STROKE} />
        </span>
      )}
      <span className={TEXT}>
        <span className={child ? NAME_CHILD : NAME}>
          <Bold text={full} part={query} />
        </span>
        <span className={child ? SUB_CHILD : SUB}>{sub}</span>
      </span>
      {child && (
        <>
          <span className={BAR} aria-hidden>
            <span className="block h-full rounded-xs bg-primary" style={{ width: `${pct}%` }} />
          </span>
          <span className={PCT}>{pct}%</span>
        </>
      )}
    </li>
  );
}

// all: label rows included; rows: the options only, numbered for ids and the active row
export function ResultRows({
  all,
  rows,
  areas,
  idPrefix,
  current,
  query,
  onChoose,
  onHover,
}: {
  all: Row[];
  rows: Row[];
  areas: Areas;
  idPrefix: string;
  current: number;
  query: string;
  onChoose: (r: Row) => void;
  onHover: (i: number) => void;
}) {
  return all.map((r) => {
    const key = rowKey(r);
    const name = r.place.bezirk
      ? `${r.place.label} (${bezirkLabel(r.place.bezirk)})`
      : r.place.label;
    if (r.type === "label") return <LabelRow key={key} place={r.place} name={name} query={query} />;
    const i = rows.indexOf(r);
    const option = {
      id: `${idPrefix}-${i}`,
      selected: i === current,
      onClick: () => onChoose(r),
      onHover: () => onHover(i),
    };
    return r.type === "more" ? (
      <MoreRow key={key} n={r.n} name={name} {...option} />
    ) : (
      <AreaRow key={key} row={r} area={areas[r.id]!} name={name} query={query} {...option} />
    );
  });
}
