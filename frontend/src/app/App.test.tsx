import { act, fireEvent, render, screen } from "@testing-library/react";
import type { FeatureCollection } from "geojson";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { bands, metadata, rec, selectors } from "../answer/testData.ts";
import type { Lookup } from "../domain/lookup.ts";
import { App } from "./App.tsx";

const lookup: Lookup = {
  metadata,
  risk_bands: bands,
  selectors,
  areas: { a1: rec({ name: "Alpha" }), a2: rec({ name: "Beta" }) },
};
const square = (id: string, x: number): FeatureCollection["features"][number] => ({
  type: "Feature",
  properties: { id },
  geometry: {
    type: "Polygon",
    coordinates: [
      [
        [x, 52],
        [x + 0.1, 52],
        [x + 0.1, 52.1],
        [x, 52.1],
        [x, 52],
      ],
    ],
  },
});
const areas: FeatureCollection = {
  type: "FeatureCollection",
  features: [square("a1", 13), square("a2", 13.2)],
};

beforeEach(() => {
  vi.stubGlobal("ResizeObserver", class { observe() {} disconnect() {} }); // prettier-ignore
  vi.stubGlobal("matchMedia", () => ({
    matches: true,
    addEventListener() {},
    removeEventListener() {},
  }));
  render(<App lookup={lookup} areas={areas} gazetteer={null} />);
});
afterEach(() => vi.unstubAllGlobals());

const field = () => screen.getByRole("combobox");
const search = (text: string) => {
  fireEvent.focus(field());
  fireEvent.change(field(), { target: { value: text } });
};
const card = () => screen.getByRole("dialog", { name: "Alpha" });

it("picking an area from the search opens its card", () => {
  search("alp");
  fireEvent.click(screen.getByRole("option"));
  expect(card().hasAttribute("data-open")).toBe(true);
});

it("closing the card returns focus to the search field on desktop", () => {
  search("alp");
  fireEvent.click(screen.getByRole("option"));
  fireEvent.click(screen.getByLabelText("Close area details", { selector: ".answer-close" }));
  expect(card().hasAttribute("data-open")).toBe(false);
  expect(document.activeElement).toBe(field());
});

it("a click on the map closes the open search list", () => {
  search("alp");
  expect(screen.getAllByRole("option").length).toBeGreaterThan(0);
  act(() => void fireEvent.click(document.querySelector(".leaflet-container")!));
  expect(screen.queryByRole("option")).toBeNull();
});
