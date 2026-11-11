import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { Explain } from "./Explain.tsx";
import { bands, metadata, rec } from "../domain/testData.ts";

it("the sheet leaves thin data off the scale and never says safe", () => {
  const { container } = render(
    <Explain
      area={rec({ reports_12m: 1, limited_data: true })}
      kind="limited"
      bands={bands}
      metadata={metadata}
    />,
  );
  expect(screen.getByText(/not placed on the scale/)).toBeTruthy();
  expect(container.textContent).not.toMatch(/\bsafe/i);
});

it("the sheet counts the area's own reports, not always one", () => {
  render(
    <Explain
      area={rec({ reports_12m: 3, limited_data: true })}
      kind="limited"
      bands={bands}
      metadata={metadata}
    />,
  );
  expect(screen.getByText(/With 3 reports, any rank would be a guess/)).toBeTruthy();
});

it("the sheet places a tiered area and names the window", () => {
  render(
    <Explain area={rec({ name: "Stralauer" })} kind="high" bands={bands} metadata={metadata} />,
  );
  expect(screen.getByText(/The pin marks the group Stralauer is in/)).toBeTruthy();
  expect(screen.getByText(/11 Oct 2025 to 10 Oct 2026/)).toBeTruthy();
});

it("the sheet explains the data levels without calling anything safe", () => {
  const { container } = render(
    <Explain area={rec()} kind="high" bands={bands} metadata={metadata} />,
  );
  expect(screen.getByRole("heading", { name: "How much data is behind this?" })).toBeTruthy();
  expect(container.textContent).toMatch(/Plenty of data.*Some data.*Limited data/s);
});
