import { ChevronDown, ChevronLeft, ChevronRight, X } from "lucide-react";
import { type CSSProperties, type KeyboardEvent, type PointerEvent, type ReactNode, useEffect, useRef, useState } from "react";
import "./AnswerCard.css";
import { RiskChip, type Tier } from "./RiskChip.tsx";

export type CardState = "ready" | "empty" | "no-data" | "error";
type Props = {
  open: boolean;
  area: { name: string; bzr_name: string } | null;
  state: CardState;
  tier: Tier;
  blocks: { risk: ReactNode; advice: ReactNode; source: ReactNode };
  onClose: () => void;
  lowerSignal?: number; // changing it lowers the phone sheet, e.g. when the search is focused
};

const STOPS = ["lowered", "higher", "full"] as const;
type Stop = (typeof STOPS)[number];
const LOWERED_PX = 280;
// at least 40px above lowered, so a short landscape phone never inverts the stops
export const higherPx = () => Math.max(LOWERED_PX + 40, Math.min(520, Math.round(window.innerHeight * 0.64)));
const CLOSED = STOPS.length; // index after the last stop in the drag stops
const SLOP_PX = 6; // movement below this is a tap, not a drag
const FLICK_MS = 150; // how far ahead the release velocity projects the sheet
const phone = () => !window.matchMedia?.("(min-width: 600px)").matches;

const NOTE: Record<Exclude<CardState, "ready">, [title: string, text: string]> = {
  empty: ["Nothing to show yet", "There is no advice for this area yet."],
  "no-data": ["Not enough data", "Too few reports for this area to give advice. Treat the area like any other and lock up."],
  error: ["Could not load this area", "Something went wrong. Pick the area again to retry."],
};

// Phone: Material 3 standard bottom sheet with three heights (lowered, higher, full screen); from 600px a full-height left panel.
// The layout switch is CSS; on a phone the sheet follows the finger and settles on the stop nearest to where it would coast to.
export function AnswerCard({ open, area, state, tier, blocks, onClose, lowerSignal }: Props) {
  const card = useRef<HTMLElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const [stop, setStop] = useState<Stop>("higher");
  const [collapsed, setCollapsed] = useState(false); // desktop: panel hidden, edge tab left
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
    if (open) setStop("higher"); // opens at the middle height; picking another area keeps the height
  }, [open]);
  useEffect(() => {
    if (!open) return;
    setCollapsed(false); // a new area must not stay hidden behind a collapsed panel
    title.current?.focus();
  }, [open, shown?.name]);

  const signal = useRef(lowerSignal);
  useEffect(() => {
    if (lowerSignal !== signal.current && phone()) setStop("lowered");
    signal.current = lowerSignal;
  }, [lowerSignal]);

  const drag = useRef<{ y: number; from: number; stops: number[]; moved: boolean; last: [y: number, t: number] | null; v: number } | null>(null);
  const down = (e: PointerEvent) => {
    if (!phone()) return;
    const h = card.current!.offsetHeight;
    const stops = [h - LOWERED_PX, h - higherPx(), 0, h]; // translateY of lowered, higher, full, then CLOSED
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
    card.current.style.removeProperty("transition"); // from here the CSS transition (token duration and easing) settles it
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
  // the handle steps lowered, higher, full, lowered: the single-pointer alternative to dragging
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
        style={{ "--answer-lowered": `${LOWERED_PX}px`, "--answer-higher": `${higherPx()}px` } as CSSProperties}
        onKeyDown={keys}
      >
        <div className="answer-drag" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={cancel}>
          <button type="button" className="answer-handle" aria-label="Change height of area details" aria-expanded={stop !== "lowered"} onClick={step}>
            <span />
          </button>
          <div className="answer-appbar">
            <button type="button" aria-label="Collapse area details" onClick={() => go(before.current)}>
              <ChevronDown aria-hidden="true" />
            </button>
            <button type="button" aria-label="Close area details" onClick={onClose}>
              <X aria-hidden="true" />
            </button>
          </div>
          <header className="answer-header">
            <div className="answer-title">
              <h2 ref={title} tabIndex={-1} className="headline-sm">{shown?.name}</h2>
              <p className="data-md">{shown?.bzr_name}</p>
              {state === "ready" && <RiskChip tier={tier} />}
            </div>
            <button type="button" className="answer-close" aria-label="Close area details" onClick={onClose}>
              <X aria-hidden="true" />
            </button>
          </header>
        </div>
        <div className="answer-body">
          {state === "ready" ? (
            <>
              <Block title="Risk assessment">{blocks.risk}</Block>
              <Block title="Lock advice">{blocks.advice}</Block>
              <Block title="Where the information comes from">{blocks.source}</Block>
            </>
          ) : (
            <div className="answer-note" data-state={state} role={state === "error" ? "alert" : undefined}>
              <p className="title-md">{NOTE[state][0]}</p>
              <p className="body-lg">{NOTE[state][1]}</p>
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

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="answer-block">
      <h3 className="title-md">{title}</h3>
      <div className="body-lg">{children}</div>
    </section>
  );
}
