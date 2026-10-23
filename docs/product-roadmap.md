# LockOut: Product Review and 4-Week Roadmap

Prepared 2026-10-21 from a review of every doc in `docs/`, `README.md`, `src/`, `.github/`, `data/`, `demo/`, plus a re-run of the audit script on the local CSV. Numbers marked **(measured)** come from that run, not from the docs.

**Assumptions to confirm:** the pitch is the end of Week 4 (Sun 2026-11-22); Day 0 is 2026-10-21 to 10-25; weeks start Monday 10-26. Change dates if the pitch is earlier.

---

## 0. Ground truth: what is built vs. what the docs claim

| Component | Docs say | Repo reality | Status |
| --- | --- | --- | --- |
| Police CSV fetch + stale fallback | Built | `src/fetch_police_csv.py`: >1 MB check, 21-day max fallback age, fails loudly. Works. | **Done** |
| Integrity audit | Built | `src/audit_police_csv.py` runs and prints, but asserts nothing, exits 0 always, filters cellar cases with a row-wide regex over every column, and picks the LOR column by first name match | **Partial, needs hardening** |
| LOR polygons | 542 | 542 features, key `plr_id`, in `data/raw/` and `demo/lor.json` | **Done** |
| Build pipeline (`build_lookup_json.py`) | Workflow step is commented out | `src/pipeline/`, `src/models/`, `tests/` contain only `.gitkeep` | **Missing** |
| Model (EB smoothing, GLM, anomaly flag) | README presents it as implemented | Nothing exists | **Missing** |
| `lookup_schema_v1.json` | Precomputed artifact | One hand-written sample area (`01100101`), 3 advice keys + 1 e-bike key, not generated | **Sketch only** |
| FastAPI (`src/api/main.py`) | README quickstart runs it | File does not exist | **Missing** |
| Frontend (`frontend/`, React + Vite + turf) | README | Empty. The real UI is `demo/index.html` (1,881 lines, React via CDN + Babel standalone + Tailwind CDN, Leaflet, 542 real polygons, **all numbers random mock**). Deployed to GitHub Pages by `pages.yaml`. | **Prototype only** |
| Weekly refresh workflow | Fetch, build, commit to `main` | Runs and shows green, but only runs fetch + audit. The commit step is a no-op. Once the build step is enabled, `git push` to `main` will be rejected: `main` has branch protection requiring 1 approving review. | **Will break when enabled** |
| Advice router + catalog | Specified in `lock-tier-documentation.md` | Not implemented. The JSON catalog still cites Sold Secure and "Standard frame + U-lock", which the lock-tier doc and E0-4 forbid. | **Missing, contradicts** |
| Tests / CI on PRs | "Tests on every model step" | `tests/` is empty; no PR-triggered CI | **Missing** |
| Discovery / ethics / design docs | n/a | Complete, but all evidence is synthetic; no rider interviewed | **Done, unvalidated** |

---

## 0.5 Scope principle: EDA before feature decisions

The demo prototype, and therefore the synthetic interviews run on it (`docs/user-research/`), was built on assumptions about the data, not on the data. Its selectors, labels and reasons are mock. Until the EDA is done, **no user-facing filter, label or advice rule is final**. Interview findings count as hypotheses to test, not requirements (the file itself rates none above Medium).

**What the EDA must settle** (output: a signed "capability table" in `docs/eda-findings.md`, Gate 1 criterion):

| Question | What we know so far (street rows, 29,212) | Open until EDA |
| --- | --- | --- |
| Bike-type filter | `ART_DES_FAHRRADS` has 13 types (Herrenfahrrad 10,598; Damenfahrrad 5,781; "Fahrrad" 5,133; Mountainbike 1,761; Lastenfahrrad 182; BMX 10). **No e-bike category.** | Which groupings are dense enough per area (types, or value bands from `SCHADENSHOEHE`: 45% of cases >= EUR 1,000, 12% >= EUR 2,500)? Do types or values differ in risk at all? |
| Hour-range filter (e.g. 8-11) | `TATZEIT_ANFANG_STUNDE` is when the owner **last saw** the bike. Start-hour share peaks at 18:00 (10.8%). Only 32% of windows are <= 3 h and 12% start and end in the same hour. | Can hourly or multi-hour ranges be allocated honestly (proportional over the window), and at what density per area? Likely citywide or district-level only for fine hours; planning-area level for coarse bands. |
| Daytypes and dayparts | Provisional: Mon-Thu / Fri / Weekend x 4 dayparts (current audit code). | Backtest 2 vs. 3 daytypes, and band boundaries from the real hour curve, not the prototype's. |
| Parking duration | Not in the data. | Confirm; if confirmed, no duration claims anywhere. |
| Lock-break share, stolen value | 89% of all rows (~94% of street rows) are "schwerer Diebstahl"; median value EUR 899. | Whether they vary enough between areas to drive advice. |
| Geographic level | Median area has ~19 street thefts per 12 months; 178 areas < 10. | Planning area, Bezirksregion, or mixed by confidence. |

**Consequences for the plan:**

- Items below that I previously marked as decided are **provisional hypotheses**: bike class = value band (D6), three daytypes (C6), Mon_Thu/Fri/Weekend labels, "whole day" option, dropping `top_factors`, solid/fair/thin wording. They stay in the plan as defaults only so the schema can be drafted; the EDA can overturn them.
- The UI selectors in M8 are built **from the capability table**, not from the prototype. The prototype is a visual and interaction reference only.
- Feature candidates raised by the interviews and held until the EDA: place search by street/station (needs a source to map streets to areas, independent of the EDA but not yet scoped), hour-range filter, finer bike-type filter, whole-day option, plain-language lock advice, source line on the card.
- The Phase 2 usability test runs on a build wired to **real data**, not on the mock prototype, so test findings are not contaminated by mock content.

---

## 1. Strategic PM Review and Scope Audit

### 1.1 Value proposition and framing check

**Verdict: the narrative is sound but is not yet visible in the product.**

| Check | Finding | Action |
| --- | --- | --- |
| Raw volume vs. activity-adjusted risk | The README explains the Volume Illusion well. The demo shows one tier from mock counts; nothing separates "busy" from "risky". The OSM signal is `[TBD]`, extraction not built. | Show two things in the answer card: *volume tier* and *"relative to what's typical for a place like this"* (only if the OSM model passes Gate 2; otherwise drop the second line and say so on the "How this works" page). |
| "Walk 15 minutes away" substitution | Discovery docs already pivot to temporal and physical mitigation. | Hard rule in copy review: no advice string suggests another location. Advice = *time shift* + *lock tier* + *anchor point*. |
| Never "safe" | Rule exists in scope docs and story H3/V9. | Make it a **unit test** on the template layer: no string with "safe/sicher" and thin data never gets calm styling. |
| Relative tiers | 60/25/15 percentile bands always produce a "High" tier even if every area improves. Technical brief flags this as open. | **Decision:** keep relative tiers, label them "higher than X% of Berlin areas at this time", and show the absolute reports/12 months next to them. Revisit only if time remains. |
| Evidence base | Executive summary: "conditional go", all personas synthetic, demand untested. Scope-definition proceeds to build anyway. | The 5-user tests in Phase 2 and Phase 3 **are** the validation phase. Gate 2 includes an explicit go/narrow/stop on the demand questions. |
| Market position | Berlin Bike Theft Clock is the nearest competitor (12 districts). | Differentiators to prove in testing: finer geography, honest confidence, lock advice. Not a moat; the data is open. |

### 1.2 Architecture and complexity guardrails

**Verdict: batch precompute + static JSON is the right call. Keep the static JSON as the product; treat FastAPI as an optional skin.**

| Decision | Assessment |
| --- | --- |
| Offline batch, no runtime inference | Correct. Removes the entire class of runtime model bugs. |
| Static JSON on GitHub Pages as primary | **Recommended change:** the static file is the *source of truth and the shipped product*. FastAPI adds a second serving path, a container, hosting and a failure mode, in exchange for ~nothing at 542 areas (~1-3 MB gzipped). Keep it because Phase 3 requires it, but time-box it (1.5 days) and ship it **behind the static default**: client tries API for 1.5 s, falls back to JSON; with the API off, the product is unchanged. |
| Client-side point-in-polygon | Correct and privacy-preserving. Use `@turf/boolean-point-in-polygon` or a ~30-line ray-casting function over `lor.json`. |
| Live weather, runtime SHAP/LLM, RAG, accounts | Correctly cut. Keep them on the Won't list (section 2). |
| CDN dependencies in the demo (Tailwind CDN, unpkg, Babel standalone) | **Cut line for Week 3:** a production build must vendor or bundle these. Babel-in-browser is a prototype technique, and every CDN call contradicts "no third-party requests". |
| OSM raster tiles | Each map view sends the viewer's IP and viewport to the tile host, which conflicts with the no-tracking promise and the OSM tile usage policy for production use. Decide in Phase 3: self-hosted/vector tiles, a privacy-acceptable provider, or a plain polygon-only map with no basemap. |
| Hosting | GitHub Pages (static) is enough. No cloud account needed for the container: it only needs to build and run in CI and locally (Gate 3). |

### 1.3 Findings from the data audit (these change the plan)

All **(measured)** on `Fahrraddiebstahl.csv` (ISO-8859-1, auto-detected delimiter), 30,788 rows.

| # | Finding | Consequence |
| --- | --- | --- |
| D1 | Data window is **2025-01-01 to 2026-10-13** (~21 months). The sample JSON says `2024-01-01`; the technical brief talks about "24 months". | Fix metadata to be generated, not typed. Only one annual cycle: no robust seasonality, and the hold-out falls in one season. |
| D2 | Only **534 of 542** areas have any record; 8 have zero. The CSV has no extra IDs outside the GeoJSON. | Gate 0 cannot say "542 aligned". It says: 542 polygons, 0 unmatched CSV IDs, 8 zero-record areas explicitly handled (shrunk to parent, flagged "no data", never "Low"). |
| D3 | Last 12 months, street thefts: **15,465 rows; median 19 per area; 178 areas have <10 and 88 have <5.** At 3 daytypes x 4 dayparts that is ~1.6 per cell for a median area. | The 28-cell grid (1.9 per cell over the *whole* window) is dead. Cell-level estimates are mostly prior. Confidence labels are not decoration; "thin" will be common (~1/3 of areas). Honest Fog is a core feature, not a Should. |
| D4 | Reporting lag (ANGELEGT_AM minus TATZEIT_ENDE_DATUM): median 0, p90 4, **p95 10** days. The sample JSON says 14. | The distribution is computed from reports that already exist, so it understates lag (late reports are missing from it). **Lock N = 14 days** (rounded up, conservative). Write it to config and metadata from one constant. |
| D5 | Offence window: only 19% are <=1 h, 36% <=4 h, 86% <=24 h. The reported hour is when the owner last saw the bike. | Assigning the start hour to a daypart misplaces most thefts. Use **proportional allocation across overlapping dayparts** (deterministic, easy to test). EM stays Won't. |
| D6 | `ART_DES_FAHRRADS` has no e-bike category (Herrenfahrrad 11,051, Damenfahrrad 5,985, ..., Lastenfahrrad 188). | The schema's `STANDARD` / `EBIKE` split cannot be derived from bike type. **Provisional (EDA decides, section 0.5):** `bike_class` = value band from `SCHADENSHOEHE` (< EUR 1,000 / >= EUR 1,000, the router's threshold), or bike type if the EDA shows it carries signal and density. Median stolen value is EUR 899 citywide, so the threshold is meaningful. |
| D7 | 27,499 of 30,788 rows (89%; ~94% of street rows) are "schwerer Diebstahl" (lock defeated). | `aggravated_lock_break_share` is close to 90%+ everywhere, so the router rule `>= 80%` fires almost always and carries little signal. Test its spread in Phase 1; if the between-area variation is small, drop it from the router and keep it as a citywide fact. |
| D8 | Dataset rows dated 2025: **17,190** vs. PKS 2025 report: **22,630** bike thefts. | The open data covers only ~76% of the PKS figure, and README's "~20,000 outdoor thefts per year" is wrong. Correct README and state in "About the data" that the open dataset is a subset. Open question from the discovery docs is now answered. |
| D9 | Street filter in the audit is a regex over every column. | Replace with `DELIKT != "Keller- und Bodeneinbruch"` and `"Keller" not in ERFASSUNGSGRUND`, tested against the expected counts (29,212 street rows in the current dump). |

### 1.4 Risk register

Likelihood and impact: H / M / L. Owner is whoever holds the PM role that week unless stated.

| # | Risk | L | I | Mitigation | Trigger / owner |
| --- | --- | --- | --- | --- | --- |
| R1 | **Sparse cells and zero inflation.** Median area has ~1.6 thefts per cell; 8 areas have none; 178 have <10 a year. Tiers can flip on one report, and zero-count areas look "safe". | H | H | Gamma-Poisson shrinkage to the 143 Bezirksregionen, then to the city. Numeric `confidence` (n_reports, 80% interval width) mapped to solid/fair/thin by a documented rule. Thin data never shows reassurance. Coarser fallback (BZR) if Gate 1 shows planning-area cells do not beat the baseline. | Gate 1 backtest; Fritz |
| R2 | **Data lag, truncation and one-season history.** Late reports bias recent weeks low; the hold-out is a single season. | H | M | N=14-day truncation from one config constant; show "data up to <date>" on every answer; rolling-origin backtest with two hold-out folds (Apr-Jun and Jul-Sep 2026); say plainly that seasonality is not modeled. | Gate 0, Gate 1; Burcak |
| R3 | **Plausible but wrong AI-written statistics.** Neither of us can independently verify the model code. | M | H | Library implementations (`statsmodels`, `scipy`); property tests (counts conserved, shrinkage monotone, tiers 60/25/15 of areas); naive-baseline comparison is a **hard gate**; one outside review of the method before Gate 2 (find a statistics-literate reviewer in Week 1). | Gate 1; PM of the week |
| R4 | **Legal, attribution and privacy.** CC-BY 4.0 (Polizei), dl-de/by-2-0 (LOR), ODbL (OSM) must be shown in the UI. Publishing area aggregates derived from OSM may trigger ODbL share-alike (a derived database vs. a produced work); tile/CDN requests leak IP; lock advice could be read as a guarantee. | M | H | Attribution component in the UI and in `metadata`, checked by a test. Publish OSM-derived features as aggregate counts only, with ODbL attribution, and get a legal read in Week 3 (university or open-data contact; not legal advice from this document). Remove third-party CDNs and decide the tile provider. Disclaimer on every answer: "not a guarantee". Share links carry area id and time band only. | Gate 3; Burcak |
| R5 | **Weekly PM handoff drag.** Two people, a different owner each Monday, AI-generated code both must review. | H | M | Monday 15-min sync (section 4), one living `STATUS.md` (not Slack), every Must item is a GitHub issue with acceptance criteria, PRs under ~300 lines, the outgoing PM writes the handoff before Friday end of day. | Every Monday |
| R6 | **Automation breaks silently.** The refresh workflow will fail on a protected `main`; "green" runs today prove nothing; a bad CSV could publish bad tiers. | H | M | Workflow opens a PR (`peter-evans/create-pull-request` or `gh pr create`) instead of pushing to `main`; schema validation + sanity checks (row count within +-15%, tier shares 60/25/15 +-3 pts, lag recomputed) gate the PR; failure keeps the last good JSON and opens an issue. | Gate 3; Fritz |
| R7 | **Demand and trust are unvalidated.** Personas are synthetic; an "alarming" or wrong-feeling answer damages trust; a "Low" tier could lead to a weak lock. | M | H | Phase 2 and 3 usability tests with real riders (5 + 3); copy templates are versioned and reviewed against `lock-tier-documentation.md`; baseline lock advice at every tier. | Gate 2 go/narrow/stop |

---

## 2. Scope Definition and MoSCoW Cut-Line

Rule: the cut-line is **end of Week 3**. After Gate 3 no new feature is merged; Week 4 is fixes, polish, docs and testing only. If a Should is not done by Gate 3 it moves to Won't for this release.

### Must Have (MVP core; Gates 0-2)

| ID | Item | Acceptance criteria |
| --- | --- | --- |
| M1 | Hardened ingestion + audit | Audit script **fails** (non-zero exit) on: wrong columns, <25k rows, unmatched LOR IDs, lag cutoff N not set. Street filter by column, covered by a test against expected counts. Lag N=14 and window dates come from one config. |
| M2 | Cleaning pipeline | `src/pipeline/`: street filter, lag truncation, daypart/daytype mapping (reuse `map_daypart`, `map_daytype`), proportional window allocation. Unit tests: counts conserved after allocation; truncation removes exactly rows newer than cutoff. |
| M3 | Baselines and backtest | Naive baseline (citywide daypart share x area total) and area-history baseline. Rolling-origin backtest, 2 folds. Report Poisson deviance and Spearman per fold. |
| M4 | Hierarchical EB (Gamma-Poisson) model | Beats **both** baselines on both folds on deviance; Spearman >= 0.6 on the 3-month hold-out; >= 70% of High-tier areas remain in the top quartile by actual thefts. If it fails, ship the better baseline and say so in `model_type`. |
| M5 | Lookup generator | `build_lookup_json.py` writes `lookup_schema_v1.json` with metadata generated from data (window, lag, `model_type`, attribution). Validated by a JSON Schema in CI. 542 areas always present; zero-record areas flagged `no_data`. |
| M6 | Confidence + verdict logic | Numeric basis (`n_reports`, interval width) -> solid/fair/thin by a documented rule. Unit test: thin or no data never yields calm styling or "normal/lower" wording. |
| M7 | Advice catalog + router | Catalog regenerated from `lock-tier-documentation.md`: VdS 2597 A+/B+, no Sold Secure, no frame-lock-alone, no "go elsewhere" text. Router tests per tier x bike class x daypart. |
| M8 | UI against locked schema | Real `lookup_schema_v1.json` consumed by the UI (the demo's mock data removed). Locate-me or tap, place search, and the time and bike selectors **exactly as the EDA capability table allows** (not as in the prototype), answer card with tier, confidence, data date, advice, "limited data" flag. Works at 375 px; location-denied and outside-Berlin states. |
| M9 | Shippable static fallback | Static site deployed with the bundled JSON as the only dependency. Works offline after first load (service worker or cache headers). |
| M10 | Attribution + "About the data" | All three attributions in the UI; the known limits (open data is ~76% of PKS, under-reporting, lag) written down. |

### Should Have (Phase 2-3)

| ID | Item | Acceptance criteria |
| --- | --- | --- |
| S1 | OSM exposure proxy + Poisson GLM | `osmnx` counts per area (transit stops, shops, amenities) cached to `data/processed/osm_features.parquet` (pinned extraction date). Adopted **only if** it improves hold-out deviance over EB alone and rankings are stable across folds. Otherwise `model_type` stays `eb_gamma_poisson` and the UI hides the "typical for this kind of area" line. Time-box: 4 working days total. |
| S2 | Area stats | `aggravated_lock_break_share` (if it varies, see D7) and median stolen value per area with a minimum-n rule (<20 cases: show citywide value labelled as such). |
| S3 | 30-day anomaly badge | `trending_up_30d` when trailing 30-day street count exceeds the 95% Poisson upper bound of the area's own expected count; requires n_expected >= 3 or the flag is `null`. Test on synthetic injected spikes. |
| S4 | FastAPI + container | `GET /api/v1/risk`, `/areas`, `/healthz`. Dockerfile builds in CI; client falls back after 1.5 s. Verified with the container stopped. |
| S5 | Automated weekly refresh | Cron opens a PR with the regenerated JSON, schema + sanity checks required, last good JSON retained on failure. |
| S6 | "How this works", "This looks wrong", share link (area ids and time band only) | Link reopens the same view; no coordinates in the URL. |
| S7 | Accessibility pass | Colour never the only signal (tier text + pattern), contrast checked, keyboard navigable, screen-reader labels. |

### Could Have (only after Gate 3 and only if Week 4 testing is green)

- Finer bike classes (cargo/Lastenfahrrad shown separately; 188 rows, likely too thin).
- Two-place compare view (story E3).
- Multi-criteria filters (daypart + risk tier + confidence).
- German/English toggle beyond the base copy.
- Guideline URL health check in CI.
- Dark mode.

### Won't Have (explicit, this release)

- Live weather or forecast inputs.
- Runtime inference of any kind: SHAP, LLM or RAG at request time.
- User accounts, saved places, rider tracking, any server-side user data.
- Cities other than Berlin; route planning; live theft reports or alerts.
- Neighbourhood rankings or "unsafe area" labels.
- Lock product or brand recommendations; Lock Budget (held for a legal read).
- Seasonality modeling (only ~21 months of data).
- EM allocation of offence windows (replaced by proportional allocation).
- Production-scale hosting, load testing, security hardening beyond the basics.

---

## 3. Phased Roadmap and Milestone Gates

### Contradictions in the docs, and the resolution used in this plan

| # | Contradiction | Resolution |
| --- | --- | --- |
| C1 | `scope-definition.md` is a 3-week plan with Week 4 "a cushion"; this roadmap is 4 weeks with a hard feature freeze at Gate 3. | 4 phases, Week 4 is test and polish only. `scope-definition.md` to be updated to match. |
| C2 | Scope docs rank OSM, FastAPI, 30-day flag and weekly refresh as Should/Could; the brief requires them by Week 3. | Promoted to Should with kill criteria (S1 adopted only if it wins the backtest; S4 stays behind the static default). |
| C3 | Executive summary: "conditional go, two-week validation, do not yet build". Scope docs: build immediately. | Build proceeds; the validation questions become explicit tests in Phases 1-3 (density in Gate 0/1, riders in Gate 2). |
| C4 | Metadata says window starting 2024-01-01 and lag 14; the audit says data starts 2025-01-01 and p95 lag is 10 days. | Generated metadata; N=14 chosen deliberately (D4). |
| C5 | README says "542 LOR alignment" and "~20,000 outdoor thefts/year". Data: 534 with records, ~17k rows dated 2025. | Gate 0 criterion rewritten; README corrected. |
| C6 | Daytype is "weekday/weekend" (scope docs) vs. Mon_Thu/Friday/Weekend (audit, sample JSON). | **Provisional:** three daytypes (Mon_Thu, Fri, Weekend), matching the existing code and schema; the EDA and Phase 1 backtest confirm or collapse to two in config. |
| C7 | `EBIKE` class in the schema vs. no e-bike field in the data. | Value-band classification (D6). |
| C8 | `advice_catalog` cites Sold Secure and frame+U-lock alone. | Regenerate from the lock-tier doc (M7). |
| C9 | README: frontend is React + Vite + Tailwind + turf, `src/api/main.py` exists, CSV is ~15-20 MB; reality: single-file CDN prototype, no API, 4 MB. | Rewrite README "Quickstart" and "Repository Structure" in Phase 4 to match what exists; until then add a "Status" table (section 0). |
| C10 | Success criterion "70% of High areas stay in top ~25%" and "0.6 Spearman" are marked "not yet verified". | Treated as targets to confirm at Gate 1; if the data cannot reach them, the gate fails and scope narrows (see Gate 1). |
| C11 | Branch protection on `main` vs. a workflow that pushes to `main`. | Refresh opens a PR (S5). |

### Calendar

| Phase | Dates | Theme |
| --- | --- | --- |
| 0 | Wed 10-21 to Sun 10-25 | Foundation, ingestion guardrails |
| 1 | Mon 10-26 to Sun 11-01 | Baseline engine + UI scaffold |
| 2 | Mon 11-02 to Sun 11-08 | Features, real data end to end, first usability test |
| 3 | Mon 11-09 to Sun 11-15 | Robustness, automation, governance. **Feature freeze at Gate 3.** |
| 4 | Mon 11-16 to Sun 11-22 | Test, stress-test, polish, docs, pitch |

### Phase 0: Foundation and Ingestion Guardrails (Day 0)

| Task | Output |
| --- | --- |
| Branch protection is already on `main`; add required status checks (tests, schema) and CODEOWNERS for both people | Settings screenshot or issue comment |
| Create issues for every Must (M1-M10) with acceptance criteria; one `STATUS.md` | Board exists |
| Harden `audit_police_csv.py` into asserts + non-zero exit; fix the street filter (D9); write `config.py` with N=14, window, daytypes | Audit passes in CI |
| Add `pytest` job on PRs (`.github/workflows/ci.yaml`) | Green CI on a trivial test |
| Record decision log: daytypes (C6), bike class (D6), tiers relative (1.1), lag N | `docs/product-discovery.md` decision log rows |
| Recruit 5 riders for Week 2 (and 3 for Week 3); book slots | Names and dates in `STATUS.md` |

**Gate 0 (go/no-go):**

- [ ] Audit script exits 0 on the current CSV and non-zero on a corrupted copy (bad delimiter, truncated file, missing column), with a test for each.
- [ ] Delimiter and encoding detected (ISO-8859-1 today); 542 GeoJSON features, **0 CSV area IDs missing from GeoJSON**, 8 zero-record areas listed and handled explicitly.
- [ ] Lag cutoff **N = 14 days** locked in `config.py` and written to metadata; derivation (p95 = 10, rounded up for censoring) documented.
- [ ] Street-filter row count equals the expected 29,212 (current dump) via a test.
- [ ] CI runs tests on PRs; `main` requires them.
- **No-go:** any of the above fails -> Day 0 extends by at most 2 days, taken from Week 1 slack. Not from Week 4.

### Phase 1: Baseline Engine and Scaffolding (Week 1)

| Work | Owner (see section 4) |
| --- | --- |
| **EDA first (days 1-3):** notebook + `docs/eda-findings.md` covering the six questions in section 0.5; capability table agreed by both | Data |
| M2 cleaning pipeline incl. proportional window allocation, with tests | Data |
| M3 baselines + rolling-origin backtest; density table (reports per cell, 12 and 24 months) | Data |
| M4 Gamma-Poisson EB shrinkage to BZR and city; first tiers | Data |
| Check D7 (variation of lock-break share) and C6 (3 vs. 2 daytypes) | Data |
| Lock `lookup_schema_v1.json` (schema file + generated sample with all 542 areas, flat or nested; one decision, no later changes without a version bump) | Both; PM signs off |
| UI: move the prototype into `frontend/` (Vite build), vendor the CDN libs, load the **mock-valid** JSON built against the locked schema, render 542 polygons + answer card | UI |
| Decide basemap/tile approach (R4) | UI |
| Outside statistics reviewer identified | PM |

**Gate 1 criteria:**

- [ ] EB baseline beats **both** naive baselines (citywide share; area history) on Poisson deviance on **both** backtest folds. Spearman >= 0.6 on the Jul-Sep 2026 hold-out. >= 70% of High-tier areas in the actual top quartile.
- [ ] Tier shares are 60/25/15 +-3 pts; no district has a tier-share gap > 2x the citywide share (fairness check).
- [ ] **Capability table signed:** every filter and label in the UI maps to a field and a density result from the EDA; anything unsupported is cut or relabelled.
- [ ] Schema validates; generator produces all 542 areas.
- [ ] UI renders 542 polygons, selectors, and answer card from the schema with **no console errors** at 375 px and desktop.
- **No-go options (decide at the gate, not later):**
  1. Model fails at planning-area level -> ship **Bezirksregion (143)** tiers with the polygons grouped, keep the UI.
  2. Model fails entirely -> ship the best baseline with "indicative only" wording; the product is still a lock-advice tool.
  3. Gate fails by a hair -> one extra day, taken from Week 2 slack.

### Phase 2: Feature Enhancement and Working Fallback (Week 2)

| Work | Notes |
| --- | --- |
| S1 `osmnx` exposure features + Poisson GLM (time-boxed 4 days) | Kill criterion: no hold-out gain, or rankings unstable across folds -> stop, delete `osm_activity_context`, document why |
| S2 area stats; M6 confidence rules; M7 advice catalog + router | Template layer for verdict text; copy reviewed against `lock-tier-documentation.md` |
| M5 full batch generation -> real `lookup_schema_v1.json`; UI wired to it | Mock data removed from the UI |
| M9 deploy static build with bundled JSON; M10 attribution and About page | Pages workflow now builds `frontend/` |
| **Usability test #1** (end of week, 5 riders, 20 min each, real data) | Script: open -> find a spot -> state tier meaning -> choose a lock. Record: time to decision, tier-wording comprehension, "would you use it" |
| Outside method review (R3) | Written feedback by Gate 2 |

**Gate 2 criteria:**

- [ ] Deployed site works end to end on **real precomputed data**; no mock strings left (`grep -i mock` in the build output returns nothing).
- [ ] Site works with the network turned off after first load.
- [ ] Usability: >= 4 of 5 explain what the tier means; median time to a lock decision < 60 s; >= 3 of 5 say they would use it. Failure here is a **narrow/stop decision** for the team (executive-summary gate), not an automatic slip.
- [ ] Advice tests pass: no frame-lock-alone, no brand/Sold Secure, no relocation text, thin data never reassured.
- [ ] Outside reviewer has no unresolved blocking comment on the model.
- **No-go:** a failed usability gate triggers wording and layout rework in the first 3 days of Week 3, and S3-S7 are cut to make room (in order: S7 partial, S6, S3).

### Phase 3: Robustness, Automation and Governance (Week 3)

| Work | Notes |
| --- | --- |
| S3 30-day anomaly badge | With injected-spike tests |
| S4 FastAPI + Dockerfile + client fallback (1.5 s timeout) | Container in CI (`docker build` + smoke test `/healthz`, one risk query) |
| S5 weekly refresh via PR with schema + sanity checks; failure issue; last good JSON retained | Dry-run with `workflow_dispatch` and with a deliberately broken CSV |
| Governance: attribution test, ODbL read, tile/CDN privacy, no-tracking verification (network panel shows only own origin) | |
| Usability fixes from test #1; **test #2** (3 riders, mid-week) on wording and anomaly badge | |
| S7 accessibility pass | |
| **Feature freeze** at Gate 3 | |

**Gate 3 criteria:**

- [ ] `docker build` and `docker run` work locally and in CI; `/healthz` and a risk query return the same answer as the static JSON.
- [ ] **Simulated outage:** with the container killed, the app falls back within 1.5 s and the answer is identical; with the container slow (artificial 5 s delay), same result. Verified by an automated browser test.
- [ ] Weekly workflow: a manual run produces a PR that passes checks; a corrupted CSV produces a failed check and **no** change to the served JSON.
- [ ] Attribution test passes; legal read on ODbL/CC-BY answered or the OSM-derived aggregates removed; no third-party requests from the app origin (except the decided tile provider).
- [ ] Usability test #2: no new blocking wording issues.
- **No-go:** anything missing is **moved to Won't** or fixed in the first 2 days of Week 4. Nothing new starts after Gate 3.

### Phase 4: Release, Polish and Stakeholder Pitch (Week 4)

| Day | Work |
| --- | --- |
| Mon-Tue | Integrate remaining feedback; polish; documentation: rewrite README to match reality (C9), architecture diagram, runbook for the refresh job and fallback |
| Tue-Wed | **Stress test** (the point of this week): 50+ concurrent users on the static site (e.g. `k6` or `hey` against the Pages URL); API under load; corrupted/old data; location denied; outside Berlin; slow 3G; 375 px phones, iOS Safari + Android Chrome; screen reader pass |
| Wed | Technical deviation and calibration report: backtest tables, calibration plot (predicted tier vs. observed rate), fairness check, limits (one season, under-reporting, lag, 76% of PKS), decisions and what was cut |
| Thu | Release candidate tagged `v1.0.0`; freeze (only P0 bugs merge) |
| Fri | Pitch dry-run to an outside person; fix only presentation issues |
| Sat-Sun | **No code.** Buffer only |

**Gate 4 (release):**

- [ ] All Must items are done; every Should is either done or has a recorded Won't decision.
- [ ] Stress test: no errors at 50 concurrent users; p95 page load on throttled mobile < 3 s; fallback path re-verified on the release build.
- [ ] README quickstart works on a clean clone (`uv sync`, pipeline, frontend) as executed by the person who did **not** write it.
- [ ] Deviation and calibration report published in `docs/`, with honest failures.
- [ ] 3 consecutive days with no P0/P1 bug open; scheduled refresh has run successfully at least once on its own (cron, not manual) before the pitch.
- [ ] Pitch deck consistent with the numbers in the report (no unverified press figures; see the "do not quote" list in `product-discovery.md`).

---

## 4. Team Work Allocation and Operational Playbook

Roles: **Data** = pipeline, model, validation, API/CI. **UI** = frontend, copy, usability tests, accessibility. Both review every PR. The weekly PM owns priorities, the board, the gate call and the handoff note; **the PM still does their stream**, minus roughly one day of coordination. Fritz holds the PM role in Week 1 (placeholder; swap if Burcak starts).

| Phase / Week | PM | Fritz | Burcak | Joint |
| --- | --- | --- | --- | --- |
| Day 0 (Oct 21-25) | Fritz | Data: audit hardening, config, CI + branch checks | UI: issues and board, rider recruiting, tile/CDN inventory | Gate 0 review; decision-log entries |
| Week 1 | **Fritz** | **PM** + cleaning pipeline, baselines, EB model | Frontend scaffold in Vite, vendored libs, schema-driven render, basemap decision | Lock schema together on Monday/Tuesday; Gate 1 review on Friday |
| Week 2 | **Burcak** | Data: GLM/OSM (time-boxed), area stats, generator, confidence, schema validation | **PM** + advice router and templates, UI on real data, deploy, test #1 | Test #1 together (one moderator, one note-taker); Gate 2 call by Burcak |
| Week 3 | **Fritz** | **PM** + FastAPI, container, refresh PR workflow, anomaly flag | Test fixes, test #2, accessibility, attribution component | Governance read, Gate 3 call by Fritz |
| Week 4 | **Burcak** | Calibration report, stress tests (API/static), data runbook | **PM** + UI polish, README, pitch, device matrix | Release candidate, pitch dry-run, Gate 4 |

Rules that keep the rotation from hurting:

- **Schema ownership never rotates.** Any change to `lookup_schema_v1.json` needs a version bump, a PR by whoever changes it, and sign-off by both.
- **Gate calls** are made by the PM of the week where the gate falls, but a gate failure decision (narrow/stop) needs both people.
- **Carry-over cap:** the outgoing PM may hand over at most 2 half-finished items; the rest is merged, parked or closed.
- **AI-generated PRs** are accepted only with a test that would fail if the code were wrong, and the reviewer runs it locally.

### Monday Morning 15-Minute Handoff Sync

Written note by the outgoing PM by Friday evening (`STATUS.md`, max one page); the meeting verifies it, it does not replace it.

| Min | Topic | Owner | Output |
| --- | --- | --- | --- |
| 0-2 | **Gate status:** which gate is next, date, which criteria are green/red | Outgoing | Red items named |
| 2-6 | **Done / in flight / blocked** since last Monday (from the board, not memory); what is merged on `main`; what is open and why | Outgoing | At most 2 carry-over items |
| 6-9 | **Decisions made** and the reasoning (incl. anything that changed the schema, model or copy); link to the decision log | Outgoing | Log up to date |
| 9-12 | **This week's plan:** top 3 outcomes, who does which stream, what gets cut if we slip (cut order is pre-agreed) | Incoming | Board updated |
| 12-14 | **Risks and surprises:** register changes, data oddities, external dependencies (testers, reviewer, legal) | Both | Register updated |
| 14-15 | **Confirm:** one sentence each: "this week succeeds if..." and who unblocks whom | Both | Written at the top of `STATUS.md` |

Template for `STATUS.md`:

```md
# Status, week N (PM: <name>), updated <date>

## Gate
Next gate: <Gate X>, <date>. Criteria red: <list> | green: <list>

## Last week
- Done (merged): <issue/PR links>
- In flight (owner, % , blocker): <max 2>
- Dropped or parked, and why: <items>

## Decisions (also in decision log)
- <decision> - <why> - <who agreed>

## This week: top 3 outcomes
1. 
2. 
3. 
Cut order if we slip: <1, 2, 3>

## Risks / surprises
- <risk, change since last week, mitigation>

## Needs from the other person / outside
- <review waiting, tester slots, legal answer...>

## Where things live
Branches: <list>. Env/data: CSV fetched <date>, last lookup generated <date>. Open PRs: <links>.
```

---

## Appendix: Evidence behind the numbers

- Audit re-run on the local `Fahrraddiebstahl.csv` (30,788 rows; 29,212 after excluding cellar cases; 534 distinct areas; lag p50/p90/p95 = 0/4/10 days; offence windows <=1 h / 4 h / 24 h = 19% / 36% / 86%).
- Last-12-month density computed in this review: 15,465 street rows; median 19 per area; 178 areas <10; 88 areas <5 (including areas with zero).
- `ART_DES_FAHRRADS` values and `ERFASSUNGSGRUND` mix: 27,499 "schwerer Diebstahl", 1,713 "Einfacher Diebstahl", 1,496 + 80 cellar cases. Median `SCHADENSHOEHE` EUR 899.
- Workflow run history (`gh run list`): scheduled run 2026-10-19 succeeded because the commit step had nothing to commit; one earlier manual run failed on 2026-10-16.
- Not verified here: CC-BY 4.0 on the dataset page itself, the OSM extraction cost for all 542 areas, hosting terms of any tile provider, and whether the 2025 gap to PKS (17,190 vs. 22,630) is a coverage or a definition difference.
