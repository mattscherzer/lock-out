import { act, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, expect, it, vi } from "vitest";
import { AreaSearch } from "./AreaSearch.tsx";
import { addStreets, buildIndex, EXAMPLES, LOADING_DELAY_MS } from "./places.ts";

const areas = {
  a1: { name: "Charitéviertel", bzr_name: "Mitte" },
  a2: { name: "Invalidenstraße", bzr_name: "Mitte" },
  a3: { name: "Nordbahnhof", bzr_name: "Mitte" },
};
const gazetteer = {
  plz: {
    "10115": [
      ["a1", 39],
      ["a2", 32],
      ["a3", 16],
    ] as [string, number][],
  },
  stations: [["Nordbahnhof", "S", "a3", 52.53, 13.38] as [string, string, string, number, number]],
};
const index = buildIndex(gazetteer, areas);

function Harness({
  onSelect = vi.fn(),
  onClear = vi.fn(),
  ...rest
}: { onSelect?: (...a: unknown[]) => void; onClear?: () => void } & Partial<
  Parameters<typeof AreaSearch>[0]
>) {
  const [selected, setSelected] = useState<string | null>(null);
  return (
    <AreaSearch
      index={index}
      areas={areas}
      selected={selected}
      onSelect={(id, c) => {
        setSelected(id);
        onSelect(id, c);
      }}
      onClear={() => {
        setSelected(null);
        onClear();
      }}
      {...rest}
    />
  );
}
const field = () => screen.getByRole("combobox") as HTMLInputElement;
const type = (v: string) => {
  fireEvent.focus(field());
  fireEvent.change(field(), { target: { value: v } });
};

it("lists one row per area of a postcode, largest share first, and selects with context", () => {
  const onSelect = vi.fn();
  render(<Harness onSelect={onSelect} />);
  type("10115");
  const rows = screen.getAllByRole("option");
  const label = document.querySelector(".area-search-parent")!;
  expect(label.textContent).toBe("10115Postcode · in 3 areas");
  expect(label.getAttribute("role")).toBe("presentation");
  expect(rows.map((r) => r.textContent)).toEqual([
    "CharitéviertelArea · Mitte39%",
    "InvalidenstraßeArea · Mitte32%",
    "NordbahnhofArea · Mitte16%",
  ]);
  expect(screen.getByRole("status").textContent).toBe("3 results");
  fireEvent.keyDown(field(), { key: "ArrowDown" });
  fireEvent.keyDown(field(), { key: "Enter" });
  expect(onSelect).toHaveBeenCalledWith("a2", {
    kind: "postcode",
    label: "10115",
    pct: 32,
    ll: undefined,
  });
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
  expect(screen.getAllByRole("option")[0].textContent).toContain("Nordbahnhof");
  fireEvent.keyDown(field(), { key: "Escape" });
  expect(field().value).toBe("Charitéviertel");
  expect(screen.queryByRole("option")).toBeNull();
});

it("clear drops the selection and empties the field", () => {
  const onClear = vi.fn();
  render(<Harness onClear={onClear} />);
  type("nordbahnhof");
  fireEvent.keyDown(field(), { key: "Enter" });
  fireEvent.click(screen.getByLabelText("Clear search"));
  expect(field().value).toBe("");
  expect(screen.queryByLabelText("Clear search")).toBeNull();
  expect(onClear).toHaveBeenCalledOnce();
  fireEvent.blur(field());
  expect(field().value).toBe(""); // the selection is gone, it does not come back on blur
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

it("re-focus keeps the picked row first and Enter keeps it", () => {
  const onSelect = vi.fn();
  render(<Harness onSelect={onSelect} />);
  type("nord");
  fireEvent.click(screen.getAllByRole("option")[0]); // the area row, above the station
  fireEvent.focus(field());
  expect(screen.getAllByRole("option")[0].textContent).toContain("Area ·");
  fireEvent.keyDown(field(), { key: "Enter" });
  expect(onSelect).toHaveBeenLastCalledWith("a3", null); // the area row, so no station pin
});

it("a pick with the pointer blurs the field, a pick with Enter keeps focus", () => {
  render(<Harness />);
  field().focus();
  fireEvent.change(field(), { target: { value: "nord" } });
  fireEvent.keyDown(field(), { key: "Enter" });
  expect(document.activeElement).toBe(field());
  fireEvent.change(field(), { target: { value: "nord" } });
  fireEvent.click(screen.getAllByRole("option")[0]);
  expect(document.activeElement).not.toBe(field());
});

it("a selection made elsewhere replaces a typed draft", () => {
  const props = { index, areas, onSelect: vi.fn(), onClear: vi.fn() };
  const { rerender } = render(<AreaSearch {...props} selected={null} />);
  type("foo");
  rerender(<AreaSearch {...props} selected="a2" />);
  expect(field().value).toBe("Invalidenstraße");
});

it("ArrowDown reopens a closed list", () => {
  render(<Harness />);
  type("nord");
  fireEvent.keyDown(field(), { key: "Escape" });
  expect(screen.queryByRole("option")).toBeNull();
  fireEvent.keyDown(field(), { key: "ArrowDown" });
  expect(screen.getAllByRole("option").length).toBeGreaterThan(0);
});

it("closes when told to from outside", () => {
  const { rerender } = render(<Harness closeSignal={0} />);
  type("nord");
  expect(screen.getAllByRole("option").length).toBeGreaterThan(0);
  rerender(<Harness closeSignal={1} />);
  expect(screen.queryByRole("option")).toBeNull();
});

it("searches again once the street data has loaded", async () => {
  const withStreets = buildIndex(gazetteer, areas);
  const file = {
    ids: ["a2"],
    streets: { Mitte: { Street: { Zimmerstraße: [[0, 100]] as [number, number][] } } },
  };
  const loadStreets = () => Promise.resolve().then(() => addStreets(withStreets, file, areas));
  render(
    <AreaSearch
      index={withStreets}
      areas={areas}
      selected={null}
      onSelect={vi.fn()}
      onClear={vi.fn()}
      loadStreets={loadStreets}
    />,
  );
  fireEvent.focus(field());
  fireEvent.change(field(), { target: { value: "zimmer" } });
  expect(screen.queryByRole("option")).toBeNull();
  expect((await screen.findAllByRole("option"))[0].textContent).toContain("Zimmerstraße"); // the typed part is bold, so match the row, not a text node
});

it("says so when a house number is typed", () => {
  render(<Harness />);
  type("Nordbahnhof 12");
  expect(screen.getByText(/House numbers aren't searchable yet/)).toBeTruthy();
});

const longName = "100 AS Kaiserdamm Einf v Knobelsdorffstr West";
const wide = {
  ...areas,
  ...Object.fromEntries(
    ["w1", "w2", "w3", "w4", "w5"].map((id) => [id, { name: id, bzr_name: "Tiergarten Süd" }]),
  ),
};
const wideIndex = buildIndex(
  {
    plz: {
      "10999": ["w1", "w2", "w3", "w4", "w5"].map((id, i) => [id, 50 - i * 10] as [string, number]),
    },
    stations: [[longName, "S", "a3", 52.5, 13.4]],
  },
  wide,
);

it("keeps a long name whole for screen readers and in the tooltip, and the Bezirk without its number", () => {
  render(
    <AreaSearch
      index={wideIndex}
      areas={wide}
      selected={null}
      onSelect={vi.fn()}
      onClear={vi.fn()}
    />,
  );
  type("Kaiserdamm");
  const option = screen.getByRole("option");
  expect(option.getAttribute("title")).toBe(longName);
  expect(option.querySelector(".area-search-name")?.textContent).toBe(longName); // the two-line clamp is a Tailwind utility on that element, which jsdom cannot measure
});

it("shows the region on each area row, and names the place on each area row", () => {
  render(
    <AreaSearch
      index={wideIndex}
      areas={wide}
      selected={null}
      onSelect={vi.fn()}
      onClear={vi.fn()}
    />,
  );
  type("10999");
  const first = screen.getAllByRole("option")[0];
  expect(first.textContent).toContain("Area · Tiergarten Süd");
  expect(first.getAttribute("aria-label")).toBe("w1, Area · Tiergarten Süd, in 10999, 50%");
});

it("expands the areas past the cap with Enter on the +N more row", () => {
  render(
    <AreaSearch
      index={wideIndex}
      areas={wide}
      selected={null}
      onSelect={vi.fn()}
      onClear={vi.fn()}
    />,
  );
  type("10999");
  expect(screen.getAllByRole("option")).toHaveLength(4);
  for (let i = 0; i < 3; i++) fireEvent.keyDown(field(), { key: "ArrowDown" });
  expect(screen.getAllByRole("option")[3].textContent).toBe("+2 more areas for 10999");
  fireEvent.keyDown(field(), { key: "Enter" });
  expect(screen.getAllByRole("option")).toHaveLength(5);
});

afterEach(() => vi.useRealTimers());

it("an empty focused field offers the examples; one fills the field and searches", () => {
  render(<Harness />);
  fireEvent.focus(field());
  expect(field().placeholder).toBe("Street, postcode, area or station");
  expect(screen.getByText("Try searching for")).toBeTruthy();
  expect(screen.getAllByRole("option").map((o) => o.textContent)).toEqual(
    EXAMPLES.map((e) => e.label + e.word),
  );
  fireEvent.click(screen.getAllByRole("option")[1]);
  expect(field().value).toBe(EXAMPLES[1].label);
  expect(screen.queryByText("Try searching for")).toBeNull();
});

it("arrow keys and Enter pick an example", () => {
  render(<Harness />);
  fireEvent.focus(field());
  fireEvent.keyDown(field(), { key: "ArrowDown" });
  fireEvent.keyDown(field(), { key: "Enter" });
  expect(field().value).toBe(EXAMPLES[1].label);
});

it("clear brings the examples back", () => {
  render(<Harness />);
  type("10115");
  fireEvent.keyDown(field(), { key: "Enter" });
  fireEvent.click(screen.getByLabelText("Clear search"));
  expect(screen.getAllByRole("option")).toHaveLength(EXAMPLES.length);
});

it("shows the spinner and placeholder rows only after the loading delay", async () => {
  vi.useFakeTimers();
  let done!: () => void;
  render(<Harness loadStreets={() => new Promise<void>((r) => (done = r))} />);
  type("zimmer");
  expect(screen.getByRole("status").textContent).toBe("Searching");
  expect(document.querySelector(".area-search-skeleton")).toBeNull();
  expect(screen.getByLabelText("Clear search")).toBeTruthy();
  act(() => void vi.advanceTimersByTime(LOADING_DELAY_MS));
  expect(document.querySelectorAll(".area-search-skeleton li")).toHaveLength(3);
  expect(screen.queryByLabelText("Clear search")).toBeNull();
  expect(field().value).toBe("zimmer");
  await act(async () => done());
  expect(document.querySelector(".area-search-skeleton")).toBeNull();
  expect(screen.getByLabelText("Clear search")).toBeTruthy();
});

it("a fast reply never flashes the placeholder rows", async () => {
  vi.useFakeTimers();
  render(<Harness loadStreets={() => Promise.resolve()} />);
  type("zimmer");
  await act(async () => void vi.advanceTimersByTime(LOADING_DELAY_MS * 2));
  expect(document.querySelector(".area-search-skeleton")).toBeNull();
});

it("a failed load says so, keeps the text, and Try again recovers", async () => {
  const loadStreets = vi
    .fn()
    .mockRejectedValueOnce(new Error("offline"))
    .mockResolvedValue(undefined);
  render(<Harness loadStreets={loadStreets} />);
  type("zimmer");
  const alert = await screen.findByRole("alert");
  expect(alert.textContent).toContain("Search isn't responding");
  expect(alert.textContent).toContain("We kept what you typed.");
  expect(screen.queryByText(/not found/)).toBeNull();
  expect(field().value).toBe("zimmer");
  fireEvent.click(screen.getByRole("button", { name: "Try again" }));
  expect(loadStreets).toHaveBeenCalledTimes(2);
  await act(async () => {});
  expect(screen.queryByRole("alert")).toBeNull();
  expect(screen.getByText(/not found/)).toBeTruthy();
  expect(field().value).toBe("zimmer");
});

it("Tab from the field to Try again keeps the panel open; leaving it closes", async () => {
  render(<Harness loadStreets={() => Promise.reject(new Error("offline"))} />);
  type("zimmer");
  const retry = await screen.findByRole("button", { name: "Try again" });
  fireEvent.blur(field(), { relatedTarget: retry });
  expect(screen.getByRole("alert")).toBeTruthy();
  fireEvent.blur(retry, { relatedTarget: null });
  expect(screen.queryByRole("alert")).toBeNull();
});

it("the error is not announced as 'No results', and the empty field has no short-query note", async () => {
  render(<Harness loadStreets={() => Promise.reject(new Error("offline"))} />);
  fireEvent.focus(field());
  expect(screen.queryByText("Type at least two characters.")).toBeNull();
  fireEvent.change(field(), { target: { value: "zzzz" } });
  await screen.findByRole("alert");
  expect(screen.getByRole("status").textContent).toBe("");
});

it("ArrowDown reopens the examples after Esc on an empty field", () => {
  render(<Harness />);
  fireEvent.focus(field());
  fireEvent.keyDown(field(), { key: "Escape" });
  expect(screen.queryByRole("option")).toBeNull();
  fireEvent.keyDown(field(), { key: "ArrowDown" });
  expect(screen.getAllByRole("option")).toHaveLength(EXAMPLES.length);
});

it("Try again hands focus back to the field without selecting the text", async () => {
  const loadStreets = vi
    .fn()
    .mockRejectedValueOnce(new Error("offline"))
    .mockResolvedValue(undefined);
  render(<Harness loadStreets={loadStreets} />);
  type("zimmer");
  fireEvent.click(await screen.findByRole("button", { name: "Try again" }));
  expect(document.activeElement).toBe(field());
  expect(field().selectionStart).not.toBe(0);
});

it("names the street search when other results are still listed", async () => {
  render(<Harness loadStreets={() => Promise.reject(new Error("offline"))} />);
  type("nord");
  const alert = await screen.findByRole("alert");
  expect(alert.textContent).toContain("Street search isn't available right now");
  expect(alert.textContent).not.toContain("Search isn't responding");
  expect(screen.getAllByRole("option").length).toBeGreaterThan(0);
});
