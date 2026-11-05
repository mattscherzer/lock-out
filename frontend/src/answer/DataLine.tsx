import { PLENTY_FROM, plural } from "./text.ts";

export function DataLine({ reports }: { reports: number }) {
  return (
    <p className="m-0 body-md text-on-surface-variant">
      <b className="font-semibold text-on-surface">
        {reports >= PLENTY_FROM ? "Plenty of data" : "Some data"}
      </b>{" "}
      behind this: {plural(reports)} in 12 months.
      {reports < PLENTY_FROM && " A few more or fewer could shift the rating."}
    </p>
  );
}
