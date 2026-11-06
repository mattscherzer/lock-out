import type L from "leaflet";

const hex = (name: string) => {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return [1, 3, 5].map((i) => parseInt(v.slice(i, i + 2), 16) / 255);
};

// Safari applies url(#svg-filter) to HTML elements unreliably, and Leaflet moves the tile pane with 3D transforms.
const isSafari = () => /^((?!chrome|android|crios|fxios).)*safari/i.test(navigator.userAgent);

// Experiment: 50% keeps the streets and colours of the original in the mix; the token says 100%.
// shortcut: tokens read once, re-run on a theme switch; strength is a constant here, not --map-tint-strength.
const STRENGTH = 0.5;

export function tintBasemap(map: L.Map) {
  const via = isSafari() ? "css" : "svg";
  const pane = map.getPane("tilePane")!;
  if (via === "svg") {
    const [sr, sg, sb] = hex("--map-shadow");
    const [hr, hg, hb] = hex("--map-highlight");
    document.body.insertAdjacentHTML(
      "beforeend",
      `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><filter id="duotone" color-interpolation-filters="sRGB">` +
        `<feColorMatrix type="matrix" result="grey" values="0.2126 0.7152 0.0722 0 0 0.2126 0.7152 0.0722 0 0 0.2126 0.7152 0.0722 0 0 0 0 0 1 0"/>` +
        `<feComponentTransfer in="grey" result="duo"><feFuncR type="table" tableValues="${sr} ${hr}"/><feFuncG type="table" tableValues="${sg} ${hg}"/><feFuncB type="table" tableValues="${sb} ${hb}"/></feComponentTransfer>` +
        `<feComposite in="duo" in2="SourceGraphic" operator="arithmetic" k1="0" k2="${STRENGTH}" k3="${1 - STRENGTH}" k4="0"/>` +
        `</filter></svg>`,
    );
    pane.style.filter = "url(#duotone)";
  } else {
    pane.style.filter = "grayscale(0.5) sepia(0.1) brightness(1.05)";
  }
  map.getContainer().dataset.tint = via;
}
