import { ChevronDown, ChevronLeft, ChevronRight, X } from "lucide-react";
import {
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import { ExplainSheet } from "./ExplainSheet.tsx";
import { ICON_BUTTON } from "./iconButton.ts";
import "./AnswerCard.css";

export type CardState = "ready" | "empty" | "no-data" | "error";
type Props = {
  open: boolean;
  area: { name: string; bzr_name: string } | null;
  areaId: string | null; // names are not unique (two Schloßstraße), so the id decides when the area changed
  state: CardState;
  verdict: (explain: () => void) => ReactNode;
  tier?: ReactNode; // compact verdict: pinned once the verdict card has scrolled away, and the only verdict shown when lowered
  advice?: ReactNode;
  details: ReactNode;
  explain: ReactNode;
  onClose: () => void;
  lowerSignal?: number; // changing it lowers the phone sheet, e.g. when the search is focused
};

const STOPS = ["lowered", "higher", "full"] as const;
type Stop = (typeof STOPS)[number];
const LOWERED_PX = 152; // handle, name, district and the compact verdict
// at least 40px above lowered, so a short landscape phone never inverts the stops
const loweredPx = () => Math.min(LOWERED_PX, window.innerHeight);
export const higherPx = () =>
  Math.min(
    window.innerHeight,
    Math.max(LOWERED_PX + 40, Math.min(520, Math.round(window.innerHeight * 0.64))),
  );
const CLOSED = STOPS.length; // index after the last stop in the drag stops
const SLOP_PX = 6; // movement below this is a tap, not a drag
const PULL_PX = 2; // a pull down from the top of the content claims the gesture this early, before the browser decides to scroll
const FLICK_MS = 150; // how far ahead the release velocity projects the sheet
const phone = () => !window.matchMedia?.("(min-width: 600px)").matches;

const NOTE: Record<Exclude<CardState, "ready" | "no-data">, [title: string, text: string]> = {
  empty: ["Nothing to show yet", "There is nothing to show for this area yet."],
  error: ["Could not load this area", "Something went wrong. Pick the area again to retry."],
};

// Phone: bottom sheet with three stops; from 600px a left panel. The layout switch is CSS; the drag settles on the stop nearest where the sheet would coast to.
export function AnswerCard({
  open,
  area,
  areaId,
  state,
  verdict,
  tier,
  advice,
  details,
  explain,
  onClose,
  lowerSignal,
}: Props) {
  const card = useRef<HTMLElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const strip = useRef<HTMLDivElement>(null);
  const verdictBox = useRef<HTMLDivElement>(null);
  const [pinned, setPinned] = useState(0); // 1: the name has scrolled away (phone), 2: the verdict card has too
  const [stop, setStop] = useState<Stop>("higher");
  const [collapsed, setCollapsed] = useState(false);
  const [explainOpen, setExplainOpen] = useState(false);
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setExplainOpen(false);
  }
  const trigger = useRef<HTMLElement | null>(null);
  const closeExplain = () => {
    setExplainOpen(false);
    trigger.current?.focus();
  };
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

  const onScroll = () => {
    if (!card.current?.scrollTop) return setPinned(0);
    const under = strip.current?.getBoundingClientRect().top; // where the pinned strip sits
    if (under === undefined) return;
    const rect = (el: HTMLElement | null) => el?.getBoundingClientRect();
    // the strip takes over as soon as the verdict card reaches it; the name once it has scrolled away
    setPinned(
      (rect(verdictBox.current)?.top ?? Infinity) <= under
        ? 2
        : (rect(title.current)?.bottom ?? Infinity) <= under
          ? 1
          : 0,
    );
  };
  useEffect(() => {
    if (stop !== "full") card.current?.scrollTo?.(0, 0);
    onScroll(); // no scroll event fires when the position did not change, but the layout did
  }, [stop, areaId, open]);
  useEffect(() => {
    card.current?.scrollTo?.(0, 0); // another area starts at its top
  }, [areaId]);
  const collapse = () => go(stop === "full" ? before.current : "lowered");
  useEffect(() => {
    if (open) setStop("higher"); // picking another area keeps the height
  }, [open]);
  useEffect(() => {
    if (!open) return;
    setCollapsed(false); // a new area must not stay hidden behind a collapsed panel
    setExplainOpen(false);
    title.current?.focus();
  }, [open, areaId]);

  const signal = useRef(lowerSignal);
  useEffect(() => {
    if (lowerSignal !== signal.current && phone()) setStop("lowered");
    signal.current = lowerSignal;
  }, [lowerSignal]);

  const drag = useRef<{
    y: number;
    from: number;
    stops: number[];
    moved: boolean;
    last: [y: number, t: number] | null;
    v: number;
  } | null>(null);
  const begin = (y: number) => {
    const h = card.current!.offsetHeight;
    const stops = [h - loweredPx(), h - higherPx(), 0, h]; // translateY of lowered, higher, full, then CLOSED
    drag.current = { y, from: stops[STOPS.indexOf(stop)], stops, moved: false, last: null, v: 0 };
  };
  const track = (y: number, capture?: () => void) => {
    const d = drag.current;
    if (!d || !card.current) return;
    if (!d.moved) {
      if (Math.abs(y - d.y) < SLOP_PX) return;
      d.moved = true;
      capture?.();
      card.current.style.transition = "none";
    }
    const now = performance.now();
    if (!d.last || now - d.last[1] >= 8) {
      if (d.last) d.v = (y - d.last[0]) / (now - d.last[1]);
      d.last = [y, now];
    }
    const raw = d.from + y - d.y;
    card.current.style.transform = `translateY(${raw < 0 ? raw / 3 : raw}px)`;
  };
  const end = (y: number) => {
    const d = drag.current;
    drag.current = null;
    if (!d?.moved || !card.current) return;
    const idle = d.last ? performance.now() - d.last[1] > 50 : true; // a held finger has no velocity
    const at = Math.max(0, d.from + y - d.y) + (idle ? 0 : d.v) * FLICK_MS;
    card.current.style.removeProperty("transition"); // the CSS transition settles it from here
    card.current.style.removeProperty("transform");
    const i = d.stops.reduce(
      (best, s, k) => (Math.abs(s - at) < Math.abs(d.stops[best] - at) ? k : best),
      0,
    );
    if (i === CLOSED) onClose();
    else go(STOPS[i]);
  };
  const cancel = () => {
    drag.current = null;
    card.current?.style.removeProperty("transition");
    card.current?.style.removeProperty("transform");
  };
  const down = (e: PointerEvent) => {
    if (!phone()) return;
    if (stop === "full" && !(e.target as Element).closest(".answer-pin")) return;
    begin(e.clientY);
  };
  const move = (e: PointerEvent) =>
    track(e.clientY, () => (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId));
  const up = (e: PointerEvent) => end(e.clientY);

  const latest = useRef({ stop, begin, track, end, cancel });
  latest.current = { stop, begin, track, end, cancel };
  useEffect(() => {
    const el = card.current;
    if (!el) return;
    let pull: { y0: number; on: boolean } | null = null;
    const start = (e: TouchEvent) => {
      const free =
        latest.current.stop === "full" &&
        phone() &&
        el.scrollTop <= 0 &&
        e.touches.length === 1 &&
        !(e.target as Element).closest(".answer-pin");
      pull = free ? { y0: e.touches[0].clientY, on: false } : null;
    };
    const move = (e: TouchEvent) => {
      if (!pull) return;
      const y = e.touches[0].clientY;
      if (!pull.on) {
        if (y < pull.y0 || el.scrollTop > 0)
          pull = null; // scrolling up: the browser scrolls the content
        else if (y - pull.y0 >= PULL_PX) {
          pull.on = true;
          latest.current.begin(pull.y0);
        }
        if (!pull?.on) return;
      }
      e.preventDefault();
      latest.current.track(y);
    };
    const finish = (e: TouchEvent) => {
      if (pull?.on) latest.current.end(e.changedTouches[0].clientY);
      pull = null;
    };
    const abort = () => {
      if (pull?.on) latest.current.cancel();
      pull = null;
    };
    el.addEventListener("touchstart", start, { passive: true });
    el.addEventListener("touchmove", move, { passive: false });
    el.addEventListener("touchend", finish);
    el.addEventListener("touchcancel", abort);
    return () => {
      el.removeEventListener("touchstart", start);
      el.removeEventListener("touchmove", move);
      el.removeEventListener("touchend", finish);
      el.removeEventListener("touchcancel", abort);
    };
  }, []);
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
        data-explain={explainOpen || undefined}
        style={
          {
            "--answer-lowered": `${loweredPx()}px`,
            "--answer-higher": `${higherPx()}px`,
          } as CSSProperties
        }
        onScroll={onScroll}
        onKeyDown={keys}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={cancel}
        onWheel={(e) => {
          if (phone() && stop !== "full" && e.deltaY > 0) go("full");
        }}
      >
        <div
          className="answer-pin answer-pin-bar gap-2 pr-2 pl-4"
          data-on={pinned > 0 || undefined}
        >
          <span className="min-w-0 flex-1 truncate title-md" aria-hidden="true">
            {shown?.name}
          </span>
          <button
            type="button"
            className={ICON_BUTTON}
            aria-label="Collapse area details"
            onClick={collapse}
          >
            <ChevronDown aria-hidden="true" />
          </button>
          <button
            type="button"
            className={ICON_BUTTON}
            aria-label="Close area details"
            onClick={onClose}
          >
            <X aria-hidden="true" />
          </button>
        </div>
        <div
          ref={strip}
          className="answer-pin answer-pin-strip px-4"
          data-on={pinned > 1 || undefined}
          aria-hidden="true"
        >
          {tier}
        </div>
        <div className="answer-drag flex-none">
          <button
            type="button"
            className="answer-handle grid h-control-sm w-full cursor-pointer place-items-center border-0 bg-transparent"
            aria-label="Change height of area details"
            aria-expanded={stop !== "lowered"}
            onClick={step}
          >
            <span className="h-sheet-handle-h w-sheet-handle-w rounded-full bg-outline" />
          </button>
          <header className="answer-header flex flex-col gap-2 px-4 pb-2">
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1">
                <h2 ref={title} tabIndex={-1} className="m-0 headline-sm [overflow-wrap:anywhere]">
                  {shown?.name}
                </h2>
                <p className="mt-0 mb-2 data-md text-on-surface-variant">{shown?.bzr_name}</p>
              </div>
              <button
                type="button"
                className={`answer-collapse ${ICON_BUTTON} -mt-1.5`}
                aria-label="Collapse area details"
                onClick={collapse}
              >
                <ChevronDown aria-hidden="true" />
              </button>
              <button
                type="button"
                className={`answer-close ${ICON_BUTTON} -mt-1.5 -mr-2`}
                aria-label="Close area details"
                onClick={onClose}
              >
                <X aria-hidden="true" />
              </button>
            </div>
            <div className="answer-peek">{tier}</div>
            {(state === "ready" || state === "no-data") && (
              <div ref={verdictBox} className="answer-verdict">
                {verdict(() => {
                  trigger.current = document.activeElement as HTMLElement;
                  setExplainOpen(true);
                })}
              </div>
            )}
          </header>
        </div>
        <div className="answer-body flex flex-col gap-6 p-4">
          {state === "ready" || state === "no-data" ? (
            <>
              {advice}
              {details}
            </>
          ) : (
            // error colour is a border only, never text
            <div
              className="rounded-lg bg-tertiary-container p-4 text-on-tertiary-container data-[state=error]:border-2 data-[state=error]:border-error data-[state=error]:bg-transparent data-[state=error]:text-on-surface"
              data-state={state}
              role={state === "error" ? "alert" : undefined}
            >
              <p className="m-0 title-md">{NOTE[state as keyof typeof NOTE][0]}</p>
              <p className="m-0 mt-1 body-lg">{NOTE[state as keyof typeof NOTE][1]}</p>
            </div>
          )}
        </div>
      </section>
      <ExplainSheet
        open={open && explainOpen}
        collapsed={collapsed || !open}
        onClose={closeExplain}
      >
        {explain}
      </ExplainSheet>
      <button
        type="button"
        className="answer-tab"
        data-open={open || undefined}
        data-explain={explainOpen || undefined}
        data-collapsed={collapsed || undefined}
        aria-label={collapsed ? "Show area details" : "Collapse area details"}
        aria-expanded={!collapsed}
        onClick={() => setCollapsed(!collapsed)}
      >
        {collapsed ? <ChevronRight aria-hidden="true" /> : <ChevronLeft aria-hidden="true" />}
      </button>
    </>
  );
}
