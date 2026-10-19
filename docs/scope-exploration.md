# LockOut - Scope Exploration

Draft based on the README and the AI ethics documents. Items marked **[TBD]** need team input. Numbers are working assumptions. The templates mix "3 weeks" and "4 weeks"; this draft uses **3 weeks** throughout (change it if the real deadline is 4).

---

## 1. Technical Feasibility Assessment

### Core AI Functionality

**What AI capability must work**: Given a Berlin location and time slot, return a calibrated bike-theft risk tier (Low / Medium / High) for the surrounding planning area (LOR, 542 areas), plus a lock-strategy recommendation.

**Technical approach**: Statistical modeling, not deep learning.

- Hierarchical Empirical Bayes smoothing: sparse area x time cells shrink toward the parent _Bezirksregion_ prior, then convert to percentile tiers (Low 0-60, Medium 60-85, High 85-100).
- (If it ships, see Should Have) Activity-adjusted residual: regress theft counts on OSM activity proxies (transit nodes, retail density, street infrastructure) to separate "busy" from "risky" (fixes the Volume Illusion).
- `model_type` in the lookup metadata is set from what actually ran (`hierarchical_eb_poisson_glm` with the OSM regression, plain `eb_gamma_poisson` without it).
- Reporting-lag truncation (drop the trailing ~10-14 days) and interval-censored offense windows (EM allocation for multi-day windows).
- Lock advice is a deterministic rule router (`src/advice_router.py`, from `lock-tier-documentation.md`): risk level + local aggravated-theft share (>= 80%) + median stolen value (>= EUR 1,000) + daypart + bike type map to an `advice_key` (`STANDARD_LOW/MEDIUM/HIGH`, `EBIKE_LOW_MEDIUM`, `EBIKE_HIGH`). No ML is involved in the advice, which keeps it auditable.
- Everything is precomputed offline into `data/processed/lookup_schema_v1.json` (risk tiers plus an `advice_catalog`), so serving is a lookup, not live inference.

**Data requirements**:

| Data                                    | Source                                                              | Status                                                                                                                                         |
| --------------------------------------- | ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Bicycle thefts (`Fahrraddiebstahl.csv`) | Polizei Berlin Open Data, CC-BY 4.0                                 | In repo pipeline (`src/fetch_police_csv.py`), cached fallback                                                                                  |
| LOR polygons (542)                      | Amt fuer Statistik / ODIS Berlin, dl-de/by-2-0                      | `data/raw/lor_planungsraeume_2021.geojson`                                                                                                     |
| Urban activity proxies                  | OpenStreetMap (ODbL)                                                | **[TBD]** extraction not yet built                                                                                                             |
| Lock-tier guidance                      | Polizei Berlin, ProPK (2026-06-03), VdS 2597 (2025-12), ADFC (2025) | Specified in `docs/lock-tier-documentation.md` (verbatim fact bank, `advice_catalog` JSON, router and URL-check code); still to be implemented |

**Complexity assessment**: **Medium**. The statistics are standard but need care (censoring, shrinkage, validation). The serving side is Simple. The OSM feature step is the least certain part.

### Team Capability Assessment

**Team setup**: Two people, alternating the PM role weekly, working with AI-assisted development (an AI coding assistant writes most first-draft code; humans review, test and decide).

**Skill Gaps**:

- Statistics review: neither of us can independently verify Empirical Bayes shrinkage and censoring choices, so AI-written model code risks going unchecked
- Geospatial OSM extraction (Overpass / osmnx) and point-in-polygon joins\

**Mitigation**: Use library implementations (`statsmodels`, `scipy`, `geopandas`, `osmnx`) instead of hand-rolled math. Start with a plain Gamma-Poisson shrinkage and treat EM censoring as optional. Every model step gets a test and a hold-out check, so correctness does not rest on reading AI-written code. Follow a Leaflet + Vite starter template.

### 3-Week Feasibility Checklist

- [x] **Core AI functionality** is within team's skill level (with AI assistance and a validation harness), as long as the model stays at Gamma-Poisson shrinkage plus one regression
- [x] **Required data** is accessible within first few days (police CSV, LOR GeoJSON and cached fallback already in place)
- [x] **Development tools** (APIs, libraries, cloud) are available: all open-source, no paid APIs
- [x] **Basic user interface** can be created with AI-assisted development and a Vite + Leaflet template (one page, one result card)
- [x] **Integration complexity** is manageable: precomputed JSON lookup, no live model, client-side geolocation
- [x] **Backup approach** exists if primary method fails: raw smoothed theft percentiles only (no OSM adjustment), and the FastAPI layer can be dropped by shipping the static JSON to the client

---

## 2. MVP Feature Definition

### 2.1 Core Value Definition

#### One-Sentence MVP Description

"In 3 weeks, we will build a Berlin bike-parking risk map that allows urban cyclists to check any location and time of day and achieve a clear lock-strategy decision before leaving their bike unattended."

#### Essential User Journey (MVP)

1. User starts with: a bike and a destination in Berlin, unsure whether the spot is risky and what lock to use
2. User interacts with AI by: allowing GPS or tapping the map, and choosing a daypart (e.g. Night), weekday or weekend, and a bike type (standard or e-bike / cargo)
3. AI processes and: matches the point to one of 542 LOR areas in the browser, then looks up that area's smoothed risk tier, data-quality flag and (if the OSM signal ships) activity-adjusted context
4. User receives: a tier label ("Lower / Medium / Higher bike-parking risk"), a short plain-language explanation, a lock recommendation, a time-of-day warning if relevant, and the data date
5. User achieves: a confident choice of lock and spot in under a minute, without being told the area is "safe" or "dangerous"

#### Success Criteria

**User Success**: User can complete the core journey in under **1 minute** and correctly restate what the tier means (target: at least 4 of 5 pilot users).

**AI Performance** (all on a time-based hold-out, last 3-6 months):

- Tier ranking: Spearman correlation of predicted vs. actual theft rank across areas of at least **0.6** **[TBD, confirm with data]**
- Calibration: at least **70%** of areas in the High tier stay in the top ~25% of areas by actual thefts in the hold-out period
- Fairness: tier share and error show no large gap across the 12 districts (see the ethics quick-check)

**Technical Success**: The static lookup, hosted as a static site, serves **50+ concurrent users** without issue. If the FastAPI endpoint ships (Should), responses stay under 200 ms and the client falls back to the bundled snapshot after 1.5 s.

### 2.2 Feature Prioritization

#### MUST HAVE (Week 1-2)

- [ ] **Core model**: Empirical Bayes smoothed risk tiers per LOR x daypart x daytype (`src/models/`); first extract `map_daypart` / `map_daytype` from `src/audit_police_csv.py` into an importable module
- [ ] **Validation and tests**: time-based hold-out check, tier-share sanity check, district-level fairness check, and unit tests for the pipeline and the advice router (`tests/`)
- [ ] **Data input**: GPS or map tap, plus daypart, weekday/weekend and bike-type selectors
- [ ] **Processing**: precomputed `lookup_schema_v1.json` and client-side point-in-polygon match against the LOR GeoJSON
- [ ] **Area stats for the router**: aggravated-theft share and median stolen value per LOR, computed in the pipeline (the router escalation depends on them)
- [ ] **Lock advice**: `advice_catalog` (5 keys) written into the lookup JSON from `lock-tier-documentation.md`, plus the `select_advice_key` router; every tier says to lock frame and at least one wheel to a fixed object and never recommends a frame or cable lock alone
- [ ] **Output display**: tier, plain-language explanation, lock recommendation, data date, "limited data" flag
- [ ] **Basic error handling**: location denied and outside-Berlin messages (tap on the map stays as the fallback)
- [ ] **Simple UI**: single-page React + Leaflet map with a result card, usable at phone width
- [ ] **Hosting**: static site (e.g. GitHub Pages) live by the end of Week 2 so pilot riders can open it on their phones

#### SHOULD HAVE (Week 2-3)

- [ ] OSM activity-adjusted context (residual risk) as the second signal; time-boxed, first thing cut if behind
- [ ] Address search; needs a geocoder, and the typed address goes to a third party, which conflicts with the README's no-data-leaves-the-browser claim, so pick a privacy-acceptable option or keep it out
- [ ] FastAPI `/api/v1/risk` endpoint with client fallback to the static snapshot
- [ ] Error handling: offline and sparse-data areas
- [ ] "How this works" panel and "About the data" page; "This looks wrong" link
- [ ] Guideline URL health check (`src/verify_guideline_sources.py`) run manually or in CI on each push (the weekly auto-refresh is a Could)

#### COULD HAVE (If time permits)

- [ ] 30-day anomaly flag (`trending_up_30d`)
- [ ] Weekly GitHub Actions auto-refresh with human diff review
- [ ] Visual polish, dark mode
- [ ] Accessibility pass (contrast, keyboard use, screen-reader labels)

#### WON'T HAVE (Out of scope)

- Cities other than Berlin
- Lock product recommendations or affiliate links (we cite standards, e.g. VdS A+/B+, not brands)
- User accounts, saved places, or any rider tracking
- Real-time or live theft reports and push alerts
- Route planning or navigation
- Deep learning or other heavyweight models
- Production-scale infrastructure, load testing and advanced security hardening

---

## 3. Weekly Milestone Planning

### 3.1 High-level 3-Week Plan

Short summary in the template format. Section 2.2 is the authoritative feature list.

## LockOut - 3-Week Scope Definition

## MVP Statement

"In 3 weeks, we will build a Berlin bike-parking risk map that allows urban cyclists to look up any spot and time of day and achieve an informed lock-strategy decision before leaving their bike unattended."

## Core Features (Must Have)

1. Smoothed theft-risk tiers (Low / Medium / High) for all 542 LOR areas by daypart and daytype, precomputed into a static lookup, with validation
2. Map-first location input (GPS or tap) with browser-only geolocation and daypart, daytype and bike-type selectors
3. Result card with plain-language tier, lock recommendation, data date and a "limited data" flag, hosted as a static site

## Success Criteria

- **User**: Pilot users finish the journey in under 1 minute and understand the tier wording (4 of 5)
- **Technical**: Hold-out rank correlation of at least 0.6; High-tier areas stay high in the later period; no large tier-share gap across districts
- **Business**: In the same 5-rider pilot, at least 3 say they would use it before locking their bike

## Team & Working Mode

Two people, alternating the PM role each week, AI-assisted development. The PM of the week owns the plan, priorities and the handover note; both review every AI-generated change before merge.

## Weekly Milestones

- **Week 1 (Foundation)**: Data pipeline cleaned and tested (outdoor filter, lag truncation); `map_daypart` / `map_daytype` extracted; first smoothed tiers per LOR; map shell renders the 542 polygons and returns the area for a tapped point
- **Week 2 (Integration)**: Area stats, `advice_catalog` and advice router; lookup JSON wired into the UI with selectors and result card; hold-out and fairness validation; static site deployed
- **Week 3 (Polish)**: Wording test with 5 pilot riders by mid-week, then fix the wording; error and edge-case handling; "How this works" text; OSM signal and FastAPI only if on schedule; demo preparation

## Explicitly Out of Scope

- Cities outside Berlin, accounts, saved places
- Neighborhood rankings or "unsafe area" labels
- Live data, alerts, route planning
- Production-scale hosting and security hardening

## Biggest Risks & Mitigations

1. **Risk**: Reported thefts under-represent some areas, and sparse area-time cells give noisy tiers, so the map misleads or stigmatizes.
   **Mitigation**: Shrinkage toward the _Bezirksregion_ prior, a "limited data" flag, neutral "bike-parking risk" wording, and a district-level fairness check before release.
2. **Risk**: The OSM activity-adjusted signal takes too long or adds little.
   **Mitigation**: Time-box it to a few days in Week 3 and only start it if Must Haves are done; if it fails or is skipped, ship the smoothed theft tier alone and describe the adjustment as future work.
3. **Risk**: Frontend work (empty `frontend/` today) eats the schedule.
   **Mitigation**: Start the map shell in Week 1 in parallel with the model, use a template, and keep the UI to one page and one result card.
4. **Risk**: A "Low" tier makes a rider choose a weak lock.
   **Mitigation**: Never say "safe", show baseline lock advice at every tier, and run the wording test with pilot users by mid-Week 3 so there is time to fix it.
5. **Risk**: The Polizei Berlin portal is down or the CSV format changes.
   **Mitigation**: The cached CSV fallback is already built; a schema check runs before every pipeline run.
6. **Risk**: AI-written model code looks plausible but is statistically wrong, and neither of us can fully verify it.
   **Mitigation**: Tests and a time-based hold-out check for each model step, library implementations over custom math, and one outside review of the approach.
7. **Risk**: Lock guidance becomes outdated or misquoted (e.g. UK standards, frame locks).
   **Mitigation**: Copy comes only from the verified fact bank in `lock-tier-documentation.md`; the URL health check warns when a source moves; `guidelines_verified_at` is shown in the data.
8. **Risk**: The weekly PM switch loses context or duplicates work.
   **Mitigation**: A short handover note each week and tickets/issues for every Must Have item.
