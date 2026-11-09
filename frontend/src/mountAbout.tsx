import type L from "leaflet";
import { createRoot } from "react-dom/client";
import { About } from "./About.tsx";
import type { Lookup } from "./search/types.ts";

// Opens About from the map's attribution link or from a caller; returns the opener.
export function mountAbout(
  root: HTMLElement,
  map: L.Map,
  attribution: Lookup["metadata"]["attribution"],
) {
  const aboutRoot = createRoot(root);
  const render = (open: boolean) =>
    aboutRoot.render(<About attribution={attribution} open={open} onClose={() => render(false)} />);
  render(false);
  map.attributionControl.getContainer()!.addEventListener("click", (e) => {
    if (!(e.target as Element).closest("[data-about]")) return;
    e.preventDefault();
    render(true);
  });
  return () => render(true);
}
