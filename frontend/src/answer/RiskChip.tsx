export type Tier = "low" | "medium" | "high" | "no-data";
const WORD: Record<Tier, string> = { low: "Low risk", medium: "Medium risk", high: "High risk", "no-data": "No data" };

// Risk colours only fill the dot; the word is on-surface text, so the chip never relies on colour alone.
export function RiskChip({ tier }: { tier: Tier }) {
  return (
    <span className="box-border inline-flex min-h-7 items-center gap-2 rounded-full bg-surface-container px-3 text-[length:var(--body-md-font-size)] font-semibold text-on-surface">
      <span className="size-2.5 rounded-full" style={{ background: `var(--risk-${tier})` }} aria-hidden="true" />
      {WORD[tier]}
    </span>
  );
}
