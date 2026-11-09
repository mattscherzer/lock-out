import { render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import type { Lookup } from "../search/types.ts";
import { AreaAnswer } from "./AreaAnswer.tsx";
import { DataLine } from "./DataLine.tsx";
import { Explain } from "./Explain.tsx";
import { kindOf } from "./kind.ts";
import { rec } from "./testData.ts";

const lookup: Lookup = JSON.parse(readFileSync("public/lookup_schema_v1.json", "utf8"));
const shown = (id: string, record = lookup.areas[id], data = lookup) => {
  const { container, unmount } = render(
    <AreaAnswer
      record={record}
      areaId={id}
      lookup={data}
      open
      lowerSignal={0}
      onClose={() => {}}
      onAbout={() => {}}
    />,
  );
  const text = container.textContent ?? "";
  unmount();
  return text;
};

it("every area's data label follows its confidence, and LOW is exactly limited data", () => {
  const WORD = { HIGH: "Plenty of data", MEDIUM: "Some data" } as const;
  for (const [id, a] of Object.entries(lookup.areas)) {
    expect(a.limited_data, id).toBe(a.confidence === "LOW");
    if (a.confidence === "LOW" || kindOf(a) === "no-data") continue;
    const { container, unmount } = render(
      <DataLine reports={a.reports_12m} confidence={a.confidence} />,
    );
    expect(container.textContent, id).toContain(WORD[a.confidence]);
    unmount();
  }
});

it("the data levels quote the thresholds from the lookup, whatever they are", () => {
  const metadata = {
    ...lookup.metadata,
    confidence_thresholds: { limited_below: 7, plenty_from: 30 },
  };
  render(<Explain area={rec()} kind="high" bands={lookup.risk_bands} metadata={metadata} />);
  expect(screen.getByText(/30 or more reports/)).toBeTruthy();
  expect(screen.getByText(/\(7 to 29\)/)).toBeTruthy();
  expect(screen.getByText(/fewer than 7\)/)).toBeTruthy();
});

it("a lookup without confidence or its thresholds shows the error state, not a guess or a crash", () => {
  const [id, a] = Object.entries(lookup.areas)[0];
  const noConfidence = { ...a, confidence: undefined } as unknown as typeof a;
  const { confidence_thresholds: _, ...rest } = lookup.metadata;
  const noThresholds = { ...lookup, metadata: rest } as unknown as Lookup;
  for (const text of [shown(id, noConfidence), shown(id, a, noThresholds)]) {
    expect(text).toContain("Could not load this area");
    expect(text).not.toContain("behind this:");
    expect(text).not.toMatch(/(Low|Medium|High|Limited data|No data) ·/);
  }
});
