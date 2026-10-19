# LockOut: Product Discovery

Inputs: [README.md](../README.md), [business-model-canvas-draft.md](business-model-canvas-draft.md), [business-model-canvas-questions.md](business-model-canvas-questions.md). No user research has been done yet, so every claim about riders below is a hypothesis unless it comes from the police data.

---

## Step 0: Product Context Calibration

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
- **That a lock recommendation changes behavior.** [lock-tier-documentation.md](lock-tier-documentation.md) shows the official advice is already public (ADFC, Polizei, ProPK) and says the same thing: buy a good U-lock, anchor frame and wheel. Riders who ignore that advice may also ignore LockOut.

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

| #   | Assumption                                                                             | Type                 | If wrong                                                                                        | How to validate                                                                                             | Cost   |
| --- | -------------------------------------------------------------------------------------- | -------------------- | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ------ |
| 1   | Riders feel enough pain about theft risk to seek out information                       | Desirability         | Nobody uses the app                                                                             | 8–10 interviews of past behavior; count how many already changed behavior because of risk                   | Low    |
| 2   | Riders will check a map _before_ parking, in the moment                                | Behavior / usability | Usage collapses after one visit                                                                 | Prototype or clickable mock at a station; "park, then show me what you'd do"                                | Low    |
| 3   | An area-level (planning-area) signal is precise enough to be useful                    | Value                | "Medium risk" for a whole neighborhood tells riders nothing about the specific rack             | Show prototypes to riders; ask what decision it changes. Compare risk spread inside areas vs. between areas | Medium |
| 4   | Riders trust a risk tier from an unknown app over their own gut                        | Trust                | Signal is ignored or seen as alarmist                                                           | Interviews plus showing the tier with and without uncertainty wording                                       | Low    |
| 5   | A lock-tier recommendation changes what riders buy or carry                            | Value                | Recommendation is a duplicate of ADFC advice                                                    | Ask what lock they own and why; test whether tier advice surprises them                                     | Low    |
| 6   | The commuter segment is the right one (vs. residents with street parking overnight)    | Segment              | Build for the wrong persona                                                                     | Use the police data to see time-of-day and value patterns; compare with interview sample                    | Low    |
| 7   | Police data reflects real risk (reporting bias)                                        | Data validity        | Risk tiers measure reporting, not theft. Riders with cheap bikes or no insurance may not report | Compare with insurance or survey data; state the limit in the UI                                            | Medium |
| 8   | OSM activity proxies explain "busy vs. risky" well enough to separate the two          | Technical            | Volume correction is noisy or wrong                                                             | Backtest on held-out months; review with a data scientist (listed as a team gap)                            | Medium |
| 9   | The predictive model beats a simple baseline (last year's rate for that area and time) | Technical            | "AI" adds complexity without value                                                              | Held-out accuracy and calibration against the baseline                                                      | Medium |
| 10  | Past theft predicts future theft in the same spot (thieves do not displace)            | Technical            | Forecasts are stale after a patrol or a new rack                                                | Check stability of area ranks across years                                                                  | Medium |
| 11  | Sharing risk by area does not stigmatize neighborhoods or hurt residents               | Ethical / reputation | Press or political backlash                                                                     | Review wording with a civic-tech or community contact; show uncertainty, avoid "dangerous" labels           | Low    |
| 12  | Free + open source is sustainable and enough to reach riders                           | Business             | Project stalls after launch                                                                     | Test channels in the pilot (ADFC, communities, station flyers); count real sign-ups                         | Medium |
| 13  | Two PMs plus AI-driven development can ship the model and the app                      | Feasibility          | Scope slips                                                                                     | Time-box a thin slice: one district, one tier, static JSON                                                  | Low    |

Notes on the table:

- Items **1, 2 and 3** are the make-or-break set. A beautiful model does not matter if riders do not open the app (1, 2) or if area-level risk is too coarse to act on (3).
- Items **8–10** have a clean cheap test: backtest against a naive baseline before building the full pipeline.
- Item **7** (reporting bias) is easy to forget because the dataset feels authoritative. State it in the product, not just in the docs.

### Suggested next steps

1. Run **8–10 interviews** with riders matching the screening question above; cover assumptions 1, 2, 4, 5, 6.
2. Run a **quick data check** on the police CSV: theft by time of day, stolen value band, and area concentration; this settles persona choice (#6) and shows how coarse the area signal is (#3).
3. Build the **cheapest prototype** (static map and a lock-tier card for one district) and watch five riders use it at a station.
4. **Re-write the problem statement and personas** from what you hear, then update the canvas.

---

## Step 1: Customer Research and Personas

**Read this first:** these three personas are **hypotheses written from the README, the canvas and general knowledge of Berlin, not from interviews.** The names, quotes and details are invented to make them concrete enough to recruit against. Treat every line as something an interview can confirm or kill, and rewrite them after 8–10 real conversations. The three personas map to the segments in Step 0: the street-parking resident, the station parker and the high-value bike owner.

|                     | Lena                        | Murat                   | Jonas                       |
| ------------------- | --------------------------- | ----------------------- | --------------------------- |
| Segment             | Street-parking resident     | Station parker          | High-value bike owner       |
| Where the bike sits | Outside her flat, overnight | At the S-Bahn, 9+ hours | Everywhere, 20 min to 3 hrs |
| Main risk window    | Night                       | Workday                 | Evenings and weekends       |
| Main fear           | Waking up to a cut lock     | Another stolen wheel    | Losing a €2,800 bike        |

---

### Persona 1: Lena Hartmann, 29, UX Researcher at a Berlin startup (Neukölln)

**Context:** Rents a 2-room flat on the 3rd floor of an Altbau with no courtyard and no cellar space. Rides a €450 used city bike daily. Has had one bike stolen before (a front wheel, then a whole bike two years ago).

#### Daily workflow

- 07:45: carries nothing down, unlocks the bike from a lamp post outside the flat, rides 25 minutes to the office.
- 08:15–17:30: parks at the office's open rack, which is shared with the building next door.
- 18:30: errands (supermarket, pharmacy) with two or three short stops.
- 22:30: locks the bike outside the flat. Checks it from the window sometimes before bed.
- Weekend: rides to friends in other districts, parking wherever there is a free pole.

#### Psychological drivers

- She wants _peace of mind_, not data. The worry is a low-level background hum.
- Prefers to feel "I did what a sensible person does" and be done with it.
- Dislikes being the person who spends 10 minutes on a purchase decision, but remembers every theft vividly.

#### Decision-making process

1. Locks the same way every time out of habit: a mid-priced U-lock plus a cable through the front wheel.
2. Changes behavior only after a theft, a story from a friend or a visible sign (a bike frame with only a wheel left).
3. Chooses a parking spot by "looks busy and well lit". Rarely checks anything online.
4. Would never read a report; would glance at a one-screen answer if it were already open.

#### Biggest frustrations

- No safe place for the bike at home, and the landlord has said no to a rack.
- Existing advice is generic ("buy a good lock") and does not tell her whether her own street is worse than the next one.
- Does not know if the lock she owns is "good enough" or just feels good.
- The police portal after the last theft felt like shouting into a void.

#### Secret motivations

- Wants to stop feeling guilty about a theft that was "partly her fault".
- Would like proof that her street is not special, so she can stop worrying.
- Hopes a clear tier lets her justify spending €90 on a better lock to her flatmate.

#### What she might say in an interview

> "I mean, I lock it with the good one at night. But honestly, I just hope for the best."

**What to ask her:** the last time she thought about where to park; what happened to the bike that was stolen; what she does differently since; which lock she owns and why.

---

### Persona 2: Murat Yıldız, 38, Facility Technician at a hospital (Spandau → Charlottenburg)

**Context:** Commutes from Spandau to a hospital in Charlottenburg by bike plus S-Bahn. Leaves a €350 hybrid bike at Spandau station for 10–11 hours on shift days. Has had a saddle and a wheel stolen in the past 18 months.

#### Daily workflow

- 05:50: rides to the station, locks the bike at the station's open rack.
- 06:10–15:30: shift. Does not see the bike until the afternoon.
- 16:00: returns, checks the bike first, then the platform clock.
- Evenings: family, kids' sports, no time for research. Uses WhatsApp groups with colleagues for local tips.
- Occasionally rides home late on a night shift, so the bike also sits through the night.

#### Psychological drivers

- Pragmatic and cost-aware; the bike has to work, not look good.
- Sees thefts as a tax on city life, but gets angry when it happens twice.
- Trusts colleagues and his own experience over apps or institutions.

#### Decision-making process

1. Asks colleagues "where do you leave yours?" and copies the one who has never lost a bike.
2. Chooses his lock by price and how heavy it feels in the bag.
3. Does not pay for anything without a clear return. A free tool is acceptable only if it is instant and in German.
4. Would try a new tool only if a trusted colleague recommends it first.

#### Biggest frustrations

- The station rack is exposed, unlit in the early morning and has no staff presence.
- A heavy lock hurts the commute; a light one hurts the bike.
- Feels that nobody takes bike theft at stations seriously, including the police.
- Replacing parts (a wheel, a saddle) costs time and money he does not have.

#### Secret motivations

- Wants a number he can show his wife: "this station is the problem, not me".
- Would like to prove to colleagues that he is the careful one.
- Quietly worried about the bike being the cheap way into a bigger problem: if it goes, he has no way to get to work.

#### What he might say in an interview

> "Look, I leave it there all day. What am I supposed to do? I take the heavier lock and hope nobody has a grinder."

**What to ask him:** his last time something was stolen and what he changed; how long the bike stays at the station; who he asks for advice; how he decides on a lock.

---

### Persona 3: Jonas Weber, 34, Senior Product Designer at a mobility company (Prenzlauer Berg)

**Context:** Rides a €2,800 gravel bike, plus a second cheaper bike for errands. Has insurance but not for every scenario. Parks all over the city and often leaves the bike for 20 minutes to a few hours outside cafés, climbing gyms and friends' places.

#### Daily workflow

- 08:30: rides to a coworking space, parks inside the courtyard rack (considered safe).
- Lunch and afternoon: short stops, bike on the street.
- 19:00: evening events, restaurants and the climbing gym, parking varies.
- Weekend: long rides outside the city, and cafés in Mitte or Kreuzberg where he parks outside.
- Uses Strava and a few cycling forums; reads reviews before buying anything.

#### Psychological drivers

- Cares about the bike as a possession and a hobby; the thought of loss is emotional, not just financial.
- Enjoys optimizing: lock weights, grinder-resistance ratings, parking strategy.
- Likes tools that feel well designed and honest about their limits.

#### Decision-making process

1. Researches locks thoroughly (VdS ratings, test videos) and owns two.
2. Checks a spot visually before locking: lighting, other bikes, people around.
3. Would readily check an app before an evening in a new district, if it took five seconds.
4. Trusts the tool more if it shows its data source and uncertainty than if it just says "high risk".

#### Biggest frustrations

- Generic advice that ignores bike value ("a good lock" means different things at €300 and €3,000).
- Existing crime maps are scary but not actionable.
- Carrying a 1.5 kg lock on a fast ride, or leaving it behind and regretting it.
- The "I locked it properly and it still got stolen" scenario: no way to know how much risk remains.

#### Secret motivations

- Wants to be the informed cyclist among his friends; likes sharing findings.
- Would like to feel in control, not lucky.
- A little worried that his insurance will not pay out if he cannot show a recommended lock, so a tier recommendation doubles as cover.

#### What he might say in an interview

> "I'd happily use something if it just told me, honestly, 'this is higher than usual tonight, bring the big lock'."

**What to ask him:** the most recent time he chose a lock based on where he was going; what he already uses to decide; what would make him distrust the app.

---

### How the three differ (and why it matters)

| Dimension                | Lena                               | Murat                        | Jonas                             |
| ------------------------ | ---------------------------------- | ---------------------------- | --------------------------------- |
| Biggest risk window      | Overnight                          | Workday                      | Evening, weekend                  |
| Needs from LockOut       | Reassurance and a simple tier      | Fast, free, trusted by peers | Detail, honesty about uncertainty |
| Would open the app       | Only if already on the home screen | If a colleague shared it     | Yes, proactively                  |
| Spends money on security | Rarely                             | Reluctantly                  | Yes                               |
| Likely first test        | Overnight tier for her address     | Station-level warning        | Evening risk before an outing     |

Product implication: **Jonas is the easiest early adopter but the least representative.** Lena and Murat may have the larger problem (daily exposure, no alternative) but are harder to reach and slower to adopt. Interview all three types, and decide whom to design for first from the evidence.

### Interview recruiting plan

| Persona | Where to find 3–4 people matching them                                                  | Screening question                                          |
| ------- | --------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| Lena    | Neighborhood Facebook groups, Kleinanzeigen "bike stolen" posts, flat-share chats       | "Does your bike stay outside overnight?"                    |
| Murat   | Bike parking at S-/U-Bahn stations, hospital and shift-worker networks, WhatsApp groups | "How long is your bike left at the station on a workday?"   |
| Jonas   | ADFC Berlin groups, Strava clubs, cycling Reddit, bike shops                            | "What did you pay for your bike and where do you leave it?" |

### Interview guide (30 minutes, same for all three)

1. **Warm-up (3 min):** how do you get around Berlin in a normal week?
2. **Last-time story (10 min):** walk me through the last time you locked your bike outside. Where, how long, which lock, what were you thinking?
3. **Theft history (5 min):** has a bike or part ever been stolen? What happened next, and what changed?
4. **Information habits (5 min):** how do you decide where and how to lock? Who or what do you ask? Have you ever used a map or app for this?
5. **Concept reaction (5 min):** show a single mock screen with an area tier and a lock tier. What would you do with it? What would you doubt?
6. **Close (2 min):** who else should I talk to?

Rules: ask about **past behavior, not future intent**; do not mention the product until step 5; record exact words.

### What these personas assume (to check in interviews)

- Riders think of theft as a **night or all-day** exposure more than a spot-by-spot decision (tests assumption 2 from Step 0).
- At least one persona **already adjusts behavior** by place or time (tests assumption 1).
- Riders would **act on a lock-tier suggestion** (tests assumption 5), and **trust an unknown app** more when it shows uncertainty (assumption 4).
- The **secret motivations** (guilt, proof for others, insurance cover, control) are emotional hooks. If they do not show up in interviews, drop them from the product pitch.

---

## Jobs-to-be-Done per Persona

Format: **When** [situation], **I want to** [motivation], **so I can** [outcome]. Like the personas, these are hypotheses to test in interviews. Each persona has one core job, plus supporting functional, emotional and social jobs. The "hire / fire" lines say what would make them start or stop using LockOut.

### Lena (street-parking resident)

**Core job:** _When I leave my bike outside my flat overnight, I want to know whether my street and my lock are good enough, so I can go to sleep without worrying._

| Type       | Job                                                                         |
| ---------- | --------------------------------------------------------------------------- |
| Functional | Find out if the overnight risk on my street is normal or unusually high     |
| Functional | Know whether my current lock is enough for that risk, or what to upgrade to |
| Emotional  | Stop feeling anxious about waking up to a cut lock                          |
| Emotional  | Stop feeling the last theft was my fault                                    |
| Social     | Justify spending €90 on a new lock to my flatmate                           |

- **Hire LockOut if** it answers "is my street worse than others?" in one glance and tells her what lock to buy.
- **Fire it if** it feels alarmist, or shows a "high risk" tier with no action she can take.
- **Current alternatives:** gut feeling, the "good lock" she already owns, checking the bike from the window.

### Murat (station parker)

**Core job:** _When I leave my bike at the station for a whole shift, I want to be confident it will still be there, so I can get home without losing time and money._

| Type       | Job                                                                           |
| ---------- | ----------------------------------------------------------------------------- |
| Functional | Choose the right lock for a 10-hour stay without carrying something too heavy |
| Functional | Pick the safer spot or rack at the station, if there is a choice              |
| Emotional  | Avoid the anger of a second theft                                             |
| Social     | Show my family and colleagues that the station is the problem, not me         |
| Social     | Be the careful one among colleagues                                           |

- **Hire LockOut if** a colleague recommends it, it is free, in German, and loads instantly.
- **Fire it if** it needs an account, takes more than a few seconds or says nothing new about "his" station.
- **Current alternatives:** asking colleagues, buying the heaviest lock he can carry, hoping.

### Jonas (high-value bike owner)

**Core job:** _When I park my expensive bike somewhere new for a few hours, I want an honest read on tonight's risk there, so I can choose the right lock and spot without over-carrying._

| Type       | Job                                                             |
| ---------- | --------------------------------------------------------------- |
| Functional | Decide before leaving home whether to bring the heavy lock      |
| Functional | Compare spots or districts for an evening plan                  |
| Functional | Have a documented lock tier that matches insurance requirements |
| Emotional  | Feel in control instead of lucky                                |
| Social     | Be the informed cyclist friends ask for advice                  |

- **Hire LockOut if** it shows its data source and uncertainty, and gives a tier that depends on bike value and time.
- **Fire it if** it shows only "high / medium / low" with no explanation, or contradicts what he already knows from experience.
- **Current alternatives:** his own research, forum threads, visual spot checks, insurance fine print.

---

### What the jobs have in common, and where they split

|                       | Lena                       | Murat                           | Jonas                                   |
| --------------------- | -------------------------- | ------------------------------- | --------------------------------------- |
| Moment of use         | Evening, at or near home   | Early morning, before the shift | Before an outing, at home or on the way |
| Question              | "Is my street OK tonight?" | "Is this station OK today?"     | "What lock for where I'm going?"        |
| Biggest emotional job | Relief                     | Fairness                        | Control                                 |
| Biggest social job    | Justify a purchase         | Prove it's not my fault         | Be the expert                           |
| Switching cost        | Low if instant             | Very low, or no use             | Low                                     |

**Shared jobs (build these first):**

1. "Tell me how risky it is, here, at this time of day."
2. "Tell me which lock matches that risk."

**Split jobs (later, only if interviews confirm):** an overnight-at-home view for Lena, a station-level view for Murat, and a bike-value-aware, evidence-showing view for Jonas.

### Check these in interviews

- Is the **overnight** question really a job Lena hires something for, or does she accept it as unavoidable? (Tests assumption 1.)
- Does Murat have **any choice** of where to park, or is "which rack" not a decision for him? If not, his job is about the lock only, and an area-level risk tier adds little.
- Does Jonas's **insurance** really require a certain lock? If not, drop that job.
- The strongest emotional job in all three is **relief or control, not information**. If true, the product's first impression has to feel reassuring and actionable, not like another crime map.

---

## Feature-to-Job Mapping

Features come from the README and [lock-tier-documentation.md](lock-tier-documentation.md). Status: **Planned** = described in the README but no code yet (the repo has only the data pipeline so far, `frontend/` and `src/api/` are empty), **Gap** = no feature covers the job. Fit: ● strong, ◐ partial, ○ none.

### Feature inventory

| ID  | Feature                                                                          | Source                                                                 |
| --- | -------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| F1  | Map of 542 planning areas coloured by risk tier (Low / Medium / High)            | README: Hotspot Tier                                                   |
| F2  | Activity-adjusted context ("busy vs. actually risky")                            | README: Activity-Adjusted Context                                      |
| F3  | Time-of-day / overnight risk warnings                                            | README: Temporal boundary warnings                                     |
| F4  | Lock-tier recommendation per area (what lock to use)                             | README + lock-tier doc                                                 |
| F5  | Local facts: share of thefts where a lock was defeated, median stolen bike value | README: Empirical Local Context                                        |
| F6  | "Trending up" flag (last 30 days above normal)                                   | README: 30-day anomaly detection                                       |
| F7  | Locate me (browser geolocation, no tracking)                                     | Canvas                                                                 |
| F8  | Uncertainty and data-source note in the UI                                       | Canvas: "clear in-app explanation of risk tiers and their uncertainty" |
| F9  | Static JSON fallback (instant load, works offline)                               | README: client fallback                                                |
| F10 | Anchoring instructions (frame + wheel, lock position)                            | Lock-tier doc                                                          |

### Lena: "Is my street and lock good enough overnight?"

| Job                                            | Best-fit features | Fit | Gap or risk                                                                                   |
| ---------------------------------------------- | ----------------- | --- | --------------------------------------------------------------------------------------------- |
| Is overnight risk on my street normal or high? | F1 + F3 + F7      | ●   | Needs a "tonight" default view and a saved home area. Neither is listed.                      |
| Is my lock enough, or what to upgrade to?      | F4 + F5 + F10     | ◐   | No way to say what lock she owns, so the advice is generic.                                   |
| Stop the anxiety                               | F2 + F8           | ◐   | Tone matters more than data: a reassuring "this is normal for Berlin" state is not specified. |
| Stop feeling it was my fault                   | F5                | ○   | Not a feature; at most a copy question.                                                       |
| Justify the lock to my flatmate                | F4 + F5           | ◐   | A shareable card or link is not planned.                                                      |

### Murat: "Will my bike survive a 10-hour shift at the station?"

| Job                                                   | Best-fit features | Fit | Gap or risk                                                                                                       |
| ----------------------------------------------------- | ----------------- | --- | ----------------------------------------------------------------------------------------------------------------- |
| Pick a lock for a long stay without too much weight   | F4 + F3           | ◐   | Tiers are per area and time of day, not "dwell time". The tier should react to a 10-hour stay.                    |
| Pick the safer spot at the station                    | none              | ○   | **Gap.** Areas are far coarser than a single rack, so this job cannot be served. Check whether he has any choice. |
| Avoid the anger of a second theft                     | F1 + F6           | ◐   | Useful only if the signal is at his station.                                                                      |
| Show family and colleagues the station is the problem | F1 + F5           | ◐   | Needs a share link or screenshot-friendly view.                                                                   |
| Be the careful one                                    | F4                | ◐   | Same shareability gap.                                                                                            |
| (Adoption) free, instant, German, no account          | F9                | ●   | German UI and the no-account stance are in the canvas but not built.                                              |

### Jonas: "What lock for where I'm going tonight?"

| Job                                                        | Best-fit features     | Fit | Gap or risk                                                                             |
| ---------------------------------------------------------- | --------------------- | --- | --------------------------------------------------------------------------------------- |
| Decide before leaving home whether to bring the heavy lock | F1 + F3 + F4          | ●   | Needs a way to look at any area and time, not just where he stands.                     |
| Compare spots or districts for an evening plan             | F1 + F2               | ◐   | Area search or "pick a place" is not specified.                                         |
| Documented lock tier matching insurance                    | F4 + F10              | ◐   | Tiers cite VdS and police guidance; whether an insurer accepts them is unverified.      |
| Feel in control, not lucky                                 | F2 + F6 + F8          | ●   | Strong fit, if the method and limits are visible.                                       |
| Be the informed cyclist among friends                      | F5 + F8               | ◐   | Same share gap.                                                                         |
| Bike value changes the advice                              | F5 (area median only) | ◐   | **Gap.** No input for his own bike's value, so a €2,800 bike gets a €450 bike's advice. |

### Features that serve the shared jobs

| Shared job                            | Features          |
| ------------------------------------- | ----------------- |
| "How risky is it here, at this time?" | F1 + F2 + F3 + F7 |
| "Which lock matches that risk?"       | F4 + F10          |
| Trust and calm                        | F8 + F9           |

These are the minimum for a first prototype: **F1, F3, F4, F7, F8.**

### Gaps revealed by the mapping

| Gap                                                | Serves             | Cost                                              | Verdict                                                         |
| -------------------------------------------------- | ------------------ | ------------------------------------------------- | --------------------------------------------------------------- |
| Look up any area and time (not just where I am)    | Jonas, Lena        | Low                                               | **Add early.** Jonas's core job needs it.                       |
| "My bike value" and "how long I'll be away" inputs | Jonas, Murat       | Low to medium                                     | **Test.** Two optional sliders could change the tier advice.    |
| Save a home area                                   | Lena               | Low                                               | **Add if** interviews show she checks nightly.                  |
| Share a card or link                               | Murat, Jonas, Lena | Low                                               | **Test.** The social jobs depend on it; may be pure assumption. |
| Pick a safer rack at a station                     | Murat              | High (needs rack-level data)                      | **Do not build.** Out of reach with area-level data.            |
| Track what lock I own                              | Lena               | Low                                               | **Defer.** Adds data entry; try it in an interview first.       |
| Personal risk or alert notifications               | all                | Medium; conflicts with "no accounts, no tracking" | **Defer.**                                                      |

### What this tells us

- **Murat is the weakest fit.** The product serves a decision (where and which lock) that he may not actually get to make. If interviews confirm he has no choice of where to park, drop the "safer spot" job and keep only the lock advice, or choose another persona to lead with.
- **Jonas is the strongest fit** but the least typical. Features built for him (area lookup, bike value, uncertainty) are cheap and also improve the product for Lena.
- **F4 (lock-tier advice) and F3 (time-of-day) carry the most jobs.** They should be the prototype's centre, and F2 (activity adjustment) is a technical differentiator that none of the personas ask for by name. Keep it, but test whether anyone notices.
- **The emotional jobs have no feature.** "Stop the anxiety" and "feel in control" are served by tone and layout, not by a data layer. Put them in the first-prototype test as a question, not a spec.

---

## Step 2: Pain Point Analysis

Two parts: (A) unspoken frustrations and cross-persona patterns, (B) complaints about existing solutions with emotional triggers and hidden needs. Both build on the synthetic personas from Step 1 and carry the same caveat: hypotheses to test in interviews, not findings.

### A. Unspoken Frustrations and Cross-Persona Patterns

**Method note.** The personas are synthetic and I wrote them knowing the product. That makes any pattern I "find" across them partly my own construction. To stay neutral, every item below is tagged:

- **Written:** the persona text states it directly.
- **Implied:** it follows from the persona's behavior but is not stated, and could be wrong.
- **Not established:** I have no basis for it; listed only so it is not smuggled in.

Nothing here is evidence about real riders. It is a list of things to listen for.

#### Bias check on the personas themselves

Before looking for patterns, here is where the personas lean toward the product. A real sample would not.

| Lean                                                               | Where it shows                                                | Effect on the analysis                                                                                           |
| ------------------------------------------------------------------ | ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Everyone has a theft story or a worry                              | Lena and Murat have had thefts; Jonas fears one               | Real riders include many with no theft and little concern. A "shared pain" may only be shared among the worried. |
| Everyone wants better advice or information                        | Each has a frustration with generic advice or no clear answer | Some riders have no unmet need here. They lock, ride, and forget it.                                             |
| Everyone is plausibly a smartphone-and-web user                    | All three would open a phone before parking                   | Not tested. Some riders would never open an app for this.                                                        |
| Jobs and motives are tidy                                          | Each has one clear core job and neat emotional drivers        | Real motives are messier, and often unstated by the rider.                                                       |
| All three are reasonably cost-aware but willing to spend something | Each might buy a better lock                                  | Some will not spend anything extra, whatever the advice.                                                         |

Not included in any persona, but real riders may be: people who have never had a theft, people who do not lock carefully on purpose, people who treat the bike as disposable, people for whom the bike is the only transport option, and people who never think about this at all.

#### Shared pain points

Pain points that appear in all three personas, written in neutral terms.

| Pattern                                                                                                                   | Lena                                       | Murat                                           | Jonas                                              | Level                            |
| ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ | ----------------------------------------------- | -------------------------------------------------- | -------------------------------- |
| **Locking is a recurring cost they cannot reduce.** Every parking event requires effort, a lock to carry, and a decision. | Nightly lock-up                            | Daily lock-up at the station                    | Per-stop decisions, carrying a heavy lock          | Written                          |
| **No feedback on whether their locking is good.** They find out only when it fails.                                       | Does not know if her lock is "good enough" | Hopes nobody has a grinder                      | "No way to know how much risk remains"             | Written                          |
| **Decisions are made on habit and rules of thumb.**                                                                       | "Busy and well lit"                        | "Copy the colleague who never lost one"         | Visual check of the spot                           | Written                          |
| **Trade-off between convenience and security.** A heavier lock hurts the ride; a lighter one hurts the bike.              | Implied (cable lock plus U-lock)           | Written                                         | Written                                            | Written for two, implied for one |
| **Institutions feel absent or unhelpful.**                                                                                | Police portal felt like "a void"           | "Nobody takes bike theft at stations seriously" | Existing crime maps are "scary but not actionable" | Written, but the framing is mine |

#### Unspoken frustrations (implied, not stated)

Things the personas do or say that suggest something they do not say outright. These are the most likely to be wrong, so each carries a counter-case.

1. **A low-level resignation that theft is part of city life.**
    - Hints: Murat's "tax on city life", Lena's "hope for the best".
    - Counter-case: a rider who is calm about it because they have insurance, a cheap bike, or have never been robbed. For them there is no resignation, just indifference.

2. **Self-blame after a theft.**
    - Hints: Lena's "partly her fault", Murat's "the careful one".
    - Counter-case: riders who blame the city or the thief and feel no guilt. Self-blame may be my addition.

3. **Uncertainty about what "good enough" means, and a reluctance to admit it.**
    - Hints: all three own a lock chosen on feel, price or weight.
    - Counter-case: some riders know exactly what they have and why. Do not assume ignorance.

4. **Choosing the least bad option, not a good one.**
    - Hints: Lena has no secure spot at home, Murat's rack is exposed, Jonas parks wherever there is a pole.
    - Counter-case: riders with a secure place at home or work, who do not feel this.

5. **Unequal consequences that are not talked about.**
    - Hints: Murat's bike is how he gets to work; losing it costs time and money he does not have.
    - Not established: whether this is a "frustration" or just a fact he lives with. I may be imposing a narrative.

6. **Social comparison.**
    - Hints: Murat and Jonas both want to look careful or informed to others.
    - Counter-case: many riders do not care what others think about their locking.

#### What they have learned to live with

Behaviors that may be coping mechanisms. These are the places where an interview might find a "workaround" they do not think of as a problem.

| Coping behavior                         | Persona     | Level           | What to listen for                                               |
| --------------------------------------- | ----------- | --------------- | ---------------------------------------------------------------- |
| Checking the bike from the window       | Lena        | Written         | Do real riders do something equivalent, or is this too specific? |
| Buying the heaviest lock they can carry | Murat       | Written         | Do they feel it is worth it, or resent it?                       |
| Owning more than one lock               | Jonas       | Written         | A sign of high care, not necessarily frustration                 |
| Copying what a colleague does           | Murat       | Written         | Whether peer advice is trusted or merely convenient              |
| Avoiding certain places                 | none        | Not established | Do any riders skip places entirely? Not in the personas, so ask. |
| Accepting loss as a cost                | Murat, Lena | Implied         | May be a stable attitude, not a pain point                       |
| Treating the bike as semi-disposable    | none        | Not established | A cheap-bike rider may behave this way; absent from the three    |

#### What this does and does not tell us

- **Reasonably safe to carry forward as questions:** locking has a daily cost; riders get no feedback until a theft; decisions run on habit; the weight-versus-security trade-off.
- **Do not carry forward as findings:** resignation, self-blame, social comparison, and unequal consequences. These came from how I wrote the personas, and are interview prompts, not conclusions.
- **Missing voices:** riders with no theft history and no worry. If most real riders look like this, the shared "pain" mostly disappears, and the product's value shifts from relief to something else, or to nothing.
- **Risk of circularity:** the personas were built around the product's jobs, so mapping them back onto the product's features (the previous section) will look better than it is. A real sample is the only check.

#### Interview prompts for the unspoken items

Ask these without mentioning theft risk or the product, and record the exact words.

- "Tell me about the last time you locked your bike and walked away. What went through your mind?"
- "Has anything ever made you change how you lock?" (Listen for "no.")
- "How do you know whether your lock is good?" (Listen for confidence, not only doubt.)
- "When did you last think about your bike being stolen?" (Listen for "rarely.")
- "What would you do differently if you could?" (Listen for "nothing.")
- "Who do you talk to about this?" (Listen for nobody.)

---

### B. Complaints About Existing Solutions

**Caveat.** These are synthetic quotes written in each persona's voice, not research. Each one is an interview prompt to confirm or discard. "Existing solutions" here means what the personas already use or could use: generic lock advice (ADFC, police), crime maps and news reports, locks themselves, insurance, tracker tags, the police reporting process, and public bike parking. I have not tested any of these products, so the complaints describe how the personas might experience them, not how the products actually perform.

Some complaints are mild or mixed on purpose. Real riders are often lukewarm, not angry.

#### The 10 complaints

| #   | Persona | Existing solution                   | Complaint                                                                                                               |
| --- | ------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| 1   | Lena    | Generic lock advice (ADFC, police)  | "Everyone says 'buy a good lock.' Okay. Which one? For my street, at night? It never answers that."                     |
| 2   | Murat   | Public bike parking at the station  | "The rack is outside, it's dark when I get there, and nobody's around. They built it and walked away."                  |
| 3   | Jonas   | Crime maps                          | "It's a wall of red dots. Alexanderplatz is red because a million people walk past. That tells me nothing."             |
| 4   | Lena    | Police reporting after a theft      | "I filled in the form, got a number, and never heard anything. I don't think anyone read it."                           |
| 5   | Murat   | Heavy U-locks                       | "The one that actually works weighs a ton. I carry it every day. My back hurts and the bike still might go."            |
| 6   | Jonas   | Insurance                           | "It pays out if I can prove I locked it a certain way. I read the fine print twice and I'm still not sure what counts." |
| 7   | Lena    | Tracker tags (AirTag-style)         | "Fine, so I'll know where it was stolen to. That doesn't get it back, and I'm not going to chase a thief at 2 a.m."     |
| 8   | Murat   | Asking colleagues and word of mouth | "One guy says the south side is safe, another says never leave it there. Both have lost a bike. So who knows."          |
| 9   | Jonas   | News and statistics about theft     | "Theft numbers go up every year and every article ends with 'be careful.' I'm careful. What else is there?"             |
| 10  | Lena    | Her own lock and habits             | "I do the same thing every night and I've no idea if it's enough. It's a bit like not knowing if the stove is off."     |

#### Analysis: emotional triggers and hidden needs

Labels: **Trigger** = the feeling the complaint is really about. **Hidden need** = what the persona might want but would not say. Both are inferences from my own wording of the quote, so treat them as hypotheses.

| #   | Emotional trigger                                                 | Hidden need (inferred)                                             | Confidence    |
| --- | ----------------------------------------------------------------- | ------------------------------------------------------------------ | ------------- |
| 1   | Frustration at vague advice; feeling talked down to               | Advice that is specific to _me, here, now_, not a generic rule     | Medium        |
| 2   | Feeling neglected by the city; unsafe in the early dark           | To feel that someone responsible is paying attention               | Medium        |
| 3   | Distrust of the data; irritation at being misled                  | A signal that treats them as intelligent, with the reasoning shown | Medium        |
| 4   | Powerlessness; feeling ignored after a loss                       | Acknowledgement and some closure, even without recovering the bike | Medium        |
| 5   | Resentment of a daily burden; fear of a worse outcome anyway      | A way to reduce carrying effort without raising risk               | Low to medium |
| 6   | Anxiety about being denied cover; mistrust of fine print          | Certainty about what counts as "locked properly"                   | Medium        |
| 7   | Helplessness; feeling a tool solves the wrong half of the problem | Prevention over detection                                          | Low           |
| 8   | Confusion and mild distrust of anecdotes                          | A neutral tiebreaker among conflicting opinions                    | Medium        |
| 9   | Fatigue and cynicism about warnings                               | Information with a _next action_, not another warning              | Medium        |
| 10  | Low-level worry; self-doubt; need for reassurance                 | To be told "you're fine" or "do this one thing"                    | Medium        |

#### Patterns across the 10

#### Triggers that recur

| Trigger                                                 | Complaints  | What it suggests                                                                                                        |
| ------------------------------------------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------- |
| Feeling ignored or unheard (institutions, city, police) | 2, 4, 9     | A tool that takes their situation seriously may win some goodwill. A tool that feels like another institution will not. |
| Uncertainty with no way to resolve it                   | 1, 6, 8, 10 | Riders want a straight answer more than a data dump.                                                                    |
| Warnings without a next step                            | 3, 9        | Fear without action is a turn-off.                                                                                      |
| Daily burden                                            | 5, 10       | The cost of locking, not just the risk of theft, bothers them.                                                          |
| Feeling talked down to or misled                        | 1, 3        | Tone and transparency matter.                                                                                           |

#### Hidden needs, grouped

| Need                                         | Complaints  | Notes                                                                     |
| -------------------------------------------- | ----------- | ------------------------------------------------------------------------- |
| **Be told what to do, specifically**         | 1, 6, 9, 10 | A clear next action beats extra data.                                     |
| **Reassurance, not only warning**            | 4, 8, 10    | "This is normal" or "this is fine" may be as valuable as "this is risky". |
| **Be treated as a capable adult**            | 1, 3, 9     | Show the reasoning, avoid alarm.                                          |
| **Be seen by someone responsible**           | 2, 4        | LockOut cannot fix this. It can only avoid worsening it.                  |
| **Certainty about rules, such as insurance** | 6           | Outside the data LockOut has; do not promise it.                          |
| **Prevention over recovery**                 | 7           | Supports the product's focus on before-the-fact advice.                   |

#### Contradictions and cautions

- **Wanting both a straight answer and the reasoning.** Complaints 1 and 3 ask for a clear action _and_ a visible method. A real user may want only one, depending on mood.
- **Reassurance versus truth.** Complaint 10 wants "you're fine." The data may say "your area is high risk." A product built to soothe can mislead. This is a design and ethics question, not only a feature question.
- **LockOut cannot fix several of these.** Complaints 2 (public parking), 4 (police follow-up), 5 (lock weight), 6 (insurance rules) and 7 (recovery) sit outside the product. Listing them is useful for context and for avoiding over-promising, not as a feature backlog.
- **Some complaints may not be universal.** The personas were written to hold frustrations. A lukewarm rider might say "it's fine, I don't think about it" to every one of these. Count how many real riders react at all before treating any as a need.
- **Product claims were not checked.** Insurance conditions, tracker behavior and police processes vary. Before quoting any of these in a pitch, verify against real sources.

#### What this feeds

| Finding                                              | Where it goes                                                        |
| ---------------------------------------------------- | -------------------------------------------------------------------- |
| People want a specific action, not just a risk label | Keep the lock-tier recommendation front and centre (F4)              |
| Reassurance may matter as much as warning            | Test a "this is normal for Berlin" state against "high risk" wording |
| Show reasoning without overloading                   | A short "why this tier" line with an optional detail (F8)            |
| Avoid alarmist framing                               | Tone check in the first prototype test                               |
| Several complaints are outside scope                 | State clearly what LockOut does not do                               |

#### Questions to test in interviews

- "What have you tried to find out whether a place is safe to lock up? How did it go?"
- "What's the most annoying thing about locking your bike?"
- "Tell me about a time advice about bike safety was useful. And one when it wasn't."
- "If you got an answer like 'medium risk', what would you do with it?" (Listen for "nothing.")
- "Would you rather be warned or reassured?" (Listen for how they react to the question.)

---

## Step 3: AI Powered Ideation

**Scope and caveats.** Ten solution ideas built from the Step 2 pain points. They are hypotheses, not recommendations. I did not search the market, so "not copied" means I avoided the obvious ones (crime maps, trackers, registration, generic advice), not that I checked for prior art. Feasibility is judged against what LockOut has or plans: Berlin police data, 542 planning-area polygons, OSM proxies, lock-tier guidance, a map client, no accounts and no tracking.

**Pain point key** (from Step 2)

| Code   | Pain point                                     |
| ------ | ---------------------------------------------- |
| S1     | Locking is a recurring cost they cannot reduce |
| S2     | No feedback on whether their locking is good   |
| S3     | Decisions run on habit and rules of thumb      |
| S4     | Weight versus security trade-off               |
| S5     | Institutions feel absent or unhelpful          |
| C1–C10 | The ten complaints, numbered as in section B   |

Three ideas are marked **Counterintuitive**: they work by doing the opposite of what a risk app would be expected to do.

---

### 1. Tonight's Verdict: one sentence, relative to your own normal

**Idea:** Open the app and get one sentence, not a map: _"Normal for a Tuesday night in your area. Your usual lock is fine."_ or _"Higher than usual this week. Use the heavy lock."_ Risk is framed against that area's own baseline, not against Berlin. The map sits one tap behind.

**Solves:** C1, C3, C9, C10, S2, S3. Gives a next action, avoids a wall of red dots, and allows reassurance as well as warning.
**Needs:** F1, F3, F4, F6 from the feature inventory, plus a plain-language template layer.
**Risks:** Reassurance can mislead if the data is thin. Needs a rule for when it must say "not enough data".

### 2. Lock Receipt: a ten-second check that leaves a record

**Idea:** After locking, the rider taps through three prompts (frame, wheel, fixed object; lock not touching the ground) and gets a "locked to the recommended standard" tick, with a dated entry kept on the phone only. If the bike is later stolen, the rider has a record of what they did.

**Solves:** C6, C10, S2. Turns the open question "did I do it right?" into a closed one, and supports the insurance question.
**Needs:** F4, F10, local storage only.
**Risks:** Unverified that an insurer would accept such a record; do not promise it. Self-reported, so it proves little. May feel like a chore.

### 3. Settle It: compare two places, share the answer

**Idea:** Pick two places or two times and get a side-by-side with a shareable link. It ends the "my colleague says north, another says south" argument with the same evidence for both.

**Solves:** C8, C3, social jobs (be the careful one, prove the station is the problem).
**Needs:** F1, F3, a share link, no accounts.
**Risks:** Area-level data may show little difference between two nearby spots, which makes the comparison dull.

### 4. Rack Case Pack: turn risk data into leverage

**Idea:** Generate a one-page, printable evidence sheet for a specific address or station: thefts nearby, time pattern, typical stolen value, and what a rack, light or camera would address. For a landlord, an employer, a transit operator or a district office.

**Solves:** C2, C4, S5, and the "no safe place at home" problem. Moves the rider from complaining to having something to hand over.
**Needs:** F1, F5, a template, a static PDF or print view.
**Risks:** Whether recipients act is unknown. Area data may be too coarse to point at a single address. Wording must not stigmatize a neighborhood.

### 5. Closure Card: acknowledge a theft

**Idea:** A guided after-theft flow: what to do first, how to report, and an honest context line such as _"you are one of N reports in your area this month; this is a common pattern."_ No promise of recovery. It makes the loss feel seen and takes some guilt out of it.

**Solves:** C4, S5, self-blame, powerlessness.
**Needs:** Aggregate counts from the dataset, curated report guidance.
**Risks:** Sensitive territory. Must not overpromise or look like official police advice. Small team may not be the right owner of this flow.

### 6. Two-Minute Alternatives

**Idea:** When a spot is rated higher risk, suggest the closest places within a two-minute walk with lower risk, bike racks nearby (from OSM) and better light or foot traffic where the proxies exist.

**Solves:** C2, C3, S1, S3. Offers an action, not just a warning.
**Needs:** F1, F2, OSM rack layer, a walking-distance query.
**Risks:** Planning areas are large, so "lower risk nearby" may be false precision. Depends on how complete OSM rack data is, which the README already flags as patchy.

### 7. Honest Fog: show what we don't know

**Idea:** A data-confidence layer. Areas with few reports or weak OSM coverage fade into a hatched "thin data" state instead of showing a confident colour. Every tier shows its confidence in plain words.

**Solves:** C3, C9, trust issues, the "treat me as a capable adult" need.
**Needs:** F8, uncertainty values from the smoothing step.
**Risks:** More honest but less decisive. Riders may read "thin data" as "no answer". Pair it with idea 1.

### 8. Lock Budget **(Counterintuitive)**

**Idea:** Reverse the question. Instead of "how strong a lock do I need?", answer "what is the _lightest_ lock that is still sensible here, now?" Tells the rider when they can leave the 1.5 kg lock at home, and when they cannot.

**Why counterintuitive:** A security product that recommends _less_ security on some days.
**Solves:** C5, S1, S4. Addresses the daily burden directly.
**Needs:** F3, F4, bike-value and time-away inputs (flagged as a gap earlier).
**Risks:** Highest liability. Police and ADFC guidance says a frame lock or cable is never enough for street parking, so "lighter" must stay within the guidance. Likely means "lightest _adequate_ tier", not "skip it". Needs careful wording and a legal read.

### 9. Non-Event Check-ins **(Counterintuitive)**

**Idea:** Ask riders to report when _nothing_ happened: "parked here for 9 hours, bike was fine". Anonymous, one tap, no account. Over time this builds exposure data, who parked where and how long, which police data lacks.

**Why counterintuitive:** Everyone collects incidents. This collects the uneventful, which is the missing denominator.
**Solves:** The Denominator Trap at the root, C3, S5 (riders contribute and feel heard), and gives a way to test whether the risk tiers hold up.
**Needs:** A light anonymous submit endpoint, abuse control, a privacy review.
**Risks:** Needs enough volume to be useful, which is a cold-start problem. Location and time data about riders is sensitive even if anonymised. Open to spam or manipulation. The "no tracking" stance must hold.

### 10. Boring Bike Coach **(Counterintuitive)**

**Idea:** Cut the target's appeal, not just the lock's strength. Short advice on making the bike look low-value: remove standout parts, swap quick-releases, cover branding, and a note on which bike-value bands are most targeted in the area (from `SCHADENSHOEHE`).

**Why counterintuitive:** The usual response to a theft threat is a stronger lock. This says: make the bike a worse target.
**Solves:** C5, S4, S1. Reduces risk without adding weight.
**Needs:** F5, the value data, curated advice (Polizei Berlin already advises securing parts).
**Risks:** The evidence that appearance changes theft odds is not established here. Some riders will not want their bike to look worse. Treat it as an advice layer, not a main feature.

---

### Evaluation matrix

Ratings: H high, M medium, L low. **Reach** counts how many pain points the idea addresses. **Fit** is how well it matches what exists or is planned. **Risk** is legal, privacy, trust or accuracy risk.

| #   | Idea                    | Reach | Fit with current data | Build effort | Risk | Counterintuitive |
| --- | ----------------------- | ----- | --------------------- | ------------ | ---- | ---------------- |
| 1   | Tonight's Verdict       | H     | H                     | L            | M    |                  |
| 2   | Lock Receipt            | M     | H                     | L            | M    |                  |
| 3   | Settle It               | M     | H                     | L            | L    |                  |
| 4   | Rack Case Pack          | M     | M                     | M            | M    |                  |
| 5   | Closure Card            | M     | M                     | M            | H    |                  |
| 6   | Two-Minute Alternatives | M     | L                     | M            | M    |                  |
| 7   | Honest Fog              | M     | H                     | L            | L    |                  |
| 8   | Lock Budget             | H     | M                     | M            | H    | Yes              |
| 9   | Non-Event Check-ins     | H     | L                     | H            | H    | Yes              |
| 10  | Boring Bike Coach       | M     | M                     | L            | M    | Yes              |

### Combinations worth a closer look

- **1 + 7 (Verdict with Honest Fog):** the verdict is decisive, the fog stops it overclaiming. Cheapest strong core.
- **1 + 8 (Verdict with Lock Budget):** gives the "what to carry tonight" answer that the lock-weight complaint asks for.
- **3 + 4 (Settle It feeding the Rack Case Pack):** the same comparison data becomes shareable evidence for the "someone responsible should act" need.
- **9 on its own:** highest long-term payoff, because it fixes a data weakness, but it is the hardest and riskiest, so run it as a small experiment after the core exists.

### What this does not settle

- None of these has been shown to a rider. Ideas 1, 2, 3 and 7 are cheap enough to mock up and put in front of the five prototype testers from Step 0.
- Ideas 5 and 9 involve sensitive situations or personal data. They need a privacy and ethics review before any build.
- Idea 8 must be checked against the police and ADFC guidance in [lock-tier-documentation.md](lock-tier-documentation.md) before it appears in any mock-up.
- Some pain points (public parking quality, police follow-up, insurance rules) are only addressed indirectly, by evidence or acknowledgement. LockOut cannot fix them.

---

### Value Creation and Business Models per Idea

**Baseline.** The canvas ([business-model-canvas-draft.md](business-model-canvas-draft.md)) commits to a free, open-source, civic-benefit product with no accounts and no tracking. Every model below is tagged against that: **Fits** keeps the stance, **Strains** bends it, **Breaks** contradicts it. No revenue figures are given, because nothing here has been tested. These are options to evaluate, not a plan.

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
- **No individual-rider payment** appears anywhere, consistent with the canvas and with the interview-based expectation that riders will not pay.
- **Untested:** whether any of these buyers (insurers, housing companies, districts, retailers) have a budget or any interest. That is a second round of customer discovery with a different set of interviewees.

---

## Top 3: Selected Ideas and Specific Features

### Selection

Ranked on the matrix above: reach across pain points, fit with existing data, build effort and risk.

| Rank | Idea                     | Why                                                                                                          |
| ---- | ------------------------ | ------------------------------------------------------------------------------------------------------------ |
| 1    | **#1 Tonight's Verdict** | Highest reach, builds on planned features, low effort, and gives the next action riders asked for            |
| 2    | **#7 Honest Fog**        | Low effort and risk, and it is what stops the Verdict from overclaiming. The two are designed as one surface |
| 3    | **#3 Settle It**         | Low effort and low risk, covers the social jobs and supplies a growth path through sharing                   |

Runner-up: **#2 Lock Receipt**, close behind on fit. **#8 Lock Budget** has the highest value but is held back by its guidance and liability risk, so it comes after a legal read of the lock-tier guidance.

Priorities: **P0** = needed for the first prototype, **P1** = next, **P2** = later. Features reference the inventory F1–F10 where they build on one.

---

### Idea 1: Tonight's Verdict

| ID  | Feature                        | What it does                                                                                                                                             | Inputs                                          | Priority | Pain points     |
| --- | ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- | -------- | --------------- |
| V1  | **Verdict sentence**           | One plain-language sentence for the rider's area and the next few hours, e.g. "Normal for a Tuesday night. Your lock is fine." Opens as the first screen | Area tier (F1), time of day (F3), area baseline | P0       | C1, C3, C9, C10 |
| V2  | **Own-baseline framing**       | Compares the area to its own typical level for this weekday and daypart, not to Berlin overall                                                           | Area-time history, smoothed estimates           | P0       | C3, C10         |
| V3  | **Next-action line**           | Names one action under the sentence: the lock tier to use and the anchoring step (frame + wheel + fixed object)                                          | F4, F10                                         | P0       | C1, C6, S2      |
| V4  | **Locate me, or pick an area** | Uses browser geolocation if allowed, otherwise lets the rider search an area or district. No account                                                     | F7, area search                                 | P0       | S3              |
| V5  | **Time shifter**               | "Now / tonight / tomorrow 8 am" control, so Jonas can check before leaving and Lena can see overnight                                                    | F3                                              | P0       | S3              |
| V6  | **"Higher than usual" flag**   | Raises the tone only when the 30-day signal is clearly above the area's norm                                                                             | F6                                              | P1       | C9              |
| V7  | **Map one tap away**           | The full map stays as a secondary view for people who want it                                                                                            | F1                                              | P1       | C3              |
| V8  | **Home area on device**        | Remembers an area on the phone only, so the app opens on it                                                                                              | Local storage                                   | P1       | S3              |
| V9  | **Calm state**                 | When the area is normal or low, the screen says so plainly, with no warning styling                                                                      | Copy and design                                 | P0       | C10             |
| V10 | **Offline snapshot**           | The verdict works from the bundled JSON if the API is slow                                                                                               | F9                                              | P1       | adoption        |

**Design rules:** the sentence is always one line, never contains more than one number, and never uses "dangerous" or similar labels. If the data is thin, it says so (see Honest Fog).

**How to test:** show five riders a mock of V1 + V3 + V9 for a "normal" area and one for a "higher than usual" area. Ask what they would do and whether they believe it.

---

### Idea 7: Honest Fog

| ID  | Feature                               | What it does                                                                                                                              | Inputs                                               | Priority | Pain points                |
| --- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- | -------- | -------------------------- |
| H1  | **Confidence level on every verdict** | A three-step label (solid / fair / thin) next to the sentence, in plain words                                                             | Smoothing uncertainty, number of reports in the cell | P0       | C3, C9                     |
| H2  | **Thin-data hatching on the map**     | Areas with too little data show a hatched pattern, not a confident colour                                                                 | Cell counts, OSM coverage                            | P0       | C3                         |
| H3  | **Verdict downgrade rule**            | If confidence is thin, the verdict changes to "not enough data here, use the standard-tier advice", never a reassurance                   | Rule layer over V1                                   | P0       | C10 (reassurance vs truth) |
| H4  | **"Why this answer" panel**           | Opens a short explanation: where the numbers come from, how recent, and what is excluded (indoor cases, last 10–14 days of reporting lag) | README data hygiene steps                            | P0       | C3, C9                     |
| H5  | **Data freshness stamp**              | "Updated on [date]; the last two weeks are incomplete"                                                                                    | Weekly refresh pipeline                              | P1       | C3                         |
| H6  | **Known limits page**                 | Plain statement of what the data cannot show: unreported thefts, rack-level detail, reporting bias                                        | Static content                                       | P1       | C3, C9                     |
| H7  | **Confidence-aware share card**       | Anything shared from the app carries its confidence label, so a screenshot cannot overclaim                                               | Idea 3 link                                          | P2       | C8                         |

**Design rules:** uncertainty is shown before it is asked for. The wording is tested for how it reads to non-statisticians. "Thin" must not read as "safe".

**How to test:** show the same area with and without the confidence label and ask how much each rider would trust the answer, and what they would do differently.

---

### Idea 3: Settle It

| ID  | Feature                   | What it does                                                                                            | Inputs                  | Priority | Pain points     |
| --- | ------------------------- | ------------------------------------------------------------------------------------------------------- | ----------------------- | -------- | --------------- |
| S1  | **Two-place compare**     | Pick two areas and two times; see the verdicts side by side, with their confidence labels               | V1, H1                  | P0       | C8              |
| S2  | **One-line difference**   | States the gap in plain words: "Area A is about the same as B" or "A is clearly higher than B at night" | Rule layer              | P0       | C8              |
| S3  | **Share link**            | A short link that reopens the same comparison, no account needed                                        | Static route parameters | P0       | C8, social jobs |
| S4  | **Share card image**      | A clean image for messaging apps, with source and date                                                  | Template                | P1       | C8, social jobs |
| S5  | **Honest tie**            | When the data cannot separate two places, say so, and say the choice is a toss-up                       | Confidence layer        | P0       | C3              |
| S6  | **Seed from the verdict** | One tap on the Verdict screen to compare "my area" with another                                         | V1                      | P1       | S3              |
| S7  | **Print view**            | A one-page printable version, which later feeds idea 4 (Rack Case Pack)                                 | Template                | P2       | C2, C4          |

**Design rules:** the comparison never ranks a neighborhood as "worse" in a way that reads as a label. It describes the difference and the confidence in it. No user identifiers in the link.

**How to test:** give two riders a disagreement from their own experience (for example, two station options) and see whether the result ends the argument or is ignored.

---

### Build order for the top 3

1. **First prototype:** V1, V2, V3, V4, V5, V9 + H1, H3, H4 (the verdict with its honesty layer).
2. **Second step:** S1, S2, S3, S5 (compare and share), then V6, V7, V8, H2.
3. **Later:** H5–H7, S4, S6, S7, V10.

### Open questions before building

- **Baselines:** does the data support a stable "own normal" for each of the 542 areas by weekday and daypart, or are the cells too sparse? If sparse, V2 falls back to coarser time bands.
- **Calm state:** will riders accept "normal" as an answer, or will they treat it as "no information"?
- **Wording:** the lock-tier copy must follow [lock-tier-documentation.md](lock-tier-documentation.md) (never a frame lock alone, always anchor frame and a wheel).
- **Sharing and privacy:** confirm that share links carry only the places and times chosen, with no rider location.
- **All of this is untested.** Priorities reflect my read of the matrix, not evidence from riders.

---

## Step 4: Market Validation

**Method and limits.** Desk research from about a dozen web searches run on 2026-10-19. I did not open the competing products, check app-store listings, download counts or pricing, or read primary documents. Many figures come from press coverage of official answers, so verify any number before quoting it externally. "I found no product that does X" means my searches did not surface one, not that none exists. This validates the problem space and the data, not demand: no rider has been asked.

### 1. Competitive landscape

#### Direct competitors (theft-risk information for riders)

| Solution                                                                                                                                                                              | What it is                                                                                                                                                                                                                                                                                   | Coverage                      | Strengths                                                                                                                                                                                                                                                                            | Weaknesses / unknowns                                                                                                                                                                                                                                                                                                                                               |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Fahrraddiebstahlwarnung](https://f-droid.org/fr/packages/de.example.fahrraddiebstahl_berlin/)                                                                                        | Free, open-source Android app that shows stolen-bike counts by location, from Polizei Berlin data distributed via ODIS                                                                                                                                                                       | Berlin                        | Same data source as LockOut, free, GPL                                                                                                                                                                                                                                               | Latest listed version 1.0.6 dated 2022-02-09; Android only; shows counts, not risk tiers or advice; depends on third-party servers                                                                                                                                                                                                                                  |
| [Kriminalitätsatlas Berlin](https://kriminalitaetsatlas.berlin.de) (via a [parliamentary answer](https://pardok.parlament-berlin.de/starweb/adis/citat/VT/19/SchrAnfr/S19-20903.pdf)) | Official police atlas of PKS offences, by 143 Bezirksregionen and 12 Bezirke, absolute counts and per-100,000 rates, covering 2014–2023                                                                                                                                                      | Berlin                        | Official, free, trusted                                                                                                                                                                                                                                                              | Coarser than 542 Planungsräume; no time of day; no lock advice. The per-resident rate may distort busy hubs (my inference, to verify)                                                                                                                                                                                                                               |
| [Litelok Theft Intelligence](https://eu.litelok.com/blogs/news/litelok-launches-live-theft-intelligence)                                                                              | Live global theft map from customer reports, official statistics and community input; lock-maker product                                                                                                                                                                                     | Global                        | Fresh (2026), multi-source, commercial backing                                                                                                                                                                                                                                       | Run by a lock vendor, so advice may favor its products; depth for Berlin unknown; no lock-tier guidance found                                                                                                                                                                                                                                                       |
| [Berlin Bike Theft Clock](https://www.walkofberlin.com/tools/berlin-bike-theft-clock) (Walk of Berlin)                                                                                | Interactive district map plus 24-hour "clock": pick a Bezirk and a time band to see that band's share of thefts versus the city, bikes per week, share taken within 3 hours, share taken from cellars, and median declared value. Map shaded by reported thefts per 100,000 residents (2025) | Berlin, 12 Bezirke            | Uses the same police dataset (a 12-month window to Aug 2026, pulled 10 Sep 2026 per the page); time-of-day framing; has a "what it cannot tell you" section (district level only, reported thefts only, a share is not a personal probability); free, no ads or affiliate links seen | Run by a walking-tour business, so it is a content and lead tool whose revenue is a 25 EUR tour (per the page); district level only; little lock advice (argues timing and place matter more than the lock); no confidence intervals or formal method stated; an embeddable widgets page exists (terms unread); behind it: author, refresh method and usage unknown |
| [Bikmo theft map](https://bikmo.com/uk/blog/bike-theft-map-by-bikmo/)                                                                                                                 | Heat map and worst/safest area list from an insurer                                                                                                                                                                                                                                          | England and Wales             | Simple, insurer-backed                                                                                                                                                                                                                                                               | Not Berlin; vendor interest                                                                                                                                                                                                                                                                                                                                         |
| [BikeMaps.org](https://campfirecycling.com/?p=28669)                                                                                                                                  | Crowdsourced map of crashes, near misses, hazards and thefts, University of Victoria                                                                                                                                                                                                         | Mostly Canada, global reports | Open, research-grade, crowd-sourced                                                                                                                                                                                                                                                  | Focused on safety and crashes more than theft; sparse in Berlin (not checked)                                                                                                                                                                                                                                                                                       |
| [BiciZen](https://webcatalog.io/en/apps/bicizen)                                                                                                                                      | Citizen-science app for reporting bike parking, theft and safety concerns                                                                                                                                                                                                                    | Unclear                       | Open data idea close to Non-Event Check-ins (#9 in Step 3)                                                                                                                                                                                                                           | Reach and activity unknown                                                                                                                                                                                                                                                                                                                                          |
| [Citybiker](https://cdn.road.cc/content/news/207416-new-app-maps-crime-hotspots-help-you-choose-where-park-your-bike)                                                                 | App marking safer places to leave bikes, built by a cyclist after a theft                                                                                                                                                                                                                    | London, around 2014           | Same user need                                                                                                                                                                                                                                                                       | Current status unknown                                                                                                                                                                                                                                                                                                                                              |
| Press hotspot articles, e.g. [Berliner Zeitung](https://www.berliner-zeitung.de/article/fahrraddiebstahl-in-berlin-hier-steht-ihr-rad-besonders-gefaehrlich-330642)                   | Static "where your bike is most at risk" stories                                                                                                                                                                                                                                             | Berlin                        | Wide reach, free                                                                                                                                                                                                                                                                     | Raw district counts, one-off, no advice                                                                                                                                                                                                                                                                                                                             |

#### Indirect alternatives (other ways riders handle the problem)

| Alternative                 | Relevant facts found                                                                                                                                                                                                                                                                                                                                                                                                       |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Lock advice and tests**   | [Stiftung Warentest](https://www.zdfheute.de/ratgeber/fahrradschloss-stiftung-warentest-100.html) tested 19 locks in February 2025 and notes there is no light, cheap, all-round winner, which matches the weight-versus-security complaint (C5). Lock advice is generic, not tied to place or time.                                                                                                                       |
| **Bike coding (EIN)**       | [Recommended by Stiftung Warentest](https://www.zdfheute.de/ratgeber/fahrradschloss-stiftung-warentest-100.html) and done by ADFC, police and some shops; helps with recovery, not prevention.                                                                                                                                                                                                                             |
| **Insurance**               | [GDV figures](https://www.versicherungsbote.de/id/4949771/Fahrraddiebstahl-Versicherungsleistung-auf-Allzeithoch/): about 115,000 insured bikes stolen in 2025, about €150 million paid, record average claim of about €1,270.                                                                                                                                                                                             |
| **Secured parking**         | Berlin is expanding it: [secured storage at S-Bahn stations](https://www.berlin.de/ba-steglitz-zehlendorf/aktuelles/pressemitteilungen/2025/pressemitteilung.1617164.php), a planned bike parking house at Schöneweide, and storage planned at 34 U-/S-Bahn stations by end of 2026 per [Berliner Zeitung](https://www.berliner-zeitung.de/article/2316670). Addresses the station parker directly but not street parking. |
| **Police reporting**        | The Polizei Berlin PKS 2025 short report does not give a bike-specific clearance rate. It gives 21.1% for theft overall (p. 19). Press figures of about 4.7–4.9% for bike theft are **unverified**; note that the report's 4.7% belongs to theft from or of motor vehicles (p. 22).                                                                                                                                        |
| **Trackers, word of mouth** | Not researched. Described only through the personas, so no market facts here.                                                                                                                                                                                                                                                                                                                                              |

### 2. Positioning

What LockOut would combine, set against what I found:

| Capability                                   | Fahrraddiebstahl-warnung | Kriminalitäts-atlas | Litelok map                                     | Bikmo map | BikeMaps  |
| -------------------------------------------- | ------------------------ | ------------------- | ----------------------------------------------- | --------- | --------- |
| Berlin-specific                              | Yes                      | Yes                 | Unknown                                         | No        | Unknown   |
| Finer than Bezirksregion (542 Planungsräume) | Unknown                  | No                  | Unknown                                         | No        | Unknown   |
| Adjusts for busy places (not just counts)    | No (counts)              | Per-resident rate   | Unknown                                         | Unknown   | No        |
| Time-of-day or overnight view                | No                       | No                  | Partly ("hourly rates" claimed)                 | Unknown   | No        |
| Lock-tier advice                             | No                       | No                  | Not found                                       | Not found | No        |
| Shows uncertainty or data limits             | Not found                | Not found           | Partly (caveat that "no hotspot" is not "safe") | Not found | Not found |
| Active and maintained                        | Not since 2022           | Yes                 | Yes                                             | Unknown   | Yes       |

**Added after review:** the Bike Theft Clock would be Berlin-specific: yes; finer than Bezirksregion: no (12 Bezirke); adjusts for busy places: no (counts, shares and per-100,000 rates); time-of-day view: yes (bands plus a 24-hour profile); lock-tier advice: not found, only a general argument that timing matters more than the lock; shows limits: yes, in prose; maintained: recent data on the page.

"Unknown" means I could not tell from the sources I read. Open each product before claiming a gap in anything external.

### 3. Gaps I see

1. **No Berlin product found that turns theft data into advice.** The tools found show where thefts happened; none gave a "what lock, now" answer. This is LockOut's core claim, and the one most worth confirming with a hands-on look.
2. **Maintained Berlin consumer tools are few, but not absent.** The Android app on the same data has been static since 2022, while the Walk of Berlin clock shows recent data (pulled September 2026). It is a tour-marketing tool, not a product with a roadmap. Whether this means unmet need or low demand is still unknown.
3. **Granularity.** The official atlas works at 143 Bezirksregionen and the Bike Theft Clock at 12 Bezirke; LockOut plans 542 Planungsräume. Finer is only a gap if the data is dense enough to say something at that level (see the sparsity risk below).
4. **Activity adjustment.** I found nothing that separates "busy" from "risky". Counts or per-resident rates dominate.
5. **Time-of-day framing is no longer a clean gap.** The Bike Theft Clock already does it at district level, and Litelok mentions hourly rates. What I did not find is time-of-day at neighbourhood level, combined with an activity adjustment and a lock recommendation.
6. **Honest uncertainty is partly covered.** Litelok has a one-line caveat and the Bike Theft Clock has a "what it cannot tell you" section. I found no per-result confidence level in either, which is what Honest Fog proposes. The data really does warrant it: a BKA study cited in [one summary](https://www.versicherungsbote.de/id/4949771/Fahrraddiebstahl-Versicherungsleistung-auf-Allzeithoch/) suggests only 50–60% of thefts are reported.
7. **Independence.** The wider maps are run by a lock maker or an insurer. A neutral, open-source tool has a different trust position, which matters because trust was a recurring theme in the complaints (C3, C9).

### 4. Trends that support the opportunity

| Trend                               | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Why it matters for LockOut                                                                                                                                                                                                   |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Fewer thefts; stakes unclear**    | **Verified (PKS Berlin 2025):** bike thefts fell 16.5% to 22,630 (2024: 27,099), the third largest drop among offences (pp. 4–5, 19). Average declared damage per completed bike theft was €1,246 in 2025 (2024: €1,262), so flat to slightly down (p. 42). **Unverified, national:** GDV figures via press show a record average insured claim of about €1,270 and about 214,000 reported thefts in Germany, down about 13% ([summary](https://www.versicherungsbote.de/id/4949771/Fahrraddiebstahl-Versicherungsleistung-auf-Allzeithoch/), [Bike-Magazin](https://www.bike-magazin.de/fahrraeder/kaufberatung/fahrraddiebstahl-in-deutschland-weniger-falle-grossere-beute/)) | Counts are falling; value per theft is not clearly rising in Berlin. The "pricier bikes" argument for a bike-value input rests on national insured data and on the Bike Theft Clock's reported median, not on the Berlin PKS |
| **High volume in Berlin**           | **Verified:** 22,630 bike thefts recorded in the PKS in 2025 (Polizei Berlin PKS Kurzbericht 2025, pp. 5, 19). Earlier years from press: 26,576 in 2022 ([Berliner Zeitung](https://www.berliner-zeitung.de/article/fahrraddiebstahl-in-berlin-hier-steht-ihr-rad-besonders-gefaehrlich-330642)). District ranking (Mitte, Friedrichshain-Kreuzberg, Pankow) is from a [press report of a Senate answer](https://www.drweb.de/die-oekonomische-anatomie-des-fahrraddiebstahls/) and is unverified. The earlier figure of about €27 million in damage is **not in the PKS report** and has been dropped                                                                           | Confirms the scale behind the README's roughly 20,000 figure; the PKS number is somewhat higher                                                                                                                              |
| **Low clearance (unverified)**      | Press reports of about 4.7–4.9% for bike theft; not in the PKS short report (see Police reporting above)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | If true, recovery is unlikely and prevention is the realistic lever. Check the primary source before using it                                                                                                                |
| **Under-reporting**                 | Estimates that about half of thefts go unreported                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | Raises the value of honest uncertainty (Honest Fog) and of exposure data (Non-Event Check-ins)                                                                                                                               |
| **E-bikes and expensive bikes**     | Over half of units sold in Germany were motorised and about 85% of revenue ([secondary summary](https://pedelec-elektro-fahrrad.de/?p=649823))                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Supports a high-value segment; the market is flattening, so growth is not guaranteed                                                                                                                                         |
| **Vendors entering the space**      | Litelok launched a theft-intelligence map in 2026                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | Shows interest and a commercial appetite; also a possible rival or partner                                                                                                                                                   |
| **Open data and open data culture** | Police data via Berlin Open Data and ODIS, official atlas                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Low cost of entry; also means anyone can copy the approach                                                                                                                                                                   |
| **Secured parking expanding**       | Stations and a bike parking house in progress                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Complementary: LockOut can cover street and open parking that these do not                                                                                                                                                   |

### 5. Threats and counter-evidence

- **Falling theft counts** may reduce urgency for riders. Verified for Berlin: bike thefts fell 16.5% in 2025 (PKS Kurzbericht 2025).
- **Berlin ranked 13th per 100,000 residents** in one summary, behind its absolute count. Per-capita framing could make Berlin look less alarming than the headline.
- **A dormant competitor is ambiguous.** It may signal low demand as much as an open field.
- **Litelok or an insurer could add Berlin.** They have reach and budget; LockOut has independence and open data.
- **Secured parking** reduces how often riders must trust a street lock, at least at stations.
- **Source quality varies.** Several figures come from blogs and press reports of official answers. Primary documents should be checked.
- **Open data is easy to copy.** The moat has to be the method (smoothing, activity adjustment, uncertainty) and trust, not the data.

### 6. Verdict and next steps

**What this supports:** the problem exists at scale, the data is public and current, no product I found offers the full combination, and vendors are starting to move. **What it does not support:** that riders want the product or would use it.

| Step                                                                                                                 | Why                                                                   | Effort |
| -------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | ------ |
| Open the Litelok map, the Kriminalitätsatlas and the Fahrraddiebstahlwarnung app and test them with a Berlin address | Turns the "Unknown" cells above into facts and tests the claimed gaps | Low    |
| Verify the key Berlin numbers against the Senate answer and the official PKS                                         | Primary sources before any external claim                             | Low    |
| Ask interviewees whether they have used any of these                                                                 | Tests real awareness and the "dormant means low demand" reading       | Low    |
| Check app store and F-Droid pages for installs and ratings                                                           | Rough demand signal for the nearest competitor                        | Low    |
| Review the Litelok data terms and how it treats Berlin                                                               | Decide whether it is a rival, a data source or a partner              | Low    |
| Landing-page or prototype click test of Tonight's Verdict                                                            | First behavioural demand signal                                       | Medium |

**Update to carry back to the docs (verified):** the Polizei Berlin PKS 2025 short report ([docs/pks-kurzbericht-2025.pdf](pks-kurzbericht-2025.pdf)) records 22,630 bike thefts in 2025 (−16.5%), and it separately counts 1,892 bike thefts within cellar break-ins (Kellereinbruch, p. 21), which are not part of that 22,630 as far as the report shows (to confirm). The README's "about 20,000" is therefore a round figure for all recorded bike thefts, not an outdoor-only count. Whether the open dataset's outdoor filter matches either category is for the data audit to settle.

### 7. Addendum: what the Berlin Bike Theft Clock changes

Source: its [page](https://www.walkofberlin.com/tools/berlin-bike-theft-clock), read through a fetch agent that saw the text but not the rendered map. All figures below are as the page reports them and are unverified.

- **It is the closest overlap so far.** Same dataset, Berlin only, time-of-day, a limits section, free. It weakens the claim that nobody in Berlin does time-of-day.
- **It validates demand-side thinking in one way.** Someone built it and promotes it, which suggests the topic draws interest. It does not show riders use it. Usage numbers are unknown.
- **It is a different kind of product.** The business is a 25 EUR tour. The tool is a content and lead tool, aimed at curious people, not at a rider deciding where to lock tonight. LockOut's job (decide where and how to lock) is not what it is built for.
- **Findings that bear on LockOut's design (as reported on the page):**
    - The hour in a police report is when the owner last saw the bike, not when it was stolen. The README already handles offence windows with Expectation-Maximization allocation; the page quotes only short-window shares because windows are capped at three days. Check that LockOut's treatment agrees.
    - It reports a share of bikes taken within 3 hours of parking. If true, short stops are not "safe", which challenges any lock recommendation that gets lighter for short stays (Lock Budget, #8 in Step 3). Test this on the data before relying on a dwell-based tier.
    - It reports a notable share of thefts from cellars and bike rooms (Spandau 11.4% against 2.6% in Friedrichshain-Kreuzberg). LockOut filters these out for street risk. That is correct for the street question, but it also shows indoor storage is not a safe default for Lena.
    - Its median declared value is 900 EUR citywide, with 46% of bikes at 1,000 EUR or more. That is higher than the personas' bikes (Lena €450, Murat €350), so check whether the personas under-state value.
- **Threat:** a free tool from a tour company shows how cheaply the open data can be turned into a public page. Embeddable widgets could spread it widely. The moat has to be finer areas, activity adjustment, advice and trust.
- **Opportunity:** it is a possible partner, a channel or a benchmark. Compare its numbers with LockOut's pipeline as a free sanity check.
- **Questions to resolve:** who runs it, whether the widgets are paid, how it refreshes, and whether it has traffic.

### 8. Risk Assessment

#### The 5 biggest risks

Ranked by my judgment of likelihood times damage. The ranking is a view, not a measurement.

| #   | Risk                                                              | Why it could kill the product                                                                                                                                                                                                                 | Evidence so far                                                                                                           | Linked assumptions (Step 0) |
| --- | ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| 1   | **Riders don't open it before parking**                           | A free tool nobody uses has no value, whatever the model quality. Parking is a habitual, unplanned moment                                                                                                                                     | None from riders. The only Berlin app on this data has been static since 2022. The Bike Theft Clock's usage is unknown    | 1, 2                        |
| 2   | **The signal is too thin to say anything at neighbourhood level** | With 542 areas split by time of day, many cells have few reports. Verdicts become "thin data" or noise, and "own normal" (Tonight's Verdict) cannot be built. Then the finer-granularity edge over the 12-district clock disappears           | README already plans smoothing because cells are sparse; the audit script checks sparsity but results are not in the docs | 3, 8, 10                    |
| 3   | **The data measures reporting, not theft**                        | Under-reporting (an estimated half is unreported), the "last seen" hour instead of the theft hour, and offence windows up to 72 hours. If tiers mostly reflect who reports and when, they mislead, and the activity adjustment may not fix it | The press cites a 50–60% reporting rate; the clock page flags the hour issue                                              | 7, 8, 9                     |
| 4   | **A wrong or alarming answer damages trust, or causes harm**      | "You're fine" followed by a theft, or "high risk" in a neighbourhood that then feels stigmatized, can end adoption and attract press. Lock advice that conflicts with police guidance is a liability                                          | Not tested. The lock-tier guidance sets firm rules (never a frame lock alone)                                             | 4, 11                       |
| 5   | **It is easy to copy and has no channel or funding**              | Open data and a free tool give no moat. A tour company, a lock vendor or an insurer already has traffic. A team of two PMs without a data scientist has limited capacity to stay ahead                                                        | Competitors found in Step 4; the canvas lists the data skills gap and no revenue                                          | 12, 13                      |

Dependencies: risks 2 and 3 undermine the advice in risk 4. Risk 1 decides whether anything else matters. Risk 5 is slower and matters most after 1–4 are survived.

#### 3 tests to run this week

Each test uses a small effort, produces a decision, and has pass and kill criteria **to be fixed before you run it**. The thresholds below are my suggestions, not benchmarks. Adjust them first, and write them down so the result cannot be bent afterwards.

##### Test 1: Cell density and baseline check on the data (risk 2 and 3)

- **Assumption tested:** the data supports a stable, useful "own normal" for each area and time band (and it beats a naive guess).
- **How, about half a day, no riders needed:**
    1. Run the existing data audit (`src/audit_police_csv.py`) on the current CSV, after the outdoor filter and lag truncation.
    2. For each of the 542 areas, count reports per daypart (for example night, morning, daytime, evening) over the last 12 months and over the last 24.
    3. Compute the share of area-daypart cells with at least a minimum number of reports (try 10).
    4. Split by time: use everything up to a cut-off as history, then check how well each area's share of the next period matches the history, against a naive baseline (the citywide share).
    5. Also check how many cells a district-level view (12 Bezirke) would cover, as the Bike Theft Clock does.
- **Pass (suggested):** most cells are dense enough to say something, or a coarser grouping (for example two or three dayparts, or Bezirksregion) gives stable results, and the area history beats the citywide baseline.
- **Kill or change:** most cells are sparse and history does not beat the baseline. Then drop neighbourhood-level verdicts. Ship at Bezirksregion or district level, and the finer-granularity edge goes away.
- **Output:** a one-page table of coverage and stability, added to this file.

##### Test 2: Fake-door demand test of Tonight's Verdict (risk 1)

- **Assumption tested:** riders want a one-sentence verdict before parking, and a stranger will act on it.
- **How, about one day to build, three to run:**
    1. Build a single static page with two mocked screens (a "normal" verdict and a "higher than usual" one), each with the lock-tier line and a confidence label. No real data needed. Use a Berlin address and a time chosen by the visitor.
    2. Add one question, "Would you check this before locking your bike? yes / no / maybe", and one optional "notify me when it's live" field (an email is optional, stored only for this purpose, and deletable on request).
    3. Share it where the personas are: an ADFC Berlin group, a local cycling subreddit or Facebook group, a station-area or flat-share group. Follow each group's rules on posting, and say plainly that it is a prototype.
    4. Record visits, answers, and any comments, without adding trackers. Count only what visitors tell you.
- **Pass (suggested):** a clear majority of respondents answer yes or maybe, and some leave their contact details unprompted.
- **Kill or change:** few answer, mostly "no", or comments say they would not check before parking. Then the product's central behaviour is wrong; consider a different moment (a weekly digest, a lock-buying guide, or a landlord and employer evidence pack).
- **Limit:** a self-selected group of cyclists in online communities will lean positive, and stated intent overstates real use. Treat a pass as "worth interviews", not as demand.

##### Test 3: Five 20-minute walkthroughs with a head-to-head against the existing clock (risks 1, 4 and 5)

- **Assumption tested:** riders find a verdict-plus-lock-tier more useful and more trustworthy than the existing district clock, and they do not feel alarmed or misled.
- **How, about two days:**
    1. Recruit five riders from the screening questions in Step 1 (at least one overnight street-parker, one station parker, one with a bike over €1,000). Short intercepts at bike racks or messages to the groups used in Test 2.
    2. Start with the past-behavior questions from the interview guide, without mentioning the product.
    3. Show the Bike Theft Clock for their district, ask what they take from it, then show your mock verdict (one "normal" case, one "higher than usual" case). Swap the order for half of them.
    4. Ask: what would you do with this? What do you doubt? Did "normal" feel reassuring or like no information? Did anything feel alarming or unfair to a neighbourhood? Have you seen anything like this before?
    5. Write exact quotes, and score each person: acted-on-it, understood-it, trusted-it.
- **Pass (suggested):** most can say what they would do differently from the verdict, and at least some prefer it to the clock for their own decision.
- **Kill or change:** they prefer the clock, treat "normal" as empty, find the confidence label confusing, or describe the "higher than usual" version as scary. Then revise the wording and the layout before building anything.
- **Limit:** five people produce patterns, not statistics. Choose them so they differ, not so they agree.

#### How the tests map to the risks

| Risk                              | Test 1 (data)                       | Test 2 (fake door)                | Test 3 (walkthroughs)               |
| --------------------------------- | ----------------------------------- | --------------------------------- | ----------------------------------- |
| 1 No habit of checking            |                                     | Primary                           | Supports                            |
| 2 Too thin at neighbourhood level | Primary                             |                                   |                                     |
| 3 Data measures reporting         | Partial (stability check, not bias) |                                   |                                     |
| 4 Wrong or alarming answer        |                                     |                                   | Primary (wording and trust)         |
| 5 Easy to copy, no channel        |                                     | Partial (where interest shows up) | Partial (versus the existing clock) |

**Not covered this week:** the full reporting-bias question (risk 3) needs outside data or a survey; the sustainability and funding question (risk 5) needs a separate round with grant bodies, housing companies or districts; and the liability read on lock advice needs someone qualified to review it.

#### Order

Day 1: Test 1 (it can change what Tests 2 and 3 show). Days 1–3: build the page for Test 2 and post it. Days 3–5: Test 3. End of week: write down the results next to the pass and kill criteria, and decide whether to continue, narrow the area level, or change the core behaviour.

---

## Step 5: Stakeholder-Ready Outputs

The four stakeholder versions are separate files. They share the evidence base of Steps 0–4 and its limits: the personas are synthetic, no rider has been interviewed, competitor findings are from desk research, and Berlin crime figures are checked against the Polizei Berlin PKS 2025 short report ([pks-kurzbericht-2025.pdf](pks-kurzbericht-2025.pdf)) where stated.

| File                                               | Audience                         | Decision it supports                              |
| -------------------------------------------------- | -------------------------------- | ------------------------------------------------- |
| [executive-summary.md](executive-summary.md)       | Executives, funders              | Go / no-go on the next phase                      |
| [technical-brief.md](technical-brief.md)           | Engineers                        | What to build, in what order                      |
| [market-brief.md](market-brief.md)                 | Partnership and funding outreach | Who to talk to, what to say, what not to claim    |
| [user-story-framework.md](user-story-framework.md) | Product team                     | What goes into the backlog and how it is accepted |
