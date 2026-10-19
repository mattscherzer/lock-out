# LockOut - 3-Week Development Plan

Details and reasoning: [Scope Exploration.md](Scope%20Exploration.md). Week 4 is a cushion before the presentation, not part of this scope.

## MVP Goal

**What we'll build**: A Berlin bike-parking risk map: tap or locate a spot, pick a time of day and bike type, and get a risk tier plus a lock recommendation.
**Who can use it**: Berlin daily bike commuters who lock outdoors; a 5-rider pilot in 1-2 districts.
**Success looks like**: Pilot riders get from open to a lock decision in under 1 minute and understand what the tier means.

## Technical Check

**Core AI feature**: Empirical Bayes smoothed theft-risk tiers (Low / Medium / High) for the 542 Berlin planning areas by daypart and weekday/weekend, with deterministic lock advice from Polizei Berlin, ProPK, VdS and ADFC guidance. In plain words: risk tiers from police theft data, adjusted so areas with few reports don't look artificially safe or dangerous. Terms are explained in the [glossary](#glossary) at the bottom.
**Data source**: Polizei Berlin Fahrraddiebstahl CSV (CC-BY 4.0), LOR 2021 GeoJSON, OpenStreetMap activity proxies (optional, extraction not yet built), [lock-tier-documentation.md](lock-tier-documentation.md) for lock guidance.
**Team skills match**: Yes, with AI-assisted development, library-based statistics and tests on every model step.
**Team**: Two people alternating the PM role weekly; both review every AI-generated change before merge.
**Backup plan**: Smoothed theft tiers only (no OSM adjustment), static JSON on a static site (no FastAPI).

## Must Have (Week 1-2)

- [ ] Smoothed risk tiers per LOR x daypart x daytype, precomputed into `lookup_schema_v1.json`
- [ ] Validation and tests: time-based hold-out, tier-share sanity check, district fairness check, advice router tests
- [ ] Per-area stats (aggravated-theft share, median stolen value), `advice_catalog` and the advice router
- [ ] Map input (GPS or tap) with browser-only point-in-polygon, daypart, daytype and bike-type selectors
- [ ] Result card: tier, plain-language explanation, lock recommendation, data date, "limited data" flag; never says "safe" and shows baseline lock advice at every tier
- [ ] Basic error handling (location denied, outside Berlin), usable at phone width
- [ ] Static site hosted by the end of Week 2
- [ ] Recruit the 5 pilot riders (1-2 districts, as in the [business model canvas](business-model-canvas-draft.md)) by the end of Week 2

## Must Have (Week 3)

- [ ] Wording test with the 5 pilot riders by mid-week, then fix the wording (the success criteria depend on it)

## Nice to Have (Week 3)

Listed in the order to build; if behind, cut from the bottom up.

- [ ] "How this works" panel, "About the data" page, "This looks wrong" link
- [ ] Offline and sparse-data handling, guideline URL health check
- [ ] Address search (privacy-acceptable geocoder only)
- [ ] FastAPI endpoint with static fallback
- [ ] OSM activity-adjusted signal (time-boxed)
- [ ] Visual polish, dark mode, accessibility pass, 30-day anomaly flag, weekly auto-refresh

## Won't Do

- Cities other than Berlin, accounts, saved places, rider tracking
- "Most dangerous areas" ranking or neighborhood safety scores
- Live theft reports, alerts, route planning
- Lock product or brand recommendations
- Deep learning, production-scale hosting and security hardening

## Weekly Plan

**Week 1**: Get the data pipeline and smoothed tiers working; map shell returns the area for a tapped point
**Week 2**: Build the lock advice, result card and selectors, validate the model, deploy the static site
**Week 3**: Pilot wording test and fixes, explanation text, offline and sparse-data handling, optional extras, prepare demo

## Biggest Risk

**Risk**: Under-reported thefts and sparse cells give noisy or misleading tiers, and AI-written model code may be statistically wrong without anyone noticing.
**Plan**: Shrinkage toward the surrounding district's average, a "limited data" flag, neutral "bike-parking risk" wording, hold-out and fairness checks with tests on every model step, and one outside review. Other risks (frontend overrun, a "Low" tier leading to a weak lock, data source down, stale lock guidance, PM handover): see Scope Exploration, section 3.

## Success Criteria

Working targets, not yet verified. Confirm against the data in Week 2.

- Users can go from opening the map to a lock decision in under 1 minute
- On a hold-out of the most recent 3-6 months, at least 70% of High-tier areas stay in the top ~25% by actual thefts, and rank correlation is at least 0.6
- 4 of 5 pilot riders understand the tier wording, and at least 3 say they'd use this

## Glossary

- **LOR / planning area**: one of Berlin's 542 official small areas (_Planungsräume_); the map gives one result per area
- **Daypart / daytype**: time-of-day band (e.g. night) / weekday vs. weekend
- **Smoothing (Empirical Bayes)**: pulling noisy counts from areas with few thefts toward the district average
- **Tier**: Low / Medium / High risk band, based on percentile among all areas
- **Advice router / `advice_catalog`**: fixed rules and texts that pick the lock recommendation from the tier and local theft data (no ML)
- **Hold-out**: recent data kept out of the model to test its predictions
- **Tier-share check**: confirms the share of areas per tier looks sensible (not e.g. 80% High)
- **VdS / ProPK / ADFC**: German lock-test standard / police crime-prevention program / cyclists' association
