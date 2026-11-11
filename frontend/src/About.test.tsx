import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { About } from "./About.tsx";
import { attribution } from "./domain/testData.ts";

it("About credits OpenStreetMap, Polizei Berlin and the LOR source", () => {
  render(<About attribution={attribution} open={false} onClose={() => {}} />);
  for (const text of Object.values(attribution))
    expect(screen.getByText(text, { exact: false })).toBeTruthy();
});
