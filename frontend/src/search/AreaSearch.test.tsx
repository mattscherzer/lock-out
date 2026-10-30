import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { expect, it, vi } from "vitest";
import { AreaSearch } from "./AreaSearch.tsx";
import { buildIndex } from "./places.ts";

const areas = {
  a1: { name: "Charitéviertel", bzr_name: "Mitte" },
  a2: { name: "Invalidenstraße", bzr_name: "Mitte" },
  a3: { name: "Nordbahnhof", bzr_name: "Mitte" },
};
const index = buildIndex({ plz: { "10115": [["a1", 39], ["a2", 32], ["a3", 16]] }, stations: [] }, areas);

function Harness({ onSelect = vi.fn() }) {
  const [selected, setSelected] = useState<string | null>(null);
  return <AreaSearch index={index} areas={areas} selected={selected} onSelect={(id, c) => { setSelected(id); onSelect(id, c); }} onClear={() => setSelected(null)} />;
}
const field = () => screen.getByRole("combobox") as HTMLInputElement;
const type = (v: string) => { fireEvent.focus(field()); fireEvent.change(field(), { target: { value: v } }); };

it("lists one row per area of a postcode, largest share first, and selects with context", () => {
  const onSelect = vi.fn();
  render(<Harness onSelect={onSelect} />);
  type("10115");
  const rows = screen.getAllByRole("option");
  expect(rows.map((r) => r.textContent)).toEqual([
    expect.stringContaining("Postcode · Charitéviertel · Mitte39%"),
    expect.stringContaining("Invalidenstraße"),
    expect.stringContaining("Nordbahnhof"),
  ]);
  expect(screen.getByRole("status").textContent).toBe("3 results");
  fireEvent.keyDown(field(), { key: "ArrowDown" });
  fireEvent.keyDown(field(), { key: "Enter" });
  expect(onSelect).toHaveBeenCalledWith("a2", { kind: "postcode", label: "10115", pct: 32, ll: undefined });
  expect(field().value).toBe("Invalidenstraße");
  expect(screen.queryByRole("option")).toBeNull();
});

it("re-focus reopens the list with the selection first; Esc keeps it; retyping replaces", () => {
  render(<Harness />);
  type("10115");
  fireEvent.keyDown(field(), { key: "Enter" });
  fireEvent.blur(field());
  fireEvent.focus(field());
  expect(screen.getAllByRole("option")[0].textContent).toContain("Charitéviertel");
  fireEvent.change(field(), { target: { value: "nord" } });
  fireEvent.keyDown(field(), { key: "Escape" });
  expect(field().value).toBe("Charitéviertel");
  expect(screen.queryByRole("option")).toBeNull();
});

it("clear drops the selection and empties the field", () => {
  render(<Harness />);
  type("nordbahnhof");
  fireEvent.keyDown(field(), { key: "Enter" });
  fireEvent.click(screen.getByLabelText("Clear search"));
  expect(field().value).toBe("");
  expect(screen.queryByLabelText("Clear search")).toBeNull();
});

it("says so when nothing matches", () => {
  render(<Harness />);
  type("zzzz");
  expect(screen.getByText("‘zzzz’ not found")).toBeTruthy();
  expect(screen.getByRole("status").textContent).toBe("No results");
});

it("re-focus after a selection lists the query's other results, so a different pick needs no retyping", () => {
  render(<Harness />);
  type("10115");
  fireEvent.keyDown(field(), { key: "Enter" });
  fireEvent.blur(field());
  fireEvent.focus(field());
  expect(screen.getAllByRole("option")).toHaveLength(3);
  fireEvent.click(screen.getAllByRole("option")[2]);
  expect(field().value).toBe("Nordbahnhof");
});

it("keeps a typed draft when the field loses focus with nothing selected", () => {
  render(<Harness />);
  type("nord");
  fireEvent.blur(field());
  expect(field().value).toBe("nord");
});

it("asks for more characters instead of saying not found", () => {
  render(<Harness />);
  type("n");
  expect(screen.getByText("Type at least two characters.")).toBeTruthy();
  expect(screen.queryByText(/not found/)).toBeNull();
});
