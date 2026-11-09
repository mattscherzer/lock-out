import { Check } from "lucide-react";
import { useSyncExternalStore } from "react";
import { palette, subscribePalette, writePalette } from "./palette.ts";

// M3 switch at 0.75 scale (quiet in the legend): 40x24 track; the thumb is 12px off, 16px on, 20px pressed, and carries a check when on (a cue besides colour).
// Pixel values on purpose: the project's spacing scale is --space-*, so Tailwind's numeric sizes do not resolve. Thumb offsets are measured inside the 2px track border.
const TRACK_ON = "border-primary bg-primary";
const TRACK_OFF = "border-outline bg-surface-container";
const THUMB_ON =
  "top-[2px] left-[18px] size-[16px] bg-on-primary text-on-primary-container group-active:top-0 group-active:left-[16px] group-active:size-[20px]";
const THUMB_OFF =
  "top-[4px] left-[4px] size-[12px] bg-outline group-active:top-0 group-active:left-0 group-active:size-[20px]";

export function PaletteToggle({ className = "" }: { className?: string }) {
  const on = useSyncExternalStore(subscribePalette, palette);
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => {
        writePalette(!on);
      }}
      className={`group flex min-h-[24px] cursor-pointer items-center gap-2 border-0 bg-transparent p-0 body-sm whitespace-nowrap text-on-surface ${className}`}
    >
      <span
        aria-hidden="true"
        className={`relative box-border block h-[24px] w-[40px] flex-none rounded-full border-2 border-solid transition-colors duration-base ease-standard ${on ? TRACK_ON : TRACK_OFF}`}
      >
        <span
          className={`absolute grid place-items-center rounded-full transition-[top,left,width,height,background-color] duration-base ease-standard ${on ? THUMB_ON : THUMB_OFF}`}
        >
          {on && <Check size={12} strokeWidth={3} />}
        </span>
      </span>
      Colour-blind
    </button>
  );
}
