import { PaletteToggle } from "./PaletteToggle.tsx";

// Whole class strings so Tailwind can see them. The toggle takes its own row under a divider; w-0 min-w-full wraps it without widening the legend.
const STACKED = {
  always: {
    row: "mt-1 flex w-0 min-w-full items-center border-0 border-t border-solid border-outline-variant pt-2",
    toggle: "w-full flex-row-reverse justify-between",
  },
  narrow: {
    row: "flex items-center max-[869px]:mt-1 max-[869px]:w-0 max-[869px]:min-w-full max-[869px]:border-0 max-[869px]:border-t max-[869px]:border-solid max-[869px]:border-outline-variant max-[869px]:pt-2",
    toggle: "max-[869px]:w-full max-[869px]:flex-row-reverse max-[869px]:justify-between",
  },
};

// narrow: one row from 870px, where it clears the open answer card
export function PaletteRow({ stacked }: { stacked: keyof typeof STACKED }) {
  const { row, toggle } = STACKED[stacked];
  return (
    <li className={row}>
      <PaletteToggle className={toggle} />
    </li>
  );
}
