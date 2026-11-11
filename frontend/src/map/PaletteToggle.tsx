import { Check } from "lucide-react";
import { useSyncExternalStore } from "react";
import { STRINGS } from "../strings.ts";
import { palette, setPalette, subscribePalette } from "./palette.ts";

// no preflight: the track needs box-border, and thumb offsets sit inside its 2px border
const TRACK_ON = "border-primary bg-primary";
const TRACK_OFF = "border-outline bg-surface-container";
const THUMB_ON =
  "top-0.5 left-4.5 size-4 bg-on-primary text-on-primary-container group-active:top-0 group-active:left-4 group-active:size-5";
const THUMB_OFF =
  "top-1 left-1 size-3 bg-outline group-active:top-0 group-active:left-0 group-active:size-5";

export function PaletteToggle({ className = "" }: { className?: string }) {
  const on = useSyncExternalStore(subscribePalette, palette);
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => setPalette(!on)}
      className={`group flex min-h-6 cursor-pointer items-center gap-2 border-0 bg-transparent p-0 body-sm whitespace-nowrap text-on-surface ${className}`}
    >
      <span
        aria-hidden="true"
        className={`relative box-border block h-6 w-10 flex-none rounded-full border-2 border-solid transition-colors duration-base ease-standard ${on ? TRACK_ON : TRACK_OFF}`}
      >
        <span
          className={`absolute grid place-items-center rounded-full transition-[top,left,width,height,background-color] duration-base ease-standard ${on ? THUMB_ON : THUMB_OFF}`}
        >
          {on && <Check size={12} strokeWidth={3} />}
        </span>
      </span>
      {STRINGS.legend.colourBlind}
    </button>
  );
}
