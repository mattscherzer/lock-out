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
      <li className="flex items-center max-[599px]:mt-1 max-[599px]:w-0 max-[599px]:min-w-full max-[599px]:border-0 max-[599px]:border-t max-[599px]:border-solid max-[599px]:border-outline-variant max-[599px]:pt-2">
        <PaletteToggle className="max-[599px]:w-full max-[599px]:flex-row-reverse max-[599px]:justify-between" />
      </li>
    </ul>
  );
}
