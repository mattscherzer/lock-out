"""Empirical Bayes model v0: Gamma-Poisson shrinkage from area to Bezirksregion to city (issue #38, roadmap M4)."""

from typing import TypeAlias

import numpy as np
import pandas as pd

Values: TypeAlias = pd.Series | np.ndarray

TIERS = [("LOW", 0.60), ("MEDIUM", 0.85), ("HIGH", 1.00)]  # upper percentile of each tier: 60 / 25 / 15 of areas
TIER_SHARE_TOLERANCE = 0.05  # ties can move a tier's share a little; a bigger gap means the rates are degenerate


def strength(y: Values, exposure: Values | float, prior_mean: Values | float) -> float:
    """Method-of-moments shape of the Gamma prior. Large means the units barely differ, so shrink hard."""
    expected = exposure * prior_mean
    excess = ((y - expected) ** 2 - expected).sum()
    return float((expected**2).sum() / excess) if excess > 0 else float("inf")


def posterior_rate(y: Values, exposure: Values | float, prior_mean: Values | float, a: float) -> np.ndarray:
    """Posterior mean rate per unit of exposure; with a = inf it is the prior mean, and a prior mean of 0 stays 0."""
    prior_mean = np.broadcast_to(np.asarray(prior_mean, dtype=float), np.shape(y))
    if np.isinf(a):
        return prior_mean.copy()
    with np.errstate(divide="ignore", invalid="ignore"):
        rate = (a + np.asarray(y, dtype=float)) / (a / prior_mean + exposure)
    return np.where(prior_mean > 0, rate, 0.0)


def fit(area_counts: pd.Series) -> tuple[pd.Series, dict[str, float]]:
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


def tiers(rate: pd.Series) -> pd.Series:
    """Relative percentile bands, cut at 60% and 85%. Areas with the same rate get the same, higher tier."""
    pct = rate.rank(method="max") / len(rate)
    return pd.cut(pct, [0.0, *(top for _, top in TIERS)], labels=[name for name, _ in TIERS]).astype(object)


def check_tier_shares(tier: pd.Series) -> None:
    shares = tier.value_counts(normalize=True)
    lower = 0.0
    for name, top in TIERS:
        target, share = top - lower, float(shares.get(name, 0.0))
        if abs(share - target) > TIER_SHARE_TOLERANCE:
            raise ValueError(f"{name} holds {share:.1%} of areas, target {target:.0%}")
        lower = top
