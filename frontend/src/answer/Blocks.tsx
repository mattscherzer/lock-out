import { useState } from "react";
import { Choice } from "../controls/Controls.tsx";
import type { AreaRecord, Fixture, Selector } from "../search/types.ts";
import type { Tier } from "./RiskChip.tsx";

export const tierOf = (a: AreaRecord): Tier => (a.no_record ? "no-data" : (a.tier.toLowerCase() as Tier));

const TIER_TEXT = { LOW: "Fewer reported thefts than most areas", MEDIUM: "More reported thefts than most areas", HIGH: "Among the areas with the most reported thefts" } as const;

const TIME: Record<string, [label: string, when: string]> = {
  Morning: ["Morning", "in the morning"],
  Afternoon: ["Afternoon", "in the afternoon"],
  Evening: ["Evening", "in the evening"],
  Night: ["Night", "at night"],
};
const DAY: Record<string, [label: string, when: string]> = {
  Mon_Thu: ["Mon–Thu", "from Monday to Thursday"],
  Friday: ["Friday", "on a Friday"],
  Weekend: ["Weekend", "on a weekend"],
};

// One selector: the share is the same for every area, so the label says so (D-18). Nothing is preselected.
function Pattern({ label, labels, selector }: { label: string; labels: typeof TIME; selector: Selector }) {
  const [value, setValue] = useState("");
  const options = Object.keys(selector.shares).map((k) => ({ value: k, label: labels[k][0] }));
  const pattern = `${selector.pattern[0].toUpperCase()}${selector.pattern.slice(1)}: the same for every area.`;
  return (
    <div>
      <Choice label={label} options={options} value={value} onChange={setValue} pattern={pattern} />
      {value && <p className="m-0 mt-2">{Math.round(selector.shares[value] * 100)}% of Berlin's bike thefts were last seen {labels[value][1]}.</p>}
    </div>
  );
}

export function RiskBlock({ area, selectors }: { area: AreaRecord; selectors: Fixture["selectors"] }) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        {area.limited_data ? (
          <p className="m-0">Limited data: {area.reports_12m} reported bike {area.reports_12m === 1 ? "theft" : "thefts"} in the last 12 months, too few to rank this area reliably.</p>
        ) : (
          <p className="m-0">{TIER_TEXT[area.tier]} ({area.reports_12m} reported bike thefts in the last 12 months). The tier compares areas; it is not the risk to a particular bike.</p>
        )}
      </div>
      <Pattern label="Time of day" labels={TIME} selector={selectors.time_band} />
      <Pattern label="Day of the week" labels={DAY} selector={selectors.day_group} />
    </div>
  );
}

export function SourceBlock({ metadata }: { metadata: Fixture["metadata"] }) {
  const { data_window: w, reports_up_to, truncation_lag_days, attribution } = metadata;
  return (
    <p className="m-0">
      Police reports of bike thefts in Berlin, {w.start} to {w.end} (reports up to {reports_up_to}; the last {truncation_lag_days} days are left out because reports arrive late). Areas are ranked by an estimated yearly count that blends their own reports with those of their district. {attribution.police}.
    </p>
  );
}
