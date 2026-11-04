import { describe, expect, it } from "vitest";
import { STRINGS } from "../strings.ts";
import { type Advice, type BikeValue, type Confidence, CATALOG, adviceFor } from "./advice.ts";

const BIKE_VALUES: BikeValue[] = ["under_eur_1000", "eur_1000_or_more"];
const CONFIDENCES: (Confidence | null)[] = ["LOW", "MEDIUM", "HIGH", null];
// the generated output: the advice for every input the router can get
const ALL = BIKE_VALUES.flatMap((b) =>
  CONFIDENCES.map((c) => ({ input: `${b}, ${c}`, advice: adviceFor(b, c) })),
);
// every piece of text a rider can see for one advice, one item per line of copy
const texts = (a: Advice) => [
  a.headline,
  ...a.steps,
  ...a.tips,
  ...(a.note ? [a.note] : []),
  ...a.terms.map((t) => `${t.term}: ${t.meaning}`),
];

describe("the four advice rules hold for every input", () => {
  it.each(ALL)("no frame or cable lock alone ($input)", ({ advice }) => {
    expect(advice.steps).toContain(STRINGS.advice.step.anchor);
    expect(advice.steps).toContain(STRINGS.advice.step.solidLock);
    for (const line of texts(advice).filter((l) => /frame lock|cable lock/i.test(l)))
      expect(line).toMatch(/never enough on its own/i);
  });

  it.each(ALL)("no Sold Secure and no brand names ($input)", ({ advice }) => {
    const all = texts(advice).join("\n");
    expect(all).not.toMatch(/sold\s*secure/i);
    expect(all).not.toMatch(
      /\b(abus|kryptonite|onguard|hiplok|litelok|trelock|master ?lock|knog|kovix|seatylock|altor|foldylock|squire|pragmasis)\b/i,
    );
    expect(all).not.toMatch(/\bAXA\b/);
  });

  it.each(ALL)("no relocation advice ($input)", ({ advice }) => {
    expect(texts(advice).join("\n")).not.toMatch(
      /elsewhere|somewhere else|another (area|place|street|spot)|avoid (this|the|parking)|move (your bike|to)|overnight|well-lit|busy|park (here|there|in)/i,
    );
  });

  it.each(ALL)("nothing reassures and nothing claims a per-bike risk ($input)", ({ advice }) => {
    const all = texts(advice).join("\n");
    expect(all).not.toMatch(
      /\b(safe|safer|safely|low risk|lower risk|normal|no need|unlikely|relax|worry|fine)\b/i,
    );
    expect(all).not.toMatch(
      /your bike (is|will be)|chance (of|that)|likely to be stolen|% (risk|chance)/i,
    );
  });
});

describe("thin data never reassures", () => {
  it.each(BIKE_VALUES)(
    "low or missing confidence gets the limited-data line and the full advice (%s)",
    (b) => {
      const strong = adviceFor(b, "HIGH");
      for (const thin of [adviceFor(b, "LOW"), adviceFor(b, null)]) {
        expect(thin.note).toBe(STRINGS.advice.limitedData);
        expect(thin.steps).toEqual(strong.steps); // never lighter than for a well-backed area
      }
      expect(adviceFor(b, "MEDIUM").note).toBeNull();
      expect(strong.note).toBeNull();
    },
  );
});

describe("the router", () => {
  it("picks one lock under EUR 1,000 and two locks of different types from EUR 1,000", () => {
    expect(adviceFor("under_eur_1000", "HIGH").level).toBe("oneLock");
    const high = adviceFor("eur_1000_or_more", "HIGH");
    expect(high.level).toBe("twoLocks");
    expect(high.steps).toContain(STRINGS.advice.step.secondLock);
  });

  it("never gives a higher bike value less than a lower one", () => {
    for (const step of CATALOG.oneLock.steps) expect(CATALOG.twoLocks.steps).toContain(step);
    for (const source of CATALOG.oneLock.sources)
      expect(CATALOG.twoLocks.sources).toContain(source);
  });

  it.each(ALL)(
    "gives everyone the battery advice: general text, not an e-bike filter ($input)",
    ({ advice }) => {
      expect(advice.tips).toContain(STRINGS.advice.tip.battery);
    },
  );

  it.each(ALL)("explains exactly the lock terms its copy uses ($input)", ({ advice }) => {
    const copy = [advice.headline, ...advice.steps, ...advice.tips].join(" ").toLowerCase();
    const used = Object.values(STRINGS.advice.term)
      .map(([term]) => term)
      .filter((term) => copy.includes(term.toLowerCase()));
    expect(advice.terms.map((t) => t.term).sort()).toEqual(used.sort());
  });

  it.each(ALL)("names a source with a link for its advice ($input)", ({ advice }) => {
    expect(advice.sources.length).toBeGreaterThan(0);
    for (const s of advice.sources) expect(s.url).toMatch(/^https:\/\//);
  });
});
