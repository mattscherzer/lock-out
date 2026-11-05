import type { Kind } from "./kind.ts";

export const PLENTY_FROM = 20;
export const plural = (n: number) => `${n} ${n === 1 ? "report" : "reports"}`;

export const longDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });

export function verdictLine(kind: Kind, reports: number, topShare: number): string {
  if (kind === "high")
    return `Among the ${topShare}% of Berlin areas with the most reported bike thefts.`;
  if (kind === "medium")
    return "More reported thefts than most Berlin areas, but not among the highest.";
  if (kind === "low") return "Among the 60% of Berlin areas with the fewest reported bike thefts.";
  if (kind === "limited")
    return `${reports === 0 ? "No reports" : `Only ${plural(reports)}`} in 12 months, too few to rate this area. This does not mean low risk.`;
  return "No reports found, so we can't rate this area. This does not mean low risk.";
}
