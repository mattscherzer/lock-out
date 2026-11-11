export type Area = { name: string; bzr_name: string };
export type Areas = Record<string, Area>;

export type Grade = "LOW" | "MEDIUM" | "HIGH";

export type AreaRecord = Area & {
  tier: Grade;
  reports_12m: number;
  confidence?: Grade; // never recomputed from reports_12m
  limited_data: boolean;
  no_record: boolean;
};
export type Selector = {
  shares: Record<string, number>;
  pattern: "citywide pattern" | "area pattern";
};
export type Thresholds = { limited_below: number; plenty_from: number };
export type Band = { min_percentile: number; max_percentile: number };
export type Metadata = Lookup["metadata"];
export type RatedMetadata = Metadata & { confidence_thresholds: Thresholds };
export type Lookup = {
  risk_bands: { LOW: Band; MEDIUM: Band; HIGH: Band };
  metadata: {
    attribution: { police: string; osm: string; lor: string };
    data_window: { start: string; end: string };
    reports_up_to: string;
    truncation_lag_days: number;
    confidence_thresholds?: Thresholds;
  };
  selectors: { time_band: Selector; day_group: Selector };
  areas: Record<string, AreaRecord>;
};
