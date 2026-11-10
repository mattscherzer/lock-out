import type { Kind } from "../domain/kind.ts";
import { STRINGS } from "../strings.ts";

export const plural = STRINGS.dataLine.reports;

export const longDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });

export function verdictLine(kind: Kind, reports: number, topShare: number): string {
  const line = STRINGS.verdict.line;
  if (kind === "high") return line.high(topShare);
  if (kind === "medium") return line.medium;
  if (kind === "low") return line.low;
  if (kind === "limited") return line.limited(reports);
  return line.noData;
}
