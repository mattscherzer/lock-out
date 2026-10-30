// DOM builders for the dropdown. Text goes in via textContent, never as HTML.

import type { Area, Row } from "./types.ts";

const li = (className: string, text: string) => Object.assign(document.createElement("li"), { className, textContent: text });

export const note = (text: string) => li("search-note", text);

// "Invalidenstraße · street · in Nordbahnhof", then district and share; an area-name match is just the name.
export function row({ place, pct, more }: Row, info: Area) {
  const kind = place.sub ? `${place.sub} ${place.kind}` : (place.type ?? place.kind).toLowerCase(); // "S station", "water"
  const name = place.bezirk ? `${place.label} (${place.bezirk})` : place.label; // one name can exist in several Bezirke
  const via = place.kind === "area" ? "" : `${name} · ${kind} · in `;
  const share = pct == null ? "" : ` · ${pct}% of ${kind}`;
  const rest = more ? ` · +${more} more areas` : "";
  return li("search-option", `${via}${info.name} (${info.bzr_name})${share}${rest}`);
}
