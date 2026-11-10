import { describe, expect, it } from "vitest";
import { STRINGS } from "../strings.ts";
import { type Advice, type DataFlags, CATALOG, adviceFor } from "./advice.ts";

const A = STRINGS.advice;
// the two levels in the lookup, no choice yet, and a value the lookup should never hold
const BIKE_VALUES = ["under_eur_1000", "eur_1000_or_more", "not_a_level"];
const FLAGS: DataFlags[] = [
  { limited_data: false, no_record: false },
  { limited_data: true, no_record: false },
  { limited_data: true, no_record: true },
  { limited_data: false, no_record: true },
];
const WELL_BACKED = FLAGS[0];
// the generated output: the advice for every input the router can get
const ALL = BIKE_VALUES.flatMap((b) =>
  FLAGS.map((f) => ({ input: `${b}, ${JSON.stringify(f)}`, advice: adviceFor(b, f) })),
);
// every piece of text a rider can see for one advice, one item per line of copy
const texts = (a: Advice) => [
  a.headline,
  a.banner,
  a.why,
  ...(a.hint ? [a.hint] : []),
  ...a.keys.map((k) => k.text),
  ...(a.note ? [a.note] : []),
  ...a.steps,
  ...a.tips,
  ...a.terms.map((t) => `${t.term}: ${t.meaning}`),
  a.sourcesLabel,
];

// the four advice rules as patterns, so each can be shown to fail on a known-bad line
const FRAME_OR_CABLE = /frame lock|cable lock/i;
const NEVER_ALONE = /never enough on its own/i;
const SOLD_SECURE = /sold\s*secure/i;
const BRANDS =
  /\b(abus|kryptonite|onguard|hiplok|litelok|trelock|master ?lock|knog|kovix|seatylock|altor|foldylock|squire|pragmasis)\b/i;
const AXA = /\bAXA\b/;
const RELOCATION =
  /elsewhere|somewhere else|another (area|place|street|spot)|avoid (this|the|parking)|move (your bike|to)|overnight|well-lit|busy|park (here|there|in)/i;
const REASSURANCE =
  /\b(safe|safer|safely|low risk|lower risk|normal|no need|unlikely|relax|worry|fine)\b/i;
const PER_BIKE_RISK =
  /your bike (is|will be)|chance (of|that)|likely to be stolen|% (risk|chance)/i;

describe("the rule patterns catch a known-bad line (negative controls)", () => {
  it.each([
    ["a frame lock with no warning", FRAME_OR_CABLE, "A frame lock will do here."],
    ["the warning", NEVER_ALONE, "A cable lock is never enough on its own."],
    ["Sold Secure", SOLD_SECURE, "Look for Sold Secure Gold."],
    ["a brand", BRANDS, "Buy a Kryptonite lock."],
    ["AXA", AXA, "An AXA frame lock is fine."],
    ["relocation", RELOCATION, "Park somewhere else at night."],
    ["reassurance", REASSURANCE, "This area is safe."],
    ["a per-bike risk", PER_BIKE_RISK, "Your bike is likely to be stolen."],
  ])("%s", (_, pattern, bad) => {
    expect(bad).toMatch(pattern);
  });
});

describe("the four advice rules hold for every input", () => {
  it.each(ALL)("no frame or cable lock alone ($input)", ({ advice }) => {
    expect(advice.steps).toContain(A.step.anchor);
    expect(advice.steps).toContain(A.step.solidLock);
    for (const line of texts(advice).filter((l) => FRAME_OR_CABLE.test(l)))
      expect(line).toMatch(NEVER_ALONE);
  });

  it.each(ALL)("no Sold Secure and no brand names ($input)", ({ advice }) => {
    const all = texts(advice).join("\n");
    expect(all).not.toMatch(SOLD_SECURE);
    expect(all).not.toMatch(BRANDS);
    expect(all).not.toMatch(AXA);
  });

  it.each(ALL)("no relocation advice ($input)", ({ advice }) => {
    expect(texts(advice).join("\n")).not.toMatch(RELOCATION);
  });

  it.each(ALL)("nothing reassures and nothing claims a per-bike risk ($input)", ({ advice }) => {
    const all = texts(advice).join("\n");
    expect(all).not.toMatch(REASSURANCE);
    expect(all).not.toMatch(PER_BIKE_RISK);
  });
});

describe("the glance and panel copy follows the same rules", () => {
  const copy = [A.note.failed, A.sectionTitle, A.bikeCaption, ...Object.values(A.panel)];

  it("has no relocation advice, no reassurance and no per-bike risk", () => {
    const all = copy.join("\n");
    expect(all).not.toMatch(RELOCATION);
    expect(all).not.toMatch(REASSURANCE);
    expect(all).not.toMatch(PER_BIKE_RISK);
    expect(all).not.toMatch(BRANDS);
  });
});

describe("thin data never reassures", () => {
  it.each(BIKE_VALUES)("limited data gets its note and the full advice (%s)", (b) => {
    const thin = adviceFor(b, { limited_data: true, no_record: false });
    expect(thin.note).toBe(A.note.limitedData);
    expect(thin.steps).toEqual(adviceFor(b, WELL_BACKED).steps); // never lighter than for a well-backed area
  });

  it.each(BIKE_VALUES)("no record gets its own note, never the few-thefts one (%s)", (b) => {
    for (const limited_data of [true, false]) {
      const none = adviceFor(b, { limited_data, no_record: true });
      expect(none.note).toBe(A.note.noRecord);
      expect(none.steps).toEqual(adviceFor(b, WELL_BACKED).steps);
    }
  });

  it.each(BIKE_VALUES)("a well-backed area gets no note (%s)", (b) => {
    expect(adviceFor(b, WELL_BACKED).note).toBeNull();
  });
});

describe("the router", () => {
  it("gives one lock under EUR 1,000 and two locks of different types from EUR 1,000", () => {
    expect(adviceFor("under_eur_1000", WELL_BACKED).level).toBe("oneLock");
    const high = adviceFor("eur_1000_or_more", WELL_BACKED);
    expect(high.level).toBe("twoLocks");
    expect(high.steps).toContain(A.step.secondLock);
  });

  it("points a one-lock rider to a second lock, with the same ADFC claim as the second-lock step", () => {
    const hint = adviceFor("under_eur_1000", WELL_BACKED).hint;
    expect(hint).toBe(A.secondLockHint);
    expect(hint).toMatch(/ADFC/);
    expect(hint).toContain(A.step.secondLock.replace("The ADFC advises ", ""));
    expect(adviceFor("eur_1000_or_more", WELL_BACKED).hint).toBeNull();
  });

  it("does not follow the toggle's default: the level comes from the bike value alone", () => {
    expect(adviceFor("under_eur_1000", WELL_BACKED).level).toBe("oneLock");
    expect(adviceFor("eur_1000_or_more", WELL_BACKED).level).toBe("twoLocks");
  });

  it.each(["not_a_level", "", "EUR_1000_OR_MORE", "under_eur_1000 "])(
    "gives two locks for a value that is not a known level (%j), never the lighter advice",
    (b) => {
      expect(adviceFor(b, WELL_BACKED).level).toBe("twoLocks");
    },
  );

  it("never gives a higher bike value less than a lower one", () => {
    for (const step of CATALOG.oneLock.steps) expect(CATALOG.twoLocks.steps).toContain(step);
  });

  it.each(ALL)(
    "gives everyone the battery advice: general text, not an e-bike filter ($input)",
    ({ advice }) => {
      expect(advice.tips).toContain(A.tip.battery);
    },
  );

  it.each(ALL)("explains exactly the lock terms its copy uses ($input)", ({ advice }) => {
    const copy = [
      advice.headline,
      advice.banner,
      advice.why,
      ...(advice.hint ? [advice.hint] : []),
      ...advice.keys.map((k) => k.text),
      ...advice.steps,
      ...advice.tips,
    ]
      .join(" ")
      .toLowerCase();
    const used = Object.values(A.term)
      .map(([term]) => term)
      .filter((term) => copy.includes(term.toLowerCase()));
    expect(advice.terms.map((t) => t.term).sort()).toEqual(used.sort());
  });
});

describe("sources", () => {
  const listed = adviceFor("under_eur_1000", WELL_BACKED).sources;

  it.each(ALL)("shows the same full list under a neutral label ($input)", ({ advice }) => {
    expect(advice.sourcesLabel).toBe(A.sourcesLabel);
    expect(advice.sources).toEqual(listed);
  });

  it("lists every source in the string table once, each with a link", () => {
    expect(listed.map((s) => s.label).sort()).toEqual(Object.values(A.source).sort());
    for (const s of listed) expect(s.url).toMatch(/^https:\/\//);
  });

  it("names the organisation behind each sourced claim in the same sentence", () => {
    // claims specific to one organisation (lock-tier doc section 3) carry its name
    expect(A.step.tested).toMatch(/ProPK.*VdS class A\+.*ADFC.*1 kg/);
    expect(A.step.secondLock).toMatch(/ADFC/);
    expect(A.step.threeMinutes).toMatch(/ADFC/);
    expect(A.step.higherClass).toMatch(/ProPK/);
    expect(A.tip.budget).toMatch(/ProPK/);
    expect(A.tip.battery).toMatch(/ProPK/);
  });
});
