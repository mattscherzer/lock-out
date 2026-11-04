import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { About } from "../About.tsx";
import type { AreaRecord } from "../search/types.ts";
import { RiskBlock, SourceBlock, tierOf } from "./Blocks.tsx";

const rec = (over: Partial<AreaRecord> = {}): AreaRecord => ({ name: "A", bzr_name: "B", tier: "LOW", reports_12m: 20, limited_data: false, no_record: false, ...over });
const selectors = {
  time_band: { pattern: "citywide pattern", shares: { Morning: 0.1772, Afternoon: 0.2909, Evening: 0.2761, Night: 0.2558 } },
  day_group: { pattern: "citywide pattern", shares: { Mon_Thu: 0.5934, Friday: 0.159, Weekend: 0.2476 } },
};
const attribution = { police: "Datenquelle: Polizei Berlin (CC-BY 4.0)", osm: "© OpenStreetMap contributors (ODbL)", lor: "Datenquelle: Amt für Statistik" };

it("maps the fixture tier; an area without records is no-data, never low", () => {
  expect(tierOf(rec({ tier: "HIGH" }))).toBe("high");
  expect(tierOf(rec({ no_record: true, limited_data: true }))).toBe("no-data");
});

it("never reassures on thin data", () => {
  render(<RiskBlock area={rec({ limited_data: true, reports_12m: 2 })} selectors={selectors} />);
  expect(screen.getByText(/Limited data: 2 reported bike thefts/)).toBeTruthy();
  expect(screen.queryByText(/Fewer reported thefts/)).toBeNull();
});

it("labels both selectors as citywide and shows the picked share only after a pick", () => {
  render(<RiskBlock area={rec()} selectors={selectors} />);
  expect(screen.getAllByText("Citywide pattern: the same for every area.").length).toBe(2);
  expect(screen.queryByText(/of Berlin's bike thefts/)).toBeNull();
  fireEvent.click(screen.getByLabelText("Evening"));
  expect(screen.getByText("28% of Berlin's bike thefts were last seen in the evening.")).toBeTruthy();
  fireEvent.click(screen.getByLabelText("Weekend"));
  expect(screen.getByText("25% of Berlin's bike thefts were last seen on a weekend.")).toBeTruthy();
});

it("source block names the window and the police attribution", () => {
  render(<SourceBlock metadata={{ attribution, data_window: { start: "2025-10-11", end: "2026-10-10" }, reports_up_to: "2026-10-24", truncation_lag_days: 14 }} />);
  expect(screen.getByText(/2025-10-11 to 2026-10-10/).textContent).toContain(attribution.police);
});

it("About credits OpenStreetMap, Polizei Berlin and the LOR source", () => {
  render(<About attribution={attribution} />);
  for (const text of Object.values(attribution)) expect(screen.getByText(text, { exact: false })).toBeTruthy();
});
