# EDA Findings and Capability Table

**Data:** Polizei Berlin bicycle theft CSV, downloaded 26 Oct 2026 (reports up to 24 Oct 2026), saved locally as `data/raw/fahrraddiebstahl_2026-10-26.csv`. The file is not in Git; ask for it to reproduce the numbers.
**Analysis:** `notebooks/eda.ipynb`. Every number below comes from its output.
**Status:** proposed for sign-off by both team members (issue #35, roadmap WP 1.1, gate G1).

## 1. Headline numbers

| Fact | 26 Oct 2026 file | 13 Oct 2026 file (roadmap 3.2) |
| --- | --- | --- |
| Rows | 31,397 | 30,788 |
| Street rows (cellar and attic break-ins excluded via `DELIKT` and `ERFASSUNGSGRUND`) | 29,796 | 29,212 |
| Cellar and attic rows | 1,601 | 1,576 |
| Areas with any record | 535 of 542 (7 with none) | 534 of 542 (8 with none) |
| Areas with a street record | 534 of 542 | n/a |
| Reporting lag p50 / p90 / p95 | 0 / 4 / 10 days | 0 / 4 / 10 days |
| Data window | Offences from 1 Jan 2025, reports up to 24 Oct 2026 | 1 Jan 2025 to 13 Oct 2026 |
| Street thefts, last 12 months (offence start 25 Oct 2025 to 24 Oct 2026) | 15,684 | 15,577 |

The p95 lag of 10 days is confirmed; the lag cutoff stays at 14 days (D-02).

## 2. Citywide patterns (street thefts, last 12 months)

- **Offence window** (last seen to found missing): 20% within 1 hour, 38% within 4 hours, 86% within 24 hours. The hour is a "last seen" value, so most thefts cannot be placed in one time band with certainty.
- **Time of day** (by last-seen hour): Evening 17-22 h 38%, Afternoon 11-17 h 30%, Morning 6-11 h 21%, Night 22-6 h 11%.
- **Day group:** Mon-Thu 59%, Friday 16%, Weekend 25%; Mon-Fri 75%, Sat-Sun 25%. An even spread over the week would give 57% / 14% / 29%, so the day effect is small.
- **Stolen value:** under EUR 1,000: 54%; EUR 1,000 or more: 46%. Median EUR 900.
- **Bike type:** 14 categories, no e-bike category. Largest: Herrenfahrrad 4,429; Fahrrad (unspecified) 2,587; Damenfahrrad 2,267. Cargo bikes (Lastenfahrrad): 141.
- **Lock defeated** ("schwerer Diebstahl"): 94% of street thefts.

## 3. Density per area (street thefts, last 12 months)

Per area: median 18 thefts; 176 areas with fewer than 10, 88 with fewer than 5, 13 with none.

A cell is one area combined with one group of a filter (for example one area in the evening). Working rule for this analysis: a cell with fewer than 5 thefts in 12 months is thin.

| Split | Cells | Median thefts per cell | Cells with < 5 | Cells with 0 |
| --- | --- | --- | --- | --- |
| Time of day (4) | 2,168 | 4 | 55% | 15% |
| Day group (Mon-Thu / Fri / Weekend) | 1,626 | 5 | 47% | 13% |
| Mon-Fri / Sat-Sun | 1,084 | 7 | 36% | 8% |
| Value band (2) | 1,084 | 9 | 33% | 7% |
| Time of day x day group | 6,504 | 1 | 84% | 39% |

Area statistics (minimum 20 thefts per area, scope S2): 255 areas qualify. Median stolen value per area ranges from EUR 653 to EUR 1,298 (10th to 90th percentile); the lock-defeated share ranges from 90% to 100%.

Trending-up badge (S3, needs an expected count of at least 3 thefts per 30 days): 145 areas qualify.

## 4. Capability table

| UI item | Data field | Density result | Proposed verdict |
| --- | --- | --- | --- |
| Area risk tier (Low / Medium / High) | `LOR` | Median 18 per area; 88 areas < 5 | Supported per area; thin areas shrink to the parent area (M4) |
| Confidence label | `LOR` counts | 176 areas < 10, 88 < 5 | Supported and needed |
| "Limited data" flag | `LOR` counts | 13 areas with no street theft in 12 months; 7 with no record at all | Supported |
| Report count and data date on the card | `LOR`, `ANGELEGT_AM` | Reports up to 24 Oct 2026 | Supported |
| Time-of-day filter (4 bands) | `TATZEIT_ANFANG_STUNDE`, window length | Median 4 per cell, 55% of cells < 5; only 38% of windows within 4 h | Citywide pattern only, labelled as such; per area only if it beats the citywide pattern on hold-out (G1) |
| Day filter (Mon-Thu / Fri / Weekend) | `TATZEIT_ANFANG_DATUM` | Median 5 per cell, 47% < 5; shares close to an even spread | Kept as a citywide pattern; small effect. The grouping (3 groups or Mon-Fri / Sat-Sun) is chosen at G1 (D-08) |
| Day filter (Mon-Fri / Sat-Sun) | `TATZEIT_ANFANG_DATUM` | Median 7 per cell, 36% < 5 | Citywide pattern; alternative grouping for the day filter (D-08) |
| E-bike / cargo filter (prototype) | None: no e-bike field; 141 cargo bikes citywide | Not measurable | Cut; e-bike advice (take the battery) stays as general advice text |
| Bike value filter (< EUR 1,000 / >= EUR 1,000) | `SCHADENSHOEHE` | 54% / 46%; median 9 per cell, 33% < 5 | Citywide pattern; replaces the e-bike filter (D-07) |
| Bike type filter | `ART_DES_FAHRRADS` | 14 types, 16% unspecified, many small types | Not offered |
| Median stolen value per area (S2) | `SCHADENSHOEHE` | 255 areas with >= 20 thefts; EUR 653 to 1,298 | Supported for those 255 areas; citywide EUR 900 elsewhere, labelled |
| Lock-defeated share per area (S2) | `ERFASSUNGSGRUND` | 90% to 100% per area | Citywide fact only; too little variation per area |
| Trending-up badge (S3) | Offence dates, `LOR` | 145 areas qualify | Only for those 145 areas |
| Parking duration | None | Not in the data | Cut (D-12) |

## 5. Limits

- Hours are "last seen" values; time-of-day results describe when bikes were last seen, not when they were stolen.
- The 12-month counts are not lag-truncated; the model applies the 14-day cutoff (M2).
- The thin-cell rule (< 5) is a working rule for this analysis, not an agreed threshold.
- Per-area verdicts on filters are confirmed or rejected by the hold-out validation at G1.