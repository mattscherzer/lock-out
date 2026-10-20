# LockOut - AI Ethics Integration Summary

Details: [ai-ethics-integration-quick-check.md](ai-ethics-integration-quick-check.md) and [ai-ethics-integration-questions.md](ai-ethics-integration-questions.md). Thresholds and costs are rough assumptions; terms are explained in the [plain-words list](ai-ethics-integration-questions.md#terms-in-plain-words). Features named below are proposals, not yet built.

## Key Ethical Commitments

1. **Fair treatment of all areas and riders**: the risk signal corrects for busy places (Volume Illusion) and incomplete rack data (Denominator Trap), uses "bike-parking risk" wording instead of "crime", and has no "worst areas" list
2. **Transparent AI decision-making**: every result says it is an area-level estimate from reported thefts, shows the data date and flags limited data
3. **User control and privacy**: location by GPS, address or map tap, no account, nothing stored, and geolocation never leaves the browser

## Top AI Risks Identified

1. **Bias and stigma**: the police data only holds reported thefts and OSM coverage is uneven, so some areas look safer or riskier than they are, and a "High" tier can label a neighborhood. Mitigation: neutral wording, a "limited data" flag for sparse areas, and a fairness check of error and the share of areas per tier across Berlin's 12 districts and across wealthier and poorer areas (assumption: a suitable income dataset exists).
2. **False "Low" result**: a rider picks a weak lock because the app seemed to say the spot was safe. Mitigation: never say "safe", say "lower risk", and show baseline lock advice at every tier.
3. **Stale or wrong data**: the client falls back to the saved snapshot, the model drifts, or a bad CSV produces wrong tiers. Mitigation: a visible "data from [date]" and fallback notice, a check of model error on recent data and a sanity check that the share of areas per tier stays stable before the weekly commit, and a human review of each weekly diff.

## Business Model Enhancements

- **Value Proposition**: fairness is the product ("Busy does not mean dangerous"), shown with honest uncertainty
- **Competitive Advantage**: trust (no account, no tracking, open code); that no existing map does both is an assumption to test
- **Additional Activities**: fairness check and model card (a one-page note on data, limits and biases), human review of AI-generated code, pipeline sanity checks and weekly diff review, hiding or merging areas with very few thefts, wording and accessibility review of the map client, pilot polls that ask about understanding and trust
- **Additional Costs**: roughly €0–550 extra in the first 3 months on top of the canvas budget (accessibility check €0–50, optional separate fairness review €0–500; incentives, hosting and the canvas reviewer are already in the canvas). The rest is team time, about 2–3 days plus 1–2 hours per week (team estimate).

## Trust-Building Features

- **Understanding**: plain-language tier label, a "How this works" panel, an "About the data" page and a short privacy note
- **Control**: choose location and time slot, turn off geolocation at any time, riders always decide and the app never blocks or alarms
- **Errors**: show the data date and uncertainty, never a blank map (labelled fallback to the saved snapshot), a one-tap "This looks wrong" link, and a public changelog of fixes
