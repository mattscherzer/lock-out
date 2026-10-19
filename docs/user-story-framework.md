# User Story Framework (Product Team)

## Framework

- **Personas:** Lena (street-parking resident), Murat (station parker), Jonas (high-value bike owner). Synthetic. Update after interviews.
- **Format:** *As a [persona or role], I want [capability], so that [outcome].*
- **Acceptance criteria:** Given / When / Then, written so a tester without context can pass or fail them.
- **Priority:** P0 (first prototype), P1 (next), P2 (later), as in [step-3-ideation.md](discovery/step-3-ideation.md).
- **Enabler** stories are technical prerequisites with no direct user value.
- **Each story carries:** its job-to-be-done, the job or complaint it serves (assumptions are tested through the epic measures below), and its feature ID from [step-3-ideation.md](discovery/step-3-ideation.md) (V = Verdict, H = Honest Fog, S = Settle It).

**Definition of ready:** persona and job named, acceptance criteria written, copy reviewed if it advises, data dependency identified, test or measure stated.
**Definition of done:** acceptance criteria pass on a phone, accessible, no tracking added, attribution shown, wording approved for advice, and the story's measure is recorded.

## Epics

| Epic | Goal | Primary persona |
| --- | --- | --- |
| E0 Foundations | Data and pipeline that the rest depend on | (engineering) |
| E1 Tonight's Verdict | One sentence and one action | Lena, Jonas |
| E2 Honest Fog | Show confidence and limits | All |
| E3 Settle It | Compare and share | Murat, Jonas |

## E0 Foundations (enablers)

| ID | Story | Acceptance criteria | Priority |
| --- | --- | --- | --- |
| E0-1 | As the team, we want a density audit of area-time cells, so that we know at which level we can give an answer. | Given the latest CSV, when the audit runs, then a table shows reports per area and daypart and the share of cells above the minimum. | P0 |
| E0-2 | As the team, we want a time-split backtest against a naive baseline, so that we know whether history predicts better than the citywide average. | Given a cut-off date, when the backtest runs, then it reports error for the area-history and citywide baselines on held-out months. | P0 |
| E0-3 | As the team, we want the lookup regenerated weekly, so that the answers stay current. | Given a failed download, when the job runs, then it keeps the last good JSON and flags the failure. | P0 |
| E0-4 | As the team, we want the advice catalog aligned with the lock-tier source of truth, so that no outdated or unsafe advice is shown. | Given the catalog, when reviewed, then no entry recommends a frame lock alone or cites Sold Secure. | P0 |

## E1 Tonight's Verdict

| ID | Story | Acceptance criteria | Job and assumption | Priority |
| --- | --- | --- | --- | --- |
| V1 | As Lena, I want one sentence about my area for tonight, so that I can stop worrying or act. | Given an area and time, when the app opens, then one sentence appears before any map, with no more than one number and no alarm wording. | Core job; assumes riders accept a one-line answer | P0 |
| V2 | As Jonas, I want the answer relative to the area's own normal, so that "high" means higher than usual here. | Given enough data, when a verdict is shown, then it states whether the area is lower, normal or higher than its usual level for that weekday and time band. | Needs a stable baseline | P0 |
| V3 | As Lena, I want a next action under the sentence, so that I know which lock and how to anchor it. | Given any verdict, when shown, then it names a lock tier and the anchoring step (frame and wheel to a fixed object), following the lock-tier source of truth. | Lock advice (C1) | P0 |
| V4 | As Murat, I want to find my place by location or search, so that I can check my station quickly. | Given location permission, when granted, then the nearest area opens; given denial, then search by area name works. No account is required. | Fast, free, no sign-up | P0 |
| V5 | As Jonas, I want to check "tonight" or "tomorrow 8 am" before I leave, so that I can choose my lock in advance. | Given a place, when I choose a time, then the verdict updates for that time band. | Plan-ahead job | P0 |
| V9 | As Lena, I want the app to say so plainly when things are normal, so that I feel reassured only when it is true. | Given a normal and high-confidence cell, when shown, then the screen uses calm styling; given thin data, then it never shows a reassurance. | Emotional job; ties to H3 | P0 |
| V7 | As Jonas, I want to see the map behind the verdict, so that I can explore. | Given a verdict, when I tap the map link, then the area map opens with the same area selected. | Secondary view | P1 |
| V8 | As Lena, I want my home area remembered on my phone, so that the app opens on it. | Given a saved area, when I reopen, then it loads that area; nothing is stored on a server. | Habit | P1 |
| V10 | As Murat, I want it to load fast on a weak connection, so that I can use it at the station. | Given the API is slow or down, when the page loads, then the bundled snapshot is used within the time budget agreed by the team. | Reliability | P1 |

## E2 Honest Fog

| ID | Story | Acceptance criteria | Job and assumption | Priority |
| --- | --- | --- | --- | --- |
| H1 | As Jonas, I want a confidence label next to every verdict, so that I know how far to trust it. | Given any verdict, when shown, then it carries solid, fair or thin, derived from a documented rule. | Trust (C3, C9) | P0 |
| H2 | As a rider, I want thin-data areas to look different on the map, so that I do not read them as safe. | Given a cell below the data minimum, when drawn, then it uses a hatched style and a text label. | Trust | P1 |
| H3 | As Lena, I want "not enough data" to give me standard advice, not a reassurance, so that I am not misled. | Given thin data, when a verdict is requested, then the sentence says so and the advice is the standard tier. | Safety rule | P0 |
| H4 | As Jonas, I want to see why I got this answer, so that I can judge it. | Given a verdict, when I open "why", then it lists the source, the data window, the exclusions (indoor cases, the last two weeks) and the known limits. | Reasoning visible | P0 |
| H5 | As a rider, I want to know how fresh the data is, so that I can judge recency. | Given a verdict, when shown, then a date shows the last update and notes that recent weeks are incomplete. | Trust | P1 |

## E3 Settle It

| ID | Story | Acceptance criteria | Job and assumption | Priority |
| --- | --- | --- | --- | --- |
| S1 | As Murat, I want to compare two places, so that I can settle a disagreement. | Given two places and a time band, when I compare, then both verdicts and confidence labels appear side by side. | Social job (C8) | P1 |
| S2 | As Murat, I want one line on the difference, so that I do not have to read two screens. | Given a comparison, when shown, then a sentence says "about the same" or names the higher area and the confidence. | Plain answer | P1 |
| S3 | As Jonas, I want a share link, so that friends see the same result. | Given a comparison, when I copy the link, then it contains only place and time parameters, and opens the same view without login. | Share job; privacy | P1 |
| S4 | As Jonas, I want a share image, so that I can send it in a chat. | Given a comparison, when I choose "image", then a card shows both places, confidence, source and date. | Growth | P1 |
| S5 | As Murat, I want an honest tie, so that I am not told a difference that the data cannot support. | Given two cells whose difference is within the uncertainty, when compared, then the result says the data cannot separate them. | Honesty | P1 |

Stories for P2 features (H6, H7, S6, S7) and for the V6 "higher than usual" flag are written when they are pulled in; the Step 4 tests mock the flag with static screens.

## Story map

| Step in the rider's day | Stories |
| --- | --- |
| Open the app | V1, V8, V10 |
| Find a place and time | V4, V5 |
| Read the answer | V1, V2, V9, H1, H3 |
| Decide what to do | V3 |
| Check the reasoning | H4, H5, V7 |
| Argue or share | S1–S5 |

## Measures and tests per epic

| Epic | Measure | Source |
| --- | --- | --- |
| E0 | Cell coverage and baseline comparison exist and are reviewed | Test 1 |
| E1 | Share of walkthrough riders who say what they would do differently; share who find "normal" useful; share who find any answer alarming | Test 3 |
| E2 | Riders' stated trust with and without the label; no rider reads "thin" as "safe" | Test 3 |
| E3 | Whether the comparison ends or starts a disagreement; share-link use | Test 3, later live use |

Targets for these measures are to be set by the team before the tests run.

## Backlog rules

- Nothing advises riders before E0-4 is done.
- Nothing ships below the area level that E0-1 and E0-2 support.
- Any story that stores or sends rider data needs a privacy review first.
- Idea 8 (Lock Budget), Closure Card and Non-Event Check-ins stay out of the backlog until the first three epics pass their tests and the lock-advice and privacy reviews are done.
