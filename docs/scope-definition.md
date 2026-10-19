# LockOut - 3-Week Development Plan

Details and reasoning: [Scope Exploration.md](Scope%20Exploration.md). Week 4 is a cushion before the presentation, not part of this scope.

## MVP Goal

**What we'll build**: A Berlin bike-parking risk map: tap or locate a spot, pick a time of day and bike type, and get a risk tier plus a lock recommendation.
**Who can use it**: Berlin daily bike commuters who lock outdoors; a 5-rider pilot in 1-2 districts.
**Success looks like**: Pilot riders get from open to a lock decision in under 1 minute and understand what the tier means.

## Technical Check

**Core AI feature**: Empirical Bayes smoothed theft-risk tiers (Low / Medium / High) for the 542 Berlin planning areas by daypart and weekday/weekend, with deterministic lock advice from Polizei Berlin, ProPK, VdS and ADFC guidance.
**Data source**: Polizei Berlin Fahrraddiebstahl CSV (CC-BY 4.0), LOR 2021 GeoJSON, OpenStreetMap activity proxies (optional), `docs/lock-tier-documentation.md` for lock guidance.
**Team skills match**: Yes, with AI-assisted development, library-based statistics and tests on every model step. Statistics review is a gap, so one outside review is planned.
**Backup plan**: Smoothed theft tiers only (no OSM adjustment), static JSON on a static site (no FastAPI).

## Must Have (Week 1-2)

- [ ] Smoothed risk tiers per LOR x daypart x daytype, precomputed into `lookup_schema_v1.json`
- [ ] Validation and tests: time-based hold-out, tier-share sanity check, district fairness check, advice router tests
- [ ] Per-area stats (aggravated-theft share, median stolen value), `advice_catalog` and the advice router
- [ ] Map input (GPS or tap) with browser-only point-in-polygon, daypart, daytype and bike-type selectors
- [ ] Result card: tier, plain-language explanation, lock recommendation, data date, "limited data" flag
- [ ] Basic error handling (location denied, outside Berlin), usable at phone width
- [ ] Static site hosted by the end of Week 2

## Nice to Have (Week 3)

- [ ] Wording test with 5 pilot riders by mid-week, then fix the wording
- [ ] "How this works" panel, "About the data" page, "This looks wrong" link
- [ ] OSM activity-adjusted signal (time-boxed, first thing cut)
- [ ] FastAPI endpoint with static fallback, address search (privacy-acceptable geocoder only)
- [ ] Offline and sparse-data handling, guideline URL health check
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
**Week 3**: Pilot wording test and fixes, error handling and explanation text, optional extras, prepare demo

## Biggest Risk

**Risk**: Under-reported thefts and sparse cells give noisy or misleading tiers, and AI-written model code may be statistically wrong without anyone noticing.
**Plan**: Shrinkage toward district priors, a "limited data" flag, neutral "bike-parking risk" wording, hold-out and fairness checks with tests on every model step, and one outside review.

## Success Criteria

- Users can go from opening the map to a lock decision in under 1 minute
- High-tier areas stay in the top ~25% of actual thefts in the hold-out period at least 70% of the time, and rank correlation is at least 0.6
- 4 of 5 pilot riders understand the tier wording, and at least 3 say they'd use this
