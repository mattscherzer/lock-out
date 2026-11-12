import { act, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { STRINGS } from "../strings.ts";
import { AreaSearch } from "./AreaSearch.tsx";
import { buildIndex } from "./places.ts";

const L = STRINGS.search.location;
const areas = { a1: { name: "Charitéviertel", bzr_name: "Mitte" } };
const index = buildIndex({ plz: {}, stations: [] }, areas);

type Perm = "prompt" | "granted" | "denied";
type Answer = { ok: [number, number] } | { fail: 1 | 2 | 3 } | "pending";

let getCurrentPosition: ReturnType<typeof vi.fn>;
let permission: { state: Perm; listeners: Set<() => void> };
const setPermission = (state: Perm) => {
  permission.state = state;
  act(() => permission.listeners.forEach((l) => l()));
};
const answer = (a: Answer) =>
  getCurrentPosition.mockImplementation((ok: PositionCallback, fail: PositionErrorCallback) => {
    if (a === "pending") return;
    if ("ok" in a) ok({ coords: { latitude: a.ok[0], longitude: a.ok[1] } } as GeolocationPosition);
    else fail({ code: a.fail } as GeolocationPositionError);
  });

beforeEach(() => {
  permission = { state: "prompt", listeners: new Set() };
  getCurrentPosition = vi.fn();
  vi.stubGlobal("navigator", {
    geolocation: { getCurrentPosition },
    permissions: {
      query: vi.fn(async () => ({
        get state() {
          return permission.state;
        },
        addEventListener: (_: string, l: () => void) => permission.listeners.add(l),
        removeEventListener: (_: string, l: () => void) => permission.listeners.delete(l),
      })),
    },
  });
});
afterEach(() => vi.unstubAllGlobals());

// 52.5 / 13.4 is in a1; anything else is in no area
const find = (lat: number, lon: number) => (lat === 52.5 && lon === 13.4 ? "a1" : null);

function Harness({ onSelect = vi.fn() }: { onSelect?: (id: string, c: unknown) => void }) {
  const [selected, setSelected] = useState<string | null>(null);
  return (
    <AreaSearch
      index={index}
      areas={areas}
      selected={selected}
      locate={find}
      onSelect={(id, c) => {
        setSelected(id);
        onSelect(id, c);
      }}
      onClear={() => setSelected(null)}
    />
  );
}
const field = () => screen.getByRole("combobox") as HTMLInputElement;
const open = async () => {
  render(<Harness />);
  await act(async () => fireEvent.focus(field()));
};
const row = () => screen.getByRole("button", { name: new RegExp(`${L.title}|${L.waitTitle}`) });
const tap = async () => act(async () => fireEvent.click(row()));

it("is not asked on load or on open, even when permission is granted", async () => {
  permission.state = "granted";
  await open();
  expect(row().textContent).toBe(`${L.title}${L.ready}`);
  expect(getCurrentPosition).not.toHaveBeenCalled();
});

it("has no row without the Geolocation API or without a finder", async () => {
  vi.stubGlobal("navigator", {});
  render(<Harness />);
  await act(async () => fireEvent.focus(field()));
  expect(screen.queryByText(L.title)).toBeNull();
});

it("shows the row above the examples", async () => {
  await open();
  const text = document.querySelector(".area-search-panel")!.textContent!;
  expect(text.indexOf(L.title)).toBeLessThan(text.indexOf(STRINGS.search.tryTitle));
});

it("found: selects the area like a picked result, with no found-via context", async () => {
  const onSelect = vi.fn();
  render(<Harness onSelect={onSelect} />);
  await act(async () => fireEvent.focus(field()));
  answer({ ok: [52.5, 13.4] });
  await tap();
  expect(getCurrentPosition).toHaveBeenCalledOnce();
  expect(onSelect).toHaveBeenCalledWith("a1", null);
  expect(field().value).toBe("Charitéviertel");
  expect(screen.getByRole("status").textContent).toBe(L.live.selected("Charitéviertel"));
});

it("waiting: spinner in the row, row stays, field stays editable, a second tap does nothing", async () => {
  await open();
  answer("pending");
  await tap();
  expect(row().getAttribute("aria-busy")).toBe("true");
  expect(row().textContent).toBe(`${L.waitTitle}${L.wait}`);
  expect(row().querySelector(".animate-spin")).not.toBeNull();
  expect(field().disabled).toBe(false);
  await tap();
  expect(getCurrentPosition).toHaveBeenCalledOnce();
});

it("typing while waiting drops the late answer", async () => {
  const onSelect = vi.fn();
  render(<Harness onSelect={onSelect} />);
  await act(async () => fireEvent.focus(field()));
  let deliver!: PositionCallback;
  getCurrentPosition.mockImplementation((ok: PositionCallback) => (deliver = ok));
  await tap();
  fireEvent.change(field(), { target: { value: "Mitte" } });
  await act(async () =>
    deliver({ coords: { latitude: 52.5, longitude: 13.4 } } as GeolocationPosition),
  );
  expect(onSelect).not.toHaveBeenCalled();
});

it("no area: a gentle message with the examples still listed, no alert", async () => {
  await open();
  answer({ ok: [52.4, 13.0] });
  await tap();
  expect(screen.getByText(L.noAreaTitle)).toBeTruthy();
  expect(screen.getByText(L.noAreaBody)).toBeTruthy();
  expect(screen.queryByRole("alert")).toBeNull();
  expect(screen.getAllByRole("option").length).toBeGreaterThan(0);
  expect(screen.getByRole("status").textContent).toContain(L.noAreaTitle);
  fireEvent.change(field(), { target: { value: "x" } });
  fireEvent.change(field(), { target: { value: "" } });
  expect(screen.queryByText(L.noAreaTitle)).toBeNull(); // typing forgets it
});

it.each([
  [2, "unavailable"],
  [3, "timeout"],
] as const)(
  "error %s (%s): the retry line and Try again, which asks again",
  async (code, _name) => {
    await open();
    answer({ fail: code });
    await tap();
    expect(row().textContent).toContain(L.failed);
    answer({ ok: [52.5, 13.4] });
    await act(async () =>
      fireEvent.click(screen.getByRole("button", { name: STRINGS.search.retry })),
    );
    expect(getCurrentPosition).toHaveBeenCalledTimes(2);
    expect(field().value).toBe("Charitéviertel");
  },
);

it("denied up front: muted row, help on tap, the API is never called", async () => {
  permission.state = "denied";
  await open();
  expect(row().textContent).toBe(`${L.title}${L.denied}`);
  expect(row().getAttribute("aria-expanded")).toBe("false");
  await tap();
  expect(screen.getByText(L.help)).toBeTruthy();
  expect(row().getAttribute("aria-expanded")).toBe("true");
  expect(getCurrentPosition).not.toHaveBeenCalled();
  await tap();
  expect(screen.queryByText(L.help)).toBeNull();
});

it("a refusal on the tap switches the row to denied", async () => {
  await open();
  answer({ fail: 1 });
  permission.state = "denied";
  await tap();
  expect(row().textContent).toBe(`${L.title}${L.denied}`);
});

it("a refusal with no Permissions API also switches to denied for the session", async () => {
  vi.stubGlobal("navigator", { geolocation: { getCurrentPosition } });
  await open();
  answer({ fail: 1 });
  await tap();
  expect(row().textContent).toBe(`${L.title}${L.denied}`);
});

it("a dismissed prompt (refusal, permission still prompt) shows the retry line instead", async () => {
  await open();
  answer({ fail: 1 });
  await tap();
  expect(row().textContent).toContain(L.failed);
});

it("follows the permission change event while open", async () => {
  await open();
  setPermission("denied");
  expect(row().textContent).toBe(`${L.title}${L.denied}`);
  setPermission("granted");
  expect(row().textContent).toBe(`${L.title}${L.ready}`);
});

it("treats a Permissions API that throws as prompt", async () => {
  vi.stubGlobal("navigator", {
    geolocation: { getCurrentPosition },
    permissions: { query: vi.fn().mockRejectedValue(new TypeError("unsupported")) },
  });
  await open();
  expect(row().textContent).toBe(`${L.title}${L.ready}`);
});

it("is a button outside the listbox, with no option role", async () => {
  await open();
  expect(row().tagName).toBe("BUTTON");
  expect(screen.getAllByRole("option").every((o) => !o.textContent!.includes(L.title))).toBe(true);
});

it("a newer selection from elsewhere drops the answer still on its way", async () => {
  const onSelect = vi.fn();
  function Outer() {
    const [selected, setSelected] = useState<string | null>(null);
    return (
      <>
        <button onClick={() => setSelected("a1")}>map click</button>
        <AreaSearch
          index={index}
          areas={areas}
          selected={selected}
          locate={() => "a1"}
          onSelect={onSelect}
          onClear={() => {}}
        />
      </>
    );
  }
  render(<Outer />);
  await act(async () => fireEvent.focus(field()));
  let deliver!: PositionCallback;
  getCurrentPosition.mockImplementation((ok: PositionCallback) => (deliver = ok));
  await tap();
  fireEvent.click(screen.getByText("map click"));
  await act(async () => deliver({ coords: { latitude: 1, longitude: 1 } } as GeolocationPosition));
  expect(onSelect).not.toHaveBeenCalled();
});

it("clears a stale denied once the setting was changed while the list was closed", async () => {
  const { unmount } = render(<Harness />);
  await act(async () => fireEvent.focus(field()));
  answer({ fail: 1 });
  permission.state = "denied";
  await tap();
  expect(row().textContent).toContain(L.denied);
  fireEvent.keyDown(field(), { key: "Escape" });
  permission.state = "granted";
  await act(async () => fireEvent.focus(field()));
  expect(row().textContent).toBe(`${L.title}${L.ready}`);
  unmount();
});

it("a keyboard activation of the row hands focus back to the field without reopening the list", async () => {
  await open();
  answer({ ok: [52.5, 13.4] });
  row().focus();
  await tap();
  expect(document.activeElement).toBe(field());
  expect(field().getAttribute("aria-expanded")).toBe("false");
});

it("does not wait for a permission read that never settles", async () => {
  vi.useFakeTimers();
  vi.stubGlobal("navigator", {
    geolocation: { getCurrentPosition },
    permissions: { query: vi.fn(() => new Promise(() => {})) },
  });
  render(<Harness />);
  await act(async () => fireEvent.focus(field()));
  answer({ fail: 2 });
  await act(async () => fireEvent.click(row()));
  await act(async () => vi.advanceTimersByTimeAsync(1_500));
  expect(row().textContent).toContain(L.failed);
  vi.useRealTimers();
});

it("hides the row on an insecure page", async () => {
  vi.stubGlobal("isSecureContext", false);
  render(<Harness />);
  await act(async () => fireEvent.focus(field()));
  expect(screen.queryByText(L.title)).toBeNull();
});
