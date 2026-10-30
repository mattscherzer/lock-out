"""Hold-out validation of the selectors the card shows: time band, day group and bike value (issue #39).

A selector gets an area pattern only if it is not too sparse and area-specific shares predict both
backtest folds better than the citywide shares. Otherwise it is flagged "citywide pattern".
"""
import numpy as np
import pandas as pd
from sklearn.metrics import mean_poisson_deviance

import config

SELECTORS = ("time_band", "day_group", "bike_value")
BIKE_VALUE_SPLIT_EUR = 1000  # bike value band (D-07); "bike class" in issue #39
MIN_MEDIAN_PER_LEVEL = 5  # working rule from the EDA: a lower median count per area and level is too sparse


def levels(df, selector):
    """Per theft, its weight in each level of the selector; a row sums to 1, or to 0 if the level is unknown."""
    if selector == "time_band":
        return df[list(config.DAYPARTS)].astype(float)  # the cleaning already spreads each theft over the bands
    if selector == "day_group":
        group = df["TATZEIT_ANFANG_DATUM"].dt.weekday.apply(config.daytype_of)
        return pd.DataFrame({g: (group == g).astype(float) for g in config.DAYTYPES})
    if selector == "bike_value":
        value = pd.to_numeric(df["SCHADENSHOEHE"], errors="coerce")  # blank or unreadable: in neither level
        return pd.DataFrame({
            f"under_eur_{BIKE_VALUE_SPLIT_EUR}": (value < BIKE_VALUE_SPLIT_EUR).astype(float),
            f"eur_{BIKE_VALUE_SPLIT_EUR}_or_more": (value >= BIKE_VALUE_SPLIT_EUR).astype(float),
        })
    raise ValueError(f"unknown selector: {selector}")


def level_counts(df, areas, selector, start, end):
    """Thefts per area (rows) and level (columns) whose window ended between start and end, both days included."""
    in_period = df[df["TATZEIT_ENDE_DATUM"].between(pd.Timestamp(start), pd.Timestamp(end))]
    return levels(in_period, selector).groupby(in_period["LOR"]).sum().reindex(areas, fill_value=0.0)


def share_strength(n, city):
    """Method-of-moments prior strength of area shares around the citywide shares; inf means no extra variation."""
    total = n.sum(axis=1)
    used = city[(city > 0) & (city < 1)].index
    n, total = n.loc[total >= 2, used], total[total >= 2]
    expected = np.outer(total, city[used])
    excess = (((n.to_numpy() - expected) ** 2) / (expected * (1 - city[used].to_numpy())) - 1).sum()
    rho = excess / ((total.to_numpy() - 1).sum() * len(used)) if len(used) and len(total) else 0.0
    return max(1 / rho - 1, 0.0) if rho > 0 else float("inf")


def area_shares(n, city, strength):
    """Each area's shares pulled toward the citywide shares; an area without thefts gets the citywide shares."""
    total = n.sum(axis=1).to_numpy()[:, None]
    city = np.broadcast_to(city.to_numpy(), n.shape)
    if np.isinf(strength):
        return city.copy()
    with np.errstate(divide="ignore", invalid="ignore"):
        shares = (n.to_numpy() + strength * city) / (total + strength)
    return np.where(total > 0, shares, city)


def deviance(actual, predicted):
    """Mean Poisson deviance over all cells; a prediction of 0 anywhere cannot be scored, so it counts as infinitely bad."""
    actual, predicted = np.ravel(actual), np.ravel(predicted)
    return float("inf") if (predicted <= 0).any() else float(mean_poisson_deviance(actual, predicted))


def holdout(df, areas, expected, history, fold, selector):
    """Score citywide vs area-specific shares on one fold. Both use the same expected count per area,
    so the test measures only whether area-specific shares help. history and fold are (start, end)."""
    n = level_counts(df, areas, selector, *history)
    actual = level_counts(df, areas, selector, *fold)
    city = n.sum() / n.to_numpy().sum() if n.to_numpy().sum() > 0 else n.sum()
    strength = share_strength(n, city)
    base = np.asarray(expected, dtype=float)[:, None]
    return {
        "median": float(np.median(n.to_numpy())),
        "citywide": deviance(actual, base * city.to_numpy()),
        "area": deviance(actual, base * area_shares(n, city, strength)),
    }


def flag(results):
    """results: the holdout() result of each fold. Area pattern only if never sparse and area-specific wins every fold."""
    median = min(r["median"] for r in results)
    if median < MIN_MEDIAN_PER_LEVEL:
        pattern, reason = "citywide pattern", f"too sparse: median {median:.1f} thefts per area and level, working rule at least {MIN_MEDIAN_PER_LEVEL}"
    elif not all(r["area"] < r["citywide"] for r in results):
        pattern, reason = "citywide pattern", "area-specific shares do not predict both folds better than the citywide shares"
    else:
        pattern, reason = "area pattern", "area-specific shares predict both folds better than the citywide shares"
    return {"pattern": pattern, "reason": reason}