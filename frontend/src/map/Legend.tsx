import type { CSSProperties } from "react";

const ITEMS = [
  { label: "Low", colour: "low" },
  { label: "Medium", colour: "medium" },
  { label: "High", colour: "high" },
  { label: "Limited data", colour: "no-data", limited: true },
];

export function Legend() {
  return (
    <ul
      aria-label="Map legend"
      className="m-0 flex list-none gap-3 rounded-sm bg-surface-container-lowest px-4 py-2 body-sm whitespace-nowrap text-on-surface shadow-elevation-2"
    >
      {ITEMS.map(({ label, colour, limited }) => (
        <li key={label} className="flex items-center gap-1">
          <span
            aria-hidden="true"
            className={`legend-swatch size-legend-swatch rounded-xs ${limited ? "legend-swatch-limited" : ""}`}
            style={{ "--c": `var(--risk-${colour})` } as CSSProperties}
          />
          {label}
        </li>
      ))}
    </ul>
  );
}
