"""Score the EB model on the backtest folds against the targets, with the selector checks behind them (issue #38, #39)."""
from collections.abc import Sequence
from typing import TypedDict

import pandas as pd

from lockout.models.backtest import baselines, counts, days, fold_periods, score
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


def selector_flags(rows: Sequence[FoldRow]) -> dict[str, Flag]:
    """Per selector: "area pattern" or "citywide pattern", with the reason, from the checks on both folds."""
    return {s: flag([r["selectors"][s] for r in rows]) for s in SELECTORS}


def targets(rows: Sequence[FoldRow]) -> list[tuple[str, str, str, bool]]:
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
