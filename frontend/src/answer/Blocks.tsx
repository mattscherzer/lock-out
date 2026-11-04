import { Ban, BarChart3, Database } from "lucide-react";
import { Info } from "lucide-react";
import { type ReactNode, useId, useState } from "react";
import type { AreaRecord, Fixture, Selector } from "../search/types.ts";
import type { Kind, Tier } from "./Verdict.tsx";

export const tierOf = (a: AreaRecord): Tier => (a.no_record ? "no-data" : (a.tier.toLowerCase() as Tier));
export const kindOf = (a: AreaRecord): Kind => (a.no_record ? "no-data" : a.limited_data ? "limited" : tierOf(a));
export const topShare = (bands: Fixture["risk_bands"]) => Math.round((1 - bands.HIGH.min_percentile) * 100);

const TIME: Record<string, string> = { Morning: "Morning", Afternoon: "Afternoon", Evening: "Evening", Night: "Night" };
const DAY: Record<string, string> = { Mon_Thu: "Mon–Thu", Friday: "Friday", Weekend: "Weekend" };
const DAY_COUNT: Record<string, number> = { Mon_Thu: 4, Friday: 1, Weekend: 2 }; // the groups differ in length, so compare them per day
const BAR_MAX = 56; // px: every group scales its tallest bar to this, so the two charts take the same room

// A chart, not a selector: the shares are the same for every area (D-18), so picking one could not change anything about the area.
function BarGroup({ label, labels, selector, perDay }: { label: string; labels: Record<string, string>; selector: Selector; perDay?: Record<string, number> }) {
  const values = Object.entries(selector.shares).map(([key, share]) => [key, (share / (perDay?.[key] ?? 1)) * 100] as const);
  const top = Math.max(...values.map(([, v]) => v));
  return (
    <div className="flex flex-col gap-1.5">
      <div className="title-sm">{label}</div>
      <div role="img" aria-label={`${label}: ${values.map(([key, v]) => `${labels[key]} ${Math.round(v)}%`).join(", ")}`} className="flex items-end gap-1.5">
        {values.map(([key, v]) => (
          <div key={key} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-1 pb-1 label-md text-on-surface-variant" aria-hidden="true">
            <em className="not-italic font-semibold text-on-surface tabular-nums">{Math.round(v)}%</em>
            <b className="block w-full rounded-t-xs bg-primary" style={{ height: Math.round((v / top) * BAR_MAX) }} />
            {labels[key]}
          </div>
        ))}
      </div>
    </div>
  );
}

const longDate = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

// Level 2: quiet detail under the verdict, visible without a tap.
export function Details({ area, selectors, metadata, onAbout }: { area: AreaRecord; selectors: Fixture["selectors"]; metadata: Fixture["metadata"]; onAbout: () => void }) {
  const pattern = selectors.time_band.pattern;
  const [why, setWhy] = useState(false);
  const whyId = useId();
  return (
    <div className="flex flex-col gap-4.5 border-t border-outline-variant pt-3.5">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <h3 className="label-md m-0 text-on-surface-variant uppercase">When bikes were last seen</h3>
          <button type="button" aria-expanded={why} aria-controls={whyId} onClick={() => setWhy(!why)} className="label-sm relative inline-flex min-h-5.5 cursor-pointer items-center gap-1 rounded-full border-0 bg-surface-container px-2 text-on-surface-variant after:absolute after:-inset-2 after:content-['']">
            {`${pattern[0].toUpperCase()}${pattern.slice(1)}`}
            <Info aria-hidden="true" size={12} />
          </button>
        </div>
        {why && (
          <p id={whyId} className="body-sm m-0 rounded-md bg-surface-container p-3">
            These shares come from all of Berlin's reports and are the same for every area. They show when bikes are usually last seen, not when this area is riskier.
          </p>
        )}
      </div>
      <BarGroup label="Time of day" labels={TIME} selector={selectors.time_band} />
      <div className="flex flex-col gap-1.5">
        <BarGroup label="Day of the week" labels={DAY} selector={selectors.day_group} perDay={DAY_COUNT} />
        <p className="body-sm m-0 text-on-surface-variant">Average share of a week's thefts per day.</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Tile big={String(area.reports_12m)} text={`${area.reports_12m === 1 ? "report" : "reports"} in 12 months`} />
        <Tile big={longDate(metadata.reports_up_to).replace(/ \d{4}$/, "")} text={`Police data up to ${metadata.reports_up_to.slice(0, 4)}`} />
      </div>
        <a
          href="#about"
          className="body-md inline-block text-tertiary"
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

function Tile({ big, text }: { big: string; text: string }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-md bg-surface-container px-3 py-2.5">
      <strong className="font-display text-[26px]/[30px] font-semibold tabular-nums">{big}</strong>
      <span className="body-sm text-on-surface-variant">{text}</span>
    </div>
  );
}

// Level 3: what the rating means, in pictures and short sentences.
export function Explain({ area, kind, bands, metadata }: { area: AreaRecord; kind: Kind; bands: Fixture["risk_bands"]; metadata: Fixture["metadata"] }) {
  const span = (b: { min_percentile: number; max_percentile: number }) => Math.round((b.max_percentile - b.min_percentile) * 100);
  // the file carries the tier, not a rank: the pin marks the middle of the group the area is in
  const pin = kind === "low" || kind === "medium" || kind === "high" ? (({ low: bands.LOW, medium: bands.MEDIUM, high: bands.HIGH })[kind]) : null;
  const w = metadata.data_window;
  return (
    <>
      <Part icon={<BarChart3 aria-hidden="true" />} title="How areas are ranked">
        {pin ? (
          <div className="relative pt-4.5">
            <div className="absolute top-0" style={{ left: `${((pin.min_percentile + pin.max_percentile) / 2) * 100}%`, marginLeft: -7, borderInline: "7px solid transparent", borderTop: "11px solid var(--on-surface)" }} />
            <div className="flex h-3.5 gap-0.75" aria-hidden="true">
              <i className="rounded-xs" style={{ flex: span(bands.LOW), background: "var(--risk-low)" }} />
              <i className="rounded-xs" style={{ flex: span(bands.MEDIUM), background: "var(--risk-medium)" }} />
              <i className="rounded-xs" style={{ flex: span(bands.HIGH), background: "var(--risk-high)" }} />
            </div>
            <div className="label-sm mt-1 flex justify-between text-on-surface-variant"><span>Fewest reports</span><span>Most reports</span></div>
          </div>
        ) : null}
        <p className="body-md m-0 text-on-surface-variant">
          {pin ? `All 542 areas, ranked by reported bike thefts over 12 months. The pin marks the group ${area.name} is in.` : `This area is not placed on the scale. With ${area.reports_12m === 0 ? "no reports" : "one report"}, any rank would be a guess.`}
        </p>
      </Part>
      <Part icon={<Ban aria-hidden="true" />} title="What it doesn't tell you">
        <p className="body-md m-0">It is not the chance that your bike is stolen. Busy places collect more reports.</p>
      </Part>
      <Part icon={<Database aria-hidden="true" />} title="Where it comes from">
        <p className="body-md m-0">
          Police reports of street bike thefts, {longDate(w.start)} to {longDate(w.end)}. The latest {metadata.truncation_lag_days} days are left out because reports arrive late.
        </p>
      </Part>
    </>
  );
}

function Part({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2 [&_svg]:size-5 [&_svg]:flex-none">
      <h3 className="title-sm m-0 flex items-center gap-2">{icon}{title}</h3>
      {children}
    </section>
  );
}
