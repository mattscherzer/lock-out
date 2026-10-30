"""Calibration, district fairness and selector validation on the backtest folds (issue #39, roadmap WP 1.4).

Run from the repo root: uv run python src/models/validate.py [path to the police CSV]
Writes docs/validation-report.md. The selector flags in data/processed/lookup_v0.json come from
the same checks, written by src/models/eb.py.
"""
import json
import sys
from pathlib import Path

import numpy as np
import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import config
from audit_checks import POLYGONS, check_csv, polygon_ids
from fetch_police_csv import find_raw_csv
from models.backtest import FOLDS
from models.eb import TIERS, TOP_QUARTILE, evaluate, selector_flags, top_quartile
from models.selector_checks import BIKE_VALUE_SPLIT_EUR, MIN_MEDIAN_PER_LEVEL, SELECTORS
from pipeline.clean import clean

OUT = Path(__file__).resolve().parents[2] / "docs" / "validation-report.md"
HIGH_OVER_LOW = 2  # calibration: the High mean must be at least this multiple of the Low mean
FAIRNESS_FACTOR = 2  # a Bezirk is flagged if one share is more than this multiple of the other
SMALL_NUMBERS_BELOW = 3  # a flagged Bezirk with fewer High or top-quartile areas than this gets a small-numbers note
SELECTOR_NAMES = {"time_band": "Time band", "day_group": "Day group", "bike_value": f"Bike value (EUR {BIKE_VALUE_SPLIT_EUR} split)"}


def bezirke():
    """8-digit area id -> Bezirk name, from the planning-area polygons ("01 - Mitte" -> "Mitte")."""
    geo = json.loads(POLYGONS.read_text(encoding="utf-8"))
    return pd.Series({f["properties"]["plr_id"]: f["properties"]["bez"].split(" - ", 1)[-1] for f in geo["features"]})


def calibration(actual, tier):
    """Mean actual thefts per area in each tier; passes if the means rise from Low to High and High >= 2x Low."""
    means = actual.groupby(tier).mean().reindex([name for name, _ in TIERS])
    rising = bool(means.notna().all() and (means.diff().dropna() > 0).all())
    return means, rising and bool(means["HIGH"] >= HIGH_OVER_LOW * means["LOW"])


def off(ratio):
    """Flag rule: one share more than FAIRNESS_FACTOR times the other. 0 on one side counts (ratio 0 or inf), 0 on both does not."""
    return bool(ratio > FAIRNESS_FACTOR or ratio < 1 / FAIRNESS_FACTOR)


def fairness(tier, top, bezirk):
    """Per Bezirk: its share of the city's High areas vs its share of the city's top-quartile areas."""
    high = tier == "HIGH"
    t = pd.DataFrame({
        "areas": True, "high": high, "top": top, "high_and_top": high & top,
        "top_medium": top & (tier == "MEDIUM"), "top_low": top & (tier == "LOW"),
    }).astype(int).groupby(bezirk).sum()
    t["share_high"] = t["high"] / t["high"].sum()
    t["share_top"] = t["top"] / t["top"].sum()
    with np.errstate(divide="ignore", invalid="ignore"):
        t["ratio"] = t["share_high"] / t["share_top"]
    t["flagged"] = [off(r) for r in t["ratio"]]
    return t


def explain(b, cut):
    """The numbers behind a flagged Bezirk: which share is larger, and which of its areas make the difference."""
    if b["share_high"] < b["share_top"]:
        text = (f"Holds {b['share_top']:.1%} of the city's top-quartile areas but {b['share_high']:.1%} of its High areas. "
                f"The model ranks {b['top_medium']} of its {b['top']} top-quartile areas Medium and {b['top_low']} Low.")
    else:
        text = (f"Holds {b['share_high']:.1%} of the city's High areas but {b['share_top']:.1%} of its top-quartile areas. "
                f"{b['high'] - b['high_and_top']} of its {b['high']} High areas had fewer thefts in this fold than the top-quartile cut ({cut:g}).")
    if min(b["high"], b["top"]) < SMALL_NUMBERS_BELOW:
        text += " Small numbers: one area more or less changes the ratio a lot."
    return text


def table(header, rows):
    lines = ["| " + " | ".join(header) + " |", "| " + " | ".join("---" for _ in header) + " |"]
    return "\n".join(lines + ["| " + " | ".join(str(v) for v in row) + " |" for row in rows])


def markdown(rows, flags, bezirk, reports_up_to, cutoff, source):
    tier_names = [name for name, _ in TIERS]
    cal_rows, fair_parts, flagged = [], [], []
    for r in rows:
        means, ok = calibration(r["actual"], r["tier"])
        cal_rows.append([r["fold"], *(f"{means[n]:.2f}" for n in tier_names), f"{means['HIGH'] / means['LOW']:.1f}x", "pass" if ok else "MISS"])
        top = top_quartile(r["actual"])
        t = fairness(r["tier"], top, bezirk)
        cut = r["actual"].quantile(TOP_QUARTILE)
        fair_parts.append(f"### {r['fold']}\n\n" + table(
            ["Bezirk", "Areas", "High", "Top quartile", "Share of city's High", "Share of city's top quartile", "Ratio", "Flag"],
            [[name, b["areas"], b["high"], b["top"], f"{b['share_high']:.1%}", f"{b['share_top']:.1%}",
              "n/a" if np.isnan(b["ratio"]) else ("inf" if np.isinf(b["ratio"]) else f"{b['ratio']:.2f}"), "flagged" if b["flagged"] else ""]
             for name, b in t.iterrows()]))
        flagged += [f"- **{name}, {r['fold']}:** {explain(b, cut)}" for name, b in t[t["flagged"]].iterrows()]
    sel_rows = []
    for s in SELECTORS:
        checks = [r["selectors"][s] for r in rows]
        holdout_alone = "area better in both folds" if all(c["area"] < c["citywide"] for c in checks) else "not better in both folds"
        sel_rows.append([SELECTOR_NAMES[s], *(f"{c['median']:.1f}" for c in checks),
                         *(f"{c['citywide']:.3f} vs {c['area']:.3f}" for c in checks), holdout_alone, flags[s]["pattern"], flags[s]["reason"]])
    folds = [r["fold"] for r in rows]
    return f"""# Validation Report: Calibration, District Fairness and Selectors

Generated by `uv run python src/models/validate.py data/raw/{source}` from `{source}` (not in Git), with reports up to {reports_up_to:%d %b %Y} and thefts counted up to the 14-day cutoff, {cutoff:%d %b %Y}. It uses the EB model v0 and the two folds of `docs/backtest-results.md`: each fold's tiers come from the 12 months before it and are checked against the thefts in the fold. Compare runs on the same file.

## Calibration

Mean actual thefts per area in the fold, by tier. It passes if the means rise from Low to Medium to High and the High mean is at least {HIGH_OVER_LOW}x the Low mean, in both folds.

{table(["Fold", "Low", "Medium", "High", "High / Low", "Result"], cal_rows)}

## District fairness

Per Bezirk, its share of the city's High areas against its share of the city's areas in the actual top quartile (as in `docs/eb-model-results.md`, an area with 0 thefts is never top quartile). This is a report, not a pass/fail check.

- **Differs from the issue's wording.** Issue #39 asks for the share of a district's own areas in each group. High covers 15% of areas and the top quartile 25%, so those shares would sit near 0.6 even for a perfect model, too close to the 0.5 flag line. With shares of the city, a Bezirk that holds as large a share of the city's High areas as of its top-quartile areas sits at 1.
- **Not 1 even for a perfect model.** High is the top 15% of areas and the top quartile the top 25%. A Bezirk with many of the city's highest-theft areas sits above 1 (at most about 1.7), and one whose busiest areas rank just below the top 15% sits below 1. The explanations below show which of a flagged Bezirk's areas make the difference.
- **Flag:** a ratio above {FAIRNESS_FACTOR} or below 1/{FAIRNESS_FACTOR}, in either fold. That includes a Bezirk with 0 High or 0 top-quartile areas while the other side has at least one; a Bezirk with 0 on both sides is not flagged.
- **Small numbers:** a Bezirk has about 36 to 60 areas, so only a handful are High. One area more or less can move a ratio across the flag line, and a flagged Bezirk with fewer than {SMALL_NUMBERS_BELOW} High or top-quartile areas says so.

{(chr(10) * 2).join(fair_parts)}

### Flagged Bezirke

{chr(10).join(flagged) if flagged else "None."}

## Selectors

Each selector the card shows is checked on both folds. It gets an area pattern only if it is not too sparse and area-specific shares predict both folds better than the citywide shares. Otherwise it is flagged "citywide pattern", the card shows the citywide shares, and area tiers stay area-only either way.

- **Sparse:** the median count per area and selector level in the fold's 12-month history is below {MIN_MEDIAN_PER_LEVEL}. This is a working rule from the EDA, not a tested threshold.
- **Hold-out test:** both versions predict each area's fold count with the same EB rate and differ only in the shares they split it by, so the test measures only whether area-specific shares help. Area-specific shares are pulled toward the citywide shares, with the strength estimated from the data (method of moments, as for the area rates). The score is the mean Poisson deviance over all areas and levels; lower is better.
- **Time band:** offence hours are spread across the reported window, and the cleaning splits each theft over the bands it covers. Even a passing time band would be weak evidence.
- **Bike value** is the one split at EUR {BIKE_VALUE_SPLIT_EUR} used in the model ("bike class" in the issue). A theft with no recorded value counts in neither level.
- **Hold-out alone** shows the hold-out result whatever the sparsity rule says, so a flag that rests on the working rule alone is visible.
- **"Area pattern" is a validation result only.** The v0 output (`lookup_v0.json`) still carries only the citywide shares. Whether to add area values, and how the card words them, is decided at the schema lock (WP 1.5): the data shows which bikes are stolen in an area, not how many of each kind are parked there.

{table(["Selector", *(f"Median, {f}" for f in folds), *(f"Deviance citywide vs area, {f}" for f in folds), "Hold-out alone", "Flag", "Reason"], sel_rows)}
"""


if __name__ == "__main__":
    path = Path(sys.argv[1]) if len(sys.argv) > 1 else find_raw_csv()
    cleaned = clean(check_csv(path))
    cleaned["LOR"] = cleaned["LOR"].str.zfill(8)
    areas = sorted(polygon_ids())
    reports_up_to = cleaned["ANGELEGT_AM"].max()
    cutoff = reports_up_to - pd.Timedelta(days=config.LAG_CUTOFF_DAYS)
    if pd.Timestamp(FOLDS[-1][1]) > cutoff:
        sys.exit(f"The file is only complete up to {cutoff:%d %b %Y}, before the last fold ends; use a newer file.")
    rows = evaluate(cleaned, areas)
    flags = selector_flags(rows)
    bezirk = bezirke().reindex(areas)
    OUT.write_text(markdown(rows, flags, bezirk, reports_up_to, cutoff, path.name), encoding="utf-8")
    for r in rows:
        means, ok = calibration(r["actual"], r["tier"])
        t = fairness(r["tier"], top_quartile(r["actual"]), bezirk)
        print(f"{r['fold']}: calibration {'pass' if ok else 'MISS'} ({', '.join(f'{n} {m:.2f}' for n, m in means.items())}); "
              f"flagged Bezirke: {', '.join(t.index[t['flagged']]) or 'none'}")
    for s, result in flags.items():
        print(f"{s}: {result['pattern']} ({result['reason']})")
    print(f"Wrote {OUT}")