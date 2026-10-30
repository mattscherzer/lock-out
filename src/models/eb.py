"""Empirical Bayes model v0: Gamma-Poisson shrinkage from area to Bezirksregion to city (issue #38, roadmap M4).

Run from the repo root: uv run python src/models/eb.py [path to the police CSV]
Scores the model on both backtest folds against the targets, writes docs/eb-model-results.md,
and writes the generator v0 output data/processed/lookup_v0.json for all 542 areas.
"""
import json
import sys
from pathlib import Path

import numpy as np
import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import config
from audit_checks import check_csv, polygon_ids
from fetch_police_csv import find_raw_csv
from models.backtest import FOLDS, HISTORY_MONTHS, baselines, counts, days, fold_periods, score
from models.selector_checks import BIKE_VALUE_SPLIT_EUR, SELECTORS, flag, holdout, levels
from pipeline.clean import clean

ROOT = Path(__file__).resolve().parents[2]
RESULTS = ROOT / "docs" / "eb-model-results.md"
LOOKUP = ROOT / "data" / "processed" / "lookup_v0.json"
TIERS = [("LOW", 0.60), ("MEDIUM", 0.85), ("HIGH", 1.00)]  # upper percentile of each tier: 60 / 25 / 15 of areas
LIMITED_DATA_BELOW = 5  # street thefts in the window (M6)
TOP_QUARTILE = 0.75
TARGET_HIGH_IN_TOP_QUARTILE = 0.70
TARGET_SPEARMAN = 0.6  # checked on the last fold only, as the issue states
TARGET_WITHIN_RAW = 1.01  # deviance within 1% of the raw area history
TIER_SHARE_TOLERANCE = 0.05  # ties can move a tier's share a little; a bigger gap means the rates are degenerate


def strength(y, exposure, prior_mean):
    """Method-of-moments shape of the Gamma prior. Large means the units barely differ, so shrink hard."""
    expected = exposure * prior_mean
    excess = ((y - expected) ** 2 - expected).sum()
    return float((expected**2).sum() / excess) if excess > 0 else float("inf")


def posterior_rate(y, exposure, prior_mean, a):
    """Posterior mean rate per unit of exposure; with a = inf it is the prior mean, and a prior mean of 0 stays 0."""
    prior_mean = np.broadcast_to(np.asarray(prior_mean, dtype=float), np.shape(y))
    if np.isinf(a):
        return prior_mean.copy()
    with np.errstate(divide="ignore", invalid="ignore"):
        rate = (a + np.asarray(y, dtype=float)) / (a / prior_mean + exposure)
    return np.where(prior_mean > 0, rate, 0.0)


def fit(area_counts):
    """Area counts (index: 8-digit LOR) -> shrunk expected count per area, plus the two prior strengths."""
    bzr = area_counts.index.str[:6]
    city_rate = area_counts.mean()
    bzr_y = area_counts.groupby(bzr).sum()
    bzr_n = area_counts.groupby(bzr).size()
    a_bzr = strength(bzr_y, bzr_n, city_rate)
    bzr_rate = pd.Series(posterior_rate(bzr_y, bzr_n, city_rate, a_bzr), index=bzr_y.index)
    parent = bzr_rate.reindex(bzr).to_numpy()
    a_area = strength(area_counts.to_numpy(), 1, parent)
    rate = pd.Series(posterior_rate(area_counts.to_numpy(), 1, parent, a_area), index=area_counts.index)
    return rate, {"bezirksregion": a_bzr, "area": a_area}


def tiers(rate):
    """Relative percentile bands, cut at 60% and 85%. Areas with the same rate get the same, higher tier."""
    pct = rate.rank(method="max") / len(rate)
    return pct.apply(lambda p: next(name for name, top in TIERS if p <= top))


def check_tier_shares(tier):
    """Each tier must hold its share of areas (60 / 25 / 15), give or take the tolerance."""
    shares = tier.value_counts(normalize=True)
    lower = 0.0
    for name, top in TIERS:
        target, share = top - lower, float(shares.get(name, 0.0))
        assert abs(share - target) <= TIER_SHARE_TOLERANCE, f"{name} holds {share:.1%} of areas, target {target:.0%}"
        lower = top


def top_quartile(actual):
    """Areas whose actual count is in the top quartile; a count of 0 never counts as top."""
    return (actual >= actual.quantile(TOP_QUARTILE)) & (actual > 0)


def share_in_top_quartile(actual, high):
    """Share of High-tier areas whose actual count is in the top quartile."""
    return float(top_quartile(actual)[high].mean())


def evaluate(df, areas):
    """Per fold: the scores against the targets, plus the tiers, actual counts and selector checks behind them."""
    rows = []
    for history_start, history_end, start, end in fold_periods():
        history = counts(df, areas, history_start, history_end)
        actual = counts(df, areas, start, end)
        scale = days(start, end) / days(history_start, history_end)
        base = baselines(history, days(history_start, history_end), days(start, end))
        rate, _ = fit(history)
        expected = rate * scale
        tier = tiers(rate)
        dev, rho = score(actual, expected)
        dev_city, _ = score(actual, base["Citywide share"])
        dev_raw, _ = score(actual, base["Raw area history"])
        rows.append({
            "fold": f"{start:%Y-%m-%d} to {end:%Y-%m-%d}", "deviance": dev, "citywide": dev_city, "raw": dev_raw, "spearman": rho,
            "high_in_top_quartile": share_in_top_quartile(actual, tier == "HIGH"),
            "raw_high_in_top_quartile": share_in_top_quartile(actual, tiers(base["Raw area history"]) == "HIGH"),
            "tier": tier, "actual": actual,
            "selectors": {s: holdout(df, areas, expected, (history_start, history_end), (start, end), s) for s in SELECTORS},
        })
    return rows


def selector_flags(rows):
    """Per selector: "area pattern" or "citywide pattern", with the reason, from the checks on both folds."""
    return {s: flag([r["selectors"][s] for r in rows]) for s in SELECTORS}


def targets(rows):
    checks = []
    for r in rows:
        checks += [
            (r["fold"], "Deviance better than citywide share", f"{r['deviance']:.3f} vs {r['citywide']:.3f}", r["deviance"] < r["citywide"]),
            (r["fold"], "Deviance within 1% of or better than raw area history", f"{r['deviance']:.3f} vs {r['raw']:.3f}", r["deviance"] <= TARGET_WITHIN_RAW * r["raw"]),
            (r["fold"], "High-tier areas in the actual top quartile >= 70%", f"{r['high_in_top_quartile']:.0%}", r["high_in_top_quartile"] >= TARGET_HIGH_IN_TOP_QUARTILE),
        ]
    last = rows[-1]
    checks.append((last["fold"], "Spearman >= 0.6 (last fold only)", f"{last['spearman']:.3f}", last["spearman"] >= TARGET_SPEARMAN))
    return checks


def citywide_multipliers(df):
    """Share of thefts in each level of each selector: the same for every area (D-18)."""
    out = {}
    for s in SELECTORS:
        n = levels(df, s).sum()
        out[s] = {level: round(float(v / n.sum()), 4) for level, v in n.items()}
    return out


def generate(df, areas, reports_up_to, cutoff, source, selectors):
    """The generator v0 output. selectors: the per-selector flags from selector_flags()."""
    start = cutoff - pd.DateOffset(months=HISTORY_MONTHS) + pd.Timedelta(days=1)
    window = df[df["TATZEIT_ENDE_DATUM"].between(start, cutoff)]
    y = counts(window, areas, start, cutoff)
    rate, a = fit(y)
    tier = tiers(rate)
    check_tier_shares(tier)
    street_record = set(df["LOR"])  # no_record: no street theft at all in the cleaned data
    out = {
        "metadata": {
            "model_type": "eb_gamma_poisson",
            "version": "v0",
            "source_file": source,
            "data_window": f"{start:%Y-%m-%d} to {cutoff:%Y-%m-%d}",
            "reports_up_to": f"{reports_up_to:%Y-%m-%d}",
            "truncation_lag_days": config.LAG_CUTOFF_DAYS,
            "shrinkage_strength": {k: (None if np.isinf(v) else round(v, 3)) for k, v in a.items()},
            "tiers": "relative percentile bands of areas: LOW 60%, MEDIUM 25%, HIGH 15%",
            "citywide_multipliers": citywide_multipliers(window),
            "selectors": {s: {**f, "area_values": False} for s, f in selectors.items()},  # v0 carries no area values
            "attribution": {"police": "Datenquelle: Polizei Berlin (CC-BY 4.0)", "osm": "© OpenStreetMap contributors (ODbL)"},
        },
        "areas": {
            lor: {
                "tier": tier[lor],
                "expected_per_year": round(float(rate[lor]), 2),
                "reports_12m": int(y[lor]),
                "limited_data": bool(y[lor] < LIMITED_DATA_BELOW),
                "no_record": lor not in street_record,
            }
            for lor in areas
        },
    }
    assert len(out["areas"]) == 542
    return out


def markdown(rows, checks, lookup, reports_up_to, cutoff, source):
    lines = [f"| {f} | {t} | {v} | {'pass' if ok else 'MISS'} |" for f, t, v, ok in checks]
    folds = [f"| {r['fold']} | {r['deviance']:.3f} | {r['citywide']:.3f} | {r['raw']:.3f} | {r['spearman']:.3f} | {r['high_in_top_quartile']:.0%} | {r['raw_high_in_top_quartile']:.0%} |" for r in rows]
    flagged = sum(a["no_record"] for a in lookup["areas"].values())
    limited = sum(a["limited_data"] for a in lookup["areas"].values())
    return f"""# EB Model v0 Results

Generated by `uv run python src/models/eb.py data/raw/{source}` from `{source}` (not in Git), with reports up to {reports_up_to:%d %b %Y} and thefts counted up to the 14-day cutoff, {cutoff:%d %b %Y}. The committed `data/processed/lookup_v0.json` comes from the same run. The baselines and folds are the ones in `docs/backtest-results.md`; compare models on the same file.

## Model

- Gamma-Poisson Empirical Bayes: each area's count is pulled toward its Bezirksregion, and each Bezirksregion toward the city. The prior strengths are estimated from the data (method of moments). An area with few thefts is pulled more strongly.
- Tiers are relative percentile bands of areas: Low 60%, Medium 25%, High 15%. Areas with the same rate get the same tier, the higher one.
- v0 scope: time band, day group and bike value (one split at EUR {BIKE_VALUE_SPLIT_EUR}) are stored as citywide shares in the metadata (D-18). No area carries multiplied values, and as citywide multipliers they never change an area's tier. Each selector carries a flag from the hold-out validation (`selectors` in the metadata); the checks are in `docs/validation-report.md`.

## Targets (G1)

The Spearman target is checked on the last fold only, as the issue states.

| Fold | Target | Value | Result |
| --- | --- | --- | --- |
{chr(10).join(lines)}

## Per fold

"High in top quartile" is shown for the raw area history too: on its own it does not show whether the model beats the baseline. Areas with 0 actual thefts never count as top quartile.

| Fold | EB deviance | Citywide share | Raw area history | Spearman | High in top quartile (EB) | High in top quartile (raw history) |
| --- | --- | --- | --- | --- | --- | --- |
{chr(10).join(folds)}

## Generator v0 output

`data/processed/lookup_v0.json`: {len(lookup['areas'])} areas, data window {lookup['metadata']['data_window']}. {flagged} areas have no street theft at all in the cleaned data (`no_record`), {limited} have fewer than {LIMITED_DATA_BELOW} street thefts in the window (`limited_data`). The file does not follow `lookup_schema_v1.json` yet; that is aligned at the schema lock (WP 1.5).
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
    checks = targets(rows)
    flags = selector_flags(rows)
    lookup = generate(cleaned, areas, reports_up_to, cutoff, path.name, flags)
    LOOKUP.write_text(json.dumps(lookup, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    RESULTS.write_text(markdown(rows, checks, lookup, reports_up_to, cutoff, path.name), encoding="utf-8")
    for f, t, v, ok in checks:
        print(f"{'pass' if ok else 'MISS'}  {f}  {t}: {v}")
    for s, result in flags.items():
        print(f"{s}: {result['pattern']} ({result['reason']})")
    print(f"Wrote {LOOKUP} and {RESULTS}")