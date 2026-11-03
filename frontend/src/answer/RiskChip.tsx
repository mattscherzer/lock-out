export type Tier = "low" | "medium" | "high" | "no-data";
const WORD: Record<Tier, string> = { low: "Low risk", medium: "Medium risk", high: "High risk", "no-data": "No data" };

// Risk colours only fill the dot; the word is on-surface text, so the chip never relies on colour alone.
export function RiskChip({ tier }: { tier: Tier }) {
  return (
    <span className="risk-chip">
      <span className="risk-chip-dot" style={{ background: `var(--risk-${tier})` }} aria-hidden="true" />
      {WORD[tier]}
    </span>
  );
}
