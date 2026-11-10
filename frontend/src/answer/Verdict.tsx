import { STRINGS } from "../strings.ts";
import { Info } from "lucide-react";
import type { AreaRecord } from "../domain/lookup.ts";
import { DataLine } from "./DataLine.tsx";
import { colour, type Kind } from "../domain/kind.ts";
import { TierMark } from "./TierMark.tsx";
import { verdictLine } from "./text.ts";

export const WORD: Record<Kind, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  "no-data": "No data",
  limited: "Limited data",
};
const GAUGE: Record<Kind, number> = { low: 0, medium: 1, high: 2, "no-data": -1, limited: -1 };

export function Verdict({
  kind,
  confidence,
  reports,
  topShare,
  onExplain,
}: {
  kind: Kind;
  confidence: AreaRecord["confidence"];
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
      {kind !== "limited" && kind !== "no-data" && (
        <DataLine reports={reports} confidence={confidence} />
      )}
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

export function VerdictStrip({ kind }: { kind: Kind }) {
  return (
    <div
      className="box-border flex w-full min-w-0 items-center gap-2 rounded-lg px-3 py-1.5"
      style={{
        background: `color-mix(in srgb, ${colour(kind)} 14%, var(--surface-container-lowest))`,
      }}
    >
      <TierMark kind={kind} className="size-6" />
      <span className="min-w-0 truncate body-md">
        <b className="title-md">{WORD[kind]}</b> · {STRINGS.verdictPhrase[kind]}
      </span>
    </div>
  );
}
