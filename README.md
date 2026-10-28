# LockOut 🚲🔒

LockOut is a map-first geospatial web application that helps urban cyclists evaluate street-parking risk and choose the right locking strategy before leaving their bike unattended. Starting in Berlin across all 542 official planning areas (*Lebensweltlich orientierte Räume* — LOR), LockOut combines historical police incident data with OpenStreetMap (OSM) urban activity proxies to deliver calibrated spatio-temporal risk profiles and actionable security recommendations.

---

## 🚧 Project Status

Work in progress; see [docs/product-roadmap.md](docs/product-roadmap.md) for the plan. Sections below describe the **target design** unless marked.

| Component | Status |
| --- | --- |
| CSV fetch with stale fallback, LOR polygons | Done |
| Data audit (`src/audit_police_csv.py`) | Works, being hardened |
| Cleaning pipeline, model, `build_lookup_json.py` | Not started |
| `lookup_schema_v1.json` | Hand-written sample, not generated |
| FastAPI service (`src/api/main.py`) | Not started |
| Frontend | Prototype in `demo/` with mock data; `frontend/` is a Vite + Leaflet scaffold that draws the 542 areas on an OSM map (local only, not deployed) |
| Weekly refresh workflow | Runs fetch + audit only; will open a PR once the build step exists |

Only 534 of the 542 areas have any police record; the other 8 are shrunk to their parent area and flagged "no data".

---

## 🎯 Problem & Core Value Proposition

Urban cyclists in Berlin face roughly 16,400 reported street bicycle thefts per year in the open police dataset (2025, by offence date, cellar break-ins excluded; 17,190 including them; the PKS 2025 report counts 22,630, so the open data is a subset). Existing crime maps suffer from two fundamental flaws:

1. **The Volume Illusion:** Raw count maps flag busy transit hubs (e.g., Alexanderplatz) as "High Risk" without accounting for underlying urban activity density.
2. **The Denominator Trap:** Naive rate maps ($\text{Thefts} / \text{Mapped Bike Racks}$) create extreme outliers in residential areas where OpenStreetMap (OSM) rack coverage is incomplete.

**LockOut solves this by delivering a two-part risk signal across all 542 Berlin Planning Areas (*Planungsräume / LOR*):**

* **Hotspot Tier:** Hierarchical Empirical Bayes smoothed theft volume percentiles.
* **Activity-Adjusted Context:** Residual risk controlling for local transit nodes, retail density, and street infrastructure.
* **Empirical Local Context:** Area-specific aggravated theft shares (% of incidents where a lock was defeated) and median stolen bicycle values (`SCHADENSHOEHE`).
* **Actionable Mitigation:** Temporal boundary warnings (e.g., overnight risk spikes) and lock-tier recommendations grounded in ADFC and Polizei Berlin guidelines.

---

## 🏗️ System Architecture & Resilient Fallback Design

LockOut is built on a **Zero-Downtime Offline Precomputation & Multi-Tier Fallback Architecture**:

1. **Automated Data Ingestion & Cache Fallback (`src/fetch_police_csv.py` + GitHub Actions):**
   * The raw Polizei Berlin dataset (`Fahrraddiebstahl.csv`, ~4 MB) is excluded from Git tracking to prevent repository bloat.
   * A scheduled weekly GitHub Action (`.github/workflows/refresh_data.yaml`) fetches the latest daily dump, validates payload integrity (>1 MB check), runs the data hygiene and modeling pipeline, and commits the updated precomputed lookup artifact (`data/processed/lookup_schema_v1.json`).
   * **Ingestion Fallback:** If the Berlin Open Data portal is unreachable during a local or CI run, `fetch_police_csv.py` automatically falls back to the last known good CSV cached locally (`data/raw/fahrraddiebstahl.csv`) or via `actions/cache`.

2. **Serving Layer & Client-Side Fallback (FastAPI $\rightarrow$ Local JSON):**
   * **Primary Serving:** A lightweight, containerized **FastAPI** service (`GET /api/v1/risk`) serves precomputed risk profiles with sub-millisecond lookup times.
   * **Client Fallback:** If the API container experiences a cold start or network interruption, the React client automatically aborts after 1.5 seconds and falls back to the bundled static `lookup_schema_v1.json` snapshot.

3. **Static Spatial Boundaries (`lor_planungsraeume_2021.geojson`):**
   * The official 2021 Berlin LOR polygons (542 *Planungsräume*) are versioned directly in the repository for deterministic local joins and zero-latency map rendering.

---

## 🧠 Statistical Modeling & Data Hygiene

* **Outdoor Street Filtering:** Excludes indoor and basement break-ins (`Keller- und Bodeneinbruch`) via `DELIKT` and `ERFASSUNGSGRUND` inspection to isolate street parking vulnerability.
* **Reporting Lag Truncation:** Truncates the trailing $N$ days (95th percentile of `ANGELEGT_AM - TATZEIT_ENDE_DATUM`, ~10–14 days) prior to train/test splitting to eliminate right-censoring bias from unreported recent thefts.
* **Interval-Censored Offense Windows:** Avoids uniform spreading of multi-day offense windows (up to 72 hours) via Expectation-Maximization (EM) proportional allocation / two-stage conditioning.
* **Hierarchical Empirical Bayes Smoothing:** Shrinks sparse area-time cells toward parent *Bezirksregion* (6-digit BZR) priors before computing risk percentiles (`Low: 0–60th`, `Medium: 60–85th`, `High: 85–100th`).
* **30-Day Anomaly Detection:** Flags planning areas where trailing 30-day theft volume exceeds the 95% Poisson confidence interval (`trending_up_30d: true`).

---

## 📂 Repository Structure

```text
lock-out/
├── .github/
│   └── workflows/
│       └── refresh_data.yaml                # Weekly cron + manual CI pipeline with CSV cache fallback
├── data/
│   ├── raw/
│   │   ├── lor_planungsraeume_2021.geojson  # Official 542 Berlin LOR polygons (EPSG:4326)
│   │   └── fahrraddiebstahl.csv             # Local raw Police CSV (git-ignored, cached fallback)
│   └── processed/
│       └── lookup_schema_v1.json            # Precomputed risk & advice lookup artifact
├── src/
│   ├── fetch_police_csv.py                  # Resilient downloader with >1MB check & local fallback
│   ├── audit_police_csv.py                  # Data integrity, lag cutoff & cell sparsity audit
│   └── api/
│       └── main.py                          # FastAPI serving wrapper
├── frontend/                                # Vite + Leaflet client (scaffold: map and 542 areas)
├── pyproject.toml / uv.lock                 # Dependencies and the exact locked versions
├── .python-version                          # Python version used by uv
└── README.md
```

---

## 🚀 Quickstart

### Prerequisites

* **Python 3.11+**
* **Node.js 20+** (for the front-end client)

### 1. Environment Setup

Clone the repository and initialize the Python virtual environment:

```bash
git clone https://github.com/mattscherzer/lock-out.git
cd lock-out

# Install uv once: https://docs.astral.sh/uv/getting-started/installation/
uv sync   # creates .venv with the exact Python and package versions from uv.lock
```

### 2. Fetch Data & Run the Integrity Audit

Fetch or verify the Polizei Berlin CSV, and run the audit script:

```bash
# 1. Fetch latest Police CSV (automatically falls back to data/raw/fahrraddiebstahl.csv if offline)
uv run python src/fetch_police_csv.py

# 2. Run the data hygiene, reporting lag, and sparsity audit
uv run python src/audit_police_csv.py
```

### 3. Run the API Server *(planned, `src/api/main.py` does not exist yet)*

Start the local FastAPI server:

```bash
uv run uvicorn src.api.main:app --reload --port 8000
```

### 4. Run the Front-End Client (local server only, not deployed yet)

Needs Node 20.19+ (or 22.12+) and internet access (OSM tiles load from `tile.openstreetmap.org`).

```bash
cd frontend
npm install
npm run dev        # dev server, open the printed URL (http://localhost:5173)
```

To test the production build instead:

```bash
npm run build && npm run preview   # serves dist/ at http://localhost:4173
```

Expected: a map of Berlin with 542 area polygons (counter top left reads "542 areas") and the OSM and Polizei Berlin attribution bottom right; the browser console stays empty. Works from 375 px up.

The fixtures in `frontend/public/` are generated from `data/raw/lor_planungsraeume_2021.geojson` and a subset of the draft schema (metadata, risk bands, area names; no predictions); regenerate with `python3 frontend/scripts/build_fixture.py`. The existing `demo/` prototype is untouched; open it with `python3 -m http.server -d demo`.

The demo shares the place-search lookup `frontend/public/gazetteer.json`. Link it once with `ln -s ../frontend/public/gazetteer.json demo/gazetteer.json` (git-ignored; Pages copies the file at deploy). Without the link the demo still works, with area-name search only.

---

## 🔄 Automated Data Refresh (CI/CD)

The repository includes an automated GitHub Actions workflow (`.github/workflows/refresh_data.yaml`) that runs every Monday at `06:00 UTC` (and supports manual triggers via `workflow_dispatch`):

1. Restores the last known good `fahrraddiebstahl.csv` from the GitHub Actions cache.
2. Runs `uv run python src/fetch_police_csv.py` to pull fresh data from `polizei-berlin.eu` (or retain the cached copy if the portal is down).
3. Executes the validation and precomputation scripts to update `data/processed/lookup_schema_v1.json`.
4. *(Planned)* Opens a pull request with the updated risk tables; `main` is branch-protected, so a direct push is not possible.

---

## 🔒 Privacy & Ethics

* **Zero Rider Tracking:** Geolocation is performed exclusively in the user's browser by matching GPS coordinates locally against the bundled LOR GeoJSON polygons (`@turf/boolean-point-in-polygon`). No user coordinates are transmitted to or stored on any server.
* **Non-Stigmatizing Framing:** Risk indicators describe *bicycle parking vulnerability* and *urban activity context*, never labeling neighborhoods as "unsafe".

---

## 📜 Data Sources & Legal Attribution

This project relies on open public datasets and complies with their respective attribution requirements:

* **Bicycle Theft Data:** *Datenquelle: Polizei Berlin – [Fahrraddiebstahl in Berlin](https://daten.berlin.de/) (Licensed under [CC-BY 4.0](https://creativecommons.org/licenses/by/4.0/))*.
* **Spatial Boundaries (LOR 2021):** *Amt für Statistik Berlin-Brandenburg / Senatsverwaltung für Stadtentwicklung, Bauen und Wohnen – [ODIS Berlin](https://daten.odis-berlin.de/) (Licensed under dl-de/by-2-0)*.
* **Urban Infrastructure & POI Proxies:** *© [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors (Licensed under [ODbL](https://opendatacommons.org/licenses/odbl/))*.

---

## 📄 License

Distributed under the MIT License. See [LICENSE](./LICENSE) for more information.