# LockOut 🚲🔒

LockOut is a map-first geospatial web application that helps urban cyclists evaluate street-parking risk and choose the right locking strategy before leaving their bike unattended. Starting in Berlin across all 542 official planning areas (*Lebensweltlich orientierte Räume* — LOR), LockOut combines historical police incident data with OpenStreetMap (OSM) urban activity proxies to deliver calibrated spatio-temporal risk profiles and actionable security recommendations.

---

## 🎯 Why LockOut?

Standard crime heatmaps fail cyclists in two ways:

1. **The Raw Volume Fallacy:** Plotting raw theft counts simply highlights major transit and commercial hubs (e.g., Alexanderplatz) without accounting for the massive volume of bicycles parked there.
2. **The Denominator Trap:** Dividing thefts by mapped bike racks (`Thefts / Racks`) causes poorly mapped residential areas with 1 mapped rack and 3 thefts to artificially rank as the #1 danger zone in the city.

**LockOut solves this by surfacing a two-part risk signal:**

* **Hotspot Volume Tier:** Empirical Bayes smoothed theft intensity ranked across Berlin (`Low`, `Medium`, `High`).
* **Activity-Adjusted Context:** Model residuals controlling for local urban activity density (transit stations, retail POIs, nightlife, and street racks) to show whether risk is higher or lower than typical for a given neighborhood profile.

Instead of telling riders to walk 15 minutes to a different neighborhood, LockOut focuses on **temporal boundary awareness** and **hardware mitigation**—informing riders when risk spikes (e.g., overnight transitions), what percentage of local thefts involve defeated locks, the median value of targeted bicycles, and what lock tier is required.

---

## ✨ Key Features

* **Interactive 542-LOR Map:** Explore Berlin's official planning areas via a fast vector polygon map or match your current location strictly client-side using browser GPS (zero location tracking or server-side logging).
* **Spatio-Temporal Risk Profiles:** Filter by day type (`Mon–Thu`, `Friday`, `Weekend`), operational daypart (`Morning 06–11`, `Afternoon 11–17`, `Evening 17–22`, `Night 22–06`), and bicycle category (`Standard` vs. `E-Bike / Cargo`).
* **Empirical Local Crime Context:** View area-specific statistics including the **Aggravated Theft Share** (% of incidents where a lock was defeated) and **Median Stolen Bike Value (€)**.
* **30-Day Anomaly Detection:** Automatic alerts (`trending_up_30d`) when recent rolling 30-day incident volume exceeds the historical 95% Poisson confidence interval.
* **Evidence-Based Locking Advice:** Tailored security guidance grounded in Polizei Berlin and ADFC (Allgemeiner Deutscher Fahrrad-Club) standards.

---

## 🏗️ System Architecture & Statistical Methodology

LockOut is engineered for sub-millisecond response times and high operational reliability by decoupling heavy statistical computation from runtime serving:

1. **Data Hygiene & Preprocessing:**
   * **Outdoor Street Filtering:** Excludes indoor and basement break-ins (`Keller- und Bodeneinbruch`) to isolate true on-street parking risk.
   * **Reporting Lag Truncation:** Dynamically truncates the trailing reporting-lag window (95th percentile of `ANGELEGT_AM - TATZEIT_ENDE_DATUM`, ~14 days) prior to model fitting and validation to prevent right-censoring bias.
   * **2021 LOR Standard:** Strictly aligned to Berlin's post-2021 8-digit LOR hierarchy (12 *Bezirke* -> 58 *Prognoseräume* -> 143 *Bezirksregionen* -> 542 *Planungsräume*).
2. **Interval-Censored Offense Window Allocation:**
   * Handles multi-hour offense windows (<= 72h) using **Expectation-Maximization (EM) / Two-Stage Conditioning**, allocating long-window incidents proportionally across overlapped dayparts using high-certainty short-window (<= 4h) priors rather than naive uniform spreading.
3. **Hierarchical Smoothing & Count Modeling:**
   * **Empirical Bayes Baseline:** Shrinks sparse *Planungsraum* time-block cells toward their parent *Bezirksregion* (first 6 digits of `PLR_ID`) to eliminate structural zero-inflation artifacts.
   * **Regularized Poisson GLM:** Incorporates log-transformed OSM point-of-interest counts (`log(1 + x)`) as learned covariates (beta) and evaluates out-of-time performance via Poisson deviance, Brier score, and Top-K spatial recall.
4. **Hybrid Serving Layer:**
   * Precomputes the full enumerable state space into a compact lookup artifact (`lookup_schema_v1.json`, ~420 KB gzipped) served via a containerized **FastAPI** backend with an automatic client-side static fallback.

---

## 📁 Repository Structure

```text
lock-out/
├── data/
│   ├── raw/                  # Raw inputs (lor_planungsraeume_2021.geojson, local CSV cache)
│   └── processed/            # Precomputed lookup_schema_v1.json & intermediate tables
├── src/
│   ├── audit_police_csv.py   # Data validation, lag distribution & LOR alignment checks
│   ├── pipeline/             # Cleaning, EM window allocation & OSM feature extraction
│   ├── models/               # Hierarchical Empirical Bayes & Poisson GLM training
│   └── api/                  # FastAPI service wrapping the precomputed lookup schema
├── frontend/                 # React + Vite + Tailwind CSS + Leaflet/MapLibre client
├── tests/                    # Automated data contract & API test suite (pytest)
├── requirements.txt          # Python dependencies
└── README.md
```

---

## 🚀 Quickstart

### Prerequisites

* **Python 3.11+**
* **Node.js 20+** (for the front-end client)

### 1. Backend & Data Pipeline Setup

Clone the repository and set up the Python environment:

```bash
git clone [https://github.com/mattscherzer/lock-out.git](https://github.com/mattscherzer/lock-out.git)
cd lock-out

python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Fetch Spatial Boundaries & Run Data Audit

Download the official 2021 Berlin LOR GeoJSON boundaries and run the data integrity audit against the Polizei Berlin dataset:

```bash
# Download 2021 LOR GeoJSON into data/raw/
curl -o data/raw/lor_planungsraeume_2021.geojson \
  "[https://tsb-opendata.s3.eu-central-1.amazonaws.com/lor_planungsgraeume_2021/lor_planungsraeume_2021.geojson](https://tsb-opendata.s3.eu-central-1.amazonaws.com/lor_planungsgraeume_2021/lor_planungsraeume_2021.geojson)"

# Run the validation & sparsity audit
python src/audit_police_csv.py
```

### 3. Run the API Server

```bash
uvicorn src.api.main:app --reload --port 8000
```

### 4. Run the Front-End Client

```bash
cd frontend
npm install
npm run dev
```

---

## 🔒 Privacy & Ethics

* **Zero Rider Tracking:** Geolocation is performed exclusively in the user's browser by matching GPS coordinates locally against the bundled LOR GeoJSON polygons (`@turf/boolean-point-in-polygon`). No user coordinates are transmitted to or stored on any server.
* **Non-Stigmatizing Framing:** Risk indicators describe *bicycle parking vulnerability* and *urban activity context*, never labeling neighborhoods as "unsafe".

---

## 📜 Data Sources & Legal Attribution

This project relies on open public datasets and complies with their respective attribution requirements:

* **Bicycle Theft Data:** *Datenquelle: Polizei Berlin – [Fahrraddiebstahl in Berlin](https://daten.berlin.de/) (Licensed under [CC-BY 4.0](https://creativecommons.org/licenses/by/4.0/))*.
* **Spatial Boundaries (LOR 2021):** *Amt für Statistik Berlin-Brandenburg / Senatsverwaltung für Stadtentwicklung, Bauen und Wohnen (Licensed under dl-de/by-2-0)*.
* **Urban Infrastructure & POI Proxies:** *© [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors (Licensed under [ODbL](https://opendatacommons.org/licenses/odbl/))*.

---

## 📄 License

Distributed under the MIT License. See [`LICENSE`](./LICENSE) for more information.
