export const STOPS = ["lowered", "higher", "full"] as const;
export type Stop = (typeof STOPS)[number];
export const CLOSED = STOPS.length; // index after the last stop in the drag stops
export const LOWERED_PX = 152; // handle, name, district and the compact verdict
export const FULL_GAP_PX = 16; // the map margin above a full sheet, the same as the search pill keeps

// at least 40px above lowered, so a short landscape phone never inverts the stops
export const loweredPx = () => Math.min(LOWERED_PX, window.innerHeight);
export const higherPx = () =>
  Math.min(
    window.innerHeight,
    Math.max(LOWERED_PX + 40, Math.min(520, Math.round(window.innerHeight * 0.64))),
  );

// translateY of lowered, higher, full, then CLOSED
export const stopOffsets = (cardHeight: number) => [
  cardHeight - loweredPx(),
  cardHeight - higherPx(),
  FULL_GAP_PX,
  cardHeight,
];

export const settle = (stops: number[], at: number) =>
  stops.reduce((best, s, k) => (Math.abs(s - at) < Math.abs(stops[best] - at) ? k : best), 0);
