"""Baselines and the two-fold rolling backtest (issue #37, roadmap M3)."""

from collections.abc import Iterator, Sequence
from typing import NamedTuple, TypeAlias

import pandas as pd
from scipy.stats import spearmanr
from sklearn.metrics import mean_poisson_deviance

Period: TypeAlias = tuple[pd.Timestamp, pd.Timestamp]

FOLDS = [("2026-04-01", "2026-06-30"), ("2026-07-01", "2026-09-29")]
HISTORY_MONTHS = 12
EMPTY_AREA_COUNT = 0.5  # history count for an area with no thefts; the deviance needs a prediction above 0


def counts(df: pd.DataFrame, areas: Sequence[str], start: pd.Timestamp | str, end: pd.Timestamp | str) -> pd.Series:
    """Thefts per area whose window ended between start and end, both days included."""
    in_period = df["TATZEIT_ENDE_DATUM"].between(pd.Timestamp(start), pd.Timestamp(end))
    return df[in_period].groupby("LOR").size().reindex(areas, fill_value=0)


def days(start: pd.Timestamp | str, end: pd.Timestamp | str) -> int:
    return (pd.Timestamp(end) - pd.Timestamp(start)).days + 1


def baselines(history: pd.Series, scale: float) -> dict[str, pd.Series]:
    """Expected counts per area on a fold, scaled from the history by scale (fold days / history days)."""
    city = pd.Series(history.sum() / len(history) * scale, index=history.index)
    area = history.where(history > 0, EMPTY_AREA_COUNT) * scale
    return {"citywide": city, "raw": area}


def score(actual: pd.Series, predicted: pd.Series) -> tuple[float, float]:
    # Spearman is undefined when either side is the same for every area
    rho = spearmanr(predicted, actual).statistic if predicted.nunique() > 1 and actual.nunique() > 1 else float("nan")
    return mean_poisson_deviance(actual, predicted), rho


def fold_periods() -> list[tuple[pd.Timestamp, pd.Timestamp, pd.Timestamp, pd.Timestamp]]:
    """(history start, history end, fold start, fold end) for each fold: the one place the models take windows from."""
    periods = []
    for start, end in FOLDS:
        start, end = pd.Timestamp(start), pd.Timestamp(end)
        periods.append((start - pd.DateOffset(months=HISTORY_MONTHS), start - pd.Timedelta(days=1), start, end))
    return periods


class FoldData(NamedTuple):
    label: str
    history: pd.Series
    actual: pd.Series
    scale: float  # fold days / history days
    history_period: Period
    period: Period


def fold_data(df: pd.DataFrame, areas: Sequence[str]) -> Iterator[FoldData]:
    """Per fold: its label, the history and actual counts per area, the day scale and both periods."""
    for history_start, history_end, start, end in fold_periods():
        yield FoldData(
            f"{start:%Y-%m-%d} to {end:%Y-%m-%d}",
            counts(df, areas, history_start, history_end),
            counts(df, areas, start, end),
            days(start, end) / days(history_start, history_end),
            (history_start, history_end),
            (start, end),
        )


def backtest(df: pd.DataFrame, areas: Sequence[str]) -> pd.DataFrame:
    """One row per fold and baseline: fold, baseline, thefts, deviance and spearman (NaN if undefined)."""
    rows = []
    for fold in fold_data(df, areas):
        for name, predicted in baselines(fold.history, fold.scale).items():
            deviance, rho = score(fold.actual, predicted)
            rows.append(
                {
                    "fold": fold.label,
                    "baseline": name,
                    "thefts": int(fold.actual.sum()),
                    "deviance": deviance,
                    "spearman": rho,
                }
            )
    return pd.DataFrame(rows)
