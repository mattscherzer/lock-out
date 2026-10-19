# Step 0: Product Context Calibration

> Caveat for all discovery files: personas, quotes and complaints are synthetic hypotheses, not research. Only police-data and PKS figures are evidence. See [Product Discovery.md](../Product%20Discovery.md).

### 1. Is my target audience specific enough for meaningful personas?

**Short answer: not yet.** "Berlin daily bike commuters who lock outdoors several times a week and have no secure indoor parking" is a good starting segment, but it is a demographic-plus-habit description. It is too broad to yield personas that would change a product decision.

What is specific enough already:

- Geography (Berlin, 542 planning areas) and a behavior filter (locks outdoors, no secure parking).
- It excludes tourists and "always parks at home" riders.

What is missing:

- **Age 16–45 is a guess**, not a behavior. It will not separate users whose needs differ.
- **Parking context is the real dividing line.** The product's two outputs (area risk tier, lock tier) matter differently depending on where and how long the bike is left. The segment hides at least these distinct situations:

| Candidate persona             | Situation                                                              | What they need from LockOut                                                                                       | Evidence level                                         |
| ----------------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| **Station parker**            | Leaves the bike 8+ hours at an S-/U-Bahn stop or workplace             | Lock tier for long dwell; whether the area is a hotspot                                                           | Assumption                                             |
| **Street-parking resident**   | No courtyard or cellar; bike stays outside overnight at home           | Overnight risk window and lock tier. Probably the largest theft exposure, but this is not yet checked in the data | Assumption                                             |
| **Errand / short-stop rider** | Shops, cafés, appointments; 10 minutes to 2 hours, new place each time | A fast "is this spot OK right now" answer                                                                         | Assumption                                             |
| **High-value bike owner**     | E-bike or road/cargo bike worth well over €1,000                       | Highest lock tier, insurance-aware advice                                                                         | Partly testable: `SCHADENSHOEHE` is in the police data |
| **Cheap-bike rider**          | Bike worth under about €300                                            | May not care at all, since the lock can cost more than the bike                                                   | Assumption                                             |

Recommendation:

1. **Pick one persona to design for first.** The sharpest fit with the product (time-of-day warnings, lock tiers, area-level data) looks like the **street-parking resident** or the **station parker**, because both have a repeated, high-dwell decision. Decide this from interviews, not from this table.
2. **Replace age with behavior and stakes:** dwell time, number of distinct parking spots per week, bike value, past theft experience, and whether the rider has a secure option at home or work.
3. **Check the data for who is actually stolen from.** The police CSV gives time of theft, location and stolen value. Use it to estimate which parking context and bike value band dominate the thefts. That tells you which persona has the biggest problem, without asking anyone.
4. **Screening question for interviews:** "In the last 4 weeks, where did you leave your bike outside, for how long, and what lock did you use?" Anyone who cannot answer concretely is not the target.

Verdict: enough to start recruiting for interviews, **not enough to write personas yet.** Write them after about 8–10 interviews.

---

### 2. Does my problem statement reflect real user pain or assumed pain?

**Short answer: mostly assumed pain.** The statement was built from the data and the shortcomings of existing maps, not from conversations with riders.

Current problem framing (from the README and canvas): riders can't tell how risky a spot is or which lock to use, and existing crime maps mislead through the **Volume Illusion** and the **Denominator Trap**.

What is **real** (supported by data):

- Bike theft is common in Berlin. The README cites roughly 20,000 reported thefts a year. Note this is _reported_ thefts, which understates the real count and may include indoor cases until the filtering step is applied.
- Risk does vary by area and time of day in the police data.

What is **assumed** (no evidence yet):

- **That riders feel a "can't tell how risky this spot is" pain.** They may already feel confident, or feel the risk is the same everywhere and nothing can be done about it.
- **That riders would consult a map before parking.** The Volume Illusion and the Denominator Trap are flaws of _crime maps_. They are an analyst's problem, not a rider's. A rider never says "the denominator is wrong"; they say "my bike got stolen" or "I'm always worried about it".
- **That the missing piece is information.** The cause of theft may be a weak lock, a poor anchor point, or no safe parking option. Information about risk does not fix the last one.
- **That a lock recommendation changes behavior.** [lock-tier-documentation.md](../lock-tier-documentation.md) shows the official advice is already public (ADFC, Polizei, ProPK) and says the same thing: buy a good U-lock, anchor frame and wheel. Riders who ignore that advice may also ignore LockOut.

How to reword the problem so it is testable:

> _Berlin riders who park outdoors regularly do not know how risky a spot is at a given time, so they either over-worry, carry too heavy a lock everywhere, or under-protect the bike and lose it._

This version names three observable behaviors that interviews can confirm or kill. If riders never over-worry and never change locks by place, the problem statement is wrong.

Evidence to collect before calling the pain real:

| Question to answer                                                                          | How                                                                        |
| ------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Have they had a bike stolen, or know someone who did? How did it feel and what did it cost? | Interviews (past events, not hypotheticals)                                |
| Do they change where or how they lock depending on the place or time?                       | Interviews, "tell me about the last time you chose where to park"          |
| What do they do today to decide, and is it good enough?                                     | Interviews, look for workarounds and spending (locks, insurance, trackers) |
| Would they open a map app _before_ parking, or is that too much friction?                   | Prototype test, or a landing page with a sign-up click                     |

Verdict: **assumed pain with a data-backed backdrop.** Treat the problem statement as a hypothesis to be confirmed by interviews of past behavior, not as a finding.

---

### 3. What assumptions am I making that need validation?

Ranked by how badly the product fails if the assumption is wrong. "Riskiest first" is the order to test.

| ID  | Assumption                                                                             | Type                 | If wrong                                                                                        | How to validate                                                                                             | Cost   | Status |
| --- | -------------------------------------------------------------------------------------- | -------------------- | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ------ |
| A1 | Riders feel enough pain about theft risk to seek out information                       | Desirability         | Nobody uses the app                                                                             | 8–10 interviews of past behavior; count how many already changed behavior because of risk                   | Low    | Untested |
| A2 | Riders will check a map _before_ parking, in the moment                                | Behavior / usability | Usage collapses after one visit                                                                 | Prototype or clickable mock at a station; "park, then show me what you'd do"                                | Low    | Untested |
| A3 | An area-level (planning-area) signal is precise enough to be useful                    | Value                | "Medium risk" for a whole neighborhood tells riders nothing about the specific rack             | Show prototypes to riders; ask what decision it changes. Compare risk spread inside areas vs. between areas | Medium | Untested |
| A4 | Riders trust a risk tier from an unknown app over their own gut                        | Trust                | Signal is ignored or seen as alarmist                                                           | Interviews plus showing the tier with and without uncertainty wording                                       | Low    | Untested |
| A5 | A lock-tier recommendation changes what riders buy or carry                            | Value                | Recommendation is a duplicate of ADFC advice                                                    | Ask what lock they own and why; test whether tier advice surprises them                                     | Low    | Untested |
| A6 | The commuter segment is the right one (vs. residents with street parking overnight)    | Segment              | Build for the wrong persona                                                                     | Use the police data to see time-of-day and value patterns; compare with interview sample                    | Low    | Untested |
| A7 | Police data reflects real risk (reporting bias)                                        | Data validity        | Risk tiers measure reporting, not theft. Riders with cheap bikes or no insurance may not report | Compare with insurance or survey data; state the limit in the UI                                            | Medium | Untested |
| A8 | OSM activity proxies explain "busy vs. risky" well enough to separate the two          | Technical            | Volume correction is noisy or wrong                                                             | Backtest on held-out months; review with a data scientist (listed as a team gap)                            | Medium | Untested |
| A9 | The predictive model beats a simple baseline (last year's rate for that area and time) | Technical            | "AI" adds complexity without value                                                              | Held-out accuracy and calibration against the baseline                                                      | Medium | Untested |
| A10 | Past theft predicts future theft in the same spot (thieves do not displace)            | Technical            | Forecasts are stale after a patrol or a new rack                                                | Check stability of area ranks across years                                                                  | Medium | Untested |
| A11 | Sharing risk by area does not stigmatize neighborhoods or hurt residents               | Ethical / reputation | Press or political backlash                                                                     | Review wording with a civic-tech or community contact; show uncertainty, avoid "dangerous" labels           | Low    | Untested |
| A12 | Free + open source is sustainable and enough to reach riders                           | Business             | Project stalls after launch                                                                     | Test channels in the pilot (ADFC, communities, station flyers); count real sign-ups                         | Medium | Untested |
| A13 | Two PMs plus AI-driven development can ship the model and the app                      | Feasibility          | Scope slips                                                                                     | Time-box a thin slice: one district, one tier, static JSON                                                  | Low    | Untested |

Notes on the table:

- Items **A1, A2 and A3** are the make-or-break set. A beautiful model does not matter if riders do not open the app (A1, A2) or if area-level risk is too coarse to act on (3).
- Items **A8–A10** have a clean cheap test: backtest against a naive baseline before building the full pipeline.
- Item **A7** (reporting bias) is easy to forget because the dataset feels authoritative. State it in the product, not just in the docs.
