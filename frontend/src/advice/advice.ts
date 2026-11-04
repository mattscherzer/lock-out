// Lock advice catalog and router (issue #58, scope M6 and M7). The copy lives in the string table; this file only
// says which pieces each lock level uses. The router reads the bike value band and the area's confidence, never the
// area's tier: the advice is the same strong standard everywhere, so a Low area never reads as "lock less".
import { STRINGS } from "../strings.ts";

const A = STRINGS.advice;

export type BikeValue = "under_eur_1000" | "eur_1000_or_more"; // the bike_value levels in the lookup (D-07)
export type Confidence = "LOW" | "MEDIUM" | "HIGH"; // the confidence label in the lookup (M6)
export type Level = "oneLock" | "twoLocks";

type Step = keyof typeof A.step;
type Tip = keyof typeof A.tip;
type Term = keyof typeof A.term;
type Source = keyof typeof A.source;

const URL: Record<Source, string> = {
  polizeiBerlin:
    "https://www.berlin.de/polizei/aufgaben/praevention/diebstahl-und-einbruch/artikel.228483.php",
  propk:
    "https://www.polizei-beratung.de/aktuelles/detailansicht/sichere-fahrradschloesser-finden/",
  adfcTypes: "https://www.adfc.de/artikel/fahrradschloss-typen",
  adfcPrevent: "https://www.adfc.de/artikel/fahrraddiebstahl-vorbeugen",
  vds: "https://shop.vds.de/publikation/vds-2597",
};

const BASE_STEPS: Step[] = ["anchor", "solidLock", "tested", "position", "neverAlone"];
// every level also gets the general tips: battery advice is text for everyone, not an e-bike filter (D-07)
const TIPS: Tip[] = ["budget", "battery", "parts"];
const TERMS: Term[] = [
  "uLock",
  "chainLock",
  "foldingLock",
  "frameLock",
  "cableLock",
  "vds",
  "discDetainer",
  "securityNuts",
];

// Two lock levels. twoLocks keeps every step of oneLock and adds to it, so a higher bike value never gets less.
export const CATALOG: Record<Level, { steps: Step[]; sources: Source[] }> = {
  oneLock: { steps: BASE_STEPS, sources: ["polizeiBerlin", "propk", "adfcTypes", "vds"] },
  twoLocks: {
    steps: [...BASE_STEPS, "secondLock", "threeMinutes", "higherClass"],
    sources: ["polizeiBerlin", "propk", "adfcTypes", "adfcPrevent", "vds"],
  },
};

export type Advice = {
  level: Level;
  headline: string;
  steps: string[];
  tips: string[];
  note: string | null; // the limited-data line when the area's data is thin
  terms: { term: string; meaning: string }[];
  sources: { label: string; url: string }[];
};

export function adviceFor(bikeValue: BikeValue, confidence: Confidence | null): Advice {
  const level: Level = bikeValue === "eur_1000_or_more" ? "twoLocks" : "oneLock";
  const entry = CATALOG[level];
  return {
    level,
    headline: A.headline[level],
    steps: entry.steps.map((s) => A.step[s]),
    tips: TIPS.map((t) => A.tip[t]),
    // no confidence counts as thin data: the advice never reassures where the data cannot back it
    note: confidence === "MEDIUM" || confidence === "HIGH" ? null : A.limitedData,
    terms: TERMS.map((t) => ({ term: A.term[t][0], meaning: A.term[t][1] })),
    sources: entry.sources.map((s) => ({ label: A.source[s], url: URL[s] })),
  };
}
