import { rememberPalette } from "./paletteStorage.ts";

const listeners = new Set<() => void>();

// the legend bar and the phone menu both subscribe here
export const subscribePalette = (fn: () => void) => {
  listeners.add(fn);
  return () => void listeners.delete(fn);
};

export const palette = () => document.documentElement.dataset.palette === "cb";

export function setPalette(on: boolean) {
  const root = document.documentElement;
  if (on) root.dataset.palette = "cb";
  else delete root.dataset.palette;
  listeners.forEach((fn) => fn());
  rememberPalette(on);
}
