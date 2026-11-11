import { ChevronLeft, ChevronRight, X } from "lucide-react";
import {
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  useSyncExternalStore,
  type Ref,
} from "react";
import type { Area } from "../domain/lookup.ts";
import { STRINGS } from "../strings.ts";
import { ExplainSheet } from "./ExplainSheet.tsx";
import { phone } from "../viewport.ts";
import { ICON_BUTTON } from "./iconButton.ts";
import { FULL_GAP_PX, higherPx, loweredPx, STOPS, type Stop } from "./sheetStops.ts";
import { useSheetDrag } from "./useSheetDrag.ts";
import { PIN_NAME, PIN_VERDICT, usePinned } from "./usePinned.ts";
import "./AnswerCard.css";

export type CardState = "ready" | "no-data" | "error";
export type AnswerCardHandle = { lower: () => void; width: () => number };
type Props = {
  ref?: Ref<AnswerCardHandle>;
  open: boolean;
  area: Area | null;
  areaId: string | null; // names are not unique (two Schloßstraße), so the id decides when the area changed
  state: CardState;
  verdict: (explain: () => void) => ReactNode;
  strip?: ReactNode; // compact verdict: pinned once the verdict card has scrolled away, and the only verdict shown when lowered
  advice?: (more: () => void) => ReactNode;
  advicePanel?: { heading: ReactNode; body: ReactNode };
  details: ReactNode;
  explain: ReactNode;
  onClose: () => void;
};

type PanelKey = "explain" | "advice";
const S = STRINGS.card;

const subscribeResize = (cb: () => void) => {
  window.addEventListener("resize", cb);
  return () => window.removeEventListener("resize", cb);
};

// Phone: bottom sheet with three stops; from 600px a left panel. The layout switch is CSS; the drag settles on the stop nearest where the sheet would coast to.
export function AnswerCard({
  ref,
  open,
  area,
  areaId,
  state,
  verdict,
  strip,
  advice,
  advicePanel,
  details,
  explain,
  onClose,
}: Props) {
  const card = useRef<HTMLElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const stripBox = useRef<HTMLDivElement>(null);
  const verdictBox = useRef<HTMLDivElement>(null);
  const { pinned, sync: syncPinned } = usePinned({
    card,
    strip: stripBox,
    verdict: verdictBox,
    title,
  });
  const [stop, setStop] = useState<Stop>("higher");
  const [collapsed, setCollapsed] = useState(false);
  const [explainOpen, setExplainOpen] = useState(false);
  const [panel, setPanel] = useState<PanelKey>("explain");
  const [prev, setPrev] = useState({ open, areaId });
  if (open !== prev.open || areaId !== prev.areaId) {
    setPrev({ open, areaId });
    if (open) {
      setCollapsed(false); // a new area must not stay hidden behind a collapsed panel
      setExplainOpen(false);
      if (!prev.open) setStop("higher"); // picking another area keeps the height
    }
  }
  useImperativeHandle(ref, () => ({
    lower() {
      if (phone()) setStop("lowered");
    },
    width: () => card.current!.offsetWidth,
  }));
  const trigger = useRef<HTMLElement | null>(null);
  const openPanel = (which: PanelKey) => {
    trigger.current = document.activeElement as HTMLElement;
    setPanel(which);
    setExplainOpen(true);
  };
  const shownPanel: { key: PanelKey; heading: ReactNode; body: ReactNode } =
    panel === "advice" && advicePanel
      ? { key: "advice", ...advicePanel }
      : {
          key: "explain",
          heading: <h2 className="m-0 title-lg">{S.ratingTitle}</h2>,
          body: explain,
        };
  const adviceNode = advicePanel && advice?.(() => openPanel("advice"));
  const closeExplain = () => {
    setExplainOpen(false);
    trigger.current?.focus();
  };
  const last = useRef(area); // keeps the content while the card slides out
  if (area) last.current = area;
  const shown = area ?? last.current;
  useSyncExternalStore(subscribeResize, () => window.innerHeight); // stops are measured from the viewport, so a rotation needs a re-render

  const scrolledFor = useRef(areaId);
  useEffect(() => {
    const another = scrolledFor.current !== areaId; // another area starts at its top
    scrolledFor.current = areaId;
    if (another || stop !== "full") card.current?.scrollTo?.(0, 0);
    syncPinned(); // no scroll event fires when the position did not change, but the layout did
  }, [stop, areaId, open]);
  useEffect(() => {
    if (open) title.current?.focus();
  }, [open, areaId]);

  const dragProps = useSheetDrag({ card, stop, onStop: setStop, onClose });
  const keys = (e: KeyboardEvent) => {
    if (e.key !== "Escape") return;
    e.stopPropagation();
    onClose();
  };
  const step = () => setStop(STOPS[(STOPS.indexOf(stop) + 1) % STOPS.length]);

  return (
    <>
      <section
        ref={card}
        role="dialog"
        aria-label={shown?.name ?? S.areaFallback}
        className="answer-card"
        data-open={open || undefined}
        data-stop={stop}
        data-collapsed={collapsed || undefined}
        data-explain={explainOpen || undefined}
        style={
          {
            "--answer-lowered": `${loweredPx()}px`,
            "--answer-higher": `${higherPx()}px`,
            "--answer-full-gap": `${FULL_GAP_PX}px`,
          } as CSSProperties
        }
        onScroll={syncPinned}
        onKeyDown={keys}
        {...dragProps}
        onWheel={(e) => {
          if (phone() && stop !== "full" && e.deltaY > 0) setStop("full");
        }}
      >
        <div
          className="answer-pin answer-pin-bar gap-2 pr-2 pl-4"
          data-on={pinned >= PIN_NAME || undefined}
        >
          <span className="min-w-0 flex-1 truncate title-md" aria-hidden="true">
            {shown?.name}
          </span>
          <button type="button" className={ICON_BUTTON} aria-label={S.close} onClick={onClose}>
            <X aria-hidden="true" />
          </button>
        </div>
        <div
          ref={stripBox}
          className="answer-pin answer-pin-strip px-4"
          data-on={pinned >= PIN_VERDICT || undefined}
          aria-hidden="true"
        >
          {strip}
        </div>
        <div className="answer-drag flex-none">
          <button
            type="button"
            className="answer-handle grid h-control-sm w-full cursor-pointer place-items-center border-0 bg-transparent"
            aria-label={S.changeHeight}
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
                className={`answer-close ${ICON_BUTTON} -mt-1.5 -mr-2`}
                aria-label={S.close}
                onClick={onClose}
              >
                <X aria-hidden="true" />
              </button>
            </div>
            <div className="answer-peek">{strip}</div>
            {(state === "ready" || state === "no-data") && (
              <div ref={verdictBox} className="answer-verdict">
                {verdict(() => openPanel("explain"))}
              </div>
            )}
          </header>
        </div>
        <div className="answer-body flex flex-col gap-6 p-4">
          {state === "ready" || state === "no-data" ? (
            <>
              {adviceNode}
              {details}
            </>
          ) : (
            <>
              {/* error colour is a border only, never text */}
              <div
                className="rounded-lg bg-tertiary-container p-4 text-on-tertiary-container data-[state=error]:border-2 data-[state=error]:border-error data-[state=error]:bg-transparent data-[state=error]:text-on-surface"
                data-state="error"
                role="alert"
              >
                <p className="m-0 title-md">{S.note.error[0]}</p>
                <p className="m-0 mt-1 body-lg">{S.note.error[1]}</p>
              </div>
              {adviceNode}
            </>
          )}
        </div>
      </section>
      <ExplainSheet
        open={open && explainOpen}
        collapsed={collapsed || !open}
        panel={shownPanel.key}
        heading={shownPanel.heading}
        onClose={closeExplain}
      >
        {shownPanel.body}
      </ExplainSheet>
      <button
        type="button"
        className="answer-tab"
        data-open={open || undefined}
        data-explain={explainOpen || undefined}
        data-collapsed={collapsed || undefined}
        aria-label={collapsed ? S.show : S.collapse}
        aria-expanded={!collapsed}
        onClick={() => setCollapsed(!collapsed)}
      >
        {collapsed ? <ChevronRight aria-hidden="true" /> : <ChevronLeft aria-hidden="true" />}
      </button>
    </>
  );
}
