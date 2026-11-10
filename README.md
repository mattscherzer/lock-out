# LockOut 🚲🔒

LockOut is a map-first geospatial web application that helps urban cyclists evaluate street-parking risk and choose the right locking strategy before leaving their bike unattended. Starting in Berlin across all 542 official planning areas (*Lebensweltlich orientierte Räume* — LOR), LockOut turns the open police theft records into a smoothed risk tier per area, with a confidence label and lock advice.

---

## 🚧 Project Status

Work in progress; see [docs/product-roadmap.md](docs/product-roadmap.md) for the plan and the decision log.

| Component | Status |
| --- | --- |
| CSV fetch with stale fallback, LOR polygons | Done (`lockout.cli.fetch`, `data/raw/lor_planungsraeume_2021.geojson`) |
| Data audit | Works (`lockout.cli.audit`); stops on a missing column, too few rows or an unknown area ID |
| Cleaning, backtest, Empirical Bayes model, lookup generator | Working on real data (`lockout.cli.clean`, `.backtest`, `.build_lookup`, `.validate`) |
| `lookup_schema_v1.json` | Written by `lockout.cli.build_lookup`; shape locked by `schemas/lookup_v1.schema.json` |
| Frontend (`frontend/`) | React + TypeScript + Vite + Leaflet app that reads the static JSON in `frontend/public/`; released weekly to GitHub Pages (see Releases) |
| Weekly refresh workflow | Fetches, audits and schema-checks, then opens a PR. The step that regenerates the lookup is still commented out in `refresh_data.yaml`, so a PR opens only on a dry run until it is switched on |
| OSM Poisson GLM | Tested as a candidate (`lockout.cli.glm`, `docs/glm-results.md`); not adopted for the MVP |

There is no server and no API. The product is the static `lookup_schema_v1.json` plus the polygons, both read by the frontend in the browser.

Only 534 of the 542 areas have any police record in the committed data; the other 8 are shrunk toward their parent and flagged `no_record`.

**Lookup schema v1 (locked).** `data/processed/lookup_schema_v1.json` is written by `lockout.cli.build_lookup` and must match `schemas/lookup_v1.schema.json`; `uv run pytest` and `uv run python -m lockout.cli.check_lookup` check it. `frontend/public/lookup_schema_v1.json` is a copy made by `lockout.cli.build_public`. After the lock, changes are additive only: a new optional field is a minor version bump (1.x.0) and needs both approvals; removing or renaming a field, or changing its meaning, is a new major version.

---

## 🎯 Problem & Core Value Proposition

Urban cyclists in Berlin face roughly 16,400 reported street bicycle thefts per year in the open police dataset (2025, by offence date, cellar break-ins excluded; 17,190 including them; the PKS 2025 report counts 22,630, so the open data is a subset). Existing crime maps suffer from two fundamental flaws:

1. **The Volume Illusion:** Raw count maps flag busy transit hubs (e.g., Alexanderplatz) as "High Risk" without accounting for underlying urban activity density.
2. **The Denominator Trap:** Naive rate maps ($\text{Thefts} / \text{Mapped Bike Racks}$) create extreme outliers in residential areas where OpenStreetMap (OSM) rack coverage is incomplete.

**LockOut answers with these parts, per planning area:**

* **Hotspot Tier:** Low, Medium or High, a percentile band of the Empirical Bayes smoothed expected theft count (see below).
* **Confidence and limited-data flags:** a LOW, MEDIUM or HIGH confidence label from the number of thefts behind the area, plus `limited_data` and `no_record` flags, so a thin area never reads as reassuring.
* **Local context:** the median stolen bicycle value (`SCHADENSHOEHE`), the area's own when it has enough values and the citywide one otherwise, and the citywide share of thefts where a lock was defeated.
* **Lock advice:** a one-lock or two-lock recommendation chosen by bike value, with steps and sources from Polizei Berlin, ADFC and VdS. It does not depend on the area's tier.

OpenStreetMap activity counts are not part of the risk signal: a GLM on them was tested and not adopted.

---

## 🏗️ System Architecture

LockOut is a static precompute. A Python pipeline turns the police CSV into one schema-checked JSON file; the frontend reads that file and the area polygons in the browser. Nothing runs on a server.

```text
police CSV -> fetch -> audit -> clean -> model -> lookup_schema_v1.json -> frontend/public/ -> browser
```

**Python layers.** `src/lockout/` imports downwards only: `config, paths <- geo, ingest <- pipeline <- models <- lookup <- cli`. `tests/test_layers.py` enforces this and that only `cli/` has `sys.exit` or a `__main__` block.

| Layer | Responsibility |
| --- | --- |
| `config`, `paths` | Constants (lag cutoff, time bands, day groups, required columns) and every repo path |
| `ingest` | Download of the police CSV with cache fallback; CSV checks (encoding, delimiter, columns, row count, area IDs) |
| `geo` | LOR polygons and names, boundary simplification for the map, place-search gazetteer, OSM counts per area |
| `pipeline` | Cleaning: street thefts only, reporting-lag truncation, offence windows spread over time bands |
| `models` | Pure statistics: Empirical Bayes, backtest, selector hold-out, area statistics, validation, the GLM candidate |
| `lookup` | The lookup JSON generator and its schema check |
| `cli` | The only layer with `main()`, argv, `sys.exit` and report markdown; one module per command |

**Data flow and refresh.**

1. `lockout.cli.fetch` downloads `Fahrraddiebstahl.csv` from `polizei-berlin.eu` (excluded from Git). A download under 1 MB is discarded. If the download fails, the cached CSV is used for up to 21 days (the age is kept in `data/raw/.fetched_at`); after that the command fails.
2. `lockout.cli.build_lookup` cleans the CSV, scores the model on two backtest folds, writes `docs/eb-model-results.md`, and writes `data/processed/lookup_schema_v1.json` only if it matches `schemas/lookup_v1.schema.json` and holds no NaN or infinity.
3. `lockout.cli.build_public` copies the lookup to `frontend/public/` and writes `areas.geojson`, the 542 polygons simplified to about 15 m.
4. A weekly GitHub Action (`.github/workflows/refresh_data.yaml`) fetches, audits and schema-checks, then opens a PR; `main` is protected, so it never pushes. The lookup regeneration step is still commented out in that workflow.

**Frontend.** React + TypeScript (strict) + Vite + Tailwind + Leaflet in `frontend/`. It loads `lookup_schema_v1.json`, `areas.geojson` and, for place search, `gazetteer.json` and `gazetteer_streets.json` from `frontend/public/`, and draws the 542 areas on an OpenStreetMap basemap. Place search is optional: without the gazetteer, area-name search still works.

---

## 🧠 Statistical Modeling & Data Hygiene

* **Street filter:** drops indoor and basement break-ins (`DELIKT` is `Keller- und Bodeneinbruch`, or `ERFASSUNGSGRUND` mentions `Keller`).
* **Reporting-lag truncation:** drops thefts whose offence window ended within 14 days of the latest report date. The 95th percentile of the reporting lag is about 10 days (`lockout.cli.audit`); 14 is that figure rounded up, because late reports are missing from the lag distribution itself.
* **Offence windows:** a theft has a start and an end hour, not one time. Its weight is spread over the four time bands (Morning 6-10, Afternoon 11-16, Evening 17-21, Night 22-5) in proportion to the hours the window covers; with no hours recorded, it is spread evenly over the day. This is a proportional split, not an EM allocation. A theft belongs to the period in which its window ended.
* **Empirical Bayes:** Gamma-Poisson shrinkage of the 12-month theft count per area, first area toward its Bezirksregion (6-digit LOR prefix) and each Bezirksregion toward the city. The prior strength at each step is estimated from the data by the method of moments, so an area with few thefts moves further toward its parent.
* **Tiers:** relative percentile bands of the shrunk rates: Low 60%, Medium 25%, High 15% of areas. Areas with the same rate get the same, higher tier.
* **Confidence:** from all street thefts in the area in the 12-month window: LOW below 5 (the same line as `limited_data`), MEDIUM 5 to 19, HIGH from 20.
* **Median stolen value:** an area's own median when at least 20 of its thefts have a usable value, the citywide median otherwise. A blank, unreadable or 0 value counts as unknown.
* **Selectors:** time band, day group (Mon-Thu, Friday, weekend) and bike value (split at EUR 1000) are stored as citywide shares in the lookup, each with a hold-out flag. A selector gets an "area pattern" flag only if its counts are not too sparse (median of at least 5 per area and level) and area-specific shares predict both backtest folds better than the citywide shares; otherwise "citywide pattern". The lookup carries no area values for any selector (`area_values` is false).
* **Backtest and validation:** two three-month folds (1 Apr to 30 Jun and 1 Jul to 29 Sep 2026), each with 12 months of history before it. In `docs/eb-model-results.md` the model beats the citywide share and the raw area history on mean Poisson deviance in both folds, with a Spearman correlation of about 0.87. `docs/validation-report.md` covers calibration by tier and district fairness by Bezirk.
* **OSM Poisson GLM:** tested as a candidate (`docs/glm-results.md`): the GLM alone is worse than EB v0, and EB pulled toward the GLM improves the deviance only slightly. It is not adopted for the MVP (D-22 in the roadmap).

---

## 📂 Repository Structure

```text
lock-out/
├── .github/workflows/
│   ├── refresh_data.yaml                # Weekly fetch, audit, schema check and PR
│   ├── tests.yaml                       # uv run pytest on every PR and push to main
│   ├── release.yaml                     # Weekly tag and GitHub Release when frontend/ changed
│   └── deploy.yaml                      # Builds a v* tag and deploys it to GitHub Pages
├── data/
│   ├── raw/                             # LOR polygons (tracked), police CSV (git-ignored)
│   └── processed/lookup_schema_v1.json  # The precomputed lookup
├── docs/                                # Roadmap, decisions, model and validation results
├── frontend/                            # React + TypeScript + Vite + Leaflet app
│   └── public/                          # JSON the app reads, written by lockout.cli.build_public and build_gazetteer
├── demo/                                # Earlier single-file prototype on mock data
├── notebooks/                           # Exploratory data analysis
├── schemas/lookup_v1.schema.json        # JSON Schema of the lookup file
├── src/lockout/
│   ├── config.py, paths.py              # Constants and every repo path
│   ├── ingest/                          # Downloader with cache fallback, CSV checks
│   ├── geo/                             # Polygons, boundary simplification, gazetteer, OSM counts
│   ├── pipeline/                        # Cleaning
│   ├── models/                          # Pure statistics
│   ├── lookup/                          # Lookup generator and schema check
│   └── cli/                             # Commands: uv run python -m lockout.cli.<name>
├── tests/                               # pytest, including the layer rule and the schema check
├── pyproject.toml / uv.lock             # Dependencies and the exact locked versions
└── .python-version                      # Python version used by uv
```

---

## 🚀 Quickstart

### Prerequisites

* **Python 3.11+** and [uv](https://docs.astral.sh/uv/getting-started/installation/)
* **Node.js 22.13+** (22.x, 24 or 26+; not 23 or 25) for the frontend

### 1. Environment Setup

```bash
git clone https://github.com/mattscherzer/lock-out.git
cd lock-out
uv sync   # creates .venv with the Python and package versions from uv.lock
```

### 2. Run the Pipeline

Each command runs from the repo root. The ones that read the police CSV take an optional path to it and default to the file in `data/raw/`.

```bash
uv run python -m lockout.cli.fetch          # download the police CSV, or fall back to the cached one
uv run python -m lockout.cli.audit          # audit the raw CSV; prints, writes nothing
uv run python -m lockout.cli.clean          # writes data/processed/street_thefts_clean.csv for inspection
uv run python -m lockout.cli.backtest       # baselines on two folds; writes docs/backtest-results.md
uv run python -m lockout.cli.build_lookup   # EB model; writes data/processed/lookup_schema_v1.json and docs/eb-model-results.md
uv run python -m lockout.cli.validate       # calibration, fairness, selectors; writes docs/validation-report.md
uv run python -m lockout.cli.area_stats     # prints median-value and confidence counts
uv run python -m lockout.cli.build_public   # writes frontend/public/areas.geojson and the lookup copy
uv run python -m lockout.cli.check_lookup   # schema check; exits 1 if a lookup file does not match
```

Separate from the main run: `lockout.cli.build_gazetteer` writes the place-search files in `frontend/public/` from downloaded street, postcode and station data (see its docstring), and `lockout.cli.osm_features` then `lockout.cli.glm` repeat the OSM GLM test.

### 3. Run the Tests

```bash
uv run pytest
```

### 4. Run the Frontend

Needs internet access (the basemap tiles load from `tile.openstreetmap.org`).

```bash
cd frontend
npm install
npm run dev        # dev server, open the printed URL (http://localhost:5173)
```

To test the production build instead:

```bash
npm run build && npm run preview   # serves dist/ at http://localhost:4173
```

`npm run typecheck` and `npm test` run the type check and the tests. More in [frontend/README.md](frontend/README.md).

---

## 🔄 Automated Data Refresh (CI/CD)

The GitHub Actions workflow `.github/workflows/refresh_data.yaml` runs every Monday at `06:00 UTC` (and supports manual triggers via `workflow_dispatch`):

1. Restores the last known good `fahrraddiebstahl.csv` from the GitHub Actions cache.
2. Runs `uv run python -m lockout.cli.fetch` to pull fresh data from `polizei-berlin.eu` (or retain the cached copy if the portal is down).
3. Runs `uv run python -m lockout.cli.audit`. The line that runs `lockout.cli.build_lookup` to regenerate `data/processed/lookup_schema_v1.json` is still commented out.
4. Checks the lookup against the schema and opens a pull request when `data/processed/lookup_schema_v1.json` changed; `main` is branch-protected, so a direct push is not possible. A manual run with **Dry run** ticked opens the PR even without a data change, to test this path; close that PR without merging.

---

## 🚢 Releases

The site is `https://mattscherzer.github.io/lock-out/`. Every Wednesday at `06:00 UTC` (`.github/workflows/release.yaml`) the workflow checks whether `frontend/` or `docs/design-system/` changed since the last `vMAJOR.MINOR.PATCH` tag. If so, it builds and tests, tags `main` with the next minor version (the first release is `v1.0.0`), publishes a GitHub Release with generated notes and starts `deploy.yaml`, which builds that tag and deploys it. No change means no release.

The site reads its own copy of the lookup, `frontend/public/lookup_schema_v1.json`. A merged data refresh only changes `data/processed/`, so it ships only after `python3 frontend/scripts/build_public.py` has regenerated the copy and that change is merged.

- **Out of cycle:** run *Release* manually and pick `patch`, `minor` or `major`. It only runs from `main`, and it is still skipped when nothing changed since the last tag.
- **Roll back, or deploy a tag whose deploy failed:** run *Deploy to GitHub Pages* with *Use workflow from* set to that `v*` tag. A failed deploy leaves the tag in place, so the next weekly run sees no change and does not retry it. The `github-pages` environment accepts nothing but `v*` tags, so `main` never deploys directly.
- **Approval:** every deploy waits for approval from `mattscherzer` (required reviewer on the `github-pages` environment), so a stray `v*` tag cannot ship by itself. After the weekly release, approve the pending *Deploy* run in the Actions tab. The ruleset *Release tags are immutable* stops released tags from being moved or deleted.

---

## 🔒 Privacy & Ethics

* **No user tracking:** the site is static. There are no accounts, no analytics and no server that receives user input; place search matches typed text against the bundled gazetteer files in the browser.
* **Non-Stigmatizing Framing:** Risk indicators describe *bicycle parking vulnerability*, never labeling neighborhoods as "unsafe". The lock advice is the same in every area.

---

## 📜 Data Sources & Legal Attribution

This project relies on open public datasets and complies with their respective attribution requirements:

* **Bicycle Theft Data:** *Datenquelle: Polizei Berlin – [Fahrraddiebstahl in Berlin](https://daten.berlin.de/) (Licensed under [CC-BY 4.0](https://creativecommons.org/licenses/by/4.0/))*.
* **Spatial Boundaries (LOR 2021):** *Amt für Statistik Berlin-Brandenburg / Senatsverwaltung für Stadtentwicklung, Bauen und Wohnen – [ODIS Berlin](https://daten.odis-berlin.de/) (Licensed under dl-de/by-2-0)*.
* **Urban Infrastructure & POI Proxies:** *© [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors (Licensed under [ODbL](https://opendatacommons.org/licenses/odbl/))*.

---

## 📄 License

Distributed under the MIT License. See [LICENSE](./LICENSE) for more information.