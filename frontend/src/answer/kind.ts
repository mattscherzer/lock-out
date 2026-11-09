import type { AreaRecord, Lookup } from "../search/types.ts";

export type Tier = "low" | "medium" | "high" | "no-data";
export type Kind = Tier | "limited";

export const tierOf = (a: AreaRecord): Tier =>
  a.no_record ? "no-data" : (a.tier.toLowerCase() as Tier);
export const kindOf = (a: AreaRecord): Kind =>
  a.no_record ? "no-data" : a.limited_data ? "limited" : tierOf(a);
export const topShare = (bands: Lookup["risk_bands"]) =>
  Math.round((1 - bands.HIGH.min_percentile) * 100);
export const colour = (kind: Kind) => `var(--risk-${kind === "limited" ? "no-data" : kind})`;
