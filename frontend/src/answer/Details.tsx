import { Info } from "lucide-react";
import { useId, useState } from "react";
import type { AreaRecord, Lookup } from "../domain/lookup.ts";
import { STRINGS } from "../strings.ts";
import { BarGroup } from "./BarGroup.tsx";
import { longDate } from "./text.ts";
import { Tile } from "./Tile.tsx";

const S = STRINGS.details;
const DAY_COUNT: Record<string, number> = { Mon_Thu: 4, Friday: 1, Weekend: 2 };

// Level 2: quiet detail under the verdict, visible without a tap.
export function Details({
  area,
  selectors,
  metadata,
  onAbout,
}: {
  area: AreaRecord;
  selectors: Lookup["selectors"];
  metadata: Lookup["metadata"];
  onAbout: () => void;
}) {
  const pattern = selectors.time_band.pattern;
  const { limited_below, plenty_from } = metadata.confidence_thresholds;
  const [why, setWhy] = useState(false);
  const whyId = useId();
  return (
    <div className="flex flex-col gap-4.5 border-t border-outline-variant pt-3.5">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <h3 className="m-0 label-md text-on-surface-variant uppercase">{S.lastSeen}</h3>
          <button
            type="button"
            aria-expanded={why}
            aria-controls={whyId}
            onClick={() => setWhy(!why)}
            className="relative inline-flex min-h-5.5 cursor-pointer items-center gap-1 rounded-full border-0 bg-surface-container px-2 label-sm text-on-surface-variant after:absolute after:-inset-x-2 after:-inset-y-3 after:content-['']"
          >
            {`${pattern[0].toUpperCase()}${pattern.slice(1)}`}
            <Info aria-hidden="true" size={12} />
          </button>
        </div>
        {why && (
          <p id={whyId} className="m-0 rounded-md bg-surface-container p-3 body-sm">
            {S.whyPattern}
          </p>
        )}
      </div>
      <BarGroup label={S.timeOfDay} labels={S.time} selector={selectors.time_band} />
      <div className="flex flex-col gap-1.5">
        <BarGroup
          label={S.dayOfWeek}
          labels={S.day}
          selector={selectors.day_group}
          perDay={DAY_COUNT}
        />
        <p className="m-0 body-sm text-on-surface-variant">{S.perDay}</p>
      </div>
      <div className="flex flex-col gap-2 border-t border-outline-variant pt-3.5">
        <h3 className="m-0 label-md text-on-surface-variant uppercase">{S.areaData}</h3>
        <div className="grid grid-cols-2 gap-2">
          <Tile big={String(area.reports_12m)} text={S.reportsIn12(area.reports_12m)} />
          <Tile
            big={longDate(metadata.reports_up_to).replace(/ \d{4}$/, "")}
            text={S.dataUpTo(metadata.reports_up_to.slice(0, 4))}
          />
        </div>
        <p className="m-0 body-sm text-on-surface-variant">
          {S.thresholds(plenty_from, limited_below)}
        </p>
      </div>
      <a
        href="#about"
        className="inline-block body-md text-tertiary"
        onClick={(e) => {
          e.preventDefault();
          onAbout();
        }}
      >
        {STRINGS.about.title}
      </a>
    </div>
  );
}
