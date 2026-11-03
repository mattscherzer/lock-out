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
  fireEvent.click(screen.getByLabelText("Close"));
  fireEvent.keyDown(dialog(), { key: "Escape" });
  expect(onClose).toHaveBeenCalledTimes(2);
});

it("takes focus when it opens", () => {
  const { rerender } = render(card({ open: false }));
  rerender(card());
  expect(document.activeElement).toBe(dialog());
});

it("drags like a sheet: follows the finger, settles on peek, expanded or closed", () => {
  Object.defineProperty(HTMLElement.prototype, "offsetHeight", { configurable: true, value: 640 }); // peek is at 440
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
  expect(drag(500, 200)).toBe("translateY(140px)"); // live: 440 - 300
  expect(dialog().hasAttribute("data-expanded")).toBe(true);
  expect((dialog() as HTMLElement).style.transform).toBe("");
  expect(drag(100, 500)).toBe("translateY(400px)"); // 0 + 400
  expect(dialog().hasAttribute("data-expanded")).toBe(false);
  drag(100, 130); // a small nudge snaps back to peek
  expect(onClose).not.toHaveBeenCalled();
  drag(100, 400); // pulled below peek
  expect(onClose).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByLabelText("Expand details"));
  expect(dialog().hasAttribute("data-expanded")).toBe(true);
});

it("replaces the content when the area changes without closing", () => {
  const { rerender } = render(card());
  rerender(card({ area: { name: "Mitte", bzr_name: "Mitte" } }));
  expect(screen.getByRole("heading", { level: 2 }).textContent).toBe("Mitte");
  expect(dialog().hasAttribute("data-open")).toBe(true);
});
