"""Baselines and the two-fold rolling backtest (issue #37, roadmap M3)."""
import numpy as np
import pandas as pd
from scipy.stats import spearmanr
from sklearn.metrics import mean_poisson_deviance

FOLDS = [("2026-04-01", "2026-06-30"), ("2026-07-01", "2026-09-29")]
HISTORY_MONTHS = 12
EMPTY_AREA_COUNT = 0.5  # history count for an area with no thefts; the deviance needs a prediction above 0


def counts(df, areas, start, end):
    """Thefts per area whose window ended between start and end, both days included."""
    in_period = df["TATZEIT_ENDE_DATUM"].between(pd.Timestamp(start), pd.Timestamp(end))
    return df[in_period].groupby("LOR").size().reindex(areas, fill_value=0)


def days(start, end):
    return (pd.Timestamp(end) - pd.Timestamp(start)).days + 1


def baselines(history, history_days, test_days):
    scale = test_days / history_days
    city = pd.Series(history.sum() / len(history) * scale, index=history.index)
    area = history.where(history > 0, EMPTY_AREA_COUNT) * scale
    return {"Citywide share": city, "Raw area history": area}


def score(actual, predicted):
    # Spearman is undefined when either side is the same for every area
    rho = spearmanr(predicted, actual).statistic if predicted.nunique() > 1 and actual.nunique() > 1 else float("nan")
    return mean_poisson_deviance(actual, predicted), rho


def fold_periods():
    """(history start, history end, fold start, fold end) for each fold: the one place every model takes its windows from."""
    periods = []
    for start, end in FOLDS:
        start, end = pd.Timestamp(start), pd.Timestamp(end)
        periods.append((start - pd.DateOffset(months=HISTORY_MONTHS), start - pd.Timedelta(days=1), start, end))
    return periods


def backtest(df, areas):
    rows = []
    for history_start, history_end, start, end in fold_periods():
        history = counts(df, areas, history_start, history_end)
        actual = counts(df, areas, start, end)
        predictions = baselines(history, days(history_start, history_end), days(start, end))
        for name, predicted in predictions.items():
            deviance, rho = score(actual, predicted)
            rows.append({
                "Fold": f"{start:%Y-%m-%d} to {end:%Y-%m-%d}",
                "Baseline": name,
                "Thefts in fold": int(actual.sum()),
                "Mean Poisson deviance": f"{deviance:.3f}",
                "Spearman": "n/a" if np.isnan(rho) else f"{rho:.3f}",
            })
    return pd.DataFrame(rows)
