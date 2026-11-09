import { render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import type { Lookup } from "../search/types.ts";
import { AreaAnswer } from "./AreaAnswer.tsx";
import { Explain } from "./Explain.tsx";
import { kindOf } from "./kind.ts";
import { rec } from "./testData.ts";

const lookup: Lookup = JSON.parse(readFileSync("public/lookup_schema_v1.json", "utf8"));
const shown = (id: string) => {
  const { container, unmount } = render(
    <AreaAnswer
      record={lookup.areas[id]}
      areaId={id}
      lookup={lookup}
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
    if (a.confidence === "LOW") continue;
    if (kindOf(a) === "no-data") continue;
    const text = shown(id);
    expect(text, id).toContain(`${WORD[a.confidence]} behind this`);
  }
});

it("the data levels quote the thresholds the lookup publishes", () => {
  const { limited_below, plenty_from } = lookup.metadata.confidence_thresholds;
  render(<Explain area={rec()} kind="high" bands={lookup.risk_bands} metadata={lookup.metadata} />);
  expect(screen.getByText(new RegExp(`${plenty_from} or more reports`))).toBeTruthy();
  expect(screen.getByText(new RegExp(`fewer than ${limited_below}\\)`))).toBeTruthy();
});

it("an area without a confidence shows the error state, not a guessed label", () => {
  const [id, a] = Object.entries(lookup.areas)[0];
  const broken = { ...a, confidence: undefined } as unknown as typeof a;
  const { container } = render(
    <AreaAnswer
      record={broken}
      areaId={id}
      lookup={lookup}
      open
      lowerSignal={0}
      onClose={() => {}}
      onAbout={() => {}}
    />,
  );
  expect(container.textContent).toContain("Could not load this area");
  expect(container.textContent).not.toContain("behind this:");
});
