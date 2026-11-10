export type Area = { name: string; bzr_name: string };
export type Areas = Record<string, Area>;

export type AreaRecord = Area & {
  tier: "LOW" | "MEDIUM" | "HIGH";
  reports_12m: number;
  confidence: "LOW" | "MEDIUM" | "HIGH"; // never recomputed from reports_12m
  limited_data: boolean;
  no_record: boolean;
};
export type Selector = { shares: Record<string, number>; pattern: string };
export type Band = { min_percentile: number; max_percentile: number };
export type Lookup = {
  risk_bands: { LOW: Band; MEDIUM: Band; HIGH: Band };
  metadata: {
    attribution: { police: string; osm: string; lor: string };
    data_window: { start: string; end: string };
    reports_up_to: string;
    truncation_lag_days: number;
    confidence_thresholds: { limited_below: number; plenty_from: number };
  };
  selectors: { time_band: Selector; day_group: Selector };
  areas: Record<string, AreaRecord>;
};
