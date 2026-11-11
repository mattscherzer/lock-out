import { type RefObject, useEffect, useState } from "react";
import { PHONE_MAX_PX } from "../viewport.ts";

const ZOOM_CLEARANCE_PX = 8;

// Large text or a narrow phone can push the bottom legend into the zoom buttons; the caller swaps it for the palette button.
export function useLegendTight(bar: RefObject<HTMLElement | null>) {
  const [tight, setTight] = useState(false);
  useEffect(() => {
    const el = bar.current!;
    const check = () => {
      const zoom = document.querySelector(".leaflet-control-zoom"); // Leaflet's own markup
      setTight(
        !!zoom &&
          innerWidth <= PHONE_MAX_PX &&
          el.getBoundingClientRect().right + ZOOM_CLEARANCE_PX > zoom.getBoundingClientRect().left,
      );
    };
    const observer = new ResizeObserver(check);
    observer.observe(el);
    addEventListener("resize", check);
    document.fonts?.ready.then(check);
    check();
    return () => {
      observer.disconnect();
      removeEventListener("resize", check);
    };
  }, [bar]);
  return tight;
}
