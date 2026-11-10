import { STRINGS } from "../strings.ts";
import { ITEMS, LegendItem } from "./LegendItem.tsx";
import { PaletteRow } from "./PaletteRow.tsx";

export function Legend() {
  return (
    <ul
      aria-label={STRINGS.legend.label}
      className="m-0 flex list-none flex-wrap gap-x-3 gap-y-1 rounded-sm bg-surface-container-lowest px-4 py-2 body-sm whitespace-nowrap text-on-surface shadow-elevation-2"
    >
      {ITEMS.map((item) => (
        <LegendItem key={item.label} {...item} />
      ))}
      <PaletteRow stacked="narrow" />
    </ul>
  );
}
