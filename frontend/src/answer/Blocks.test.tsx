import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { About } from "../About.tsx";
import type { AreaRecord, Fixture } from "../search/types.ts";
import { Details, Explain, kindOf, tierOf, topShare } from "./Blocks.tsx";
import { TierMark, Verdict, verdictLine } from "./Verdict.tsx";

const rec = (over: Partial<AreaRecord> = {}): AreaRecord => ({ name: "A", bzr_name: "B", tier: "LOW", reports_12m: 20, limited_data: false, no_record: false, ...over });
const selectors = {
  time_band: { pattern: "citywide pattern", shares: { Morning: 0.1772, Afternoon: 0.2909, Evening: 0.2761, Night: 0.2558 } },
  day_group: { pattern: "citywide pattern", shares: { Mon_Thu: 0.5934, Friday: 0.159, Weekend: 0.2476 } },
};
const attribution = { police: "Datenquelle: Polizei Berlin (CC-BY 4.0)", osm: "© OpenStreetMap contributors (ODbL)", lor: "Datenquelle: Amt für Statistik" };
const metadata: Fixture["metadata"] = { attribution, data_window: { start: "2025-10-11", end: "2026-10-10" }, reports_up_to: "2026-10-24", truncation_lag_days: 14 };
const bands = { LOW: { min_percentile: 0, max_percentile: 0.6 }, MEDIUM: { min_percentile: 0.6, max_percentile: 0.85 }, HIGH: { min_percentile: 0.85, max_percentile: 1 } };

it("maps the fixture; no record is no-data, thin data is limited, never low", () => {
  expect(tierOf(rec({ tier: "HIGH" }))).toBe("high");
  expect(kindOf(rec({ no_record: true, limited_data: true }))).toBe("no-data");
  expect(kindOf(rec({ limited_data: true }))).toBe("limited");
  expect(kindOf(rec())).toBe("low");
  expect(topShare(bands)).toBe(15);
});

it("thin and missing data never read as calm and say so", () => {
  expect(verdictLine("limited", 1, 15)).toBe("Only 1 report in 12 months, too few to rate this area. This does not mean low risk.");
  expect(verdictLine("limited", 0, 15)).toBe("No reports in 12 months, too few to rate this area. This does not mean low risk.");
  expect(verdictLine("no-data", 0, 15)).toContain("does not mean low risk");
  for (const kind of ["limited", "no-data"] as const) expect(verdictLine(kind, 2, 15)).not.toMatch(/fewer/i);
});

it("the verdict shows the word and offers the explanation", () => {
  let asked = 0;
  render(<Verdict kind="high" reports={101} topShare={15} onExplain={() => asked++} />);
  expect(screen.getByText("High", { selector: ".display-sm" })).toBeTruthy();
  expect(screen.getByText("Among the 15% of Berlin areas with the most reported bike thefts.")).toBeTruthy();
  fireEvent.click(screen.getByText("What does this mean?"));
  expect(asked).toBe(1);
});

it("each kind has its own shape", () => {
  const shapes = (["high", "medium", "low", "limited"] as const).map((k) => render(<TierMark kind={k} />).container.innerHTML);
  expect(new Set(shapes).size).toBe(4);
});

it("details chart the citywide timing as a labelled picture, with days compared per day", () => {
  render(<Details area={rec({ reports_12m: 41 })} selectors={selectors} metadata={metadata} onAbout={() => {}} />);
  expect(screen.queryByRole("button", { name: /Evening/ })).toBeNull(); // not selectors: the shares cannot change an area's rating
  expect(screen.getByRole("img", { name: /Time of day: Morning 18%, Afternoon 29%, Evening 28%, Night 26%/ })).toBeTruthy();
  // 59% over four days, 16% over one, 25% over two
  expect(screen.getByRole("img", { name: "Day of the week: Mon–Thu 15%, Friday 16%, Weekend 12%" })).toBeTruthy();
});

it("the citywide label explains itself on tap", () => {
  render(<Details area={rec()} selectors={selectors} metadata={metadata} onAbout={() => {}} />);
  const tag = screen.getByRole("button", { name: "Citywide pattern" });
  expect(tag.getAttribute("aria-expanded")).toBe("false");
  expect(screen.queryByText(/same for every area/)).toBeNull();
  fireEvent.click(tag);
  expect(tag.getAttribute("aria-expanded")).toBe("true");
  expect(screen.getByText(/same for every area/)).toBeTruthy();
  fireEvent.click(tag);
  expect(screen.queryByText(/same for every area/)).toBeNull();
});

it("details show the report count and a way to the About page", () => {
  let about = 0;
  render(<Details area={rec({ reports_12m: 41 })} selectors={selectors} metadata={metadata} onAbout={() => about++} />);
  expect(screen.getByText("41")).toBeTruthy();
  fireEvent.click(screen.getByRole("link", { name: "About the data" }));
  expect(about).toBe(1);
});

it("the sheet leaves thin data off the scale and never says safe", () => {
  const { container } = render(<Explain area={rec({ reports_12m: 1, limited_data: true })} kind="limited" bands={bands} metadata={metadata} />);
  expect(screen.getByText(/not placed on the scale/)).toBeTruthy();
  expect(container.textContent).not.toMatch(/\bsafe/i);
});

it("the sheet places a tiered area and names the window", () => {
  render(<Explain area={rec({ name: "Stralauer" })} kind="high" bands={bands} metadata={metadata} />);
  expect(screen.getByText(/The pin marks the group Stralauer is in/)).toBeTruthy();
  expect(screen.getByText(/11 Oct 2025 to 10 Oct 2026/)).toBeTruthy();
});

it("About credits OpenStreetMap, Polizei Berlin and the LOR source", () => {
  render(<About attribution={attribution} open={false} onClose={() => {}} />);
  for (const text of Object.values(attribution)) expect(screen.getByText(text, { exact: false })).toBeTruthy();
});
