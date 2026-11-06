import type L from "leaflet";
import type { Kind } from "../answer/kind.ts";

export type Emphasis = "rest" | "hover" | "selected";

export const HATCH_ID = "limited-hatch";
export const HATCH_LIFTED_ID = "limited-hatch-lifted";

const root = () => document.documentElement;
const token = (name: string) => getComputedStyle(root()).getPropertyValue(name).trim();
const num = (name: string) => parseFloat(token(name));

// Colour comes from the .risk-* classes so the tokens stay live; only opacity and weight are computed here.
export function areaStyle(kind: Kind, emphasis: Emphasis): L.PathOptions {
  const dark = root().dataset.theme === "dark";
  const rest = num(dark ? "--map-fill-dark" : "--map-fill-light");
  const lifted = Math.min(rest + num("--map-fill-boost"), num("--map-fill-max"));
  const limited = kind === "limited";
  return {
    className: `risk-${kind}`,
    // the hatch carries the meaning, so it keeps full opacity; hover and selection add a tint behind it instead
    fillOpacity: limited ? 1 : emphasis === "rest" ? rest : lifted,
    // an attribute, not CSS: url(#id) in a stylesheet resolves against the stylesheet in some Safari versions
    fillColor: limited ? `url(#${emphasis === "rest" ? HATCH_ID : HATCH_LIFTED_ID})` : undefined,
    opacity: num(dark ? "--map-stroke-dark" : "--map-stroke-light"),
    weight: emphasis === "selected" ? 2 : 1,
    dashArray: limited ? token("--dash-limited") : undefined,
    lineJoin: "miter",
    lineCap: "butt",
  };
}

// The renderer's container only exists once it is on the map, so the patterns go in on "add".
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
    // _container: Leaflet's typings expose no getter for the renderer's <svg>
    (renderer as unknown as { _container: SVGElement })._container.insertAdjacentHTML(
      "afterbegin",
      `<defs>${pattern(HATCH_ID, "")}${pattern(
        HATCH_LIFTED_ID,
        `<rect width="${pitch}" height="${pitch}" style="fill:var(--risk-no-data);fill-opacity:${lifted}"/>`,
      )}</defs>`,
    );
  });
}
