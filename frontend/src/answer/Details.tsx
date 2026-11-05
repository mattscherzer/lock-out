import { Info } from "lucide-react";
import { useId, useState } from "react";
import type { AreaRecord, Fixture } from "../search/types.ts";
import { BarGroup } from "./BarGroup.tsx";
import { longDate, PLENTY_FROM } from "./text.ts";
import { Tile } from "./Tile.tsx";

const TIME: Record<string, string> = {
  Morning: "Morning",
  Afternoon: "Afternoon",
  Evening: "Evening",
  Night: "Night",
};
const DAY: Record<string, string> = { Mon_Thu: "Mon–Thu", Friday: "Friday", Weekend: "Weekend" };
const DAY_COUNT: Record<string, number> = { Mon_Thu: 4, Friday: 1, Weekend: 2 };

// Level 2: quiet detail under the verdict, visible without a tap.
export function Details({
  area,
  selectors,
  metadata,
  onAbout,
}: {
  area: AreaRecord;
  selectors: Fixture["selectors"];
  metadata: Fixture["metadata"];
  onAbout: () => void;
}) {
  const pattern = selectors.time_band.pattern;
  const [why, setWhy] = useState(false);
  const whyId = useId();
  return (
    <div className="flex flex-col gap-4.5 border-t border-outline-variant pt-3.5">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <h3 className="m-0 label-md text-on-surface-variant uppercase">
            When bikes were last seen
          </h3>
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
            These shares come from all of Berlin's reports and are the same for every area. They
            show when bikes are usually last seen, not when this area is riskier.
          </p>
        )}
      </div>
      <BarGroup label="Time of day" labels={TIME} selector={selectors.time_band} />
      <div className="flex flex-col gap-1.5">
        <BarGroup
          label="Day of the week"
          labels={DAY}
          selector={selectors.day_group}
          perDay={DAY_COUNT}
        />
        <p className="m-0 body-sm text-on-surface-variant">
          Average share of a week's thefts per day.
        </p>
      </div>
      <div className="flex flex-col gap-2 border-t border-outline-variant pt-3.5">
        <h3 className="m-0 label-md text-on-surface-variant uppercase">This area's data</h3>
        <div className="grid grid-cols-2 gap-2">
          <Tile
            big={String(area.reports_12m)}
            text={`${area.reports_12m === 1 ? "report" : "reports"} in 12 months`}
          />
          <Tile
            big={longDate(metadata.reports_up_to).replace(/ \d{4}$/, "")}
            text={`Police data up to ${metadata.reports_up_to.slice(0, 4)}`}
          />
        </div>
        <p className="m-0 body-sm text-on-surface-variant">
          Plenty of data means {PLENTY_FROM} or more reports in 12 months, some data 5 to{" "}
          {PLENTY_FROM - 1}, limited data fewer than 5.
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
        About the data
      </a>
    </div>
  );
}
