import { Palette } from "lucide-react";
import { type CSSProperties, useEffect, useRef, useState } from "react";

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

function Item({ label, colour, limited }: (typeof ITEMS)[number]) {
  return (
    <li className="flex items-center gap-1">
      <span
        aria-hidden="true"
        className={`${SWATCH} ${limited ? HATCH : FILL}`}
        style={{ "--c": `var(--risk-${colour})` } as CSSProperties}
      />
      {label}
    </li>
  );
}

export function Legend() {
  return (
    <ul
      aria-label="Map legend"
      className="m-0 flex list-none gap-3 rounded-sm bg-surface-container-lowest px-4 py-2 body-sm whitespace-nowrap text-on-surface shadow-elevation-2"
    >
      {ITEMS.map((item) => (
        <Item key={item.label} {...item} />
      ))}
    </ul>
  );
}

// Phone: the bottom legend would sit under the sheet, so it slides out of a button on tap and back in when focus or a press leaves it.
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
        <Palette aria-hidden="true" size={20} />
      </button>
      {/* the clip lets the bar slide out from behind the button; its padding keeps the shadow */}
      <div className="absolute top-1/2 right-full -translate-y-1/2 overflow-hidden p-2">
        <ul
          id="legend-list"
          aria-hidden={!open}
          className={`m-0 flex list-none gap-2 rounded-sm bg-surface-container-lowest px-3 py-2 body-sm whitespace-nowrap text-on-surface shadow-elevation-2 transition-[transform,visibility] duration-base ease-standard ${open ? "visible translate-x-0" : "invisible translate-x-[calc(100%+var(--space-2))]"}`}
        >
          {ITEMS.map((item) => (
            <Item key={item.label} {...item} />
          ))}
        </ul>
      </div>
    </div>
  );
}
