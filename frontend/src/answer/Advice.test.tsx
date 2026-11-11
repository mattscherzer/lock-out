import { fireEvent, render, screen, within } from "@testing-library/react";
import { expect, it } from "vitest";
import { adviceFor, CATALOG, DEFAULT_BIKE_VALUE } from "../advice/advice.ts";
import { STRINGS } from "../strings.ts";
import { AreaAnswer } from "./AreaAnswer.tsx";
import { attribution, bands, metadata, rec, selectors } from "../domain/testData.ts";

const A = STRINGS.advice;
const answer = (over = {}, areaId = "1") => (
  <AreaAnswer
    record={rec(over)}
    areaId={areaId}
    lookup={{ risk_bands: bands, metadata: { ...metadata, attribution }, selectors, areas: {} }}
    open
    onClose={() => {}}
    onAbout={() => {}}
  />
);
const show = (over = {}) => render(answer(over));
const glance = () => screen.getByRole("region", { name: A.sectionTitle });
const advicePanel = () => screen.getByRole("dialog", { name: A.sectionTitle });
const allSteps = (level: keyof typeof CATALOG) =>
  screen.getByRole("button", { name: A.allSteps(CATALOG[level].steps.length) });
const bike = (value: keyof typeof A.bikeValue) =>
  screen.getByLabelText(A.bikeValue[value]) as HTMLInputElement;
const WELL_BACKED = { limited_data: false, no_record: false };

it("starts with under EUR 1,000 chosen, so it shows one lock", () => {
  show();
  expect(bike("under_eur_1000").checked).toBe(true);
  expect(DEFAULT_BIKE_VALUE).toBe("under_eur_1000");
  expect(glance().textContent).toContain(A.banner.oneLock);
  expect(glance().textContent).toContain(A.why.oneLock);
});

it("points a one-lock rider to a second lock in the panel, not on the glance", () => {
  show();
  expect(glance().textContent).not.toContain(A.secondLockHint);
  fireEvent.click(allSteps("oneLock"));
  expect(advicePanel().textContent).toContain(A.secondLockHint);
});

it("switches to two locks for a bike worth EUR 1,000 or more", () => {
  show();
  fireEvent.click(bike("eur_1000_or_more"));
  const text = glance().textContent;
  expect(text).toContain(A.banner.twoLocks);
  expect(text).toContain(A.why.twoLocks);
  expect(text).toContain(A.key.secondLock);
  expect(text).toContain(A.key.neverAlone);
  expect(text).not.toContain(A.banner.oneLock);
});

it("keeps the bike value when another area is picked", () => {
  const { rerender } = show();
  fireEvent.click(bike("eur_1000_or_more"));
  rerender(answer({}, "2"));
  expect(bike("eur_1000_or_more").checked).toBe(true);
  expect(glance().textContent).toContain(A.banner.twoLocks);
});

it("puts the advice above the details", () => {
  show();
  const order = glance().compareDocumentPosition(screen.getByText("When bikes were last seen"));
  expect(order & Node.DOCUMENT_POSITION_FOLLOWING).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
});

it.each([
  ["thin data", { limited_data: true, confidence: "LOW" }, A.note.limitedData],
  [
    "no record",
    { no_record: true, limited_data: true, confidence: "LOW", reports_12m: 0 },
    A.note.noRecord,
  ],
])(
  "%s: the note and the full advice are on the glance, the note is in the panel",
  (_, over, note) => {
    show(over);
    expect(glance().textContent).toContain(note);
    expect(glance().textContent).toContain(A.banner.oneLock);
    fireEvent.click(allSteps("oneLock"));
    expect(advicePanel().textContent).toContain(note);
  },
);

it("names the step count of the chosen level on the button", () => {
  show();
  expect(allSteps("oneLock").textContent).toBe(A.allSteps(CATALOG.oneLock.steps.length));
  fireEvent.click(bike("eur_1000_or_more"));
  expect(allSteps("twoLocks").textContent).toBe(A.allSteps(CATALOG.twoLocks.steps.length));
});

it("opens every step of the level in the second panel", () => {
  show();
  fireEvent.click(allSteps("oneLock"));
  const steps = within(advicePanel()).getAllByRole("listitem", {});
  const text = advicePanel().textContent;
  for (const step of adviceFor(DEFAULT_BIKE_VALUE, WELL_BACKED).steps) expect(text).toContain(step);
  expect(steps.length).toBeGreaterThanOrEqual(CATALOG.oneLock.steps.length);
});

it("explains how the advice was made and lists the lock words in an expandable", () => {
  show();
  fireEvent.click(allSteps("oneLock"));
  expect(advicePanel().textContent).toContain(A.panel.madeText);
  const words = within(advicePanel()).getByText(A.panel.terms).closest("details");
  expect(words?.hasAttribute("open")).toBe(false);
  expect(words?.querySelectorAll("dt")).toHaveLength(Object.keys(A.term).length);
});

it("links every source of the advice", () => {
  show();
  fireEvent.click(allSteps("oneLock"));
  const hrefs = within(advicePanel())
    .getAllByRole("link")
    .map((a) => a.getAttribute("href"));
  expect(hrefs).toEqual(adviceFor(DEFAULT_BIKE_VALUE, WELL_BACKED).sources.map((s) => s.url));
});

it("switches the second panel to the rating explanation and back", () => {
  show();
  fireEvent.click(allSteps("oneLock"));
  fireEvent.click(screen.getByRole("button", { name: "What does this mean?" }));
  const rating = screen.getByRole("dialog", { name: "What this rating means" });
  expect(rating.textContent).not.toContain(A.panel.madeText);
  fireEvent.click(allSteps("oneLock"));
  expect(advicePanel().textContent).toContain(A.panel.madeText);
});

it("returns focus to the button that opened the panel last", () => {
  show();
  const first = allSteps("oneLock");
  first.focus();
  fireEvent.click(first);
  const second = screen.getByRole("button", { name: "What does this mean?" });
  second.focus();
  fireEvent.click(second);
  fireEvent.click(
    within(screen.getByRole("dialog", { name: "What this rating means" })).getByRole("button", {
      name: "Close",
    }),
  );
  expect(document.activeElement).toBe(second);
});

it("still gives the standard advice, with its note, when the area could not be read", () => {
  show({ confidence: undefined });
  expect(screen.getByText("Could not load this area")).toBeDefined();
  expect(glance().textContent).toContain(A.note.failed);
  expect(glance().textContent).toContain(A.banner.oneLock);
  fireEvent.click(allSteps("oneLock"));
  expect(advicePanel().textContent).toContain(A.note.failed);
});
