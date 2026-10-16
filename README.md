# LockOut 🚲🔒

LockOut is a map-first geospatial web application that helps urban cyclists evaluate street-parking risk and choose the right locking strategy before leaving their bike unattended. Starting in Berlin across all 542 official planning areas (*Lebensweltlich orientierte Räume* — LOR), LockOut combines historical police incident data with OpenStreetMap (OSM) urban activity proxies to deliver calibrated spatio-temporal risk profiles and actionable security recommendations.

---

## 🎯 Problem & Core Value Proposition

Urban cyclists in Berlin face approximately 20,000 reported outdoor bicycle thefts per year. Existing crime maps suffer from two fundamental flaws:

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
   * The raw Polizei Berlin dataset (`Fahrraddiebstahl.csv`, ~15–20 MB) is excluded from Git tracking to prevent repository bloat.
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
├── frontend/                                # React + Vite + Tailwind CSS + Leaflet client
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
git clone [https://github.com/mattscherzer/lock-out.git](https://github.com/mattscherzer/lock-out.git)
cd lock-out

# Install uv once: https://docs.astral.sh/uv/getting-started/installation/
uv sync   # creates .venv with the exact Python and package versions from uv.lock
```

### 2. Fetch Data & Run the Integrity Audit

Download the official 2021 Berlin LOR GeoJSON boundaries (one-time setup), fetch or verify the Polizei Berlin CSV, and run the audit script:

```bash
# 1. Download 2021 LOR GeoJSON boundaries into data/raw/
curl -o data/raw/lor_planungsraeume_2021.geojson \
  "[https://tsb-opendata.s3.eu-central-1.amazonaws.com/lor_planungsgraeume_2021/lor_planungsraeume_2021.geojson](https://tsb-opendata.s3.eu-central-1.amazonaws.com/lor_planungsgraeume_2021/lor_planungsraeume_2021.geojson)"

# 2. Fetch latest Police CSV (automatically falls back to data/raw/fahrraddiebstahl.csv if offline)
uv run python src/fetch_police_csv.py

# 3. Run the data hygiene, reporting lag, and sparsity audit
uv run python src/audit_police_csv.py
```

### 3. Run the API Server

Start the local FastAPI server:

```bash
uv run uvicorn src.api.main:app --reload --port 8000
```

### 4. Run the Front-End Client

In a separate terminal, launch the React/Vite application:

```bash
cd frontend
npm install
npm run dev
```

---

## 🔄 Automated Data Refresh (CI/CD)

The repository includes an automated GitHub Actions workflow (`.github/workflows/refresh_data.yaml`) that runs every Monday at `06:00 UTC` (and supports manual triggers via `workflow_dispatch`):

1. Restores the last known good `fahrraddiebstahl.csv` from the GitHub Actions cache.
2. Runs `uv run python src/fetch_police_csv.py` to pull fresh data from `polizei-berlin.eu` (or retain the cached copy if the portal is down).
3. Executes the validation and precomputation scripts to update `data/processed/lookup_schema_v1.json`.
4. Commits and pushes updated risk tables back to `main`.

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