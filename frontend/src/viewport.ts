export const PHONE_MAX_PX = 599;
export const phone = () => !window.matchMedia?.(`(min-width: ${PHONE_MAX_PX + 1}px)`).matches;
