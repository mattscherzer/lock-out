// Lock advice catalog and router (issue #58, scope M6 and M7). The copy lives in the string table; this file only
// says which pieces each lock level uses. The router reads the bike value band and the area's thin-data flags, never
// the area's tier: the advice is the same strong standard everywhere, so a Low area never reads as "lock less".
import { STRINGS } from "../strings.ts";

const A = STRINGS.advice;

export type BikeValue = "under_eur_1000" | "eur_1000_or_more"; // the bike_value levels in the lookup (D-07)
export type DataFlags = { limited_data: boolean; no_record: boolean }; // required on every area in the lookup (M6)
export type Level = "oneLock" | "twoLocks";

type Step = keyof typeof A.step;
type Tip = keyof typeof A.tip;
type Term = keyof typeof A.term;
type Source = keyof typeof A.source;

const SOURCE_URLS: Record<Source, string> = {
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
// one flat list, shown for every level
const SOURCES = Object.keys(SOURCE_URLS) as Source[];

// Two lock levels. twoLocks keeps every step of oneLock and adds to it, so a higher bike value never gets less.
export const CATALOG: Record<Level, { steps: Step[] }> = {
  oneLock: { steps: BASE_STEPS },
  twoLocks: { steps: [...BASE_STEPS, "secondLock", "threeMinutes", "higherClass"] },
};

export type Advice = {
  level: Level;
  headline: string;
  note: string | null; // the thin-data line, shown on top of the full advice
  steps: string[];
  hint: string | null; // the second-lock line when no bike value is chosen
  tips: string[];
  terms: { term: string; meaning: string }[];
  sourcesLabel: string;
  sources: { label: string; url: string }[];
};

// bikeValue is typed loosely on purpose: a value from the JSON that is not a known level gets two locks, never one
export function adviceFor(bikeValue: string | null, data: DataFlags): Advice {
  const level: Level =
    bikeValue === null || bikeValue === "under_eur_1000" ? "oneLock" : "twoLocks";
  return {
    level,
    headline: A.headline[level],
    note: data.no_record ? A.note.noRecord : data.limited_data ? A.note.limitedData : null,
    steps: CATALOG[level].steps.map((s) => A.step[s]),
    hint: bikeValue === null ? A.noBikeValue : null,
    tips: TIPS.map((t) => A.tip[t]),
    terms: TERMS.map((t) => ({ term: A.term[t][0], meaning: A.term[t][1] })),
    sourcesLabel: A.sourcesLabel,
    sources: SOURCES.map((s) => ({ label: A.source[s], url: SOURCE_URLS[s] })),
  };
}
