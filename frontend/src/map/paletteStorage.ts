export const PALETTE_KEY = "palette";

export function rememberPalette(on: boolean) {
  try {
    if (on) localStorage.setItem(PALETTE_KEY, "cb");
    else localStorage.removeItem(PALETTE_KEY);
  } catch {
    // blocked storage: the palette still applies this visit
  }
}
