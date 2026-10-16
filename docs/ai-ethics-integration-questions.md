# LockOut: AI Ethics Integration, Step-by-Step Answers

Inputs: README.md, [business-model-canvas-draft.md](business-model-canvas-draft.md), and the same assumptions as the canvas (primary user = Berlin daily commuters; free, open source, civic benefit; statistical models plus a predictive model; team = 2 PMs using AI-driven development). Filled-in summary: [ai-ethics-integration.md](ai-ethics-integration.md).

Items marked **(assumption to test)** are hypotheses, not facts from the project. Costs are rough estimates.

---

## Step 1: Risk Assessment

### 1. Could this be unfair to some groups?

**Yes, mainly through the data and through labelling places.**

| Risk | Why it happens | Simple fix |
| --- | --- | --- |
| **Reporting bias** | The police data only holds *reported* thefts. Areas where people report less (low trust in police, no insurance that requires a report, language barriers) look safer than they are. Areas with more reporting look worse. | Say so in the app ("based on reported thefts"). Compare reporting-related patterns across districts and note the gap in the model card. |
| **Stigmatizing neighborhoods** | A "High" tier on a residential area can read as "dangerous neighborhood" and hurt its residents, shops and rents. | Word the tiers as *bike-parking risk*, never "crime" or "danger". Show the tier next to the activity-adjusted context so busy hubs and residential areas are read fairly. No ranked "worst areas" list. |
| **Uneven OSM coverage** | OSM rack and shop data is more complete in central areas. The "Denominator Trap" can come back through the activity proxies. | Test whether residuals correlate with OSM completeness. Fall back to the district prior when OSM data is thin. |
| **Sparse areas** | Empirical Bayes shrinks small areas toward their parent district. This is statistically sound but can hide a real local problem or over-weight the district. | Show a "limited data" flag for sparse cells instead of a confident tier. |
| **Who can use the app** | Phone-only, German or English only, map colors alone carry the meaning, riders without a smartphone are left out. | Colour-blind-safe palette plus text labels, keyboard and screen-reader basics, plain German and English copy. |
| **People outside the user group** | Residents and businesses are affected by what the map says about their area, but they never use the app. | Keep the output at planning-area level, publish the method, and give a public way to report concerns (GitHub issues). |

**Simple test for MVP:** compare tier distribution and prediction error across the 12 districts and across high/low-income areas **(assumption to test: an income or social-index dataset, e.g. Berlin's *Monitoring Soziale Stadtentwicklung*, is available to join)**. If one group is systematically over-flagged, adjust or add a caveat.

### 2. Are there privacy concerns with the data?

**Low, but not zero.**

- **Police data:** published as open data, no names. Locations are already at planning-area level. Risk: in very small cells with few thefts, an incident could be linked to a person by someone with local knowledge. **Fix:** keep the area-level output only, never publish raw rows, and suppress or merge cells below a minimum count (for example fewer than 5 incidents) **(threshold to be set by the team)**.
- **Rider location:** geolocation is requested in the browser only. **Fix:** ask permission in context ("Use my location to find your area"), never send coordinates to the server, always allow typing an address or tapping the map instead.
- **Third parties:** the map tile provider and the host see the rider's IP address. **Fix:** pick a provider with a clear privacy policy, no analytics cookies, no accounts, and say this in a short privacy note.
- **Feedback:** the in-app poll and interviews can collect personal details. **Fix:** keep the poll anonymous, get consent for interviews, and delete raw notes after analysis.
- **Licences:** CC-BY 4.0, dl-de/by-2-0 and ODbL need attribution. **Fix:** an "About the data" page with all credits.

### 3. Do users need to understand how AI works?

**Not the maths, but they must understand five things:**

1. This is a **statistical estimate from past reported thefts**, not a live feed and not a guarantee.
2. The tier is for the **whole planning area**, not the exact spot.
3. Why a tier looks the way it does (busy hub vs. really high theft rate).
4. How **fresh** the data is (last update date; reporting lag of about 10–14 days is cut off).
5. How **sure** the estimate is (for example a "limited data" note).

Put this in a one-sentence label plus a "How this works" panel, written for a commuter, not a statistician.

### 4. What happens if the AI makes mistakes?

| Mistake | What it causes | Simple fix |
| --- | --- | --- |
| **False "Low"** | A rider uses a weak lock because the app said it was safe. This is the most harmful error. | Never show "safe". Use "lower risk". The baseline lock advice (good U-lock, lock frame and wheel to a fixed object) appears at every tier. |
| **False "High"** | A rider avoids a fine area, or the area is stigmatized. | Wording as above, plus a "report a wrong result" link. |
| **Stale data** | The client falls back to the bundled JSON snapshot and shows old risk. | Always show "data from [date]" and mark when the fallback snapshot is in use. |
| **Model drift** | Theft patterns change (new rack programme, new hotspot) and the predictive model gets worse. | Weekly refresh already exists. Add a held-out error check to the pipeline and block publishing if error rises past a set limit. |
| **Bug in the pipeline** | A bad CSV produces wrong tiers. | The pipeline already checks payload size and falls back to the last good CSV. Add a simple sanity check (tier shares stay close to the 60/25/15 split) before the weekly commit. |

Keep a **human in the loop**: the team reviews each weekly diff of the lookup file before it ships, or at least the summary stats.

---

## Step 2: Trust Building

Focus: practical MVP features, kept small enough for a student team.

### 1. What should users understand about the AI?

- What the tier means and what it does **not** mean ("expected theft risk for this area, from reported cases").
- That the **same area can read differently by time of day**, and why.
- What data it uses, shown as a short list with the date of the last update.
- That it **cannot see the exact street, the rack quality, or this particular bike**.

### 2. What control should they have?

| Control | MVP? |
| --- | --- |
| Choose location by GPS, address or map tap (no forced location sharing) | **Yes** |
| Choose the time slot, so they can check "tonight" or "tomorrow morning" | **Yes** |
| Turn off geolocation at any time, no account required | **Yes** (nothing is stored) |
| Switch the lock advice to a simple "show only the basic tips" view | Later |
| Language switch German / English | Later, but plan the text for it |

Riders always decide. The app suggests, it never blocks or alarms.

### 3. How should we handle errors?

- **Say what is wrong in plain words.** For example: "Showing saved data from 12 Oct, live data is unavailable."
- **Never show a blank map.** The 1.5 second fallback to the bundled JSON already does this. Add the visible "saved data" label.
- **One-tap "This looks wrong"** link that opens a prefilled GitHub issue or form (area, time, what looked off). No login.
- **Fix and say so.** Keep a short public changelog ("2026-11-03: corrected tier for area X").
- Show **uncertainty** instead of false precision: "limited data for this area".

### 4. What would make them comfortable using this?

- No account, no tracking, no ads, free. Say it on the first screen.
- A short **privacy note** (three lines) and an **About the data** page.
- **Open source** code and open method.
- **Tone**: calm and practical ("Use a U-lock, lock the frame and a wheel"), not fear.
- Test with 5–8 commuters: "Do you understand the tier? Do you trust it? What would you change?" and record the answers.

### MVP trust checklist

- [ ] Tier label with plain-language meaning and "reported thefts" wording
- [ ] "Data from [date]" and a visible fallback notice
- [ ] "How this works" panel and "About the data" page
- [ ] Location by tap/address, no account, nothing stored
- [ ] "This looks wrong" link
- [ ] Baseline lock advice shown at every tier

---

## Step 3: Ethical Business Model

Realistic for a student team of 2 PMs using AI-driven development.

### 1. Add ethical value to our main benefit

Main benefit (from the canvas): *a fair, area-level and time-specific theft-risk signal and lock recommendation.*

- **Fairness is the product.** The two-part signal (Hotspot Tier plus Activity-Adjusted Context) already avoids the Volume Illusion and the Denominator Trap. State this as the promise: "Busy does not mean dangerous."
- **Non-stigmatizing by design**: bike-parking wording, no "worst areas" list.
- **Open evidence for the public**: the method and data are open, so anyone can reuse it.

### 2. Include ethical safeguards in key activities

| Key activity (from the canvas) | Safeguard to add |
| --- | --- |
| Build the AI model | Fairness check across districts and a social-index split. Model card (data, limits, known biases, error rates). Document the choice of the tier thresholds. |
| Keep the weekly pipeline reliable | Sanity checks before commit (tier shares, row counts, error against held-out data). Review of the weekly diff. Small-cell suppression. |
| Build and ship the map client | Wording review, colour-blind-safe palette, data-date label, "limited data" flag, "This looks wrong" link, privacy note. |
| Run a commuter pilot | Consent and anonymity for interviews and polls. Ask about **understanding and trust**, not only usage. Include riders from different districts. |

### 3. Budget for responsible AI practices

Rough estimates, on top of the canvas budget **(assumption to test)**:

| Item | Cost | Notes |
| --- | --- | --- |
| Team time for fairness checks and the model card | 0 €, about 2–3 days | Done by the team with AI help |
| Pipeline sanity checks and the weekly review | 0 €, about 1–2 hours per week | Runs in GitHub Actions on the free tier |
| Accessibility check (screen reader, contrast, mobile) | 0–50 € | Free tools (axe, Lighthouse) plus testers |
| External review of fairness and method | 0 € favour, or about 200–500 € for a few hours | The "gap" in the team skills list |
| Pilot incentives for diverse participants | 100–300 € | Already partly in the canvas budget |
| Privacy-friendly hosting and tile provider | A few € per month | Choose it at the start, no extra cost later |

**Roughly 300–900 € extra for the first 3 months** (or near 0 € if a reviewer helps for free). Time is the main cost, so schedule it in the sprint plan instead of "later".

### 4. Make ethics a competitive advantage

- **Differentiator:** "The only Berlin bike-theft map that corrects for busy places and tells you how sure it is."
- **Trust as the moat:** free, no account, no tracking, open code. Hard to copy for a commercial app that needs data and ads.
- **Proof points to publish:** the model card, the fairness check results, and the changelog of corrections.

---

## Success measures

| Question | Simple metric |
| --- | --- |
| Is it fair? | Gap in prediction error and tier share between districts and social-index groups (target: no group clearly over-flagged; threshold set by the team) |
| Is it trusted? | In the poll: "I understand what the risk tier means" and "I trust this result" (1–5 scale), plus the share who open "How this works" |
| Does it admit errors? | Number of "This looks wrong" reports, and share answered or fixed within one week |
| Is the data fresh? | Days since the last successful refresh, shown in the app and tracked |

## What this assessment does not cover

- No legal advice (GDPR review, licence compliance check).
- Numbers, thresholds and costs above are assumptions.
