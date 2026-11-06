import type { CSSProperties } from "react";

const SWATCH = "box-border size-legend-swatch rounded-xs border border-(--c)";
const FILL =
  "bg-[color-mix(in_srgb,var(--c)_calc(var(--map-fill-light)*100%),transparent)] [[data-theme=dark]_&]:bg-[color-mix(in_srgb,var(--c)_calc(var(--map-fill-dark)*100%),transparent)]";
const HATCH =
  "border-dashed bg-[repeating-linear-gradient(45deg,var(--c)_0_var(--hatch-line),transparent_var(--hatch-line)_var(--hatch-pitch))]";

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
            className={`${SWATCH} ${limited ? HATCH : FILL}`}
            style={{ "--c": `var(--risk-${colour})` } as CSSProperties}
          />
          {label}
        </li>
      ))}
    </ul>
  );
}
