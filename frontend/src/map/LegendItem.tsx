import type { CSSProperties } from "react";
import { STRINGS } from "../strings.ts";

const SWATCH = "box-border size-legend-swatch rounded-xs border border-(--c)";
const FILL =
  "bg-[color-mix(in_srgb,var(--c)_calc(var(--map-fill-light)*100%),transparent)] [[data-theme=dark]_&]:bg-[color-mix(in_srgb,var(--c)_calc(var(--map-fill-dark)*100%),transparent)]";
const HATCH =
  "border-dashed bg-[repeating-linear-gradient(45deg,var(--c)_0_var(--hatch-line),transparent_var(--hatch-line)_var(--hatch-pitch))]";

export const ITEMS = [
  { label: STRINGS.legend.low, colour: "low" },
  { label: STRINGS.legend.medium, colour: "medium" },
  { label: STRINGS.legend.high, colour: "high" },
  { label: STRINGS.legend.limited, colour: "no-data", limited: true },
];

export function LegendItem({ label, colour, limited }: (typeof ITEMS)[number]) {
  return (
    <li className="flex items-center gap-1 whitespace-nowrap">
      <span
        aria-hidden="true"
        className={`${SWATCH} ${limited ? HATCH : FILL}`}
        style={{ "--c": `var(--risk-${colour})` } as CSSProperties}
      />
      {label}
    </li>
  );
}
