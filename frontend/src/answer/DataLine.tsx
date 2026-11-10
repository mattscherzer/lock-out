import type { AreaRecord } from "../domain/lookup.ts";
import { plural } from "./text.ts";

export function DataLine({
  reports,
  confidence,
}: {
  reports: number;
  confidence: AreaRecord["confidence"];
}) {
  const plenty = confidence === "HIGH";
  return (
    <p className="m-0 body-md text-on-surface-variant">
      <b className="font-semibold text-on-surface">{plenty ? "Plenty of data" : "Some data"}</b>{" "}
      behind this: {plural(reports)} in 12 months.
      {!plenty && " A few more or fewer could shift the rating."}
    </p>
  );
}
