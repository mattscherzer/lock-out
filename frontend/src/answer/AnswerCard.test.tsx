import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { AnswerCard, higherPx, type CardState } from "./AnswerCard.tsx";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

// jsdom has no matchMedia, which the card reads as a phone; say so explicitly
const asPhone = () => vi.stubGlobal("matchMedia", () => ({ matches: false }));

const area = { name: "Tempelhof-Schöneberg", bzr_name: "Tempelhof" };
const verdict = (explain: () => void) => (
  <button type="button" onClick={explain}>
    What does this mean?
  </button>
);
const card = (over: Partial<Parameters<typeof AnswerCard>[0]> = {}) => (
  <AnswerCard
    open
    area={area}
    areaId="a"
    state="ready"
    verdict={verdict}
    details={<p>details</p>}
    explain={<p>explained</p>}
    onClose={() => {}}
    {...over}
  />
);
const dialog = () => document.querySelector(".answer-card") as HTMLElement;

it("shows the name, the verdict slot and the level 2 details", () => {
  render(card());
  expect((document.querySelector(".answer-card h2") as HTMLElement).textContent).toBe(
    "Tempelhof-Schöneberg",
  );
  expect(screen.getByText("What does this mean?")).toBeTruthy();
  expect(screen.getByText("details")).toBeTruthy();
});

it("puts the advice above the details when given", () => {
  render(card({ advice: <p>advice</p> }));
  expect(
    screen.getByText("advice").compareDocumentPosition(screen.getByText("details")) &
      Node.DOCUMENT_POSITION_FOLLOWING,
  ).toBeTruthy();
});

it("no-data keeps the verdict; empty and error replace it", () => {
  const { rerender } = render(card({ state: "no-data" }));
  expect(screen.getByText("What does this mean?")).toBeTruthy();
  rerender(card({ state: "empty" }));
  expect(screen.getByText("Nothing to show yet")).toBeTruthy();
  expect(screen.queryByText("What does this mean?")).toBeNull();
  rerender(card({ state: "error" }));
  expect(screen.getByText("Could not load this area")).toBeTruthy();
  expect(screen.queryByText("details")).toBeNull();
});

it("opens the explain sheet, focuses its Close, and Esc closes it and returns focus without closing the card", () => {
  const onClose = vi.fn();
  render(card({ onClose }));
  const trigger = screen.getByText("What does this mean?");
  trigger.focus();
  fireEvent.click(trigger);
  const sheet = screen.getByRole("dialog", { name: "What this rating means" });
  expect(sheet.hasAttribute("data-open")).toBe(true);
  expect(document.activeElement).toBe(
    screen.getByLabelText("Close", { selector: ".explain-sheet button" }),
  );
  fireEvent.keyDown(sheet, { key: "Escape" });
  expect(sheet.hasAttribute("data-open")).toBe(false);
  expect(document.activeElement).toBe(trigger);
  expect(onClose).not.toHaveBeenCalled();
});

it("announces the error state", () => {
  render(card({ state: "error" }));
  expect(screen.getByRole("alert").textContent).toContain("Could not load this area");
});

it("closes on the close button and on Escape", () => {
  const onClose = vi.fn();
  render(card({ onClose }));
  fireEvent.click(screen.getByLabelText("Close area details", { selector: ".answer-close" }));
  fireEvent.keyDown(dialog(), { key: "Escape" });
  expect(onClose).toHaveBeenCalledTimes(2);
});

it("takes focus when it opens", () => {
  const { rerender } = render(card({ open: false }));
  rerender(card());
  expect(document.activeElement).toBe(document.querySelector(".answer-card h2") as HTMLElement);
});

const stop = () => dialog().getAttribute("data-stop");
const dragSurface = () =>
  dialog().querySelector(stop() === "full" ? ".answer-appbar" : ".answer-body")!;

it("opens at higher; the handle steps lowered, higher, full, lowered; collapse returns to where it came from", () => {
  render(card());
  expect(stop()).toBe("higher");
  const handle = screen.getByLabelText("Change height of area details");
  fireEvent.click(handle);
  expect(stop()).toBe("full");
  fireEvent.click(
    screen.getByLabelText("Collapse area details", { selector: ".answer-appbar button" }),
  );
  expect(stop()).toBe("higher");
  fireEvent.click(handle);
  fireEvent.click(handle);
  expect(stop()).toBe("lowered");
});

it("drags like a sheet: follows the finger, settles on the nearest stop, closes below lowered", () => {
  asPhone();
  vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockReturnValue(800);
  vi.stubGlobal("innerHeight", 800); // higher = 512, so stops are 520 / 288 / 0 / 800
  const onClose = vi.fn();
  render(card({ onClose }));
  const drag = (from: number, to: number) => {
    const el = dragSurface();
    fireEvent.pointerDown(el, { clientY: from });
    fireEvent.pointerMove(el, { clientY: to });
    const live = (dialog() as HTMLElement).style.transform;
    fireEvent.pointerUp(el, { clientY: to });
    return live;
  };
  expect(drag(500, 300)).toBe("translateY(88px)"); // from higher (288) up 200
  expect(stop()).toBe("full"); // 88 is nearest 0
  expect((dialog() as HTMLElement).style.transform).toBe("");
  expect(drag(100, 450)).toBe("translateY(350px)"); // from full down 350: nearest higher (288)
  expect(stop()).toBe("higher");
  drag(100, 330); // from higher down 230: 518, nearest lowered (520)
  expect(stop()).toBe("lowered");
  expect(onClose).not.toHaveBeenCalled();
  drag(100, 400); // from lowered down 300: past it, closed
  expect(onClose).toHaveBeenCalledTimes(1);
});

it("a new area uncollapses the desktop panel and takes focus", () => {
  const { rerender } = render(card());
  fireEvent.click(screen.getByLabelText("Collapse area details", { selector: ".answer-tab" }));
  rerender(card({ area: { name: "Mitte", bzr_name: "Mitte" }, areaId: "b" }));
  expect(dialog().hasAttribute("data-collapsed")).toBe(false);
  expect(document.activeElement).toBe(document.querySelector(".answer-card h2") as HTMLElement);
});

it("two areas with the same name still uncollapse the panel, told apart by id", () => {
  const same = { name: "Schloßstraße", bzr_name: "Steglitz" };
  const { rerender } = render(card({ area: same, areaId: "a" }));
  fireEvent.click(screen.getByLabelText("Collapse area details", { selector: ".answer-tab" }));
  rerender(card({ area: { ...same, bzr_name: "Zehlendorf" }, areaId: "b" }));
  expect(dialog().hasAttribute("data-collapsed")).toBe(false);
});

it("a held finger carries no velocity: releasing after a pause settles where it is", () => {
  asPhone();
  vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockReturnValue(800);
  vi.stubGlobal("innerHeight", 800);
  vi.spyOn(performance, "now").mockReturnValueOnce(0).mockReturnValueOnce(20).mockReturnValue(1000); // fast move, then a long hold
  render(card());
  const el = dragSurface();
  fireEvent.pointerDown(el, { clientY: 100 });
  fireEvent.pointerMove(el, { clientY: 110 });
  fireEvent.pointerMove(el, { clientY: 200 });
  fireEvent.pointerUp(el, { clientY: 200 });
  expect(stop()).toBe("higher"); // 288 + 100 = 388 is nearest higher; the stale 4.5px/ms would have flicked it shut
});

it("does not drag from 600px up", () => {
  vi.stubGlobal("matchMedia", () => ({ matches: true }));
  vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockReturnValue(800);
  const onClose = vi.fn();
  render(card({ onClose }));
  const el = dragSurface();
  fireEvent.pointerDown(el, { clientY: 100 });
  fireEvent.pointerMove(el, { clientY: 700 });
  fireEvent.pointerUp(el, { clientY: 700 });
  expect((dialog() as HTMLElement).style.transform).toBe("");
  expect(onClose).not.toHaveBeenCalled();
  expect(stop()).toBe("higher");
});

it("lowers the phone sheet when the signal changes", () => {
  const { rerender } = render(card({ lowerSignal: 0 }));
  rerender(card({ lowerSignal: 1 }));
  expect(stop()).toBe("lowered");
});

it("desktop edge tab collapses the panel and brings it back", () => {
  render(card());
  fireEvent.click(screen.getByLabelText("Collapse area details", { selector: ".answer-tab" }));
  expect(dialog().hasAttribute("data-collapsed")).toBe(true);
  fireEvent.click(screen.getByLabelText("Show area details"));
  expect(dialog().hasAttribute("data-collapsed")).toBe(false);
});

it("replaces the content when the area changes without closing", () => {
  const { rerender } = render(card());
  rerender(card({ area: { name: "Mitte", bzr_name: "Mitte" }, areaId: "b" }));
  expect((document.querySelector(".answer-card h2") as HTMLElement).textContent).toBe("Mitte");
  expect(dialog().hasAttribute("data-open")).toBe(true);
});

it("a viewport shorter than the sheet keeps the stops in order", () => {
  vi.stubGlobal("innerHeight", 280);
  expect(higherPx()).toBe(280);
});

it("scrolling the content on a phone opens the sheet to full screen first", () => {
  asPhone();
  render(card());
  fireEvent.wheel(dialog(), { deltaY: 40 });
  expect(stop()).toBe("full");
});

it("scrolling does not move the side panel", () => {
  vi.stubGlobal("matchMedia", () => ({ matches: true }));
  render(card());
  fireEvent.wheel(dialog(), { deltaY: 40 });
  expect(stop()).toBe("higher");
});

it("pulling down on the content at full screen brings the sheet back down; scrolling up does not", () => {
  asPhone();
  vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockReturnValue(800);
  vi.stubGlobal("innerHeight", 800);
  render(card());
  fireEvent.wheel(dialog(), { deltaY: 40 });
  expect(stop()).toBe("full");
  const touch = (type: "touchStart" | "touchMove" | "touchEnd", y: number) =>
    fireEvent[type](dialog().querySelector(".answer-body")!, {
      touches: type === "touchEnd" ? [] : [{ clientY: y }],
      changedTouches: [{ clientY: y }],
    });
  touch("touchStart", 300);
  touch("touchMove", 280); // up: left to the browser
  touch("touchEnd", 280);
  expect(stop()).toBe("full");
  touch("touchStart", 300);
  touch("touchMove", 310);
  touch("touchMove", 600);
  touch("touchEnd", 600); // down 300 from full: nearest higher
  expect(stop()).toBe("higher");
});
