// DOM builders for the dropdown. Text goes in via textContent, never as HTML.

const li = (className, text) => Object.assign(document.createElement("li"), { className, textContent: text });

export const note = (text) => li("search-note", text);

// "Invalidenstraße · street · in Nordbahnhof", then district and share; an area-name match is just the name.
export function row({ place, pct, more }, info) {
  const via = place.kind === "area" ? "" : `${place.label} · ${place.kind} · in `;
  const share = pct == null ? "" : ` · ${pct}% of ${place.kind}`;
  const rest = more ? ` · +${more} more areas` : "";
  return li("search-option", `${via}${info.name} (${info.bzr_name})${share}${rest}`);
}
