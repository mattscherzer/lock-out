import { X } from "lucide-react";
import { type KeyboardEvent, type PointerEvent, type ReactNode, useEffect, useRef, useState } from "react";
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
};

const PEEK_PX = 200; // visible height when peeking; the same 200px as in AnswerCard.css
const SLOP_PX = 6; // movement below this is a tap, not a drag
const FLICK_MS = 150; // how far ahead the release velocity projects the sheet
const phone = () => !window.matchMedia?.("(min-width: 600px)").matches;

const NOTE: Record<Exclude<CardState, "ready">, [title: string, text: string]> = {
  empty: ["Nothing to show yet", "There is no advice for this area yet."],
  "no-data": ["Not enough data", "Too few reports for this area to give advice. Treat the area like any other and lock up."],
  error: ["Could not load this area", "Something went wrong. Pick the area again to retry."],
};

// Bottom sheet on phones (peek or expanded), side panel from 600px; the layout switch is pure CSS.
export function AnswerCard({ open, area, state, tier, blocks, onClose }: Props) {
  const card = useRef<HTMLElement>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (open) card.current?.focus();
    else setExpanded(false);
  }, [open]);

  // Material 3 style: the sheet follows the finger, then settles on the detent nearest to where it would coast to.
  const drag = useRef<{ y: number; from: number; h: number; moved: boolean; last: [y: number, t: number] | null; v: number } | null>(null);
  const down = (e: PointerEvent) => {
    if (!phone()) return;
    const h = card.current!.offsetHeight;
    drag.current = { y: e.clientY, from: expanded ? 0 : h - PEEK_PX, h, moved: false, last: null, v: 0 };
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
    if (d.last && now - d.last[1] >= 8) d.v = (e.clientY - d.last[0]) / (now - d.last[1]);
    if (!d.last || now - d.last[1] >= 8) d.last = [e.clientY, now];
    const raw = d.from + e.clientY - d.y; // above 0 (fully expanded) the sheet resists, at a third of the pull
    card.current.style.transform = `translateY(${raw < 0 ? raw / 3 : raw}px)`;
  };
  const up = (e: PointerEvent) => {
    const d = drag.current;
    drag.current = null;
    if (!d?.moved || !card.current) return;
    const at = Math.max(0, d.from + e.clientY - d.y) + d.v * FLICK_MS;
    card.current.style.transition = ""; // from here the CSS transition (token duration and easing) settles it
    card.current.style.transform = "";
    const stops = [0, d.h - PEEK_PX, d.h];
    const stop = stops.reduce((best, s) => (Math.abs(s - at) < Math.abs(best - at) ? s : best));
    if (stop === d.h) onClose();
    else setExpanded(stop === 0);
  };
  const cancel = () => {
    drag.current = null;
    if (card.current) card.current.style.cssText = "";
  };
  const keys = (e: KeyboardEvent) => {
    if (e.key !== "Escape") return;
    e.stopPropagation();
    onClose();
  };

  return (
    <section ref={card} tabIndex={-1} role="dialog" aria-label={area?.name ?? "Area details"} className="answer-card" data-open={open || undefined} data-expanded={expanded || undefined} onKeyDown={keys}>
      <div className="answer-drag" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={cancel}>
        <button type="button" className="answer-handle" aria-label={expanded ? "Shrink details" : "Expand details"} aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>
          <span />
        </button>
        <header className="answer-header">
          <div className="answer-title">
            <h2 className="headline-sm">{area?.name}</h2>
            <p className="body-md">{area?.bzr_name}</p>
            {state === "ready" && <RiskChip tier={tier} />}
          </div>
          <button type="button" className="answer-close" aria-label="Close" onClick={onClose}>
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
