"""Empirical Bayes model v0: Gamma-Poisson shrinkage from area to Bezirksregion to city (issue #38, roadmap M4).

Run from the repo root: uv run python src/models/eb.py
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
from models.backtest import FOLDS, HISTORY_MONTHS, baselines, counts, days, score
from pipeline.clean import clean

ROOT = Path(__file__).resolve().parents[2]
RESULTS = ROOT / "docs" / "eb-model-results.md"
LOOKUP = ROOT / "data" / "processed" / "lookup_v0.json"
TIERS = [("LOW", 0.60), ("MEDIUM", 0.85), ("HIGH", 1.00)]  # upper percentile of each tier: 60 / 25 / 15 of areas
LIMITED_DATA_BELOW = 5  # street thefts in 12 months (M6)


def strength(y, exposure, prior_mean):
    """Method-of-moments shape of the Gamma prior. Large means the units barely differ, so shrink hard."""
    expected = exposure * prior_mean
    excess = ((y - expected) ** 2 - expected).sum()
    return float((expected**2).sum() / excess) if excess > 0 else float("inf")


def posterior_rate(y, exposure, prior_mean, a):
    """Posterior mean rate per unit of exposure; with a = inf it is the prior mean."""
    if np.isinf(a):
        return prior_mean * np.ones(len(y))
    return (a + y) / (a / prior_mean + exposure)


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
    """Relative percentile bands: rank the areas and cut at 60% and 85%."""
    pct = rate.rank(method="first") / len(rate)
    return pct.apply(lambda p: next(name for name, top in TIERS if p <= top))


def evaluate(df, areas):
    rows = []
    for start, end in FOLDS:
        history_start = pd.Timestamp(start) - pd.DateOffset(months=HISTORY_MONTHS)
        history_end = pd.Timestamp(start) - pd.Timedelta(days=1)
        history = counts(df, areas, history_start, history_end)
        actual = counts(df, areas, start, end)
        scale = days(start, end) / days(history_start, history_end)
        base = baselines(history, days(history_start, history_end), days(start, end))
        rate, _ = fit(history)
        predicted = rate * scale
        dev, rho = score(actual, predicted)
        dev_city, _ = score(actual, base["Citywide share"])
        dev_raw, _ = score(actual, base["Raw area history"])
        high = tiers(rate) == "HIGH"
        in_top_quartile = (actual[high] >= actual.quantile(0.75)).mean()
        rows.append({"fold": f"{start} to {end}", "deviance": dev, "citywide": dev_city, "raw": dev_raw,
                     "spearman": rho, "high_in_top_quartile": in_top_quartile})
    return rows


def targets(rows):
    checks = []
    for r in rows:
        checks += [
            (r["fold"], "Deviance better than citywide share", f"{r['deviance']:.3f} vs {r['citywide']:.3f}", r["deviance"] < r["citywide"]),
            (r["fold"], "Deviance within 1% of or better than raw area history", f"{r['deviance']:.3f} vs {r['raw']:.3f}", r["deviance"] <= 1.01 * r["raw"]),
            (r["fold"], "High-tier areas in the actual top quartile >= 70%", f"{r['high_in_top_quartile']:.0%}", r["high_in_top_quartile"] >= 0.70),
        ]
    last = rows[-1]
    checks.append((last["fold"], "Spearman >= 0.6", f"{last['spearman']:.3f}", last["spearman"] >= 0.6))
    return checks


def citywide_multipliers(df):
    """Shares of thefts per time band, day group and bike value: the same for every area (D-18)."""
    band = df[list(config.DAYPARTS)].sum() / len(df)
    day = df["TATZEIT_ANFANG_DATUM"].dt.weekday.apply(config.daytype_of).value_counts(normalize=True)
    value = (pd.to_numeric(df["SCHADENSHOEHE"], errors="coerce") >= 1000).map({True: "eur_1000_or_more", False: "under_eur_1000"})
    r = lambda s: {k: round(float(v), 4) for k, v in s.items()}
    return {"time_band": r(band), "day_group": r(day), "bike_value": r(value.value_counts(normalize=True))}


def generate(df, raw, areas, reports_up_to, cutoff):
    start = cutoff - pd.DateOffset(months=12) + pd.Timedelta(days=1)
    window = df[df["TATZEIT_ENDE_DATUM"].between(start, cutoff)]
    y = counts(window, areas, start, cutoff)
    rate, a = fit(y)
    tier = tiers(rate)
    shares = tier.value_counts(normalize=True)
    for name, target in [("LOW", 0.60), ("MEDIUM", 0.25), ("HIGH", 0.15)]:
        assert abs(shares.get(name, 0) - target) < 0.02, f"{name} share {shares.get(name, 0):.1%} is not near {target:.0%}"
    recorded = set(raw["LOR"].str.zfill(8))
    out = {
        "metadata": {
            "model_type": "eb_gamma_poisson",
            "version": "v0",
            "data_window": f"{start:%Y-%m-%d} to {cutoff:%Y-%m-%d}",
            "reports_up_to": f"{reports_up_to:%Y-%m-%d}",
            "truncation_lag_days": config.LAG_CUTOFF_DAYS,
            "shrinkage_strength": {k: (None if np.isinf(v) else round(v, 3)) for k, v in a.items()},
            "tiers": "relative percentile bands of areas: LOW 60%, MEDIUM 25%, HIGH 15%",
            "citywide_multipliers": citywide_multipliers(window),
            "attribution": {"police": "Datenquelle: Polizei Berlin (CC-BY 4.0)", "osm": "© OpenStreetMap contributors (ODbL)"},
        },
        "areas": {
            lor: {
                "tier": tier[lor],
                "expected_per_year": round(float(rate[lor]), 2),
                "reports_12m": int(y[lor]),
                "limited_data": bool(y[lor] < LIMITED_DATA_BELOW),
                "no_record": lor not in recorded,
            }
            for lor in areas
        },
    }
    assert len(out["areas"]) == 542
    return out


def markdown(rows, checks, lookup, reports_up_to, cutoff):
    lines = [f"| {f} | {t} | {v} | {'pass' if ok else 'MISS'} |" for f, t, v, ok in checks]
    folds = [f"| {r['fold']} | {r['deviance']:.3f} | {r['citywide']:.3f} | {r['raw']:.3f} | {r['spearman']:.3f} | {r['high_in_top_quartile']:.0%} |" for r in rows]
    flagged = sum(a["no_record"] for a in lookup["areas"].values())
    limited = sum(a["limited_data"] for a in lookup["areas"].values())
    return f"""# EB Model v0 Results

Generated by `uv run python src/models/eb.py` from the police file with reports up to {reports_up_to:%d %b %Y} (thefts counted up to the 14-day cutoff, {cutoff:%d %b %Y}). The baselines and folds are the ones in `docs/backtest-results.md`; compare models on the same file.

## Model

- Gamma-Poisson Empirical Bayes: each area's count is pulled toward its Bezirksregion, and each Bezirksregion toward the city. The prior strengths are estimated from the data (method of moments). An area with few thefts is pulled more strongly.
- Time band, day group and bike value are citywide multipliers (D-18): they scale every area's expected count by the same factor, so they never change an area's tier.
- Tiers are relative percentile bands of areas: Low 60%, Medium 25%, High 15%.

## Targets (G1)

| Fold | Target | Value | Result |
| --- | --- | --- | --- |
{chr(10).join(lines)}

## Per fold

| Fold | EB deviance | Citywide share | Raw area history | Spearman | High in top quartile |
| --- | --- | --- | --- | --- | --- |
{chr(10).join(folds)}

## Generator v0 output

`data/processed/lookup_v0.json`: {len(lookup['areas'])} areas, data window {lookup['metadata']['data_window']}. {flagged} areas have no record at all (`no_record`), {limited} have fewer than {LIMITED_DATA_BELOW} street thefts in the window (`limited_data`).
"""


if __name__ == "__main__":
    raw = check_csv(find_raw_csv())
    cleaned = clean(raw)
    cleaned["LOR"] = cleaned["LOR"].str.zfill(8)
    areas = sorted(polygon_ids())
    reports_up_to = cleaned["ANGELEGT_AM"].max()
    cutoff = reports_up_to - pd.Timedelta(days=config.LAG_CUTOFF_DAYS)
    if pd.Timestamp(FOLDS[-1][1]) > cutoff:
        sys.exit(f"The file is only complete up to {cutoff:%d %b %Y}, before the last fold ends; use a newer file.")
    rows = evaluate(cleaned, areas)
    checks = targets(rows)
    lookup = generate(cleaned, raw, areas, reports_up_to, cutoff)
    LOOKUP.write_text(json.dumps(lookup, ensure_ascii=False, indent=1), encoding="utf-8")
    RESULTS.write_text(markdown(rows, checks, lookup, reports_up_to, cutoff), encoding="utf-8")
    for f, t, v, ok in checks:
        print(f"{'pass' if ok else 'MISS'}  {f}  {t}: {v}")
    print(f"Wrote {LOOKUP} and {RESULTS}")