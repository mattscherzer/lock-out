# LockOut: Product Roadmap and Delivery Plan

| | |
| --- | --- |
| **Version** | 2.2 (2.1 plus the high-risk gap review; supersedes 1.0) |
| **Date** | 2026-10-23 (Week 0, Friday) |
| **Owners** | Fritz, Burcak (PM role rotates every Monday) |
| **Status** | Proposed for team sign-off at the Monday 2026-10-26 sync |
| **Fixed dates** | Midterm presentation **Tue 2026-11-10** · Dry-run **Wed 2026-11-18** · Graduation (final presentation) **Fri 2026-11-20** |

Abbreviations are explained in Appendix C.

---

## 1. Executive summary

**Objective.** By the graduation presentation on 20 November, deliver a working, honest, privacy-preserving web app that shows a Berlin cyclist how bicycle-theft risk compares across places and times and which locking practice fits, backed by a validated statistical model, a tested fallback path and an automated weekly data refresh.

**Where we stand (end of Week 0).** Discovery, a clickable prototype, synthetic user research and the documentation set are complete. The prototype and the research ran on **mock data**, so product decisions that depend on the data (filters, bike classes, time bands) are held until the exploratory data analysis (EDA) in Week 1. Engineering is at the start: the data fetch with stale-cache fallback and the polygons exist; the pipeline, model, lookup artifact, API, real frontend, tests and CI do not (section 3).

**The plan in one line.** Lock the data foundation (Phase 0), build and validate the baseline model with the UI scaffold (Week 1), run end to end on real data and test with riders ahead of the midterm (Week 2), harden, automate and stress-test (Week 3), and use Week 4 for defect fixing, polish, documentation and rehearsal only.

**Scheduling decisions driven by the fixed dates**

1. **Gate 2 (Fri 6 Nov) is also the midterm-readiness gate.** What we show on 10 Nov is the Gate 2 build.
2. **Stress testing happens in Week 3.** Gate 3 (Fri 13 Nov) requires a passed stress test, the feature freeze and a tagged release candidate. Week 4 starts no new feature.
3. **One freeze ladder** (section 7): feature freeze at Gate 3; pitch build frozen at Gate 4 (Tue 17 Nov); hard freeze Thu 19 Nov 12:00 with P0 fixes only.

**Decisions requested at the Monday 26 Oct sync:** approve the scope and cut order (section 5); confirm the PM rotation (section 11); note decisions D-09 to D-11, now decided by the team, and confirm D-15 (trips measure) (section 9); confirm rider recruiting is under way (WP 0.4). Presentation formats are due by 30 Oct (DEP-6).

---

## 2. Goals and success measures

| Dimension | Measure | Target | Verified at |
| --- | --- | --- | --- |
| Model quality | Poisson deviance on two rolling hold-out folds | Better than the citywide baseline on both folds; within 1% of or better than the raw area-history baseline on both folds | G1 |
| Model quality | Spearman rank correlation, Jul-Sep 2026 hold-out | >= 0.6 | G1 |
| Model quality | High-tier areas that stay in the top quartile of actual thefts | >= 70% | G1 |
| Validity | Each selector the card shows (time band, bike class) validated on hold-out, else shown as a citywide pattern | All selectors pass or are relabelled | G1 |
| Calibration | Observed hold-out thefts per area by tier | Rise monotonically Low < Medium < High; High mean >= 2x Low mean (working target, reviewed after the EDA) | G1 |
| Fairness | District fairness report (section 7, G1) | Produced, reviewed, every flagged district explained | G1 |
| Usability | Riders who explain the tier and the confidence label in their own words | >= 4 of 5 | G2 |
| Usability | Median time from opening the app to a stated lock decision | < 60 s | G2 |
| Value | Riders who say they would use it (stated intent; background only if it disagrees with the trips measure) | >= 3 of 5 | G2 |
| Value | **Trips measure** (prototype task 6): "Thinking of last week, which of your trips would you have checked this for?" | Pass: >= 3 of 5 riders name at least one concrete trip (place and time) and >= 2 of them include a place other than their daily spot. Narrow: 2 of 5, or every named trip is a daily spot. Stop: <= 1 rider. **Decides the value outcome if it disagrees with stated intent** (D-15) | G2 |
| Method review | Outside reviewer on the model | No open blocking comment | G2 |
| Wording | Usability test #2 (3 riders) | No new blocking wording issue | G3 |
| Resilience | Same answer with API up, down and slow (5 s delay); fallback switch | <= 1.5 s | G3 |
| Capacity | Production build under 50 concurrent users (local static server) | 0 errors; p95 load on throttled mobile < 3 s | G3 |
| Automation | Refresh job: valid run opens a PR; corrupted CSV changes nothing served | Both demonstrated | G3 |
| Accessibility | Contrast, labels, colour-independent signals | Baseline built in (M8); audit passed | G4 |
| Delivery | Gates passed on the planned date | G0-G3 on date; G4 by Tue 17 Nov | Each gate |

Usability and value thresholds are working targets inherited from `scope-definition.md`. Tested on five riders, they are a go/narrow/stop signal, not statistical proof.

---

## 3. Baseline and capability status

### 3.1 What exists today

| Component | State |
| --- | --- |
| CSV fetch with stale-cache fallback (`src/fetch_police_csv.py`) | Done: >1 MB check, 21-day maximum fallback age, fails loudly |
| LOR polygons (542 features, key `plr_id`) | Done: `data/raw/` and `demo/lor.json` |
| Data audit (`src/audit_police_csv.py`) | Runs; asserts nothing, always exits 0; street filter is a regex over all columns |
| Cleaning pipeline, model, `build_lookup_json.py` | Not started (`src/pipeline`, `src/models` empty) |
| `lookup_schema_v1.json` | One hand-written sample area; not generated |
| FastAPI service (`src/api/main.py`) | Not started |
| Frontend | `frontend/` empty; `demo/index.html` is a single-file prototype on mock data (React/Tailwind/Babel via CDN), deployed to GitHub Pages |
| Weekly refresh workflow | Runs fetch + audit only; the commit step is a no-op. Pushing to `main` will fail once enabled because `main` requires a reviewed PR |
| Tests and PR CI | None; the raw CSV is not tracked in git |
| Advice catalog | The sample JSON still cites Sold Secure and "frame + U-lock", contradicting `lock-tier-documentation.md` |

Discovery-phase work (documents, prototype, research) is complete; engineering work has not started.

### 3.2 Data baseline (CSV dump of 2026-10-13: 30,788 rows, 29,212 street rows)

"Street rows" excludes cellar and attic break-ins (`ERFASSUNGSGRUND` containing "Keller"). The "12-month window" is offence start date 2025-10-14 to 2026-10-13.

| Fact | Value | Planning consequence |
| --- | --- | --- |
| Data window | 2025-01-01 to 2026-10-13 (~21 months) | One annual cycle; no seasonality modeling |
| Areas with at least one record | 534 of 542 (8 with none) | Zero-record areas shrink to the parent and are flagged, never "Low" |
| Street thefts, 12-month window | 15,577; median 19 per area; 178 areas < 10 and 87 areas < 5 (zero-record areas included) | Cells are mostly prior; confidence labelling is core |
| Reporting lag p50 / p90 / p95 | 0 / 4 / 10 days | Truncate N = 14 days (rounded up: late reports are missing from the distribution itself) |
| Offence window <= 1 h / 3 h / 4 h / 24 h | 19% / 32% / 36% / 86% | The hour field is "last seen"; hours need allocation across the window |
| Start-hour share | Peak 18:00 (10.8%) | Time bands to be derived from this curve |
| Bike types | 13 categories (Herrenfahrrad 10,598; Damenfahrrad 5,781; "Fahrrad" 5,133; Lastenfahrrad 182; BMX 10); no e-bike category | Type filter possible only after grouping |
| Stolen value (all rows) | Median EUR 899; 45% >= EUR 1,000; 12% >= EUR 2,500 | Value bands are a candidate bike class |
| Lock defeated ("schwerer Diebstahl") | 89% of all rows (~94% of street rows) | Little between-area signal expected |
| Coverage vs. official figure | 2025: 17,190 rows by report year (all rows) and 16,409 street rows by offence year, against 22,630 in the PKS 2025 report | The open data is roughly three quarters (72-76%) of the official figure; the exact share depends on the basis |

---

## 4. Planning principles

1. **Data before features.** No user-facing filter, label or advice rule is final until the EDA capability table is signed (Gate 1). The prototype and the interviews are inputs, not requirements.
2. **The static JSON is the product.** FastAPI is an optional layer behind a static default and is not publicly hosted (D-13); the deployed app must work with the API off.
3. **Honest by construction.** Thin or missing data never produces reassurance; no string says "safe"; tiers are labelled "reported thefts relative to other areas", never as the risk to a particular bike (the model has no exposure term unless S1 is adopted, so busy places rank higher); baseline lock advice shows at every tier; no advice suggests parking elsewhere.
4. **Precompute, do not infer.** No live weather, no runtime model, SHAP, LLM or RAG, no accounts.
5. **Stage-gated with pre-agreed fallbacks.** Every gate has a no-go option decided in advance (section 7).
6. **Freeze early.** Features stop at Gate 3; Week 4 is defect fixing, polish, documentation and rehearsal.
7. **AI-written code is accepted only with a test that would fail if it were wrong,** and the reviewer runs it locally. Library implementations (`statsmodels`, `scipy`, `geopandas`) over custom maths.

---

## 5. Scope (MoSCoW)

### Must have

| ID | Capability | Acceptance criteria |
| --- | --- | --- |
| M1 | Hardened ingestion and audit | Audit exits non-zero on wrong columns, fewer than 25,000 total rows, unmatched LOR IDs or an unset lag cutoff. Street filter by `DELIKT`/`ERFASSUNGSGRUND`. Unit tests run against a committed fixture (`tests/fixtures/`, a few thousand rows with cellar rows and edge cases); the live-data range check runs in the refresh workflow. Lag N, window and daytypes come from one config file |
| M2 | Cleaning pipeline | Street filter, lag truncation, time-band mapping, proportional allocation of offence windows. Tests: counts conserved; truncation removes exactly the rows newer than the cutoff |
| M3 | Baselines and backtest | Citywide-share and raw area-history baselines; two rolling hold-out folds (Apr 1-Jun 30 and Jul 1-Sep 29 2026; the latter ends at the 14-day truncation cutoff); deviance and Spearman reported |
| M4 | Hierarchical Empirical Bayes model | Gamma-Poisson shrinkage: area, then Bezirksregion, then city. Time band and bike class enter as **citywide multipliers** on the area level; an area-specific time or class profile is used only if it beats that on hold-out. Meets the targets in section 2, or the better baseline ships and `model_type` says so |
| M5 | Lookup generator | `build_lookup_json.py` writes `lookup_schema_v1.json` with metadata generated from data; JSON Schema validated in CI; all 542 areas present, zero-record areas flagged |
| M6 | Confidence and verdict logic | Numeric basis (report count, interval width) mapped to a labelled confidence by a documented rule. Tests: thin or no data never yields calm styling or "normal/lower" wording; reason strings come only from data-derived templates |
| M7 | Advice catalog and router | Generated from `lock-tier-documentation.md` (VdS 2597 A+/B+; no Sold Secure; never a frame or cable lock alone; no relocation advice). Tests per tier, bike class and time band, including a check that no string claims a per-bike risk. Each lock term explained in plain words. All copy held in a string table; the MVP is English only (D-11) |
| M8 | Client on the locked schema | Location or tap; place search by planning-area and district name, plus street and station if the Phase 1 gazetteer passes (WP 1.7); time and bike selectors **as the capability table allows**; answer card in this order (D-09): (1) risk assessment: tier, confidence, "limited data" flag, and the "typical for this kind of area" line only if S1 is adopted; (2) lock advice; (3) a breakdown of where the information comes from: how risk is assessed (report count, period, area, data date, method in one line) and the source of the lock advice (police, ProPK, VdS, ADFC guidance). Baseline accessibility built in (contrast, labels, colour never the only signal). Works at 375 px; location-denied, outside-Berlin and no-result states; no mock text in the build |
| M9 | Shippable static release | Static deployment with the bundled JSON as the only data dependency. Offline: app shell, data and polygons are cached; basemap tiles are not, so offline shows polygons without a basemap and a notice |
| M10 | Attribution and "About the data" | Polizei Berlin (CC-BY 4.0), LOR (dl-de/by-2-0), OSM (ODbL) shown in the UI and in `metadata`, checked by a test. The About page also serves as "How this works" and lists the limits (open data is about three quarters of the PKS figure, under-reporting, lag, one season). The rider-feedback feature is S6 |
| M11 | Automated weekly refresh | Cron opens a PR with the regenerated JSON. PR creation needs either the repository setting "Allow GitHub Actions to create and approve pull requests" (currently off) or a PAT/GitHub App token; PRs opened with the default token do not trigger other workflows, so the schema, row-count and tier-sanity checks run as **steps inside the refresh workflow** and block PR creation on failure. Failure keeps the last good JSON and opens an issue. A no-op dry-run PR is opened by Fri 6 Nov. Merged and enabled by Fri 13 Nov so the first cron run is Mon 16 Nov 06:00 UTC |

### Should have

| ID | Capability | Acceptance criteria / kill criterion |
| --- | --- | --- |
| S1 | OSM exposure proxy and Poisson GLM (`osmnx`) | Adopted only if it improves hold-out deviance over M4 and rankings are stable across folds. Time-box 1.75 pd, Tue pm to Thu; decision Thu 5 Nov 17:00. Adoption changes numbers only, never the UI. Otherwise `model_type` stays `eb_gamma_poisson`, the answer-card line is omitted, and the reason is documented |
| S2 | Area statistics (lock-defeated share, median stolen value) | Minimum-n rule (< 20 cases: citywide value, labelled); dropped from the router if between-area variation is negligible |
| S3 | 30-day anomaly badge | Trailing 30-day count above the 95% Poisson upper bound of the area's expected count, only where expected count >= 3; tested on injected spikes |
| S4 | FastAPI service, container, client fallback | `/api/v1/risk`, `/areas`, `/healthz`; `docker build` and smoke test in CI; client falls back after 1.5 s. Not publicly hosted (D-13): demonstrated locally and in CI, with a configurable API base URL that is unset in production. Cut decision at G2 (section 5 ladder) |
| S6 | Report wrong information or give feedback | A rider can report information that looks wrong or give general feedback from the answer card. **How feedback is collected is not decided (parked, D-14).** Provisional 0.25 pd in Phase 3 (WP 3.6), to be re-estimated once the approach is chosen |
| S7 | Accessibility audit | Screen-reader and keyboard pass on the release build; contrast verified (the baseline is part of M8) |

### Could have (not scheduled)

Pulled forward only into confirmed Phase 3 slack before Gate 3; otherwise a backlog after graduation: share link (area ids and time band only) · two-place compare view · German and other languages (nice-to-have if time remains; the string table makes it a translation task) · anonymized aggregate usage analytics (D-10) · finer bike classes · multi-criteria filters · guideline-URL health check in CI · dark mode.

### Won't have (this release)

Live weather or forecasts · runtime inference of any kind · accounts, saved places or rider tracking · cities other than Berlin · route planning, live reports, alerts · neighbourhood rankings or "unsafe" labels · lock product or brand recommendations and Lock Budget · seasonality modeling · EM allocation of offence windows (replaced by proportional allocation) · parking-duration risk (not in the data) · in-app analytics and polls in the MVP (D-10) · public hosting of the API (D-13) · load testing of GitHub Pages.

### Scope ladder (cut order if the plan slips)

1. Could-have items. 2. S3 anomaly badge. 3. S6 report/feedback feature. 4. S7 audit beyond the M8 baseline. 5. S1 OSM/GLM (decision Thu 5 Nov). 6. S4 FastAPI (decision at G2; if cut, the G3 resilience and API criteria are tested on the static and offline path, and the docs state the API as designed, not shipped). Must-haves are not cut; if one is at risk at a gate, the gate's fallback in section 7 applies.

---

## 6. Roadmap

### 6.1 Calendar

| Phase | Dates | Theme | Gate | Fixed event |
| --- | --- | --- | --- | --- |
| Week 0 | Oct 19-23 | Discovery, prototype, user research, roadmapping | n/a (complete) | |
| 0 | Fri Oct 23 to Mon Oct 26 noon | Foundation and ingestion guardrails | **G0** Mon Oct 26, review 11:30 | |
| 1 | Oct 26-30 | EDA, baseline engine, UI scaffold | **G1** Fri Oct 30 | |
| 2 | Nov 2-6 | Features, real data end to end, usability test #1 | **G2** Fri Nov 6, 15:00 (midterm readiness) | |
| 3 | Nov 9-13 | Midterm, robustness, automation, governance, stress test | **G3** Fri Nov 13 (feature freeze, RC1) | **Midterm Tue Nov 10** |
| 4 | Nov 16-20 | Defect fixing, polish, documentation, rehearsal | **G4** Tue Nov 17 (pitch build); hard freeze Thu Nov 19 12:00 | **Dry-run Wed Nov 18; Graduation Fri Nov 20** |

No weekend work is planned; weekends are buffer.

### 6.2 Work packages, estimates and owners

Estimates are person-days (pd). Net capacity is 4 pd per person per full week, 8 pd for the team: 5 days less 20% for reviews, meetings and PM duties. Event time (midterm, dry-run, graduation) is planned **inside** that net capacity, as work packages. Roles: **Data** (pipeline, model, validation, API, CI) and **UX** (frontend, copy, advice templates, usability sessions). The person holding the PM role in a week still works in their stream.

**Phase 0: Foundation (Fri Oct 23 to Mon Oct 26 noon). Net capacity ~1.2 pd per person (2.4 team), planned 2.25 (Data 1.25: WP 0.2 now includes the admin action and token decision and slightly overruns Data's share, absorbed by the G0 fallback day)**

| WP | Work | pd | Owner |
| --- | --- | --- | --- |
| 0.1 | Harden audit (asserts, exit codes, column-based street filter); `config.py` with N = 14, window, daytypes; committed test fixture | 0.75 | Data |
| 0.2 | PR CI (pytest); enable required status checks on `main` (not enabled today; repo admin action); CODEOWNERS; decide the PR-creation token approach for M11 (setting vs. PAT/App) | 0.5 | Data |
| 0.3 | Issues for M1-M11 with acceptance criteria; `STATUS.md`; decision log | 0.5 | PM (Burcak) |
| 0.4 | Rider recruiting: outreach sent for 8 riders (5 for Nov 5-6, 3 for Nov 11-12) | 0.5 | UX |

**Phase 1: Baseline engine and scaffolding (Oct 26-30). Net capacity 8.0, planned 8.0 (Data 4.0, UX 4.0). No time slack: the buffer is the fallback list in G1**

| WP | Work | pd | Owner | Window |
| --- | --- | --- | --- | --- |
| 1.1 | EDA and capability table (`docs/eda-findings.md`); both review and sign | 1.5 | Data 1.0, UX 0.5 | Mon pm-Wed |
| 1.2 | Cleaning pipeline, window allocation, tests (M2) | 1.0 | Data | Wed-Thu |
| 1.3 | Baselines and rolling-origin backtest (M3) | 1.0 | Data | Thu-Fri |
| 1.4 | EB model v0, tiers, calibration and fairness report, hold-out validation of every selector the card shows (M4); generator v0 emits all 542 areas from real data | 1.0 | Data | Thu-Fri |
| 1.5 | Schema v1: JSON Schema and sample; draft Thu, **final lock Fri 11:00** after the model run; later changes additive only | 0.5 | UX, Data review | Thu-Fri |
| 1.6 | Frontend scaffold (Vite build, vendored libraries, 542 polygons, schema-driven render on a fixture); Pages workflow for `frontend/` deploying a hello page by Thu 29 Oct (`pages.yaml` deploys only `demo/` today) | 1.5 | UX | Mon-Thu |
| 1.7 | Basemap decision (DEP-3); place-search gazetteer: street and station to area from open data, prototype fixed at 0.75 pd. Not feasible by Fri -> fall back to area and district name search. The gazetteer is not cut for the scaffold: the Pages hello page may slip to Fri 30 Oct but must deploy by G1, and the gazetteer verdict is due Fri. Street and station search is measured in usability test #1 (hypothesis H3) | 1.25 | UX | Mon-Fri |
| 1.8 | Confirm midterm and graduation formats (DEP-6); identify outside statistics reviewer (DEP-1); confirm 5 riders with dates (DEP-2) | 0.25 | PM (Fritz) | Mon-Fri |

**Phase 2: Features and working fallback (Nov 2-6). Net capacity 8.0, planned 8.0 (Data 4.0, UX 4.0). S1 is the Data buffer: if killed, its 1.75 pd is released**

| WP | Work | pd | Owner | Window |
| --- | --- | --- | --- | --- |
| 2.1 | OSM features and Poisson GLM (S1); decision Thu 17:00 | 1.75 | Data | Tue pm-Thu |
| 2.2 | Area statistics, confidence rules (Data); advice catalog, router, templates (UX) (S2, M6, M7) | 1.5 | Data 0.5, UX 1.0 | Mon-Tue |
| 2.3 | Generator on EB output with advice and confidence; schema validation in CI (M5); no-op dry-run refresh PR (M11) opened by Fri 6 Nov | 1.25 | Data | Mon-Tue |
| 2.4 | UI on real data from the G1 sample: selectors per capability table, place search, answer card, error states, About and attribution (M8, M10) | 1.5 | UX | Mon-Wed |
| 2.5 | Production deployment of the built frontend; offline caching (M9); the mock `demo/` deployment is removed or redirected after G2. **Test build frozen Wed 4 Nov 18:00** | 0.5 | UX | Wed |
| 2.6 | Usability test #1: 5 riders (Thu 5 Nov: 3, Fri 6 Nov morning: 2); moderator + note-taker; synthesis | 1.0 | Both | Thu-Fri |
| 2.7 | Midterm storyline and slide draft | 0.5 | UX | Fri |

**Phase 3: Midterm, robustness, automation, governance (Nov 9-13). Net capacity 8.0, planned 7.75 (Data 4.0, UX 3.75) plus 0.25 UX buffer**

| WP | Work | pd | Owner | Window |
| --- | --- | --- | --- | --- |
| 3.1 | Midterm: build verification, a screen recording of `midterm-v0.9` and a local static copy on a laptop (no venue network needed) by Mon, rehearsal Mon, presentation Tue | 1.5 | Both (Data 0.5, UX 1.0) | Mon-Tue |
| 3.2 | Midterm feedback triage and wording fixes from tests #1 | 0.5 | UX | Wed |
| 3.3 | FastAPI, Dockerfile, client fallback (S4); CI build and smoke test | 1.5 | Data | Wed-Thu |
| 3.4 | Refresh workflow opening a PR with checks; dry-runs with a valid and a corrupted CSV; merged and enabled by Fri (M11) | 1.0 | Data | Wed-Thu |
| 3.5 | Anomaly badge with injected-spike tests (S3); first on the cut ladder | 0.5 | Data | Thu |
| 3.6 | Governance: attribution test, privacy check (network panel shows only our origin and the chosen tile provider, plus anything the S6 approach adds, once decided), ODbL read (DEP-5), no-tracking verification; report/feedback feature (S6) | 1.0 | UX | Wed-Thu |
| 3.7 | Usability test #2 (3 riders, Wed 11-Thu 12 Nov) and fixes | 0.75 | UX | Wed-Thu |
| 3.8 | Stress and resilience tests: automated browser outage and slow-API test (UX 0.5); 50+ concurrent users against a local production build, and API load (Data 0.5); RC1 tag | 1.0 | Both | Thu-Fri |

**Phase 4: Release, polish, rehearsal (Nov 16-20). Net capacity 8.0, planned 7.0 (Data 3.5, UX 3.5) plus 1.0 buffer. Dry-run and graduation are inside WP 4.5**

| WP | Work | pd | Owner | Window |
| --- | --- | --- | --- | --- |
| 4.1 | Defects from tests #1-#2, the stress test and any Gate 3 miss | 1.5 | Both | Mon-Tue |
| 4.2 | UI polish and accessibility audit (S7); device matrix (iOS Safari, Android Chrome, 375 px) | 1.5 | UX | Mon-Tue |
| 4.3 | Documentation: README matched to reality, architecture diagram, refresh and fallback runbook; first cron run (Mon 16 Nov 06:00 UTC) verified | 1.0 | Data | Mon-Tue |
| 4.4 | Technical deviation and calibration report (backtest, calibration, fairness, limits) | 1.0 | Data | Mon-Tue |
| 4.5 | Pitch deck and demo script; screen recording and local static copy of the pitch build by Tue 17 Nov; dry-run Wed, graduation Fri; after Wed only deck, script and typo-level copy changes | 2.0 | Both | Mon-Fri |

### 6.3 Critical path

EDA capability table (1.1) -> model run and schema lock (1.4, 1.5) -> generator and real-data UI (2.3, 2.4) -> deployed test build, frozen Wed 4 Nov 18:00 (2.5) -> usability test #1 (2.6) -> **midterm build** -> container, fallback and stress tests (3.3, 3.8) -> RC1 (G3) -> pitch build (G4).

Off the critical path, can slip a day without moving a gate: S1 (until Thu 5 Nov), S3, S7, documentation.

---

## 7. Milestone gates

Each gate is a go/no-go call made in a 30-minute review on the date shown, by the PM of the week with both people present. A failed criterion triggers the listed fallback, decided in advance.

### Freeze ladder

| Point | Rule |
| --- | --- |
| G2 Fri 6 Nov | `midterm-v0.9` tagged |
| Mon 9 Nov 12:00 to the end of the midterm Tue 10 Nov | No merges to `main` except a demo-critical fix approved by both; Phase 3 work continues on branches |
| **G3 Fri 13 Nov** | **Feature freeze:** no new feature starts; RC1 tagged |
| Mon-Tue 16-17 Nov | Defect fixes, polish, documentation only |
| RC1 to graduation | **No refresh PR is merged.** The pitch build is pinned to the tagged `lookup_schema_v1.json`; after the first cron run (Mon 16 Nov) is verified at G4, the cron schedule is disabled until after graduation, so deck, report and live site cannot drift apart |
| **G4 Tue 17 Nov EOD** | Pitch build frozen |
| Wed 18 Nov | Dry-run on the pitch build; afterwards only deck, script and typo-level copy changes |
| **Thu 19 Nov 12:00** | Hard freeze: no merges except P0 fixes approved by both |

### G0: Foundation, Mon 26 Oct (review 11:30 at the Monday sync; Fritz, as incoming PM, makes the call)

- [ ] Audit exits 0 on the current CSV and non-zero on a corrupted copy (bad delimiter, truncated file, missing column), one test each, run against the committed fixture.
- [ ] Delimiter and encoding detected (ISO-8859-1 today); 542 polygons; **0 CSV area IDs missing from the polygons**; the 8 zero-record areas listed in the audit output.
- [ ] Lag cutoff N = 14 days and its derivation (p95 = 10, rounded up for censoring) in `config.py`.
- [ ] Street-filter rule covered by fixture tests; the live count (29,212 street rows in the 2026-10-13 dump) is reported by the audit, with a range check in the refresh workflow.
- [ ] CI runs tests on PRs and is a **required status check on `main`** (not enabled today); the M11 PR-token approach is decided; issues M1-M11 exist; rider outreach sent.
- **Fallback:** one extra day taken from the 0.75 pd gazetteer prototype (WP 1.7) and Phase 2 slack; EDA starts after the review at noon.

### G1: Baseline engine, Fri 30 Oct

- [ ] **Capability table signed** (`docs/eda-findings.md`): every filter and label maps to a data field and a density result; unsupported ideas are cut or relabelled.
- [ ] Deviance better than the citywide baseline and within 1% of or better than the raw area-history baseline, on both folds. Spearman >= 0.6 (Jul-Sep). >= 70% of High-tier areas in the actual top quartile.
- [ ] **Every selector the card shows is validated on hold-out** (time band, bike class, daytype). A selector that fails or is too sparse is shown as a citywide pattern, labelled "citywide pattern", and area tiers stay area-only. Offence hours are "last seen" values spread by proportional allocation, so no area-specific time-of-day claim ships without this check.
- [ ] **Calibration:** observed hold-out thefts per area rise across Low < Medium < High, and the High mean is at least 2x the Low mean.
- [ ] **District fairness report** produced and reviewed: per district, share of areas in the High tier against share of areas in the actual top quartile; every district off by more than a factor of 2 is explained (for example spatial concentration), not hidden. This is a report, not a pass/fail threshold.
- [ ] Tier shares near 60/25/15 are an assertion in the generator, not a gate.
- [ ] Schema v1 locked (Fri 11:00) and validated; generator emits all 542 areas from real data.
- [ ] UI renders 542 polygons, the selectors and the answer card from the schema with no console errors at 375 px and on desktop; the `frontend/` build deploys to Pages.
- [ ] Outside statistics reviewer identified; 5 riders confirmed with dates; gazetteer verdict (feasible or fallback); basemap decision.
- **Fallbacks:** (a) planning-area tiers fail -> ship Bezirksregion (143) tiers with the same UI; (b) the model fails entirely -> ship the best baseline labelled "indicative", with the product leading on lock advice; (c) a near-miss -> one extra day taken from the Phase 2 Data buffer (S1 is first to shrink).

### G2: Real data end to end and midterm readiness, Fri 6 Nov, 15:00

- [ ] The deployed site runs on **real precomputed data**; `grep -i mock` over the build output is empty.
- [ ] Offline behaviour as in M9 verified.
- [ ] Usability test #1 (Thu-Fri): >= 4 of 5 explain the tier and the confidence label; median time to decision < 60 s; **trips measure passes** (section 2); >= 3 of 5 saying they would use it is recorded as background, and if the two disagree the trips measure decides. Interview-guide hypotheses H1-H7 recorded with evidence.
- [ ] Advice tests pass: no frame lock alone, no Sold Secure or brand, no relocation advice; thin data never reassured.
- [ ] S1 decision taken (Thu 17:00); S4 keep-or-cut decision taken.
- [ ] Outside reviewer has no open blocking comment on the model, or the DEP-1 fallback has been applied and the claim dropped.
- [ ] `midterm-v0.9` tagged; midterm storyline and slides drafted (WP 2.7); the recording and local copy follow by Mon 9 Nov (WP 3.1).
- **Fallbacks:** a usability miss -> the tested build goes to the midterm as is, with the results and the planned fixes presented; wording and layout rework happens Wed-Thu of Week 3 (WP 3.2, 3.7); S3 and S7 are cut first. A "narrow or stop" signal on value is raised with both people and taken to the midterm as a decision, not hidden.

### G3: Robustness and feature freeze, Fri 13 Nov

- [ ] `docker build` and `docker run` clean locally and in CI; `/healthz` and a risk query return the same answer as the static JSON (skipped if S4 was cut at G2; then the resilience test covers the offline and cached path).
- [ ] **Outage simulation:** with the container stopped, and with a 5 s artificial delay, the client falls back within 1.5 s and shows the identical answer (automated browser test).
- [ ] Refresh workflow merged and enabled. A manual run opens a PR whose in-workflow checks pass; a corrupted CSV fails those checks, opens no PR and leaves the served JSON unchanged.
- [ ] **Stress test passed:** 50+ concurrent users against a local production build, 0 errors, p95 load < 3 s on throttled mobile; API load result recorded. GitHub Pages itself is not load-tested.
- [ ] Attribution test passes; no third-party requests other than the decided tile provider and whatever the S6 approach adds, disclosed on the About page; ODbL question answered or the OSM-derived aggregates removed.
- [ ] Usability test #2: no new blocking wording issue.
- [ ] **RC1 tagged. Feature freeze.** Anything not done moves to Won't for this release.
- **Fallbacks:** missing items are fixed Mon-Tue of Week 4 inside WP 4.1 or moved to Won't. No new feature starts after G3.

### G4: Pitch build, Tue 17 Nov EOD

- [ ] All Must items done; every Should done or recorded as Won't with the reason.
- [ ] README quickstart works on a clean clone, executed by the person who did not write it.
- [ ] Fallback path re-verified on the release build; the scheduled refresh has run from cron on Mon 16 Nov 06:00 UTC (or its failure is understood and fixed), its PR is **not** merged, and the cron schedule is then disabled (freeze ladder).
- [ ] Deviation and calibration report in `docs/`, failures stated plainly.
- [ ] Zero open P0 or P1 defects at the review.
- [ ] Pitch deck figures match the report and the verified-facts list in `product-discovery.md` (no press figures).
- After G4 follow the freeze ladder: Wed 18 Nov dry-run, Thu 19 Nov 12:00 hard freeze, Fri 20 Nov graduation.

---

## 8. Quality and test plan

| Layer | What | When |
| --- | --- | --- |
| Data | Audit with asserts; schema and range checks; LOR alignment | Every PR (fixture) and every refresh (live data) |
| Pipeline | Unit tests: filter, truncation, allocation conserves counts, time-band mapping | Every PR |
| Model | Baseline comparison on two folds; calibration and district fairness report; shrinkage property tests | Gate 1, every refresh |
| Copy and advice | Router tests per tier x class x band; no "safe" strings; thin data never reassured; every reason string comes from a data-derived template | Every PR |
| Schema | JSON Schema validation of the artifact; metadata generated, never typed | Every PR |
| UI | Browser tests: location denied, outside Berlin, no results, offline; 375 px layout | From Week 2 |
| Resilience | API up, down, 5 s slow; fallback within 1.5 s; identical answers | Gate 3 |
| Load | 50+ concurrent users on a local production build; API load | Gate 3 |
| Usability | Test #1 (5 riders, Week 2), test #2 (3 riders, Week 3); moderated, scripted from the interview guide, observation over opinion | Gates 2 and 3 |
| Accessibility | Baseline in M8 (contrast, labels, colour-independent signals); audit in Week 4 | Weeks 2-4 |

---

## 9. RAID

### Risks

| # | Risk | L | I | Mitigation | Owner | Trigger |
| --- | --- | --- | --- | --- | --- | --- |
| R1 | Sparse cells and zero-inflation make tiers unstable; 8 areas have no data | H | H | Hierarchical shrinkage; numeric confidence with a documented rule; Bezirksregion fallback (G1 fallback a) | Data | G1 backtest |
| R2 | Reporting lag and a single season bias the recent window and the hold-out | H | M | N = 14 truncation from one constant; "data up to" date on every answer; two-fold backtest; seasonality stated as not modeled | Data | G0, G1 |
| R3 | Plausible but wrong AI-written statistics go unnoticed | M | H | Library implementations; property tests; baseline comparison gate; outside review before G2 | PM of week | G1, G2 |
| R4 | Legal, attribution and privacy: ODbL share-alike on OSM-derived aggregates; IP leakage via CDN and tile requests (and the S6 approach, once chosen); advice read as a guarantee | M | H | Attribution test; aggregate OSM counts only; vendored libraries; tile decision by 30 Oct; legal read by 12 Nov; "not a guarantee" on every answer | UX | G3 |
| R5 | Capacity: Phases 1 and 2 are planned at 8.0 of 8.0, with no time slack | H | H | Scope ladder (section 5); S1 is the Data buffer in Phase 2; 0.25 pd UX buffer in Phase 3 and 1.0 pd in Phase 4; fallbacks defined per gate; any gate slip over one day triggers the next ladder cut | PM of week | Any gate slip over 1 day |
| R6 | PM handoff loses context between two people | H | M | Monday 15-minute sync; written `STATUS.md` by Friday; issues for every WP; PRs under ~300 lines; schema ownership does not rotate | PM of week | Every Monday |
| R7 | Refresh job breaks silently or publishes bad tiers; branch protection blocks a direct push; Actions cannot create PRs under current settings; first cron run is Mon 16 Nov | H | M | PR-based refresh; schema and range checks; failure keeps the last good JSON and opens an issue; merged and enabled by Fri 13 Nov | Data | G3 |
| R8 | Demand and trust unproven: personas and interviews are synthetic and ran on mock data | M | H | Real-rider tests on real data (G2, G3); go/narrow/stop decision at G2; findings treated as hypotheses | UX | G2 |
| R9 | Rider recruiting fails (test dates are fixed) | M | M | Outreach sent by G0, 5 confirmed with dates by G1, 3 more by G2; fallback: classmates and ADFC contacts; if short, test with 3 and report n | UX | G1 |
| R10 | Midterm or graduation format differs from assumptions | M | M | Confirm by 30 Oct (DEP-6) | PM | G1 |

### Assumptions

- A-1: Both people work full-time Monday to Friday in Weeks 1-4; weekends are buffer only.
- A-2: The EDA capability table fits in two days and does not change the architecture.
- A-3: `osmnx` extraction for 542 areas completes within the S1 time-box.
- A-4: GitHub Pages and GitHub Actions remain the hosting and CI platforms; no paid services, hence no public API host.
- A-5: The Polizei Berlin CSV stays available at the current URL and keeps its schema.

### Issues (open now)

| # | Issue | Action | Due |
| --- | --- | --- | --- |
| I-1 | Refresh workflow cannot push to protected `main`; Actions cannot currently create PRs (setting off, default token read-only) and PRs from the default token do not trigger checks | Token approach decided in WP 0.2; checks run inside the workflow; dry-run PR by Nov 6 (WP 3.4 completes it); workflow stays disabled until the build step exists | Nov 13 |
| I-2 | Audit script asserts nothing | WP 0.1 | Oct 26 |
| I-3 | Sample JSON contradicts lock guidance and the data window | Regenerated in WP 2.2 and 2.3 | Nov 3 |
| I-4 | Prototype labels (Standard/E-bike, Morning/Evening, area-only search) do not match the data | Rebuilt from the capability table (WP 2.4) | Nov 4 |

### Dependencies

| # | Dependency | Needed by | Owner |
| --- | --- | --- | --- |
| DEP-1 | Outside statistics reviewer: a candidate and a named backup agreed by Oct 26, identified (G1), written feedback Nov 4. **Fallback applied Nov 4:** a documented self-review checklist and a limits section, with the "externally reviewed" claim dropped | Oct 26 / Oct 30 / Nov 4 | PM |
| DEP-2 | Riders: outreach sent (G0); 5 confirmed with dates (G1: tests on Nov 5-6); 3 more (G2: tests on Nov 11-12) | Oct 26 / Oct 30 / Nov 6 | UX |
| DEP-3 | Basemap or tile decision, including a polygon-only fallback | Oct 30 | UX |
| DEP-4 | Street/station-to-area source for place search | Oct 30 (verdict in WP 1.7) | UX |
| DEP-5 | Legal or open-data read on ODbL | Nov 12 | UX |
| DEP-6 | Midterm and graduation formats and slot lengths | Oct 30 | PM |

### Decision log

| # | Decision | Status | Rationale |
| --- | --- | --- | --- |
| D-01 | Plan runs Oct 26 to Nov 20 with fixed events; feature freeze at G3 | Decided | Fixed dates; testing before the final week |
| D-02 | Lag cutoff N = 14 days | Decided | p95 = 10 days measured on an already-biased sample |
| D-03 | Tiers are relative percentile bands (60/25/15); the card also shows the absolute report count | Decided | Simple and comparable; avoids false precision |
| D-04 | Static JSON is the source of truth; API is an optional layer | Decided | Resilience and maintenance cost |
| D-05 | Offence windows allocated proportionally across time bands, not EM | Decided | Deterministic, testable, fits the runway |
| D-06 | Refresh opens a PR instead of pushing to `main` | Decided | Branch protection and human review of data changes |
| D-07 | Bike class: value band (< EUR 1,000 / >= EUR 1,000) or grouped bike type | Provisional (EDA) | No e-bike field in the data |
| D-08 | Three daytypes (Mon-Thu, Fri, Weekend) and four dayparts | Provisional (EDA) | Inherited from the audit code; to be tested against the hour curve |
| D-09 | The answer card has three blocks in this order: [Risk assessment], [Lock advice], [Breakdown of where the information comes from: how risk is assessed and where the lock advice is sourced] | Decided (team) | Answers the core question first, then the action, then the evidence that supports trust |
| D-10 | No analytics in the MVP. Follow-up: anonymized aggregate usage measurement to gauge success. Individual users are not tracked (a requirement), so a per-user monthly-active-users metric is not available; aggregate visit and event counts are the option | Decided (team); follow-up after the MVP | Success measurement needs some usage signal; it must not identify people. Until then, success is measured through the moderated tests |
| D-11 | The MVP is English only. Copy lives in a string table from the start (M7); German and other languages are a nice-to-have follow-up if time remains | Decided (team) | Keeps the MVP small; the string table keeps translation cheap later |
| D-12 | Parking-duration risk is out of scope | Decided | Duration is not in the data |
| D-13 | The API is not publicly hosted; the deployed site is static and the API is demonstrated locally and in CI | Decided | No paid hosting (A-4); static default is the product |
| D-14 | "Report wrong information / give feedback" is a feature (S6). The mechanism (for example a link, an in-app form, or something else) is not decided and is not needed before Phase 3 | Parked | Avoids committing to a privacy and hosting trade-off before the rest of the plan is settled |
| D-15 | The value gate rests on the trips measure, not stated intent: stated "would use it" is kept as background because riders tend to answer politely. Pass mark: >= 3 of 5 name a concrete trip, >= 2 beyond a daily spot (split reported as new place vs. usual place). With only 5 riders one person is the difference between pass and narrow, so test #2 (3 riders) adds data and the combined 8 are read together before any "stop" | Proposed: confirm 26 Oct | Intent is cheap to give; naming a real trip is behavioural evidence |

---

## 10. Open items

| # | Item | Owner | Due |
| --- | --- | --- | --- |
| O-1 | Midterm (10 Nov) and graduation (20 Nov) formats, slot lengths, audience, whether a live demo is allowed (= DEP-6) | PM | Oct 30 |
| O-2 | Confirm the PM rotation in section 11 | Both | Oct 26 |
| O-3 | Whether graduation needs the live deployed URL or a recorded fallback demo (plan: both; recording and local copy are WPs 3.1 and 4.5) | PM | Oct 30 |
| O-4 | Decide how S6 (report wrong information / give feedback) is implemented, including any privacy and hosting implications | Both | Nov 6 (before WP 3.6) |

---

## 11. Team organisation

### PM rotation and stream allocation

| Week | PM | Fritz | Burcak | Joint deliverable |
| --- | --- | --- | --- | --- |
| 0 tail (Oct 23-26) | Burcak | Data: WP 0.1, 0.2 | PM + UX: WP 0.3, 0.4 | G0 review Mon 11:30 |
| 1 (Oct 26-30) | Fritz | PM + Data: EDA, pipeline, baselines, EB model | UX: scaffold, basemap, gazetteer | Capability table; schema lock (Fri 11:00); G1 Fri |
| 2 (Nov 2-6) | Burcak | Data: generator, stats, OSM/GLM | PM + UX: advice, UI on real data, deploy, slides | Usability test #1 (one moderator, one note-taker); G2 Fri |
| 3 (Nov 9-13) | Fritz | PM + Data: container, refresh PR, anomaly, stress test | UX: governance, test #2, fixes, midterm deck | Midterm Tue; G3 Fri |
| 4 (Nov 16-20) | Burcak | Data: report, docs, resilience re-check | PM + UX: polish, accessibility, deck | G4 Tue; dry-run Wed; graduation Fri |

The rotation is an assumption; swap names if the actual order differs. Single-person risk is managed explicitly: PR reviews are returned within 24 hours (a pending review blocks the critical path, so the reviewer clears it first); if the Data owner is out, the UX owner takes over the generator, documentation and the report skeleton, and the scope ladder is applied at once; G1 near-miss fallback (c) is pre-authorised at Mon 2 Nov noon without a new meeting. Fixed rules: the PM owns the board, the weekly priorities, the gate call and the handoff note; **a "narrow or stop" decision at a gate needs both people**; schema changes need a version bump and both sign-offs; the outgoing PM hands over at most two half-finished items.

### RACI

| Workstream | Responsible | Accountable | Consulted | Informed |
| --- | --- | --- | --- | --- |
| Data ingestion, audit, pipeline, model | Data owner | PM of the week | Outside reviewer | Other person |
| Schema and artifact | Both | PM of the week | n/a | n/a |
| Advice catalog and copy | UX owner | PM of the week | Lock-tier doc owner | Both |
| Frontend and deployment | UX owner | PM of the week | Data owner | Both |
| API, container, refresh workflow | Data owner | PM of the week | n/a | Both |
| Usability tests | Both | PM of the week | Recruited riders | Both |
| Gate decisions | PM of the week | Both (on narrow/stop) | n/a | n/a |
| Midterm and graduation presentations | Both | PM of the week | n/a | Programme staff |

### Cadence

| Ritual | When | Purpose |
| --- | --- | --- |
| Monday handoff sync | Mon 09:00, 15 min | Context transfer and the week's plan (template below) |
| Midweek check | Wed, 10 min | Burn-down against WPs; early cut-order call |
| Gate review | Dates in section 7, 30 min | Go/no-go against criteria |
| Handoff note | Fri by 17:00 | Outgoing PM writes `STATUS.md` |

Special weeks: Mon 26 Oct has the sync at 09:00 and the G0 review at 11:30, then the EDA starts; Mon 9 Nov is shortened (rehearsal day, midterm on Tuesday); Mon 16 Nov also covers the dry-run and graduation plan.

### Monday Morning 15-Minute Handoff Sync

| Min | Topic | Lead | Output |
| --- | --- | --- | --- |
| 0-2 | Gate status: next gate, its date, criteria red and green | Outgoing PM | Red items named |
| 2-6 | Done, in flight and blocked, taken from the board; what is on `main`; at most two carry-over items | Outgoing PM | Carry-over list |
| 6-9 | Decisions made last week and why; decision log current | Outgoing PM | Log updated |
| 9-12 | This week: top three outcomes, who does what, cut order if behind | Incoming PM | Board updated |
| 12-14 | Risks and surprises; external dependencies (riders, reviewer, legal) | Both | RAID updated |
| 14-15 | Confirm: "this week succeeds if..." and who unblocks whom | Both | One line at the top of `STATUS.md` |

```md
# Status, week N (PM: <name>), updated <date>

## Gate
Next gate: <G?>, <date>. Criteria red: <list> | green: <list>

## Last week
- Done (merged): <issue/PR links>
- In flight (owner, % done, blocker): <max 2>
- Dropped or parked, and why: <items>

## Decisions (also in the decision log)
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
Branches: <list>. Data: CSV fetched <date>, lookup generated <date>. Open PRs: <links>.
```

---

## Appendix A: Documentation reconciliation

Changes the team agrees to make so the documents tell one story. "Done" items are committed on `docs/roadmap`.

| # | Conflict | Resolution | State |
| --- | --- | --- | --- |
| 1 | `scope-definition.md` plans 3 weeks with a Week 4 "cushion"; the programme runs to Week 4 with fixed events | Four phases through Week 4; feature freeze at G3; stress-testing in Week 3 | Done once the 2.1 edit to `scope-definition.md` is committed |
| 2 | OSM, FastAPI, anomaly flag and weekly refresh were Should/Could in scope docs but are required by the delivery plan | Refresh promoted to Must (M11); OSM and FastAPI kept Should with kill criteria; anomaly flag Should | This document |
| 3 | `executive-summary.md` asks for a two-week validation before building; scope docs build immediately | Validation questions become tests in G0-G2 | This document |
| 4 | Sample JSON window 2024-01-01 and lag 14 vs. measured window 2025-01-01 and p95 lag 10 | Metadata generated from data; N = 14 by decision | This document |
| 5 | README: "542 alignment", "about 20,000 outdoor thefts", "15-20 MB" | Corrected to measured values; status table added | Done (README) |
| 6 | Daytype "weekday/weekend" (scope docs) vs. three daytypes (audit, sample) | Provisional until the EDA (D-08) | Done (scope-definition) |
| 7 | `EBIKE` class in the schema vs. no e-bike field in the data | Value band or grouped type (D-07) | This document |
| 8 | Advice catalog cites Sold Secure and "frame + U-lock" | Regenerate from `lock-tier-documentation.md` (M7) | Open (WP 2.2) |
| 9 | README describes React/Vite, `src/api/main.py` and a push-to-`main` refresh that do not exist | Marked planned in the README; rewritten at G4 | Partly done |
| 10 | `scope-exploration.md`, `technical-brief.md`, `product-discovery.md` still reference "3 weeks", "24 months" and Week 1-2 validation | Update at G1 once the EDA fixes the facts | Open |
| 11 | Branch protection on `main` vs. a workflow that pushes to `main` | PR-based refresh (D-06) | Open (WP 3.4) |

## Appendix B: Evidence and limits

- Data figures in section 3.2 come from the local `Fahrraddiebstahl.csv` dump of 2026-10-13 and the audit script; density and hour-curve figures were computed from the same file during planning (and independently re-checked in a plan review) and are re-derived formally in WP 1.1.
- Not yet verified: the CC-BY 4.0 licence on the dataset page; the cost of `osmnx` extraction for all 542 areas; tile-provider terms; whether the gap to the PKS 2025 figure is coverage or definition.
- The user research in `docs/user-research/` used AI personas on the mock prototype; it informs hypotheses H1-H7 and the test scripts, not requirements.

## Appendix C: Glossary

| Term | Meaning |
| --- | --- |
| LOR / Planungsraum | One of Berlin's 542 official small areas; the map returns one result per area. A Bezirksregion (143) is the parent level; a Bezirk (12) is a district |
| PKS | Polizeiliche Kriminalstatistik, the official police crime statistics (here the 2025 short report) |
| EDA | Exploratory data analysis: profiling the dataset to decide what the product can honestly offer |
| EB / Empirical Bayes | Smoothing that pulls noisy counts from areas with few reports toward the parent area's average |
| Tier | Low / Medium / High risk band: relative percentile bands of 60% / 25% / 15% of areas |
| Daytype / daypart | Day grouping (Mon-Thu, Fri, Weekend) and time-of-day band |
| Deviance | A fit measure for count models; lower is better |
| Spearman | Rank correlation between predicted and actual theft ranking across areas |
| VdS 2597 A+/B+ | German lock-test standard referenced by the police and ADFC |
| G0-G4 | Milestone gates (section 7) |
| RC1 | Release candidate 1: the build tagged at Gate 3 |
| P0 / P1 | Defect severity: P0 blocks the core user loop or breaks a promise (privacy, honesty); P1 is a serious defect with a workaround |
| EOD | End of day |
| pd | Person-day |
| go / narrow / stop | The three possible outcomes of a gate: continue, reduce scope, or stop |
| WP | Work package (section 6.2) |
| ODbL, CC-BY 4.0, dl-de/by-2-0 | The licences of OpenStreetMap, the police data and the LOR boundaries |
