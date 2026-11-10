# Midterm presentation (Tue 10 Nov 2026)

A 10-slide web deck for the 10-minute midterm: where LockOut stands, what is done, and what comes next. It is a checkup of the project, not a defence of the approach.

## What it covers

1. **Title.**
2. **Problem:** 22,630 bike thefts in Berlin in 2025, down 16.5%; no rider interviewed yet.
3. **Data:** the police open data (whole file vs the last 12 months used to rate areas) and why thin areas are hard.
4. **Model idea:** thin areas borrow from their neighbours (Empirical Bayes, in plain words) and become Low, Medium or High tiers.
5. **Accuracy:** a bar chart of the backtest on two future quarters against two simple baselines.
6. **Tiers hold up:** actual thefts per area by predicted tier.
7. **Limits:** what the data cannot tell us.
8. **Product and demo:** map, search and answer card, shown from the app running locally.
9. **Tested:** what was checked on data, and that riders are still untested.
10. **Next:** new features, the usability test, robustness, and the dates to graduation.

An "AI product decisions" slide is in the file but hidden. Remove its `hidden` attribute in `index.html` to bring it back.

Every number comes from `docs/eda-findings.md`, `docs/product-discovery.md`, `docs/eb-model-results.md`, `docs/validation-report.md` or `docs/glm-results.md`. Each slide names its source in the bottom corner.

## How to run it

The deck is one static file. It reads the design tokens and fonts from `frontend/src/styles` and `frontend/src/fonts`, so serve the repository root, not this folder:

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000/docs/midterm/>.

| Key | Action |
| --- | --- |
| Right arrow, Space, Page Down, or click the right half | Next slide |
| Left arrow, Page Up, or click the left half | Previous slide |
| Home / End | First / last slide |
| `d` | Toggle dark mode |

The URL hash holds the slide number (`#5`), so a reload keeps your place.