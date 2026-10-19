# Step 1: Personas, Jobs-to-be-Done and Feature Mapping

> Caveat for all discovery files: personas, quotes and complaints are synthetic hypotheses, not research. Only police-data and PKS figures are evidence. See [Product Discovery.md](../Product%20Discovery.md).

Three personas map to the Step 0 segments. Dropped from Step 0: the errand/short-stop rider (folded into Jonas's short stops) and the cheap-bike rider (not yet covered; add one if interviews find them). **Who the first prototype is for is not decided**: Verdict and Fog serve Lena and Jonas most directly, Murat's fit is weakest, and the choice should follow interviews. Interview questions are in [interview-guide.md](interview-guide.md).

|                     | Lena                        | Murat                   | Jonas                       |
| ------------------- | --------------------------- | ----------------------- | --------------------------- |
| Segment             | Street-parking resident     | Station parker          | High-value bike owner       |
| Where the bike sits | Outside her flat, overnight | At the S-Bahn, 9+ hours | Everywhere, 20 min to 3 hrs |
| Main risk window    | Night                       | Workday                 | Evenings and weekends       |
| Main fear           | Waking up to a cut lock     | Another stolen wheel    | Losing a €2,800 bike        |

---

## Personas

### Persona 1: Lena Hartmann, 29, UX Researcher at a Berlin startup (Neukölln)

**Context:** Rents a 2-room flat on the 3rd floor of an Altbau with no courtyard and no cellar space. Rides a €450 used city bike daily. Has had two thefts: a front wheel, then a whole bike two years ago.

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

### How the three differ (and why it matters)

| Dimension                | Lena                               | Murat                        | Jonas                             |
| ------------------------ | ---------------------------------- | ---------------------------- | --------------------------------- |
| Biggest risk window      | Overnight                          | Workday                      | Evening, weekend                  |
| Needs from LockOut       | Reassurance and a simple tier      | Fast, free, trusted by peers | Detail, honesty about uncertainty |
| Would open the app       | Only if already on the home screen | If a colleague shared it     | Yes, proactively                  |
| Spends money on security | Rarely                             | Reluctantly                  | Yes                               |
| Likely first test        | Overnight tier for her address     | Station-level warning        | Evening risk before an outing     |

Product implication: **Jonas is the easiest early adopter but the least representative.** Lena and Murat may have the larger problem (daily exposure, no alternative) but are harder to reach and slower to adopt. Interview all three types, and decide whom to design for first from the evidence.

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

The strongest emotional job in all three is **relief or control, not information**. If true, the first impression must feel reassuring and actionable, not like another crime map.

## Feature-to-Job Mapping

Features come from the README and [lock-tier-documentation.md](../lock-tier-documentation.md). The mapping is circular by construction (personas were written around the product's jobs), so it looks better than it is. Only interviews can check it.

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
