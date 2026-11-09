import { Palette } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ITEMS, LegendItem } from "./LegendItem.tsx";
import { PaletteRow } from "./PaletteRow.tsx";

// Phone, sheet open: the bottom legend would sit under the sheet, so it slides out of a button on tap and back in when focus or a press leaves it.
export function LegendMenu() {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const away = (e: Event) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", away, true);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", away, true);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);
  return (
    <div
      ref={root}
      className="relative"
      onBlur={(e) => !root.current?.contains(e.relatedTarget) && setOpen(false)}
    >
      <button
        type="button"
        className="grid size-control-md cursor-pointer place-items-center rounded-sm border-0 bg-surface-container-lowest text-on-surface shadow-elevation-2"
        aria-label="Map legend"
        aria-expanded={open}
        aria-controls="legend-list"
        onClick={() => setOpen(!open)}
      >
        <Palette aria-hidden="true" className="size-icon-md" />
      </button>
      {/* the clip lets the bar slide out from behind the button; its padding keeps the shadow (-top-2 cancels it) */}
      <div className="absolute -top-2 right-full box-border w-max max-w-[calc(100vw-var(--space-4)-var(--control-md))] overflow-hidden p-2">
        <ul
          id="legend-list"
          aria-hidden={!open}
          className={`m-0 box-border flex list-none flex-wrap gap-x-2 gap-y-1 rounded-sm bg-surface-container-lowest px-3 py-2 body-sm whitespace-nowrap text-on-surface shadow-elevation-2 transition-[translate,visibility] duration-base ease-standard ${open ? "visible translate-x-0" : "invisible translate-x-[calc(100%+var(--space-2))]"}`}
        >
          {ITEMS.map((item) => (
            <LegendItem key={item.label} {...item} />
          ))}
          <PaletteRow stacked="always" />
        </ul>
      </div>
    </div>
  );
}
