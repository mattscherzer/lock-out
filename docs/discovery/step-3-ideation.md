# Step 3: AI Powered Ideation

> Caveat for all discovery files: personas, quotes and complaints are synthetic hypotheses, not research. Only police-data and PKS figures are evidence. See [Product Discovery.md](../Product%20Discovery.md).

Ten ideas built from the Step 2 pain points. "Not copied" means I avoided the obvious ones (crime maps, trackers, registration, generic advice); prior art is checked in [step-4-market.md](step-4-market.md). Feasibility is judged against Berlin police data, 542 planning areas, OSM proxies, lock-tier guidance, a map client, no accounts and no tracking.

**Pain point key:** PP1 locking is a recurring cost; PP2 no feedback on whether locking is good; PP3 decisions run on habit; PP4 weight versus security; PP5 institutions feel absent. C1–C10 are the complaints in [step-2-pain-points.md](step-2-pain-points.md). Feature IDs: F = inventory (Step 1), V = Tonight's Verdict, H = Honest Fog, S = Settle It.

## The ten ideas

**Counterintuitive** = does the opposite of what a risk app would be expected to do.

| #   | Idea | What it is | Solves | Needs | Main risk |
| --- | ---- | ---------- | ------ | ----- | --------- |
| 1 | **Tonight's Verdict** | One sentence relative to the area's own normal ("Normal for a Tuesday night. Your usual lock is fine."), map one tap behind | C1, C3, C9, C10, PP2, PP3 | F1, F3, F4, F6, template layer | Reassurance can mislead on thin data; needs a "not enough data" rule |
| 2 | **Lock Receipt** | Three-prompt check after locking, a dated record kept on the phone only | C6, C10, PP2 | F4, F10, local storage | No insurer is known to accept it; self-reported; may feel like a chore |
| 3 | **Settle It** | Compare two places or times, shareable link, ends "north vs south" arguments | C8, C3, social jobs | F1, F3, share link | Area data may show little difference between nearby spots |
| 4 | **Rack Case Pack** | Printable evidence sheet for an address or station, for a landlord, employer or operator | C2, C4, PP5 | F1, F5, print template | Unknown whether recipients act; may stigmatize an area |
| 5 | **Closure Card** | After-theft flow with honest context ("one of N reports in your area this month") | C4, PP5, self-blame | Aggregate counts, report guidance | Sensitive; must not look like police advice |
| 6 | **Two-Minute Alternatives** | Suggest lower-risk spots and racks within a two-minute walk | C2, C3, PP1, PP3 | F1, F2, OSM rack layer | Planning areas are large, so false precision; OSM racks are patchy |
| 7 | **Honest Fog** | Hatched "thin data" state and plain-words confidence on every tier | C3, C9, trust | F8, smoothing uncertainty | "Thin" may be read as "no answer"; pair with idea 1 |
| 8 | **Lock Budget** (counterintuitive) | "Lightest sensible lock here, now", so the rider knows when the heavy lock can stay home | C5, PP1, PP4 | F3, F4, bike-value and time-away inputs | Highest liability; must stay within police and ADFC guidance (never a frame lock alone) |
| 9 | **Non-Event Check-ins** (counterintuitive) | One-tap anonymous "parked 9 hours, bike was fine" to build exposure data police data lacks | C3, PP5, Denominator Trap | Anonymous endpoint, abuse control, privacy review | Cold start; rider location and time are sensitive; spam |
| 10 | **Boring Bike Coach** (counterintuitive) | Make the bike a worse target: remove standout parts, cover branding | C5, PP4, PP1 | F5, curated advice | No evidence appearance changes theft odds |

Ideas 5 and 9 need a privacy and ethics review before any build. Idea 8 must be checked against [lock-tier-documentation.md](../lock-tier-documentation.md) before it appears in a mock-up.

## Evaluation matrix

H high, M medium, L low. **Reach** = pain points addressed. **Fit** = match with existing data. **Risk** = legal, privacy, trust or accuracy.

| #   | Idea                    | Reach | Fit with current data | Build effort | Risk | Counterintuitive |
| --- | ----------------------- | ----- | --------------------- | ------------ | ---- | ---------------- |
| 1   | Tonight's Verdict       | H     | H (assumed, pending data check) | L            | M    |                  |
| 2   | Lock Receipt            | M     | H                     | L            | M    |                  |
| 3   | Settle It               | M     | H                     | L            | L    |                  |
| 4   | Rack Case Pack          | M     | M                     | M            | M    |                  |
| 5   | Closure Card            | M     | M                     | M            | H    |                  |
| 6   | Two-Minute Alternatives | M     | L                     | M            | M    |                  |
| 7   | Honest Fog              | M     | H (assumed, pending data check) | L            | L    |                  |
| 8   | Lock Budget             | H     | M                     | M            | H    | Yes              |
| 9   | Non-Event Check-ins     | H     | L                     | H            | H    | Yes              |
| 10  | Boring Bike Coach       | M     | M                     | L            | M    | Yes              |

### Combinations worth a closer look

- **1 + 7 (Verdict with Honest Fog):** the verdict is decisive, the fog stops it overclaiming. Cheapest strong core.
- **1 + 8 (Verdict with Lock Budget):** gives the "what to carry tonight" answer that the lock-weight complaint asks for.
- **3 + 4 (Settle It feeding the Rack Case Pack):** the same comparison data becomes shareable evidence for the "someone responsible should act" need.
- **9 on its own:** highest long-term payoff, because it fixes a data weakness, but it is the hardest and riskiest, so run it as a small experiment after the core exists.

## Value creation and business models

**Baseline.** The canvas ([business-model-canvas-draft.md](../business-model-canvas-draft.md)) commits to a free, open-source, civic-benefit product with no accounts and no tracking. Every model below is tagged against that: **Fits** keeps the stance, **Strains** bends it, **Breaks** contradicts it. No revenue figures are given, because nothing here has been tested. These are options to evaluate, not a plan.

| #   | Idea                    | Value created (for whom)                                                                                          | Possible business models                                                                                              | Stance                                                             |
| --- | ----------------------- | ----------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| 1   | Tonight's Verdict       | Rider: a decision in seconds, less worry. City and public: a fair, readable risk signal                           | Grant or civic-tech funding; city or district license for an embeddable widget; donations                             | Fits                                                               |
| 2   | Lock Receipt            | Rider: proof of what they did, closure on "did I do it right". Insurer: better-documented claims                  | Insurer partnership (a verified-locking record as a claim aid); lock retailer affiliate links; sponsorship            | Strains (insurer data flow, retail incentives bias advice)         |
| 3   | Settle It               | Rider: ends disputes, a shareable evidence link. Community: growth through sharing                                | Free growth driver; sponsored by cycling clubs or ADFC; supporters tier                                               | Fits                                                               |
| 4   | Rack Case Pack          | Rider: leverage with landlord, employer or transit operator. Operator: evidence for a parking investment decision | Paid evidence reports for housing companies, employers or districts; consultancy; grant-funded public version         | Fits (public version free; B2B reports paid)                       |
| 5   | Closure Card            | Victim: acknowledgement and a clear next step. Police or victim-support services: better-prepared reports         | Partnership with victim-support or police prevention programs; grant                                                  | Fits, but sensitive                                                |
| 6   | Two-Minute Alternatives | Rider: an action instead of a warning. Retailers, cafés: an incentive to host safe racks                          | Local business listings or "safe rack" partner badges; city rack-siting analysis                                      | Strains (partner badges may bias advice)                           |
| 7   | Honest Fog              | Rider and public: trust and a safe signal. Researchers and journalists: a credible reference                      | Part of the open-source core; data-quality service for institutions                                                   | Fits                                                               |
| 8   | Lock Budget             | Rider: lighter carry on low-risk days; less burden. Lock makers: a clear tiered shopping guide                    | Lock retailer or manufacturer partnership (tier-to-product guides); affiliate links                                   | Strains (commercial bias risk is high for a safety recommendation) |
| 9   | Non-Event Check-ins     | Public and city: exposure data that police data lacks, which improves risk estimates. Researchers: a rare dataset | Research partnerships and grants; anonymised data license to the city, transport operators or academics; open dataset | Strains (collects location and time data, even anonymised)         |
| 10  | Boring Bike Coach       | Rider: lower risk without heavier locks. Bike shops: a service for "theft-proofing" a bike                        | Bike shop partnerships (a theft-proofing service); content sponsorship                                                | Strains                                                            |

### Reading across the table

- **Three revenue patterns recur:** public funding (grants, city licenses), B2B evidence for people who control the physical space (landlords, employers, transport operators, districts), and commercial partnerships with locks, insurers or bike shops.
- **The commercial partnerships carry the most risk.** An advice product paid by the sellers of the thing it advises on has a conflict of interest. For a safety recommendation, this can destroy the trust the product depends on (see C1, C3, C9). Treat them as last-resort options.
- **The most defensible long-term asset is data.** Ideas 7 and 9 build something nobody else has: honest uncertainty and exposure data. Neither pays for itself soon, but both support grant and research funding.
- **No individual-rider payment** appears anywhere, consistent with the canvas, which assumes riders will not pay (untested).
- **Untested:** whether any of these buyers (insurers, housing companies, districts, retailers) have a budget or any interest. That is a second round of customer discovery with a different set of interviewees.

## Top 3: selected ideas and specific features

Ranked on the matrix above: reach across pain points, fit with existing data, build effort and risk.

| Rank | Idea                     | Why                                                                                                          |
| ---- | ------------------------ | ------------------------------------------------------------------------------------------------------------ |
| 1    | **#1 Tonight's Verdict** | Highest reach, builds on planned features, low effort, and gives the next action riders asked for            |
| 2    | **#7 Honest Fog**        | Low effort and risk, and it is what stops the Verdict from overclaiming. The two are designed as one surface |
| 3    | **#3 Settle It**         | Low effort and low risk, covers the social jobs and supplies a growth path through sharing                   |

Runner-up: **#2 Lock Receipt**, close behind on fit. **#8 Lock Budget** has the highest value but is held back by its guidance and liability risk, so it comes after a legal read of the lock-tier guidance.

Priorities: **P0** = needed for the first prototype (Verdict plus Honest Fog; Settle It is the second step), **P1** = next, **P2** = later. Features reference the inventory F1–F10 where they build on one.

### Idea 1: Tonight's Verdict

| ID  | Feature                        | What it does                                                                                                                                             | Inputs                                          | Priority | Pain points     |
| --- | ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- | -------- | --------------- |
| V1  | **Verdict sentence**           | One plain-language sentence for the rider's area and the next few hours, e.g. "Normal for a Tuesday night. Your lock is fine." Opens as the first screen | Area tier (F1), time of day (F3), area baseline | P0       | C1, C3, C9, C10 |
| V2  | **Own-baseline framing**       | Compares the area to its own typical level for this weekday and daypart, not to Berlin overall                                                           | Area-time history, smoothed estimates           | P0       | C3, C10         |
| V3  | **Next-action line**           | Names one action under the sentence: the lock tier to use and the anchoring step (frame + wheel + fixed object)                                          | F4, F10                                         | P0       | C1, C6, PP2     |
| V4  | **Locate me, or pick an area** | Uses browser geolocation if allowed, otherwise lets the rider search an area or district. No account                                                     | F7, area search                                 | P0       | PP3             |
| V5  | **Time shifter**               | "Now / tonight / tomorrow 8 am" control, so Jonas can check before leaving and Lena can see overnight                                                    | F3                                              | P0       | PP3             |
| V6  | **"Higher than usual" flag**   | Raises the tone only when the 30-day signal is clearly above the area's norm                                                                             | F6                                              | P1       | C9              |
| V7  | **Map one tap away**           | The full map stays as a secondary view for people who want it                                                                                            | F1                                              | P1       | C3              |
| V8  | **Home area on device**        | Remembers an area on the phone only, so the app opens on it                                                                                              | Local storage                                   | P1       | PP3             |
| V9  | **Calm state**                 | When the area is normal or low, the screen says so plainly, with no warning styling                                                                      | Copy and design                                 | P0       | C10             |
| V10 | **Offline snapshot**           | The verdict works from the bundled JSON if the API is slow                                                                                               | F9                                              | P1       | adoption        |

**Design rules:** the sentence is always one line, never contains more than one number, and never uses "dangerous" or similar labels. If the data is thin, it says so (see Honest Fog).

---

### Idea 7: Honest Fog

| ID  | Feature                               | What it does                                                                                                                              | Inputs                                               | Priority | Pain points                |
| --- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- | -------- | -------------------------- |
| H1  | **Confidence level on every verdict** | A three-step label (solid / fair / thin) next to the sentence, in plain words                                                             | Smoothing uncertainty, number of reports in the cell | P0       | C3, C9                     |
| H2  | **Thin-data hatching on the map**     | Areas with too little data show a hatched pattern, not a confident colour                                                                 | Cell counts, OSM coverage                            | P1       | C3                         |
| H3  | **Verdict downgrade rule**            | If confidence is thin, the verdict changes to "not enough data here, use the standard-tier advice", never a reassurance                   | Rule layer over V1                                   | P0       | C10 (reassurance vs truth) |
| H4  | **"Why this answer" panel**           | Opens a short explanation: where the numbers come from, how recent, and what is excluded (indoor cases, last 10–14 days of reporting lag) | README data hygiene steps                            | P0       | C3, C9                     |
| H5  | **Data freshness stamp**              | "Updated on [date]; the last two weeks are incomplete"                                                                                    | Weekly refresh pipeline                              | P1       | C3                         |
| H6  | **Known limits page**                 | Plain statement of what the data cannot show: unreported thefts, rack-level detail, reporting bias                                        | Static content                                       | P1       | C3, C9                     |
| H7  | **Confidence-aware share card**       | Anything shared from the app carries its confidence label, so a screenshot cannot overclaim                                               | Idea 3 link                                          | P2       | C8                         |

**Design rules:** uncertainty is shown before it is asked for. The wording is tested for how it reads to non-statisticians. "Thin" must not read as "safe".

---

### Idea 3: Settle It

| ID  | Feature                   | What it does                                                                                            | Inputs                  | Priority | Pain points     |
| --- | ------------------------- | ------------------------------------------------------------------------------------------------------- | ----------------------- | -------- | --------------- |
| S1  | **Two-place compare**     | Pick two areas and two times; see the verdicts side by side, with their confidence labels               | V1, H1                  | P1       | C8              |
| S2  | **One-line difference**   | States the gap in plain words: "Area A is about the same as B" or "A is clearly higher than B at night" | Rule layer              | P1       | C8              |
| S3  | **Share link**            | A short link that reopens the same comparison, no account needed                                        | Static route parameters | P1       | C8, social jobs |
| S4  | **Share card image**      | A clean image for messaging apps, with source and date                                                  | Template                | P1       | C8, social jobs |
| S5  | **Honest tie**            | When the data cannot separate two places, say so, and say the choice is a toss-up                       | Confidence layer        | P1       | C3              |
| S6  | **Seed from the verdict** | One tap on the Verdict screen to compare "my area" with another                                         | V1                      | P1       | PP3             |
| S7  | **Print view**            | A one-page printable version, which later feeds idea 4 (Rack Case Pack)                                 | Template                | P2       | C2, C4          |

**Design rules:** the comparison never ranks a neighborhood as "worse" in a way that reads as a label. It describes the difference and the confidence in it. No user identifiers in the link.

---
### Build order for the top 3

1. **First prototype:** V1, V2, V3, V4, V5, V9 + H1, H3, H4 (the verdict with its honesty layer).
2. **Second step:** S1, S2, S3, S5 (compare and share), then V6, V7, V8, V10, H2.
3. **Later:** H5–H7, S4, S6, S7.

### Open questions before building

- **Baselines:** does the data support a stable "own normal" for each of the 542 areas by weekday and daypart, or are the cells too sparse? If sparse, V2 falls back to coarser time bands.
- **Calm state:** will riders accept "normal" as an answer, or will they treat it as "no information"?
- **Wording:** the lock-tier copy must follow [lock-tier-documentation.md](../lock-tier-documentation.md) (never a frame lock alone, always anchor frame and a wheel).
- **Sharing and privacy:** confirm that share links carry only the places and times chosen, with no rider location.
