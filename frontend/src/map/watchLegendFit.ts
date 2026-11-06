import { PHONE_MAX_PX } from "../viewport.ts";

const ZOOM_CLEARANCE_PX = 8;

// Large text or a narrow phone can push the bottom legend into the zoom buttons; the body flag swaps it for the palette button (see index.html).
export function watchLegendFit() {
  const bar = document.getElementById("legend")!;
  const check = () => {
    const zoom = document.querySelector(".leaflet-control-zoom");
    const tight =
      !!zoom &&
      innerWidth <= PHONE_MAX_PX &&
      bar.getBoundingClientRect().right + ZOOM_CLEARANCE_PX > zoom.getBoundingClientRect().left;
    document.body.toggleAttribute("data-legend-tight", tight);
  };
  new ResizeObserver(check).observe(bar);
  addEventListener("resize", check);
  document.fonts?.ready.then(check);
  check();
}
