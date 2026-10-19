# Executive Summary

**LockOut: free, map-first theft-risk guidance for Berlin cyclists**
_Decision requested: approve a two-week validation phase. Do not yet approve a full build._

## Market opportunity

- Berlin recorded **22,630 bike thefts in 2025**, down 16.5% from 27,099 in 2024. Average declared damage per completed case was €1,246 (2024: €1,262). Source: Polizei Berlin, PKS Kurzbericht 2025, pp. 5, 19, 42 ([pks-kurzbericht-2025.pdf](pks-kurzbericht-2025.pdf)). These are reported cases only.
- Nationally, insurer data reported in the press shows a record average claim of about €1,270 in 2025. That figure is not verified here, and Berlin's own average damage is flat, so "bikes are getting more valuable" is not shown for Berlin.
- The bike-specific clearance rate is not in the PKS short report. Press reports of under 5% are unverified.
- Police data is public and current. Thefts are widely under-reported, so a fair, honest reading of the data has value that raw counts do not.
- No payer exists yet. The model is free and open source, funded by grants or institutional buyers. Neither has been tested.

## Key insights

- Riders face a repeated, unaided decision (where and how to lock) and get generic advice. This is a hypothesis from synthetic personas. No rider has been interviewed.
- Existing tools show counts. We found no Berlin product that turns theft data into a specific "what lock, now" answer, though the search was a single pass.
- Closest competitor: a free district-level "bike theft clock" run by a tour company, using the same data. It confirms the data can be turned into a public tool cheaply, and it covers only 12 districts.
- The product's value depends on three things not yet shown: riders check before parking, the data is dense enough at neighbourhood level, and riders trust the answer.

## Proposed solution

A mobile web app that gives one plain sentence per place and time, for example "Normal for a Tuesday night; your usual lock is fine", plus a lock-tier recommendation grounded in Polizei Berlin, ProPK and ADFC guidance. Every answer carries a confidence label, and a two-place comparison can be shared by link. No accounts and no tracking.

## Competitive position (hypothesis)

- Finer areas (542 planning areas against 12 districts or 143 Bezirksregionen), only if the data is dense enough to support them.
- Adjusts for busy places and shows its uncertainty.
- Gives lock advice, which none of the tools found do.
- Independent of any lock maker or insurer.
- Not a moat: the data is open and easy to copy. The advantage has to come from method, advice and trust.

## Top risks

Riders may not check before parking. Neighbourhood cells may be too thin. The data measures reporting as much as theft. A wrong or alarming answer could damage trust. The product is easy to copy and has no channel or funding yet.

**Recommendation: conditional go.**
Run three one-week tests: a data density check, a fake-door demand test and five rider walkthroughs. Cost is mostly team time. The canvas estimates roughly €100–€270 per month in the first three months, a rough figure and not budgeted.

| Gate (end of week 2) | Continue if                                                                            | Otherwise                                        |
| -------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------ |
| Data density         | Most area-time cells are stable enough, or coarser grouping works                      | Ship at district or Bezirksregion level, or stop |
| Demand               | Cyclists say they would check before parking and some leave contact details unprompted | Rethink the moment of use, or the product        |
| Trust and usefulness | Riders can say what they would do differently and do not find it alarming              | Rewrite the wording before building              |

## Next steps

1. Week 1: run the data check and build the demand page.
2. Week 1–2: run five walkthroughs; check the competing products hands-on.
3. End of week 2: decide go, narrow or stop against the gates above.
4. Before any launch: review lock-advice wording and the privacy of any shared link.

_Evidence status: desk research and synthetic personas only. No rider, buyer or funder has been consulted._
