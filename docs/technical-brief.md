# Technical Brief (Engineers)

## Context

The repo currently holds discovery-phase work: a data fetch script, an integrity and sparsity audit, the LOR polygons and a draft lookup JSON that serves as the contract sketch. The README describes the intended design. The brief below treats all of it as a starting point to be revised after discovery, not as a baseline to defend.

## Target architecture (as designed)

1. **Offline precompute** (GitHub Action, weekly): fetch CSV, filter to street thefts, truncate the last N days for reporting lag, allocate multi-day offence windows, smooth sparse cells toward parent Bezirksregion priors, assign risk percentiles, write `lookup_schema_v1.json`.
2. **Serving:** a small read-only FastAPI service over the precomputed JSON.
3. **Client:** React, Vite, Leaflet. Falls back to a bundled JSON snapshot if the API is slow.
4. **No accounts, no server-side user data.** Geolocation stays in the browser.

## Data contract

Existing fields in the sample: `metadata` (version, data window, lag, attribution), `risk_bands` (Low 0–60th, Medium 60–85th, High 85–100th percentile), `advice_catalog`, and per area: `area_stats` (`trending_up_30d`, `aggravated_lock_break_share`, `median_stolen_value_eur`, `osm_activity_context`) and `predictions[daytype][daypart][bike_class]` with `lambda_smoothed`, `hotspot_percentile`, `risk_level`, `confidence`, `top_factors`, `temporal_warning`, `advice_key`.

**Changes needed for the top 3 ideas** (proposed, not decided):

| Field                                                                                                     | For                | Notes                                                                              |
| --------------------------------------------------------------------------------------------------------- | ------------------ | ---------------------------------------------------------------------------------- |
| `baseline_ratio` (this cell against the area's own typical level for the weekday and daypart)             | Tonight's Verdict  | Needs a stable baseline; see the sparsity check                                    |
| `confidence` with numeric basis (`n_reports`, interval width) and a rule that maps to solid / fair / thin | Honest Fog         | `confidence` already exists as a label; define how it is computed                  |
| `verdict_key` and a template layer instead of free text                                                   | Verdict            | Copy lives in a versioned catalog, not in the pipeline                             |
| `bike_class` (standard, e-bike or high value)                                                             | Verdict, lock tier | Already partly present as STANDARD / EBIKE; decide the value bands                 |
| `dwell_band`                                                                                              | Lock advice        | Add only if the data supports it; the clock page suggests short stays are not safe |
| Stable area IDs and names                                                                                 | Settle It          | 8-digit planning-area keys are already used                                        |

## Issues found in the draft contract

- **`advice_catalog` contradicts [lock-tier-documentation.md](lock-tier-documentation.md).** `EBIKE_HIGH` references "Sold Secure Gold/Diamond", which the lock-tier doc says to drop in favor of VdS 2597 A+ / B+. `STANDARD_LOW` says "Standard frame + U-lock", while the doc says a frame lock alone is never enough. Fix before any advice is shown.
- **Percentile bands are relative.** Low / Medium / High are fixed shares of areas (60/25/15), so a "High" tier exists in every period even if all areas improve. Decide whether tiers are relative or absolute, and say so in the UI.
- **Model naming.** `model_type: hierarchical_eb_poisson_glm` is declared in the draft. Keep it only if the backtest supports that model.

## Modeling plan and validation

1. Reproduce the audit and write the density table: reports per area-daypart cell over 12 and 24 months, after filters.
2. Build the naive baseline (citywide share by daypart) and the simple area-history baseline. Any smoothed model has to beat both on a time-split backtest. The README names EB smoothing and EM allocation; these are justified only if the numbers show it.
3. Handle three known data problems explicitly (the PKS 2025 report counts 1,892 bike thefts inside cellar break-ins, a separate category from the 22,630 bike thefts; confirm which the open dataset includes): the reported hour is when the owner last saw the bike, offence windows run up to about 72 hours, and cellar thefts must be filtered for street risk.
4. Calibrate: do tiers match the observed rates in held-out months?
5. Activity adjustment from OSM proxies: test that it changes rankings in a sensible direction and is stable. It has no direct evidence yet.
6. Record the interval or sample size behind every confidence label.

## API (minimal)

| Endpoint                                                   | Purpose                                                                                |
| ---------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `GET /api/v1/risk?area=<id>&daytype=<>&daypart=<>&bike=<>` | One cell, including verdict inputs and confidence                                      |
| `GET /api/v1/areas`                                        | Area list and names for search                                                         |
| `GET /api/v1/compare?a=<id>&b=<id>&daypart=<>`             | Two cells and the difference sentence (can also be computed client-side from the JSON) |
| `GET /healthz`                                             | Liveness                                                                               |

The static JSON is the fallback and also the source of truth, so the API can stay thin. Share links are plain URL parameters carrying area ids and a time band only, with no rider location.

## Build order

| Phase | Work                                                                                        | Done when                                                               |
| ----- | ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| 0     | Density audit and baseline backtest (Test 1)                                                | Table of coverage and stability exists; area level decision made        |
| 1     | `build_lookup_json.py`; enable the workflow step; tests for filters and lag                 | Weekly job regenerates a valid JSON that matches a schema check         |
| 2     | Verdict and confidence logic with the template catalog                                      | Unit tests on rules, including "thin data never produces a reassurance" |
| 3     | API and bundled fallback                                                                    | Client gets a verdict with the API both up and down                     |
| 4     | Client: verdict screen, time shifter, locate-me or area search, confidence label, why-panel | Usable on a phone, accessible, German and English                       |
| 5     | Compare and share                                                                           | Link reopens the same comparison; no personal data in the URL           |

## Non-functional requirements

Mobile-first and accessible (colour is never the only signal; the tier colours need contrast checks). No third-party trackers. Attribution for Polizei Berlin (CC-BY 4.0), OSM (ODbL) and LOR data (dl-de/by-2-0) shown in the UI. Weekly job must fail loudly and keep serving the last good JSON if the download or validation fails.

## Open technical questions

- Is the data dense enough for 542 areas by time band, or must the app fall back to a coarser level?
- Relative or absolute tiers?
- How are the confidence labels derived and tested?
- Where is the app hosted, and who maintains the weekly job?
- Does a third-party tile provider fit the no-tracking promise?
