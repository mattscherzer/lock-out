"""S1 test: do OpenStreetMap counts improve on EB model v0? (issue #61, roadmap WP 2.1, scope S1)

Candidates: a Poisson GLM on OSM counts (sees an area's own history only through the coefficients) and EB pulled toward
the GLM instead of the Bezirksregion. Kept only if deviance drops on both folds and the ranking is as stable as EB v0's.
"""
from collections.abc import Sequence
from typing import TypedDict

import numpy as np
import pandas as pd
import statsmodels.api as sm
from scipy.stats import spearmanr

from lockout.geo.osm_features import KINDS
from lockout.models.backtest import baselines, counts, days, fold_periods, score
from lockout.models.eb import fit, posterior_rate, strength, tiers
from lockout.models.evaluate import share_in_top_quartile

CANDIDATES = ["GLM on OSM counts", "EB toward the GLM"]
STABILITY_TOLERANCE = 0.02  # working rule: a candidate's fold-to-fold rank correlation may be at most this much below EB v0's


class Score(TypedDict):
    deviance: float
    spearman: float
    high_in_top_quartile: float


class FoldResult(TypedDict):
    fold: str
    scores: dict[str, Score]
    coefficients: pd.Series
    rates: dict[str, pd.Series]


class Verdict(TypedDict):
    checks: list[tuple[str, str, bool]]
    keep: bool


def design(features: pd.DataFrame) -> pd.DataFrame:
    """Model inputs per area: log(1 + count) for each OSM kind, log of the area's size, and a constant."""
    x = np.log1p(features[list(KINDS)].astype(float))
    x["log_area_km2"] = np.log(features["area_km2"].astype(float))
    return sm.add_constant(x)


def glm_rate(history: pd.Series, x: pd.DataFrame) -> tuple[pd.Series, pd.Series]:
    """Poisson GLM of the history counts on x -> expected history count per area, and the fitted coefficients."""
    model = sm.GLM(history.to_numpy(dtype=float), x.to_numpy(), family=sm.families.Poisson()).fit()
    return pd.Series(model.predict(x.to_numpy()), index=history.index), pd.Series(model.params, index=x.columns)


def eb_toward(history: pd.Series, prior: pd.Series) -> pd.Series:
    """EB v0's area step with the GLM prediction as the prior mean: thin areas move toward what their OSM counts suggest."""
    a = strength(history.to_numpy(dtype=float), 1, prior.to_numpy())
    return pd.Series(posterior_rate(history.to_numpy(dtype=float), 1, prior.to_numpy(), a), index=history.index)


def compare(df: pd.DataFrame, areas: Sequence[str], features: pd.DataFrame) -> list[FoldResult]:
    """Per fold: every model's expected counts and scores, the GLM coefficients, and each model's rates for the stability check."""
    x = design(features.reindex(areas))
    if not np.isfinite(x.to_numpy()).all():
        raise ValueError("The OSM table has no counts for some planning areas; run `python -m lockout.cli.osm_features` again.")
    folds: list[FoldResult] = []
    for history_start, history_end, start, end in fold_periods():
        history = counts(df, areas, history_start, history_end)
        actual = counts(df, areas, start, end)
        scale = days(start, end) / days(history_start, history_end)
        eb, _ = fit(history)
        glm, coefficients = glm_rate(history, x)
        rates = {"EB v0": eb, "GLM on OSM counts": glm, "EB toward the GLM": eb_toward(history, glm)}
        expected = {**baselines(history, days(history_start, history_end), days(start, end)), **{k: v * scale for k, v in rates.items()}}
        scores: dict[str, Score] = {}
        for name, predicted in expected.items():
            deviance, rho = score(actual, predicted)
            ranked = predicted.nunique() > 1  # the citywide share ranks nothing, so it has no High tier
            scores[name] = {"deviance": deviance, "spearman": rho,
                            "high_in_top_quartile": share_in_top_quartile(actual, tiers(predicted) == "HIGH") if ranked else float("nan")}
        folds.append({"fold": f"{start:%Y-%m-%d} to {end:%Y-%m-%d}", "scores": scores, "coefficients": coefficients, "rates": rates})
    return folds


def stability(folds: Sequence[FoldResult], name: str) -> float:
    """How alike a model ranks the areas in the two folds: Spearman correlation of its rates from fold 1 and fold 2."""
    return float(spearmanr(folds[0]["rates"][name], folds[1]["rates"][name]).statistic)


def verdict(folds: Sequence[FoldResult]) -> dict[str, Verdict]:
    """Per candidate: the S1 checks against EB v0 (deviance lower on each fold, ranking as stable) and keep or cut."""
    result: dict[str, Verdict] = {}
    base = stability(folds, "EB v0")
    for name in CANDIDATES:
        checks = [(f"Deviance below EB v0, {f['fold']}", f"{f['scores'][name]['deviance']:.3f} vs {f['scores']['EB v0']['deviance']:.3f}",
                   f["scores"][name]["deviance"] < f["scores"]["EB v0"]["deviance"]) for f in folds]
        own = stability(folds, name)
        checks.append(("Ranking as stable across folds as EB v0", f"{own:.3f} vs {base:.3f}", own >= base - STABILITY_TOLERANCE))
        result[name] = {"checks": checks, "keep": all(ok for _, _, ok in checks)}
    return result
