import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { AnswerCard, type CardState } from "./AnswerCard.tsx";

const area = { name: "Tempelhof-Schöneberg", bzr_name: "Tempelhof" };
const blocks = { risk: "r", advice: "a", source: "s" };
const card = (over: Partial<Parameters<typeof AnswerCard>[0]> = {}) => <AnswerCard open area={area} state="ready" tier="high" blocks={blocks} onClose={() => {}} {...over} />;
const dialog = () => screen.getByRole("dialog", { hidden: true });

it("shows the name, tier chip and the three titled blocks", () => {
  render(card());
  expect(screen.getByRole("heading", { level: 2 }).textContent).toBe("Tempelhof-Schöneberg");
  expect(screen.getByText("High risk")).toBeTruthy();
  expect(screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent)).toEqual(["Risk assessment", "Lock advice", "Where the information comes from"]);
});

it.each<[CardState, string]>([["empty", "Nothing to show yet"], ["no-data", "Not enough data"], ["error", "Could not load this area"]])("%s state replaces the blocks and hides the chip", (state, title) => {
  render(card({ state }));
  expect(screen.getByText(title)).toBeTruthy();
  expect(screen.queryByText("High risk")).toBeNull();
  expect(screen.queryByText("Lock advice")).toBeNull();
});

it("closes on the close button and on Escape", () => {
  const onClose = vi.fn();
  render(card({ onClose }));
  fireEvent.click(screen.getAllByLabelText("Close area details")[1]);
  fireEvent.keyDown(dialog(), { key: "Escape" });
  expect(onClose).toHaveBeenCalledTimes(2);
});

it("takes focus when it opens", () => {
  const { rerender } = render(card({ open: false }));
  rerender(card());
  expect(document.activeElement).toBe(screen.getByRole("heading", { level: 2, hidden: true }));
});

const stop = () => dialog().getAttribute("data-stop");

it("opens at higher; the handle steps lowered, higher, full, lowered; collapse returns to where it came from", () => {
  render(card());
  expect(stop()).toBe("higher");
  const handle = screen.getByLabelText("Change height of area details");
  fireEvent.click(handle);
  expect(stop()).toBe("full");
  fireEvent.click(screen.getByLabelText("Collapse area details", { selector: ".answer-appbar button" }));
  expect(stop()).toBe("higher");
  fireEvent.click(handle);
  fireEvent.click(handle);
  expect(stop()).toBe("lowered");
});

it("drags like a sheet: follows the finger, settles on the nearest stop, closes below lowered", () => {
  Object.defineProperty(HTMLElement.prototype, "offsetHeight", { configurable: true, value: 800 });
  Object.defineProperty(window, "innerHeight", { configurable: true, value: 800 }); // higher = 512, so stops are 520 / 288 / 0 / 800
  const onClose = vi.fn();
  render(card({ onClose }));
  const drag = (from: number, to: number) => {
    const el = dialog().querySelector(".answer-drag")!;
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
  rerender(card({ area: { name: "Mitte", bzr_name: "Mitte" } }));
  expect(screen.getByRole("heading", { level: 2 }).textContent).toBe("Mitte");
  expect(dialog().hasAttribute("data-open")).toBe(true);
});
