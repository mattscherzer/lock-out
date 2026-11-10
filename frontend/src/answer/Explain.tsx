import { Ban, BarChart3, Database, ListOrdered } from "lucide-react";
import type { AreaRecord, Lookup } from "../domain/lookup.ts";
import type { Kind } from "../domain/kind.ts";
import { STRINGS } from "../strings.ts";
import { Part } from "./Part.tsx";
import { longDate } from "./text.ts";

const S = STRINGS.explain;
const PIN_HALF_PX = 7;
const PIN_HEIGHT_PX = 11;

export function Explain({
  area,
  kind,
  bands,
  metadata,
}: {
  area: AreaRecord;
  kind: Kind;
  bands: Lookup["risk_bands"];
  metadata: Lookup["metadata"];
}) {
  const span = (b: { min_percentile: number; max_percentile: number }) =>
    Math.round((b.max_percentile - b.min_percentile) * 100);
  // the file carries the tier, not a rank: the pin marks the middle of the group the area is in
  const pin =
    kind === "low" || kind === "medium" || kind === "high"
      ? { low: bands.LOW, medium: bands.MEDIUM, high: bands.HIGH }[kind]
      : null;
  const w = metadata.data_window;
  const { limited_below, plenty_from } = metadata.confidence_thresholds;
  return (
    <>
      <Part icon={<BarChart3 aria-hidden="true" />} title={S.rankTitle}>
        {pin ? (
          <div className="relative pt-4.5">
            <div
              className="absolute top-0"
              style={{
                left: `${((pin.min_percentile + pin.max_percentile) / 2) * 100}%`,
                marginLeft: -PIN_HALF_PX,
                borderInline: `${PIN_HALF_PX}px solid transparent`,
                borderTop: `${PIN_HEIGHT_PX}px solid var(--on-surface)`,
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
              <span>{S.fewest}</span>
              <span>{S.most}</span>
            </div>
          </div>
        ) : null}
        <p className="m-0 body-md text-on-surface-variant">
          {pin ? S.ranked(area.name) : S.unplaced(area.reports_12m)}
        </p>
      </Part>
      <Part icon={<ListOrdered aria-hidden="true" />} title={S.dataTitle}>
        <p className="m-0 body-md">{S.dataIntro}</p>
        <p className="m-0 body-md">
          <b>{S.plentyTitle}</b> {S.plenty(plenty_from)}
        </p>
        <p className="m-0 body-md">
          <b>{S.someTitle}</b> {S.some(limited_below, plenty_from - 1)}
        </p>
        <p className="m-0 body-md">
          <b>{S.limitedTitle}</b> {S.limited(limited_below)}
        </p>
        <p className="m-0 body-md">{S.dataClosing}</p>
      </Part>
      <Part icon={<Ban aria-hidden="true" />} title={S.notTitle}>
        <p className="m-0 body-md">{S.not}</p>
      </Part>
      <Part icon={<Database aria-hidden="true" />} title={S.sourceTitle}>
        <p className="m-0 body-md">
          {S.source(longDate(w.start), longDate(w.end), metadata.truncation_lag_days)}
        </p>
      </Part>
    </>
  );
}
