import type L from "leaflet";
import type { Kind } from "../domain/kind.ts";

export type Emphasis = "rest" | "hover" | "selected";

// the same lift for a map hover and a list highlight, except on the area whose card is open
export const emphasisOf = (
  id: string,
  {
    active,
    highlighted,
    hovered,
  }: { active: string | null; highlighted: string | null; hovered: string | null },
): Emphasis =>
  id === active ? "selected" : id === highlighted || id === hovered ? "hover" : "rest";

export const HATCH_ID = "limited-hatch";
export const HATCH_LIFTED_ID = "limited-hatch-lifted";

// Whole class strings so Tailwind can see them.
const CLASS: Record<Kind, string> = {
  low: "stroke-risk-low fill-risk-low",
  medium: "stroke-risk-medium fill-risk-medium",
  high: "stroke-risk-high fill-risk-high",
  "no-data": "stroke-risk-no-data fill-risk-no-data",
  limited: "stroke-risk-no-data",
};

const root = () => document.documentElement;
const token = (name: string) => getComputedStyle(root()).getPropertyValue(name).trim();
const num = (name: string) => parseFloat(token(name));

export function areaStyle(kind: Kind, emphasis: Emphasis): L.PathOptions {
  const dark = root().dataset.theme === "dark";
  const rest = num(dark ? "--map-fill-dark" : "--map-fill-light");
  const lifted = Math.min(rest + num("--map-fill-boost"), num("--map-fill-max"));
  const limited = kind === "limited";
  return {
    className: CLASS[kind],
    // the hatch must stay at full opacity; emphasis tints behind it
    fillOpacity: limited ? 1 : emphasis === "rest" ? rest : lifted,
    // an attribute: url(#id) in CSS resolves against the stylesheet in some Safari versions
    fillColor: limited ? `url(#${emphasis === "rest" ? HATCH_ID : HATCH_LIFTED_ID})` : undefined,
    opacity: num(dark ? "--map-stroke-dark" : "--map-stroke-light"),
    weight: emphasis === "selected" ? 2 : 1,
    dashArray: limited ? token("--dash-limited") : undefined,
    lineJoin: "miter",
    lineCap: "butt",
  };
}

// the renderer's <svg> only exists once it is on the map
// shortcut: the lifted opacity is read once, so a runtime theme switch leaves the hatch stale; re-run if a theme toggle is added.
export function addHatch(renderer: L.SVG) {
  renderer.on("add", () => {
    const pitch = num("--hatch-pitch");
    const dark = root().dataset.theme === "dark";
    const lifted = Math.min(
      num(dark ? "--map-fill-dark" : "--map-fill-light") + num("--map-fill-boost"),
      num("--map-fill-max"),
    );
    const lines = `<line x1="0" y1="0" x2="0" y2="${pitch}" style="stroke:var(--risk-no-data);stroke-width:var(--hatch-line)"/>`;
    const pattern = (id: string, tint: string) =>
      `<pattern id="${id}" width="${pitch}" height="${pitch}" patternUnits="userSpaceOnUse" patternTransform="rotate(${num("--hatch-angle")})">${tint}${lines}</pattern>`;
    // no public getter in Leaflet's typings
    (renderer as unknown as { _container: SVGElement })._container.insertAdjacentHTML(
      "afterbegin",
      `<defs>${pattern(HATCH_ID, "")}${pattern(
        HATCH_LIFTED_ID,
        `<rect width="${pitch}" height="${pitch}" style="fill:var(--risk-no-data);fill-opacity:${lifted}"/>`,
      )}</defs>`,
    );
  });
}
