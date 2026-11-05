import { Ban, BarChart3, Database, ListOrdered } from "lucide-react";
import type { AreaRecord, Fixture } from "../search/types.ts";
import type { Kind } from "./kind.ts";
import { Part } from "./Part.tsx";
import { longDate, PLENTY_FROM, plural } from "./text.ts";

// Level 3: what the rating means, in pictures and short sentences.
export function Explain({
  area,
  kind,
  bands,
  metadata,
}: {
  area: AreaRecord;
  kind: Kind;
  bands: Fixture["risk_bands"];
  metadata: Fixture["metadata"];
}) {
  const span = (b: { min_percentile: number; max_percentile: number }) =>
    Math.round((b.max_percentile - b.min_percentile) * 100);
  // the file carries the tier, not a rank: the pin marks the middle of the group the area is in
  const pin =
    kind === "low" || kind === "medium" || kind === "high"
      ? { low: bands.LOW, medium: bands.MEDIUM, high: bands.HIGH }[kind]
      : null;
  const w = metadata.data_window;
  return (
    <>
      <Part icon={<BarChart3 aria-hidden="true" />} title="How areas are ranked">
        {pin ? (
          <div className="relative pt-4.5">
            <div
              className="absolute top-0"
              style={{
                left: `${((pin.min_percentile + pin.max_percentile) / 2) * 100}%`,
                marginLeft: -7,
                borderInline: "7px solid transparent",
                borderTop: "11px solid var(--on-surface)",
              }}
            />
            <div className="flex h-3.5 gap-0.75" aria-hidden="true">
              <i
                className="rounded-xs"
                style={{ flex: span(bands.LOW), background: "var(--risk-low)" }}
              />
              <i
                className="rounded-xs"
                style={{ flex: span(bands.MEDIUM), background: "var(--risk-medium)" }}
              />
              <i
                className="rounded-xs"
                style={{ flex: span(bands.HIGH), background: "var(--risk-high)" }}
              />
            </div>
            <div className="mt-1 flex justify-between label-sm text-on-surface-variant">
              <span>Fewest reports</span>
              <span>Most reports</span>
            </div>
          </div>
        ) : null}
        <p className="m-0 body-md text-on-surface-variant">
          {pin
            ? `All 542 areas, ranked by expected bike thefts per year, with small areas drawn toward their neighbourhood. The pin marks the group ${area.name} is in.`
            : `This area is not placed on the scale. With ${area.reports_12m === 0 ? "no reports" : plural(area.reports_12m)}, any rank would be a guess.`}
        </p>
      </Part>
      <Part icon={<ListOrdered aria-hidden="true" />} title="How much data is behind this?">
        <p className="m-0 body-md">
          Risk and data are two different things. The rating compares reported thefts with other
          Berlin areas. The data line says how many reports that comparison rests on.
        </p>
        <p className="m-0 body-md">
          <b>Plenty of data</b> ({PLENTY_FROM} or more reports in 12 months): one or two more thefts
          would not change the rating.
        </p>
        <p className="m-0 body-md">
          <b>Some data</b> (5 to {PLENTY_FROM - 1}): our best read, but a few more or fewer reports
          could move it to a neighbouring level.
        </p>
        <p className="m-0 body-md">
          <b>Limited data</b> (fewer than 5): too few to rate, so no rating is shown. This does not
          mean low risk.
        </p>
        <p className="m-0 body-md">
          A lot of data does not mean high risk, and little data does not mean low risk.
        </p>
      </Part>
      <Part icon={<Ban aria-hidden="true" />} title="What it doesn't tell you">
        <p className="m-0 body-md">
          It is not the chance that your bike is stolen. Busy places collect more reports.
        </p>
      </Part>
      <Part icon={<Database aria-hidden="true" />} title="Where it comes from">
        <p className="m-0 body-md">
          Police reports of street bike thefts, {longDate(w.start)} to {longDate(w.end)}. The latest{" "}
          {metadata.truncation_lag_days} days are left out because reports arrive late.
        </p>
      </Part>
    </>
  );
}
