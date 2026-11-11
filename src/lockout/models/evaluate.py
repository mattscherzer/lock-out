"""Score the EB model on the backtest folds against the targets, with the selector checks (issue #38, #39)."""

from collections.abc import Sequence
from typing import TypedDict

import pandas as pd

from lockout.models.backtest import baselines, fold_data, score
from lockout.models.eb import fit, tiers
from lockout.models.selectors import SELECTORS, Flag, HoldoutResult, flag, holdout

TOP_QUARTILE = 0.75
TARGET_HIGH_IN_TOP_QUARTILE = 0.70
TARGET_SPEARMAN = 0.6  # checked on the last fold only, as the issue states
TARGET_WITHIN_RAW = 1.01  # deviance within 1% of the raw area history


class FoldRow(TypedDict):
    fold: str
    deviance: float
    citywide: float
    raw: float
    spearman: float
    high_in_top_quartile: float
    raw_high_in_top_quartile: float
    tier: pd.Series
    actual: pd.Series
    selectors: dict[str, HoldoutResult]


def top_quartile(actual: pd.Series) -> pd.Series:
    """Areas whose actual count is in the top quartile; a count of 0 never counts as top."""
    return (actual >= actual.quantile(TOP_QUARTILE)) & (actual > 0)


def share_in_top_quartile(actual: pd.Series, high: pd.Series) -> float:
    return float(top_quartile(actual)[high].mean())


def evaluate(df: pd.DataFrame, areas: Sequence[str]) -> list[FoldRow]:
    """Per fold: the scores against the targets, plus the tiers, actual counts and selector checks behind them."""
    rows: list[FoldRow] = []
    for f in fold_data(df, areas):
        base = baselines(f.history, f.scale)
        rate, _ = fit(f.history)
        expected = rate * f.scale
        tier = tiers(rate)
        dev, rho = score(f.actual, expected)
        dev_city, _ = score(f.actual, base["citywide"])
        dev_raw, _ = score(f.actual, base["raw"])
        rows.append(
            {
                "fold": f.label,
                "deviance": dev,
                "citywide": dev_city,
                "raw": dev_raw,
                "spearman": rho,
                "high_in_top_quartile": share_in_top_quartile(f.actual, tier == "HIGH"),
                "raw_high_in_top_quartile": share_in_top_quartile(f.actual, tiers(base["raw"]) == "HIGH"),
                "tier": tier,
                "actual": f.actual,
                "selectors": {s: holdout(df, areas, expected, f.history_period, f.period, s) for s in SELECTORS},
            }
        )
    return rows


def selector_flags(rows: Sequence[FoldRow]) -> dict[str, Flag]:
    """Per selector: "area pattern" or "citywide pattern", with the reason, from the checks on both folds."""
    return {s: flag([r["selectors"][s] for r in rows]) for s in SELECTORS}


def targets(rows: Sequence[FoldRow]) -> list[tuple[str, str, tuple[float, ...], bool]]:
    """(fold, check key, the numbers compared, passed): "citywide" and "raw" hold (deviance, baseline deviance)."""
    checks = []
    for r in rows:
        checks += [
            (r["fold"], "citywide", (r["deviance"], r["citywide"]), r["deviance"] < r["citywide"]),
            (r["fold"], "raw", (r["deviance"], r["raw"]), r["deviance"] <= TARGET_WITHIN_RAW * r["raw"]),
            (r["fold"], "high", (r["high_in_top_quartile"],), r["high_in_top_quartile"] >= TARGET_HIGH_IN_TOP_QUARTILE),
        ]
    last = rows[-1]
    checks.append((last["fold"], "spearman", (last["spearman"],), last["spearman"] >= TARGET_SPEARMAN))
    return checks
