import { ChevronDown, LoaderCircle, Locate, LocateFixed, LocateOff } from "lucide-react";
import { useRef } from "react";
import { STRINGS } from "../strings.ts";
import type { LocateView } from "./useLocate.ts";

const S = STRINGS.search.location;
const GLYPH_PX = 18;
const GLYPH_STROKE = 1.8;

// Write class strings out whole so Tailwind sees them; never build one from state.
const GLYPH = "grid size-9 flex-none place-items-center rounded-full";
const GLYPH_READY = `${GLYPH} bg-secondary-container text-on-secondary-container`;
const GLYPH_DENIED = `${GLYPH} bg-surface-container text-on-surface-variant`;
const TITLE_READY = "body-lg block font-semibold text-on-primary-container";
const TITLE_DENIED = "body-lg block font-semibold text-on-surface-variant";
const SUB = "body-sm block text-on-surface-variant";

type Props = {
  view: LocateView;
  helpOpen: boolean;
  helpId: string;
  located: boolean; // a position was found earlier and is on the map
  onLocate: () => void;
  onToggleHelp: () => void;
};

// A button, not an option: Tab reaches it after the field and the list keeps only the examples. The row and "Try again" are siblings, as buttons cannot nest.
export function LocationRow({ view, helpOpen, helpId, located, onLocate, onToggleHelp }: Props) {
  const row = useRef<HTMLButtonElement>(null);
  const denied = view === "denied";
  const wait = view === "wait";
  const fail = view === "fail";
  const Icon = denied ? LocateOff : located ? LocateFixed : Locate;
  const sub = denied ? S.denied : wait ? S.wait : fail ? S.failed : S.ready;
  return (
    <div className="area-search-locate">
      <div className="flex items-center">
        <button
          ref={row}
          type="button"
          className="area-search-locate-row"
          aria-busy={wait || undefined}
          aria-expanded={denied ? helpOpen : undefined}
          aria-controls={denied ? helpId : undefined}
          onMouseDown={(e) => e.preventDefault()} // keep the focus in the field, so the keyboard and the list stay as they are
          onClick={denied ? onToggleHelp : onLocate}
        >
          <span className={denied ? GLYPH_DENIED : GLYPH_READY}>
            {wait ? (
              <LoaderCircle
                aria-hidden
                className="animate-spin motion-reduce:animate-none"
                size={GLYPH_PX}
              />
            ) : (
              <Icon aria-hidden size={GLYPH_PX} strokeWidth={GLYPH_STROKE} />
            )}
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className={denied ? TITLE_DENIED : TITLE_READY}>
              {wait ? S.waitTitle : S.title}
            </span>
            <span className={SUB}>{sub}</span>
          </span>
          {denied && (
            <ChevronDown
              aria-hidden
              size={GLYPH_PX}
              strokeWidth={GLYPH_STROKE}
              className={helpOpen ? "rotate-180" : undefined}
            />
          )}
        </button>
        {fail && (
          <button
            type="button"
            className="area-search-locate-retry"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              onLocate();
              row.current?.focus(); // this button unmounts while waiting: keep the keyboard user in the list
            }}
          >
            {STRINGS.search.retry}
          </button>
        )}
      </div>
      {denied && helpOpen && (
        // pl-16 lines the text up with the row title: px-4 + size-9 glyph + gap-3
        <p
          id={helpId}
          className="m-0 bg-surface-container py-3 pr-4 pl-16 body-sm text-on-surface-variant"
        >
          {S.help}
        </p>
      )}
    </div>
  );
}
