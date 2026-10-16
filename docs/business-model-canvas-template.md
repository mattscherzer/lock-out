# Business Model Canvas Template (Draft Level)

## LockOut - Business Model Canvas (Draft)

Details and reasoning: [business-model-canvas-steps.md](business-model-canvas-steps.md). Cost and funding figures are rough estimates.

## Customer Segments

**Primary Users**: Berlin daily bike commuters who lock outdoors several times a week (stations, workplaces, shops) and have no secure indoor parking
**Their Context**: Parking at changing places and times, unsure how risky the spot is or which lock to use, as roughly 20,000 outdoor bike thefts are reported in Berlin each year
**How to Reach**: Commuter interviews at S-/U-Bahn bike parking, ADFC Berlin groups and events, Berlin cycling communities (Reddit, Facebook, Strava clubs), a pilot test-run in 1–2 districts

## Value Propositions

**Main Benefit**: A fair, area-level and time-specific theft-risk signal and lock recommendation for all Berlin planning areas, so riders decide in seconds where and how to lock
**Problem Solved**: Crime maps flag busy hubs as risky just because they are busy (Volume Illusion) and distort residential areas with incomplete rack data (Denominator Trap); riders get no guidance on lock tier or risky times
**Why AI**: Statistical modeling (Empirical Bayes smoothing, EM allocation, anomaly detection) plus a predictive model give calibrated, forward-looking risk that a rider or a raw count map cannot

## Revenue/Value Model

**Internal Project**: Free, open source, civic-benefit project; the value is public (fewer thefts, open non-stigmatizing evidence), not revenue
**External Product**: None at launch (€0 for riders, no accounts, no tracking)
**Rough Value**: One avoided theft of a bike worth a few hundred euros outweighs any running cost; measured by weekly active users, lock recommendations viewed and a "did this change how you parked?" poll

## Key Resources

**Data**: Polizei Berlin Fahrraddiebstahl CSV (CC-BY 4.0), LOR 2021 GeoJSON (dl-de/by-2-0), OpenStreetMap activity proxies (ODbL), ADFC and Polizei lock guidance
**Technology**: Python with uv, GitHub Actions, FastAPI, React, Vite, Tailwind CSS, Leaflet, Turf.js, an AI coding assistant
**Team Skills**: Product and user research (the 2 PMs); AI-driven development; data and statistics review (gap, to be borrowed); accessibility and mobile UX checks

## Key Activities

**Must Do**: 3-4 most important activities to deliver value

- Build AI model (risk smoothing plus a predictive spatio-temporal model, validated on held-out data)
- Keep the weekly data refresh and precompute pipeline reliable
- Build and ship the map client with lock recommendations and the API/JSON fallback
- Run a commuter pilot and measure usage and behavior change

## Key Partners

**Data Source**: Polizei Berlin (via Berlin Open Data), Amt für Statistik Berlin-Brandenburg / ODIS Berlin, OpenStreetMap contributors
**Technology**: GitHub (Actions, repo hosting), a container or static host, a map tile provider, an AI coding assistant provider

## Channels

**How Users Access**: Free external web app in the mobile browser
**How They Learn**: Word of mouth, cycling communities

## Customer Relationships

**Support Needed**: Self-service only; clear in-app explanation of the risk tiers and their uncertainty; GitHub issues for bugs
**Feedback**: In-app 1-question poll, commuter interviews, GitHub issues, a short before/after survey

## Cost Structure

**Development**: Two PMs' timeand AI coding assistant subscriptions
**Operations**: Hosting and domain, user-testing incentives; data, GitHub Actions and map tiles on free tiers
**Rough Monthly**: Roughly €100–€270 per month in the first 3 months (about €300–€800 total without paid labor; about €1,300–€3,800 with an external reviewer); the ongoing run cost is a few euros per month
