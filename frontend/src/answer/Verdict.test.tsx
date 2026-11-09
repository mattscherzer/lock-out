import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { TierMark } from "./TierMark.tsx";
import { verdictLine } from "./text.ts";
import { Verdict } from "./Verdict.tsx";

it("thin and missing data never read as calm and say so", () => {
  expect(verdictLine("limited", 1, 15)).toBe(
    "Only 1 report in 12 months, too few to rate this area. This does not mean low risk.",
  );
  expect(verdictLine("limited", 0, 15)).toBe(
    "No reports in 12 months, too few to rate this area. This does not mean low risk.",
  );
  expect(verdictLine("low", 40, 15)).toBe(
    "Among the 60% of Berlin areas with the fewest reported bike thefts.",
  );
  expect(verdictLine("no-data", 0, 15)).toContain("does not mean low risk");
  for (const kind of ["limited", "no-data"] as const)
    expect(verdictLine(kind, 2, 15)).not.toMatch(/fewer/i);
});

it("the verdict adds a data line for tiers, with the wording following the lookup's confidence, and none for thin data", () => {
  const { rerender } = render(
    <Verdict kind="low" confidence="MEDIUM" reports={14} topShare={15} onExplain={() => {}} />,
  );
  expect(screen.getByText(/behind this: 14 reports in 12 months/).textContent).toMatch(
    /Some data behind this.*A few more or fewer could shift the rating/,
  );
  rerender(
    <Verdict kind="high" confidence="HIGH" reports={101} topShare={15} onExplain={() => {}} />,
  );
  expect(screen.getByText(/behind this: 101 reports in 12 months/).textContent).not.toMatch(
    /shift/,
  );
  rerender(
    <Verdict kind="limited" confidence="LOW" reports={3} topShare={15} onExplain={() => {}} />,
  );
  expect(screen.queryByText(/behind this/)).toBeNull();
});

it("the verdict shows the word and offers the explanation", () => {
  let asked = 0;
  render(
    <Verdict kind="high" confidence="HIGH" reports={101} topShare={15} onExplain={() => asked++} />,
  );
  expect(screen.getByText("High", { selector: ".display-sm" })).toBeTruthy();
  expect(
    screen.getByText("Among the 15% of Berlin areas with the most reported bike thefts."),
  ).toBeTruthy();
  fireEvent.click(screen.getByText("What does this mean?"));
  expect(asked).toBe(1);
});

it("each kind has its own shape", () => {
  const shapes = (["high", "medium", "low", "limited"] as const).map(
    (k) => render(<TierMark kind={k} />).container.innerHTML,
  );
  expect(new Set(shapes).size).toBe(4);
});
