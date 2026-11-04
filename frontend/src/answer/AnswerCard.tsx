import { ChevronDown, ChevronLeft, ChevronRight, X } from "lucide-react";
import { type CSSProperties, type KeyboardEvent, type PointerEvent, type ReactNode, useEffect, useRef, useState } from "react";
import "./AnswerCard.css";
import { RiskChip, type Tier } from "./RiskChip.tsx";

export type CardState = "ready" | "empty" | "no-data" | "error";
type Props = {
  open: boolean;
  area: { name: string; bzr_name: string } | null;
  areaId: string | null; // names are not unique (two Schloßstraße), so the id decides when the area changed
  state: CardState;
  tier: Tier;
  limited?: boolean; // few reports: the chip says so instead of showing the tier
  found?: string[]; // how the area was found in the place search
  blocks: { risk: ReactNode; advice?: ReactNode; source: ReactNode }; // advice arrives with #107
  onClose: () => void;
  lowerSignal?: number; // changing it lowers the phone sheet, e.g. when the search is focused
};

const STOPS = ["lowered", "higher", "full"] as const;
type Stop = (typeof STOPS)[number];
const LOWERED_PX = 280;
// at least 40px above lowered, so a short landscape phone never inverts the stops
const loweredPx = () => Math.min(LOWERED_PX, window.innerHeight);
export const higherPx = () => Math.min(window.innerHeight, Math.max(LOWERED_PX + 40, Math.min(520, Math.round(window.innerHeight * 0.64))));
const CLOSED = STOPS.length; // index after the last stop in the drag stops
const SLOP_PX = 6; // movement below this is a tap, not a drag
const FLICK_MS = 150; // how far ahead the release velocity projects the sheet
const phone = () => !window.matchMedia?.("(min-width: 600px)").matches;

const NOTE: Record<Exclude<CardState, "ready">, [title: string, text: string]> = {
  empty: ["Nothing to show yet", "There is nothing to show for this area yet."],
  "no-data": ["Not enough data", "There are no reports for this area, so it cannot be assessed. Treat it like any other area and lock up."],
  error: ["Could not load this area", "Something went wrong. Pick the area again to retry."],
};

// Phone: bottom sheet with three stops; from 600px a left panel. The layout switch is CSS; the drag settles on the stop nearest where the sheet would coast to.
export function AnswerCard({ open, area, areaId, state, tier, limited, found, blocks, onClose, lowerSignal }: Props) {
  const card = useRef<HTMLElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const [stop, setStop] = useState<Stop>("higher");
  const [collapsed, setCollapsed] = useState(false);
  const before = useRef<Stop>("higher"); // where Collapse returns to from full screen
  const last = useRef(area); // keeps the content while the card slides out
  if (area) last.current = area;
  const shown = area ?? last.current;
  const [, resized] = useState(0); // stops are measured from the viewport, so a rotation needs a re-render
  useEffect(() => {
    const bump = () => resized((n) => n + 1);
    window.addEventListener("resize", bump);
    return () => window.removeEventListener("resize", bump);
  }, []);

  const go = (next: Stop) => {
    if (next === "full" && stop !== "full") before.current = stop;
    setStop(next);
  };

  useEffect(() => {
    if (open) setStop("higher"); // picking another area keeps the height
  }, [open]);
  useEffect(() => {
    if (!open) return;
    setCollapsed(false); // a new area must not stay hidden behind a collapsed panel
    title.current?.focus();
  }, [open, areaId]);

  const signal = useRef(lowerSignal);
  useEffect(() => {
    if (lowerSignal !== signal.current && phone()) setStop("lowered");
    signal.current = lowerSignal;
  }, [lowerSignal]);

  const drag = useRef<{ y: number; from: number; stops: number[]; moved: boolean; last: [y: number, t: number] | null; v: number } | null>(null);
  const down = (e: PointerEvent) => {
    if (!phone()) return;
    const h = card.current!.offsetHeight;
    const stops = [h - loweredPx(), h - higherPx(), 0, h]; // translateY of lowered, higher, full, then CLOSED
    drag.current = { y: e.clientY, from: stops[STOPS.indexOf(stop)], stops, moved: false, last: null, v: 0 };
  };
  const move = (e: PointerEvent) => {
    const d = drag.current;
    if (!d || !card.current) return;
    if (!d.moved) {
      if (Math.abs(e.clientY - d.y) < SLOP_PX) return;
      d.moved = true;
      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
      card.current.style.transition = "none";
    }
    const now = performance.now();
    if (!d.last || now - d.last[1] >= 8) {
      if (d.last) d.v = (e.clientY - d.last[0]) / (now - d.last[1]);
      d.last = [e.clientY, now];
    }
    const raw = d.from + e.clientY - d.y; // above full screen the sheet resists, at a third of the pull
    card.current.style.transform = `translateY(${raw < 0 ? raw / 3 : raw}px)`;
  };
  const up = (e: PointerEvent) => {
    const d = drag.current;
    drag.current = null;
    if (!d?.moved || !card.current) return;
    const idle = d.last ? performance.now() - d.last[1] > 50 : true; // a held finger has no velocity
    const at = Math.max(0, d.from + e.clientY - d.y) + (idle ? 0 : d.v) * FLICK_MS;
    card.current.style.removeProperty("transition"); // the CSS transition settles it from here
    card.current.style.removeProperty("transform");
    const i = d.stops.reduce((best, s, k) => (Math.abs(s - at) < Math.abs(d.stops[best] - at) ? k : best), 0);
    if (i === CLOSED) onClose();
    else go(STOPS[i]);
  };
  const cancel = () => {
    drag.current = null;
    card.current?.style.removeProperty("transition");
    card.current?.style.removeProperty("transform");
  };
  const keys = (e: KeyboardEvent) => {
    if (e.key !== "Escape") return;
    e.stopPropagation();
    onClose();
  };
  const step = () => go(STOPS[(STOPS.indexOf(stop) + 1) % STOPS.length]);

  return (
    <>
      <section
        ref={card}
        role="dialog"
        aria-label={shown?.name ?? "Area details"}
        className="answer-card"
        data-open={open || undefined}
        data-stop={stop}
        data-collapsed={collapsed || undefined}
        style={{ "--answer-lowered": `${loweredPx()}px`, "--answer-higher": `${higherPx()}px` } as CSSProperties}
        onKeyDown={keys}
      >
        <div className="answer-drag flex-none" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={cancel}>
          <button type="button" className="answer-handle grid h-control-sm w-full cursor-pointer place-items-center border-0 bg-transparent" aria-label="Change height of area details" aria-expanded={stop !== "lowered"} onClick={step}>
            <span className="h-sheet-handle-h w-sheet-handle-w rounded-full bg-outline" />
          </button>
          <div className="answer-appbar h-14 items-center justify-between px-2">
            <button type="button" className={ICON_BUTTON} aria-label="Collapse area details" onClick={() => go(before.current)}>
              <ChevronDown aria-hidden="true" />
            </button>
            <button type="button" className={ICON_BUTTON} aria-label="Close area details" onClick={onClose}>
              <X aria-hidden="true" />
            </button>
          </div>
          <header className="answer-header flex items-start gap-2 px-4 pb-2">
            <div className="min-w-0 flex-1">
              <h2 ref={title} tabIndex={-1} className="headline-sm m-0 [overflow-wrap:anywhere]">{shown?.name}</h2>
              <p className="data-md mt-0 mb-2 text-on-surface-variant">{shown?.bzr_name}</p>
              {found?.map((line) => <p key={line} className="body-md mt-0 mb-2 text-on-surface-variant">{line}</p>)}
              {state === "ready" && <RiskChip tier={tier} limited={limited} />}
            </div>
            <button type="button" className={`answer-close ${ICON_BUTTON} -mt-1.5 -mr-2`} aria-label="Close area details" onClick={onClose}>
              <X aria-hidden="true" />
            </button>
          </header>
        </div>
        <div className="answer-body flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-4">
          {state === "ready" ? (
            <>
              <Block title="Risk assessment">{blocks.risk}</Block>
              {blocks.advice && <Block title="Lock advice">{blocks.advice}</Block>}
              <Block title="Where the information comes from">{blocks.source}</Block>
            </>
          ) : (
            // error colour is a border only, never text
            <div className="rounded-lg bg-tertiary-container p-4 text-on-tertiary-container data-[state=error]:border-2 data-[state=error]:border-error data-[state=error]:bg-transparent data-[state=error]:text-on-surface" data-state={state} role={state === "error" ? "alert" : undefined}>
              <p className="title-md m-0">{NOTE[state][0]}</p>
              <p className="body-lg m-0 mt-1">{NOTE[state][1]}</p>
            </div>
          )}
        </div>
      </section>
      <button type="button" className="answer-tab" data-open={open || undefined} data-collapsed={collapsed || undefined} aria-label={collapsed ? "Show area details" : "Collapse area details"} aria-expanded={!collapsed} onClick={() => setCollapsed(!collapsed)}>
        {collapsed ? <ChevronRight aria-hidden="true" /> : <ChevronLeft aria-hidden="true" />}
      </button>
    </>
  );
}

const ICON_BUTTON = "answer-icon-button grid size-tap-target flex-none cursor-pointer place-items-center rounded-full border-0 bg-transparent text-on-surface";

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="answer-block">
      <h3 className="title-md m-0 mb-2">{title}</h3>
      <div className="body-lg">{children}</div>
    </section>
  );
}
