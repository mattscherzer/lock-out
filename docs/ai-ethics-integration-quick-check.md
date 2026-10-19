# AI Ethics Quick Check

## LockOut - AI Ethics Assessment

Details and reasoning: [ai-ethics-integration-questions.md](ai-ethics-integration-questions.md). Thresholds and costs are rough proposals. Terms are explained in the [plain-words list](ai-ethics-integration-questions.md#terms-in-plain-words). Features named below are proposals, not yet built.

## Who's Affected?

**Primary Users**: Berlin daily bike commuters who lock outdoors several times a week and have no secure indoor parking
**Others Impacted**: Residents and shops in areas labelled "High" (stigma, perceived value), neighborhoods where theft is under-reported (they look safer than they are), ADFC and city bodies who may reuse the evidence, riders without a smartphone or without German/English

## Key Risks

**Bias Risk**: Could this AI treat some groups unfairly? **Yes**

- If yes: Police data only holds reported thefts, and OSM coverage is uneven, so some areas can look safer or riskier than they are. Test prediction error and the share of areas per tier across Berlin's 12 districts and across wealthier and poorer areas (assumption: a suitable income dataset exists). Use "bike-parking risk" wording (not "crime"), no "worst areas" list, and a "limited data" flag for sparse areas.

**Privacy Risk**: Does this use sensitive data? **Maybe (low)**

- If yes: Police data has no personal details and is shown at planning-area level only. Hide or merge areas with very few incidents. Geolocation stays in the browser and is never sent or stored, with address or map tap as an alternative. No accounts, no analytics cookies, anonymous feedback poll, privacy-friendly tile provider.

**Trust Risk**: Do users need to understand AI decisions? **Yes**

- If yes: Plain-language tier label ("expected bike-parking risk for this area, from reported thefts"), a "How this works" panel, an "About the data" page, the data date, and a note on uncertainty. Never say "safe", say "lower risk".

## Essential Safeguards

**Must Have** (for MVP):

- Honest labelling: "reported thefts, area level", data date, visible notice when the saved fallback snapshot is used, "limited data" flag for sparse areas
- Baseline lock advice at every tier (including "Low"), and a pipeline sanity check plus review of the weekly diff before it ships

**Should Add** (soon after):

- Model card and published fairness check results, reviewed by an external statistician or ADFC contact
- Public changelog of corrections, German/English language switch, accessibility audit (screen reader, contrast)

## User Control

**What users can control**: Location by GPS, address or map tap; time slot; turning off geolocation at any time; no account needed, nothing stored
**What happens when AI is wrong**: Show the data date and uncertainty instead of false precision, never a blank map (fallback to the saved snapshot with a label), a one-tap "This looks wrong" link that opens a prefilled GitHub issue, and a public changelog of fixes

## Success Measures

**How to measure fairness**: Gap in prediction error and share of areas per tier between districts and between wealthier and poorer areas (no group clearly over-flagged; threshold set by the team)
**How to measure trust**: In-app 1–5 poll ("I understand what the tier means", "I trust this result"), share who open "How this works", and number and resolution time of "This looks wrong" reports
