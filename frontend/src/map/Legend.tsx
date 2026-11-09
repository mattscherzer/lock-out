import { ITEMS, LegendItem } from "./LegendItem.tsx";
import { PaletteToggle } from "./PaletteToggle.tsx";

export function Legend() {
  return (
    <ul
      aria-label="Map legend"
      className="m-0 flex list-none flex-wrap gap-x-3 gap-y-1 rounded-sm bg-surface-container-lowest px-4 py-2 body-sm whitespace-nowrap text-on-surface shadow-elevation-2"
    >
      {ITEMS.map((item) => (
        <LegendItem key={item.label} {...item} />
      ))}
      {/* one row only from 870px, where it fits beside the open answer card */}
      <li className="flex items-center max-[869px]:mt-1 max-[869px]:w-0 max-[869px]:min-w-full max-[869px]:border-0 max-[869px]:border-t max-[869px]:border-solid max-[869px]:border-outline-variant max-[869px]:pt-2">
        <PaletteToggle className="max-[869px]:w-full max-[869px]:flex-row-reverse max-[869px]:justify-between" />
      </li>
    </ul>
  );
}
