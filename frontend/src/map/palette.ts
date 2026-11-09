export const PALETTE_KEY = "palette";

// Storage can throw (blocked site data, private windows); the app must work without it.
export function readPalette(): boolean {
  try {
    return localStorage.getItem(PALETTE_KEY) === "cb";
  } catch {
    return false;
  }
}

const listeners = new Set<() => void>();

// The legend bar and the phone legend menu are separate React roots; both read the attribute through this.
export const subscribePalette = (fn: () => void) => {
  listeners.add(fn);
  return () => void listeners.delete(fn);
};
export const palette = () => document.documentElement.dataset.palette === "cb";

export function writePalette(on: boolean) {
  const root = document.documentElement;
  if (on) root.dataset.palette = "cb";
  else delete root.dataset.palette;
  listeners.forEach((fn) => fn());
  try {
    if (on) localStorage.setItem(PALETTE_KEY, "cb");
    else localStorage.removeItem(PALETTE_KEY);
  } catch {
    // not remembered; the palette still applies for this visit
  }
}
