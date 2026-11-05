import { Info } from "lucide-react";

export type Tier = "low" | "medium" | "high" | "no-data";
// thin data is its own kind, never a tier: it must not look like Low
export type Kind = Tier | "limited";

const WORD: Record<Kind, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  "no-data": "No data",
  limited: "Limited data",
};
const GAUGE: Record<Kind, number> = { low: 0, medium: 1, high: 2, "no-data": -1, limited: -1 };
const colour = (kind: Kind) => `var(--risk-${kind === "limited" ? "no-data" : kind})`;
export const plural = (n: number) => `${n} ${n === 1 ? "report" : "reports"}`;

// Each tier has its own shape, so the tier never rests on colour alone. Glyphs sit on the tier fill, so they stay fixed across themes.
export function TierMark({ kind, className = "size-14" }: { kind: Kind; className?: string }) {
  const c = colour(kind);
  return (
    <svg viewBox="0 0 56 56" className={`flex-none ${className}`} aria-hidden="true">
      {kind === "high" && (
        <>
          <path d="M28 5 53 49H3Z" fill={c} stroke={c} strokeWidth="4" strokeLinejoin="round" />
          <path
            d="M28 20v14M28 41h.01"
            stroke="#fff"
            strokeWidth="5"
            strokeLinecap="round"
            fill="none"
          />
        </>
      )}
      {kind === "medium" && (
        <>
          <path
            d="M28 4 52 28 28 52 4 28Z"
            fill={c}
            stroke={c}
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path
            d="M19 24h18M19 32h18"
            stroke="#1D1B1C"
            strokeWidth="4"
            strokeLinecap="round"
            fill="none"
          />
        </>
      )}
      {kind === "low" && (
        <>
          <circle cx="28" cy="28" r="24" fill={c} />
          <path
            d="m18 24 10 10 10-10"
            stroke="#fff"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </>
      )}
      {(kind === "limited" || kind === "no-data") && (
        <>
          <circle
            cx="28"
            cy="28"
            r="23"
            fill="var(--surface-container-lowest)"
            stroke={c}
            strokeWidth="3"
            strokeDasharray="5 4"
          />
          <path
            d="M22 22a6 6 0 1 1 8 5.6c-1.5.7-2 1.6-2 3.4M28 38h.01"
            stroke={c}
            strokeWidth="4"
            strokeLinecap="round"
            fill="none"
          />
        </>
      )}
    </svg>
  );
}

export function verdictLine(kind: Kind, reports: number, topShare: number): string {
  if (kind === "high")
    return `Among the ${topShare}% of Berlin areas with the most reported bike thefts.`;
  if (kind === "medium")
    return "More reported thefts than most Berlin areas, but not among the highest.";
  if (kind === "low") return "Among the 60% of Berlin areas with the fewest reported bike thefts.";
  if (kind === "limited")
    return `${reports === 0 ? "No reports" : `Only ${plural(reports)}`} in 12 months, too few to rate this area. This does not mean low risk.`;
  return "No reports found, so we can't rate this area. This does not mean low risk.";
}

// Mirrors confidence() in src/models/area_stats.py (5 and 20 reports) until the lookup carries it (#63). Words describe the data, never "low/high", so they cannot read as risk.
export const PLENTY_FROM = 20;

function DataLine({ reports }: { reports: number }) {
  return (
    <p className="m-0 body-md text-on-surface-variant">
      <b className="font-semibold text-on-surface">
        {reports >= PLENTY_FROM ? "Plenty of data" : "Some data"}
      </b>{" "}
      behind this: {plural(reports)} in 12 months.
      {reports < PLENTY_FROM && " A few more or fewer could shift the rating."}
    </p>
  );
}

export function Verdict({
  kind,
  reports,
  topShare,
  onExplain,
}: {
  kind: Kind;
  reports: number;
  topShare: number;
  onExplain: () => void;
}) {
  const on = GAUGE[kind];
  return (
    <div
      className="flex flex-col gap-2 rounded-lg p-3.5"
      style={{
        background: `color-mix(in srgb, ${colour(kind)} 14%, var(--surface-container-lowest))`,
      }}
    >
      <div className="label-md text-on-surface-variant uppercase">
        Reported bike thefts vs other areas
      </div>
      <div className="flex items-center gap-3.5">
        <TierMark kind={kind} />
        <div className="display-sm">{WORD[kind]}</div>
      </div>
      <p className="m-0 body-lg">{verdictLine(kind, reports, topShare)}</p>
      {kind !== "limited" && kind !== "no-data" && <DataLine reports={reports} />}
      <div className="mt-0.5 flex gap-1.5" aria-hidden="true">
        {["Low", "Medium", "High"].map((name, i) => (
          <div key={name} className="flex-1">
            <i
              className="block h-3 rounded-xs border border-outline-variant"
              style={
                on === i
                  ? { background: colour(kind), borderColor: colour(kind) }
                  : on < 0
                    ? {
                        border: "1px dashed var(--risk-no-data)",
                        background:
                          "repeating-linear-gradient(45deg, var(--risk-no-data) 0 var(--hatch-line), var(--surface-container-lowest) var(--hatch-line) var(--hatch-pitch))",
                      }
                    : { background: "var(--surface-container-lowest)" }
              }
            />
            <span className="mt-1 block label-sm text-on-surface-variant">{name}</span>
          </div>
        ))}
      </div>
      <button
        type="button"
        className="explain-trigger -mb-2 -ml-2 inline-flex min-h-tap-target cursor-pointer items-center gap-2 self-start rounded-full border-0 bg-transparent px-3 font-[inherit] font-semibold text-tertiary"
        onClick={onExplain}
        aria-haspopup="dialog"
      >
        <Info aria-hidden="true" size={18} />
        What does this mean?
      </button>
    </div>
  );
}
