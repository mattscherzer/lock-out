# LockOut: Business Model Canvas, Step-by-Step Answers

Inputs: README.md, plus the choices made for this draft: primary user = Berlin daily commuters; model = free / open source / civic benefit; AI = statistical models plus a predictive model; team = 2 PMs using AI-driven development.

Items marked **(assumption to test)** are hypotheses, not facts from the project.

---

## Step 1: Customer and problem

### 1. Who would actually use this?

**Berlin daily bike commuters** who lock their bike outside several times a week (U-/S-Bahn stations, workplaces, shops, cafés) and have no secure indoor parking. In more detail:

- Age roughly 16–45, riding 3 or more days a week, and parking at a different place each time (new stations, client visits, evening events).
- Owners of a bike that is worth protecting. The police dataset records the stolen value (`SCHADENSHOEHE`), so this can be sized from the data.
- Not the "I always park at home" rider, and not tourists.

### 2. What problem does it solve for them?

- Berlin has more than 20,000 reported outdoor bike thefts a year, but a rider can't tell how risky a given spot is.
- Existing crime maps mislead in two ways:
  - **Volume Illusion:** busy hubs like Alexanderplatz look "high risk" simply because many people pass through.
  - **Denominator Trap:** theft-per-rack maps spike in residential areas where OSM rack data is incomplete.
- A rider also doesn't know **which lock to use or when the spot is worst** (for example overnight).

### 3. How do they solve this problem now?

- Gut feeling and word of mouth.
- Generic advice from ADFC and Polizei Berlin: "use a good U-lock".
- Raw police crime maps or news reports, which have the two flaws above.
- Avoiding risky places altogether, or taking the bike inside.
- Insurance, tracker tags (AirTag-style) and buying a cheaper "commuter bike".

### 4. Why would they switch to an AI solution?

- The signal is hard to compute by hand. It needs smoothing across 542 areas and time slots, a correction for reporting lag, and a separation of "busy" from "risky". A rider can't do that in their head, and a plain count map doesn't.
- It gives a location-specific and time-specific answer ("this area, tonight, medium risk, use a tier-2 lock"). Generic advice can't.
- A predictive model can say what risk is **coming**, not just what happened.
- The honest limit: switching needs trust, so the product must be simple, free and clear about its uncertainty. Riders won't pay for it, and they will drop it if it feels alarmist.

---

## Step 2: Value and model

**Product:** a map-first web app that shows area-level theft-risk tiers (Low / Medium / High) for all Berlin planning areas. It adds activity-adjusted context and, time-of-day warnings. Geolocation happens in the browser only.
**Users:** Berlin daily commuters who park outdoors.

### 1. What's the main value this creates?

Riders **decide in seconds where and how to lock** their bike, based on a fair risk signal. For the city and public, it is open, non-stigmatizing evidence on bike-parking vulnerability.

### 2. How would users measure success?

Testable, in order of difficulty:

| Metric | Type | Target for a first test (to be set by the team) |
| --- | --- | --- |
| Weekly active users (WAU) among commuters | Usage | Set after a pilot in 1–2 districts |
| Share of sessions that end with a lock recommendation being viewed | Engagement | Majority of sessions |
| "Did this change how you parked?" in-app 1-question poll | Behavior | Share answering yes |
| Self-reported thefts in a user survey (before/after) | Outcome | Directional only; too few users for statistics |
| Model quality: held-out accuracy of risk tiers, calibration | Technical | Defined with the data scientist |
| Data freshness (weekly refresh succeeds) | Reliability | Weekly refresh succeeds on most weeks |

### 3. How could this make money? (internal value or external revenue)

**Chosen model: free, open source, civic benefit.** The value is not revenue, it is public value. However if enough attention is brought to the project such scenarios could provide external revenue:

1. **Open-source / civic-tech grants** to cover development time.
2. **Partnerships**: ADFC, Polizei Berlin, BVG/S-Bahn or district offices could co-promote or fund it as a prevention tool. The aim is the credibility and reach it brings, not a sale.
3. **Off the critical path**: non-intrusive affiliate links to locks, or insurers' bike cover. These would need a clear label, and they could risk trust.

### 4. What would be realistic pricing/value?

- **Price to riders: €0.** No accounts, no tracking.
- **Value to riders, a simple sanity check:** if the app avoids even one theft of a bike worth a few hundred euros, it pays for itself many times. The median stolen value can be taken from the police data (`SCHADENSHOEHE`), which this draft does not compute.
- **Value to funders:** cost per active user and cost per recommendation viewed.
- **Cost to run:** Could run for free with free hosting options, depends on the attraction it gains could increase to a couple euros a month.

**Simplest testable model:** launch free in 1–2 Berlin districts, track WAU and the in-app poll for 4–6 weeks.

---

## Step 3: AI product and what it needs

**AI in this product:** statistical risk modeling, plus a predictive spatio-temporal model that forecasts expected risk by area and time window.
**Technical approach:** offline precomputation of risk profiles from police and OSM data, served as a precomputed JSON lookup (FastAPI, with a static JSON fallback in the React client). No LLM in the decision path, and no user data sent to a server.

### 1. Essential data sources

| Source | Use | Status |
| --- | --- | --- |
| Polizei Berlin, *Fahrraddiebstahl* CSV (CC-BY 4.0) | Theft incidents, time, area, value, aggravation | In use; weekly refresh via GitHub Actions |
| LOR 2021 Planungsräume GeoJSON (dl-de/by-2-0) | 542 area polygons, spatial join | In repo |
| OpenStreetMap (ODbL) | Point-of-interest density proxies (bike racks, transit stations, shops, nightlife POIs) extracted via osmnx/Overpass under ODbL. | Not yet in the repo |

### 2. Key technology and tools

- **Python 3.11+ with uv**, for the pipeline and modeling (pandas-style data work, statistical models; the predictive model library is still to be chosen).
- **GitHub Actions**, for the weekly data refresh and precompute.
- **FastAPI** in a container, for serving; the **precomputed JSON** is the fallback.
- **React, Vite, Tailwind CSS, Leaflet and Turf.js**, for the map client and local point-in-polygon.
- **AI coding assistant (Claude Code)**, because the team works with AI-driven development.
- Hosting: a small container host, or static hosting plus a free tier.

### 3. Critical skills and expertise

Team: **2 AIPMs using AI-driven development.**

### 4. Rough cost estimate for 3 months

2 PMs working using an AI assistant. Every number is a rough estimate to be replaced with real quotes.

| Item | Estimate for 3 months |
|---|---|
| AI coding assistant subscriptions (2 seats) | about €100–€400 (depends on the plan) |
| Hosting (container or static host, domain) | about €20–€60 |
| GitHub Actions | €0 (public repo, free tier) |
| Data (police, LOR, OSM) | €0 |
| Map tiles | €0 on a free tier; check the provider terms |
| User testing incentives (for example 10–15 interviews) | about €150–€300 |
| Optional: part-time stats/data reviewer (a few days) | about €1,000–€3,000 if paid; €0 if a volunteer or mentor |
| **Total tools and operations, without paid labor** | **about €300–€800** |
| **Total with an external reviewer** | **about €1,300–€3,800** |

PM time is not costed. If it were paid at a market rate, it would dominate the budget.
