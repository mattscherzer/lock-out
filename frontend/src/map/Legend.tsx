import { ITEMS, LegendItem } from "./LegendItem.tsx";

export function Legend() {
  return (
    <ul
      aria-label="Map legend"
      className="m-0 flex list-none gap-3 rounded-sm bg-surface-container-lowest px-4 py-2 body-sm whitespace-nowrap text-on-surface shadow-elevation-2"
    >
      {ITEMS.map((item) => (
        <LegendItem key={item.label} {...item} />
      ))}
    </ul>
  );
}
