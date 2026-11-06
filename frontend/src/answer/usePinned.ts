import { type RefObject, useState } from "react";

// how much of the verdict card must scroll away before its compact copy pins
const SCROLLED = 0.75;

export const PIN_NONE = 0;
export const PIN_NAME = 1; // the name has scrolled away (phone)
export const PIN_VERDICT = 2; // the verdict card has too

type Refs = {
  card: RefObject<HTMLElement | null>;
  strip: RefObject<HTMLElement | null>;
  verdict: RefObject<HTMLElement | null>;
  title: RefObject<HTMLElement | null>;
};

export function usePinned({ card, strip, verdict, title }: Refs) {
  const [pinned, setPinned] = useState(PIN_NONE);
  const sync = () => {
    if (!card.current?.scrollTop) return setPinned(PIN_NONE);
    const under = strip.current?.getBoundingClientRect().top;
    if (under === undefined) return;
    const verdictRect = verdict.current?.getBoundingClientRect();
    const titleBottom = title.current?.getBoundingClientRect().bottom ?? Infinity;
    setPinned(
      verdictRect && verdictRect.top + verdictRect.height * SCROLLED <= under
        ? PIN_VERDICT
        : titleBottom <= under
          ? PIN_NAME
          : PIN_NONE,
    );
  };
  return { pinned, sync };
}
