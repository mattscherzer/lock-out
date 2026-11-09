import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { PaletteToggle } from "./PaletteToggle.tsx";

it("toggles the palette attribute and aria-checked", () => {
  render(<PaletteToggle />);
  const b = screen.getByRole("switch", { name: "Colour-blind" });
  expect(b.getAttribute("aria-checked")).toBe("false");
  fireEvent.click(b);
  expect(b.getAttribute("aria-checked")).toBe("true");
  expect(document.documentElement.dataset.palette).toBe("cb");
  fireEvent.click(b);
  expect(b.getAttribute("aria-checked")).toBe("false");
  expect(document.documentElement.dataset.palette).toBeUndefined();
});

it("keeps two toggles in sync", () => {
  render(
    <>
      <PaletteToggle />
      <PaletteToggle />
    </>,
  );
  const [a, b] = screen.getAllByRole("switch");
  fireEvent.click(a);
  expect(b.getAttribute("aria-checked")).toBe("true");
  fireEvent.click(b);
  expect(a.getAttribute("aria-checked")).toBe("false");
});
