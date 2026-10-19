# LockOut: Product Discovery

The backbone of the discovery phase: what we asked, what we concluded, what is verified, and what we decided. Detail lives in [docs/discovery/](discovery/); this file stays short and is updated as evidence arrives.

**Evidence status.** No rider has been interviewed. Personas, quotes and complaints are synthetic hypotheses written from the README, the business model canvas ([draft](business-model-canvas-draft.md), [questions](business-model-canvas-questions.md)) and general knowledge of Berlin. Competitor findings are desk research. Only the police data and the PKS figures below count as evidence. Existing code is an incomplete draft and is not assessed here.

## ID legend

**A** assumption (A1–A13, Step 0) · **PP** shared pain point (PP1–PP5) and **C** complaint (C1–C10), both Step 2 · **F** feature inventory (F1–F10, Step 1) · **V / H / S** features of Tonight's Verdict, Honest Fog and Settle It (Step 3) · **E0–E3** epics and **P0–P2** priorities (P0 = first prototype) in the [user-story framework](user-story-framework.md).

## The steps at a glance

| Step | Question | Conclusion | Detail |
| ---- | -------- | ---------- | ------ |
| 0. Context calibration | Is the audience specific, the pain real, the assumptions known? | Audience not specific enough for personas yet; the pain is assumed, with a data-backed backdrop; 13 assumptions ranked, A1–A3 are make-or-break | [step-0](discovery/step-0-context.md) |
| 1. Personas, jobs, features | Who are we building for and what do they hire it for? | Three hypotheses: street-parking resident (Lena), station parker (Murat), high-value owner (Jonas). Shared jobs: "how risky here, now?" and "which lock matches?". Murat is the weakest fit, Jonas the easiest but least typical | [step-1](discovery/step-1-personas.md) |
| 2. Pain points | What do they live with, and what do they dislike in existing options? | Shared: locking is a daily cost with no feedback, decisions run on habit. Hidden needs: a specific next action, reassurance as well as warning, being treated as a capable adult. Many frustrations are outside LockOut's reach | [step-2](discovery/step-2-pain-points.md) |
| 3. Ideation | What could we build? | Ten ideas; top three: **Tonight's Verdict**, **Honest Fog**, **Settle It** (features V1–V10, H1–H7, S1–S7). Lock Budget is held back for a legal read | [step-3](discovery/step-3-ideation.md) |
| 4. Market and risk | Who else is here, and what could kill it? | The problem is real at scale and no product found combines neighborhood level, activity adjustment, advice and uncertainty. The Berlin Bike Theft Clock is the closest overlap. Nothing shows riders want it. Five risks and three tests for the validation phase | [step-4](discovery/step-4-market.md) |
| 5. Stakeholder outputs | What does each audience need? | Four separate files (below) | below |

Interview questions from every step are consolidated in [interview-guide.md](discovery/interview-guide.md).

## Verified facts

From the Polizei Berlin PKS 2025 short report ([pks-kurzbericht-2025.pdf](pks-kurzbericht-2025.pdf)). Use these, not press figures, in anything external.

| Fact | Value | Page |
| ---- | ----- | ---- |
| Bike thefts recorded, 2025 | 22,630 (2024: 27,099; −4,469, −16.5%) | 4–5, 19 |
| Average declared damage per completed bike theft | €1,246 (2024: €1,262) | 42 |
| Bike thefts counted within cellar break-ins | 1,892, reported separately; whether they are in the 22,630 is to confirm | 21 |
| Clearance rate, theft overall | 21.1% (no bike-specific rate in the report) | 19 |
| Clearance rate, theft from or of motor vehicles | 4.7% (the figure press often attaches to bikes) | 22 |

**Unverified, do not quote** (press or third-party only): about €27M damage; bike-theft clearance of 4.7–4.9%; GDV figures (about 115,000 insured thefts, €150M paid, €1,270 average claim, about 214,000 national thefts, −13%); "about half of thefts are unreported" (50–60%); Berlin's 13th rank per 100,000; district ranking; secured-parking plans; all Bike Theft Clock figures. The README's "about 20,000" is a round figure for all recorded bike thefts, not an outdoor-only count; whether the open dataset's outdoor filter matches either category is for the data audit.

## Assumption register

Thirteen assumptions (A1–A13) with cost to test and status are in [step-0-context.md](discovery/step-0-context.md#3-what-assumptions-am-i-making-that-need-validation). Update the **Status** column there as tests finish (Untested, Supported, Weakened, Killed). Current status: all untested.

## Decision log

Add a row whenever a decision changes direction. Keep entries to one line each; reasoning stays in the step files or the commit.

| Date | Decision | Why | Evidence level |
| ---- | -------- | --- | -------------- |
| 2026-10-19 | Settle It is the second build step; first prototype is Verdict plus Honest Fog | Keeps the first prototype small; Settle It depends on both | Assumption |
| 2026-10-19 | Frame personas as street parker, station parker, high-value owner; synthetic, tagged as hypotheses | Parking context separates needs better than age | Assumption |
| 2026-10-19 | Top 3 ideas: Tonight's Verdict, Honest Fog, Settle It, designed as one surface | Highest reach, lowest effort and risk; Fog stops Verdict from overclaiming | Assumption |
| 2026-10-19 | Lock Budget deferred until a legal read of lock-tier guidance | Highest liability; "lighter" must stay within police and ADFC guidance. The Clock also reports a share of bikes taken within 3 hours, which would undercut lighter locks for short stays ([step-4 §7](discovery/step-4-market.md#7-what-the-berlin-bike-theft-clock-changes)) | Guidance docs; Clock figure unverified |
| 2026-10-19 | Drop the €27M damage figure; mark 4.7–4.9% clearance unverified | Not in the PKS short report | Verified (PKS) |
| 2026-10-19 | Do not claim thefts are rising | Berlin thefts fell 16.5% in 2025 | Verified (PKS) |
| 2026-10-19 | Conditional go: a two-week validation phase before building | No demand evidence; data density and the Clock's overlap are open | See [executive summary](executive-summary.md) |

## Validation phase

Two weeks, ending in the go / narrow / stop gate in the [executive summary](executive-summary.md). The same plan is detailed in [step-4](discovery/step-4-market.md#tests-for-the-validation-phase).

| When | What |
| ---- | ---- |
| Week 1 | **Test 1:** data check (cell density, baseline stability, PKS vs dataset reconciliation). **Test 2:** build and post the fake-door page for Tonight's Verdict. Hands-on pass through Litelok, the Kriminalitätsatlas, the Fahrraddiebstahlwarnung app and the Bike Theft Clock |
| Week 2 | **Test 3:** five walkthroughs against the existing clock; these are the first five of the 8–10 interviews ([guide](discovery/interview-guide.md)). Gate decision at the end |
| After the gate | Remaining interviews, rewrite personas from what riders say, update the assumption register and decision log, correct the README's "about 20,000 outdoor thefts" once the data check settles it |

## Step 5: Stakeholder-ready outputs

All four share the evidence base and limits above.

| File | Audience | Decision it supports |
| ---- | -------- | -------------------- |
| [executive-summary.md](executive-summary.md) | Executives, funders | Go / no-go on the next phase |
| [technical-brief.md](technical-brief.md) | Engineers | What to build, in what order |
| [market-brief.md](market-brief.md) | Partnership and funding outreach | Who to talk to, what to say, what not to claim |
| [user-story-framework.md](user-story-framework.md) | Product team | What goes into the backlog and how it is accepted |
