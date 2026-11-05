"""S1 test: do OpenStreetMap counts make the model better than EB model v0? (issue #61, roadmap WP 2.1, scope S1)

Run from the repo root after src/models/osm_features.py:
    uv run python src/models/glm.py data/raw/fahrraddiebstahl_2026-10-26.csv
Writes docs/glm-results.md. Both folds, history windows and scores are the backtest's (fold_periods, counts, score).

Two candidates against EB v0:
- GLM on OSM counts: a Poisson GLM of each area's history count on its OpenStreetMap counts and size. It does not see
  the area's own history in its prediction, only through the fitted coefficients.
- EB toward the GLM: EB v0's area step, but each area is pulled toward its GLM prediction instead of its Bezirksregion.
S1 is kept only if a candidate lowers the hold-out deviance on both folds and its ranking is as stable across the
folds as EB v0's (roadmap, S1 row).
"""
import sys
from pathlib import Path

import numpy as np
import pandas as pd
import statsmodels.api as sm
from scipy.stats import spearmanr

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import config
from audit_checks import check_csv, polygon_ids
from fetch_police_csv import find_raw_csv
from models.backtest import FOLDS, baselines, counts, days, fold_periods, score
from models.eb import fit, posterior_rate, share_in_top_quartile, strength, tiers
from models.osm_features import KINDS, OUT as FEATURES
from pipeline.clean import clean

OUT = Path(__file__).resolve().parents[2] / "docs" / "glm-results.md"
CANDIDATES = ["GLM on OSM counts", "EB toward the GLM"]
STABILITY_TOLERANCE = 0.02  # working rule: a candidate's fold-to-fold rank correlation may be at most this much below EB v0's
LABELS = {"bike_parking": "bike parking", "shops": "shops", "food_drink": "food and drink places",
          "transit_stops": "transit stops", "education": "schools, colleges and universities"}


def design(features):
    """Model inputs per area: log(1 + count) for each OSM kind, log of the area's size, and a constant."""
    x = np.log1p(features[list(KINDS)].astype(float))
    x["log_area_km2"] = np.log(features["area_km2"].astype(float))
    return sm.add_constant(x)


def glm_rate(history, x):
    """Poisson GLM of the history counts on x -> expected history count per area, and the fitted coefficients."""
    model = sm.GLM(history.to_numpy(dtype=float), x.to_numpy(), family=sm.families.Poisson()).fit()
    return pd.Series(model.predict(x.to_numpy()), index=history.index), pd.Series(model.params, index=x.columns)


def eb_toward(history, prior):
    """EB v0's area step with the GLM prediction as the prior mean: thin areas move toward what their OSM counts suggest."""
    a = strength(history.to_numpy(dtype=float), 1, prior.to_numpy())
    return pd.Series(posterior_rate(history.to_numpy(dtype=float), 1, prior.to_numpy(), a), index=history.index)


def compare(df, areas, features):
    """Per fold: every model's expected counts and scores, the GLM coefficients, and each model's rates for the stability check."""
    x = design(features.reindex(areas))
    if not np.isfinite(x.to_numpy()).all():
        raise ValueError("The OSM table has no counts for some planning areas; run src/models/osm_features.py again.")
    folds = []
    for history_start, history_end, start, end in fold_periods():
        history = counts(df, areas, history_start, history_end)
        actual = counts(df, areas, start, end)
        scale = days(start, end) / days(history_start, history_end)
        eb, _ = fit(history)
        glm, coefficients = glm_rate(history, x)
        rates = {"EB v0": eb, "GLM on OSM counts": glm, "EB toward the GLM": eb_toward(history, glm)}
        expected = {**baselines(history, days(history_start, history_end), days(start, end)), **{k: v * scale for k, v in rates.items()}}
        scores = {}
        for name, predicted in expected.items():
            deviance, rho = score(actual, predicted)
            ranked = predicted.nunique() > 1  # the citywide share ranks nothing, so it has no High tier
            scores[name] = {"deviance": deviance, "spearman": rho,
                            "high_in_top_quartile": share_in_top_quartile(actual, tiers(predicted) == "HIGH") if ranked else float("nan")}
        folds.append({"fold": f"{start:%Y-%m-%d} to {end:%Y-%m-%d}", "scores": scores, "coefficients": coefficients, "rates": rates})
    return folds


def stability(folds, name):
    """How alike a model ranks the areas in the two folds: Spearman correlation of its rates from fold 1 and fold 2."""
    return float(spearmanr(folds[0]["rates"][name], folds[1]["rates"][name]).statistic)


def verdict(folds):
    """Per candidate: the S1 checks against EB v0 (deviance lower on each fold, ranking as stable) and keep or cut."""
    result = {}
    base = stability(folds, "EB v0")
    for name in CANDIDATES:
        checks = [(f"Deviance below EB v0, {f['fold']}", f"{f['scores'][name]['deviance']:.3f} vs {f['scores']['EB v0']['deviance']:.3f}",
                   f["scores"][name]["deviance"] < f["scores"]["EB v0"]["deviance"]) for f in folds]
        own = stability(folds, name)
        checks.append(("Ranking as stable across folds as EB v0", f"{own:.3f} vs {base:.3f}", own >= base - STABILITY_TOLERANCE))
        result[name] = {"checks": checks, "keep": all(ok for _, _, ok in checks)}
    return result


def table(header, rows):
    lines = ["| " + " | ".join(header) + " |", "| " + " | ".join("---" for _ in header) + " |"]
    return "\n".join(lines + ["| " + " | ".join(str(v) for v in row) + " |" for row in rows])


def fmt(v, pattern):
    return "n/a" if np.isnan(v) else format(v, pattern)


def markdown(folds, result, features, reports_up_to, cutoff, source):
    rows = [[f["fold"], name, fmt(s["deviance"], ".3f"), fmt(s["spearman"], ".3f"), fmt(s["high_in_top_quartile"], ".0%")]
            for f in folds for name, s in f["scores"].items()]
    coef = [[f["fold"], *(f"{f['coefficients'][c]:.3f}" for c in folds[0]["coefficients"].index)] for f in folds]
    checks = [[name, check, value, "pass" if ok else "MISS"] for name, r in result.items() for check, value, ok in r["checks"]]
    keep = [name for name, r in result.items() if r["keep"]]
    totals = "; ".join(f"{LABELS[k]}: {int(features[k].sum()):,}" for k in KINDS)
    passes = "passes" if len(keep) == 1 else "pass"
    decision = f"{' and '.join(keep)} {passes} every check, so S1 may be adopted (roadmap, S1 row); the decision itself is in the roadmap's decision log." if keep else "No candidate passes every check, so S1 is cut (roadmap, S1 row)."
    return f"""# S1 Results: OpenStreetMap Counts in a Poisson GLM

Generated by `uv run python src/models/glm.py data/raw/{source}` from `{source}` (not in Git), with reports up to {reports_up_to:%d %b %Y} and thefts counted up to the 14-day cutoff, {cutoff:%d %b %Y}. The folds, history windows and scores are those of `docs/backtest-results.md`; compare models on the same file.

## Features

OpenStreetMap features inside Berlin, counted per planning area by `src/models/osm_features.py` (one Overpass request per kind, cached): {totals}. Each area also has its size in km2 from the planning-area data. The counts come from the current map and are used for the earlier folds too; a model in use would only have the map of its own time. Only these aggregate counts are used. The per-area table (`data/raw/osm/osm_features.csv`) is not in Git until the ODbL question (risk R4) is answered. Data © OpenStreetMap contributors, ODbL.

## Models

- **EB v0:** the current model (`docs/eb-model-results.md`).
- **GLM on OSM counts:** a Poisson GLM of each area's history count on log(1 + count) per kind and log(size).
- **EB toward the GLM:** EB v0's area step, with each area pulled toward its GLM prediction instead of its Bezirksregion.

## Results

Lower deviance is better; Spearman and the High-tier share in the actual top quartile should be high.

{table(["Fold", "Model", "Mean Poisson deviance", "Spearman", "High in top quartile"], rows)}

### GLM coefficients

On the log scale: a coefficient of 0.5 on a kind means that doubling 1 + its count multiplies the expected thefts by about 2^0.5 = 1.41, with the other inputs fixed. Kinds that rise together, such as shops and food and drink places, share their effect, so read their coefficients together, not one by one.

{table(["Fold", *folds[0]["coefficients"].index], coef)}

## Decision checks

The roadmap keeps S1 only if it improves the hold-out deviance over EB v0 and the rankings are stable across folds. Stable is read here as: the Spearman correlation between a model's rates from the two folds is at most {STABILITY_TOLERANCE} below EB v0's (a working rule, not a roadmap figure).

{table(["Candidate", "Check", "Value", "Result"], checks)}

**{decision}**
"""


if __name__ == "__main__":
    path = Path(sys.argv[1]) if len(sys.argv) > 1 else find_raw_csv()
    if not FEATURES.exists():
        sys.exit(f"{FEATURES} is missing; run src/models/osm_features.py first.")
    features = pd.read_csv(FEATURES, dtype={"plr_id": str}).set_index("plr_id")
    cleaned = clean(check_csv(path))
    cleaned["LOR"] = cleaned["LOR"].str.zfill(8)
    reports_up_to = cleaned["ANGELEGT_AM"].max()
    cutoff = reports_up_to - pd.Timedelta(days=config.LAG_CUTOFF_DAYS)
    if pd.Timestamp(FOLDS[-1][1]) > cutoff:
        sys.exit(f"The file is only complete up to {cutoff:%d %b %Y}, before the last fold ends; use a newer file.")
    folds = compare(cleaned, sorted(polygon_ids()), features)
    result = verdict(folds)
    OUT.write_text(markdown(folds, result, features, reports_up_to, cutoff, path.name), encoding="utf-8")
    for f in folds:
        for name, s in f["scores"].items():
            print(f"{f['fold']}  {name}: deviance {s['deviance']:.3f}, Spearman {fmt(s['spearman'], '.3f')}, High in top quartile {fmt(s['high_in_top_quartile'], '.0%')}")
    for name, r in result.items():
        for check, value, ok in r["checks"]:
            print(f"{'pass' if ok else 'MISS'}  {name}: {check}: {value}")
        print(f"{name}: {'passes every check' if r['keep'] else 'fails a check'}")
    print(f"Wrote {OUT}")
