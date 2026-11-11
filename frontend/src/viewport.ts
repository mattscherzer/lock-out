// Class strings and CSS repeat 600/599/900 (Tailwind only reads whole literals); this is the only copy TS uses.
export const PHONE_MAX_PX = 599;
export const WIDE = `(min-width: ${PHONE_MAX_PX + 1}px)`;
export const phone = () => !window.matchMedia?.(WIDE).matches;
