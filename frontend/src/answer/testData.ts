import type { AreaRecord, Lookup } from "../domain/lookup.ts";

export const rec = (over: Partial<AreaRecord> = {}): AreaRecord => ({
  name: "A",
  bzr_name: "B",
  tier: "LOW",
  reports_12m: 20,
  confidence: "HIGH",
  limited_data: false,
  no_record: false,
  ...over,
});
export const selectors = {
  time_band: {
    pattern: "citywide pattern",
    shares: { Morning: 0.1772, Afternoon: 0.2909, Evening: 0.2761, Night: 0.2558 },
  },
  day_group: {
    pattern: "citywide pattern",
    shares: { Mon_Thu: 0.5934, Friday: 0.159, Weekend: 0.2476 },
  },
};
export const attribution = {
  police: "Datenquelle: Polizei Berlin (CC-BY 4.0)",
  osm: "© OpenStreetMap contributors (ODbL)",
  lor: "Datenquelle: Amt für Statistik",
};
export const metadata: Lookup["metadata"] = {
  attribution,
  data_window: { start: "2025-10-11", end: "2026-10-10" },
  reports_up_to: "2026-10-24",
  truncation_lag_days: 14,
  confidence_thresholds: { limited_below: 5, plenty_from: 20 },
};
export const bands = {
  LOW: { min_percentile: 0, max_percentile: 0.6 },
  MEDIUM: { min_percentile: 0.6, max_percentile: 0.85 },
  HIGH: { min_percentile: 0.85, max_percentile: 1 },
};
