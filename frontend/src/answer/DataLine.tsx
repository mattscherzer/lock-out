import type { AreaRecord } from "../domain/lookup.ts";
import { STRINGS } from "../strings.ts";
import { plural } from "./text.ts";

const S = STRINGS.dataLine;

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
      <b className="font-semibold text-on-surface">{plenty ? S.plenty : S.some}</b>{" "}
      {S.behind(plural(reports))}
      {!plenty && ` ${S.shift}`}
    </p>
  );
}
