"""Calibration and district fairness on the backtest folds (issue #39, roadmap WP 1.4)."""
import numpy as np
import pandas as pd

from lockout.models.eb import TIERS

HIGH_OVER_LOW = 2  # calibration: the High mean must be at least this multiple of the Low mean
FAIRNESS_FACTOR = 2  # a Bezirk is flagged if one share is more than this multiple of the other
SMALL_NUMBERS_BELOW = 3  # a flagged Bezirk with fewer High or top-quartile areas than this gets a small-numbers note


def calibration(actual, tier):
    """Mean actual thefts per area in each tier; passes if the means rise from Low to High and High >= 2x Low."""
    means = actual.groupby(tier).mean().reindex([name for name, _ in TIERS])
    rising = bool(means.notna().all() and (means.diff().dropna() > 0).all())
    return means, rising and bool(means["HIGH"] >= HIGH_OVER_LOW * means["LOW"])


def off(ratio):
    """Flag rule: one share more than FAIRNESS_FACTOR times the other. 0 on one side counts (ratio 0 or inf), 0 on both does not."""
    return bool(ratio > FAIRNESS_FACTOR or ratio < 1 / FAIRNESS_FACTOR)


def fairness(tier, top, bezirk):
    """Per Bezirk: its share of the city's High areas vs its share of the city's top-quartile areas."""
    high = tier == "HIGH"
    t = pd.DataFrame({
        "areas": True, "high": high, "top": top, "high_and_top": high & top,
        "top_medium": top & (tier == "MEDIUM"), "top_low": top & (tier == "LOW"),
    }).astype(int).groupby(bezirk).sum()
    t["share_high"] = t["high"] / t["high"].sum()
    t["share_top"] = t["top"] / t["top"].sum()
    with np.errstate(divide="ignore", invalid="ignore"):
        t["ratio"] = t["share_high"] / t["share_top"]
    t["flagged"] = [off(r) for r in t["ratio"]]
    return t


def explain(b, cut):
    """The numbers behind a flagged Bezirk: which share is larger, and which of its areas make the difference."""
    if b["share_high"] < b["share_top"]:
        text = (f"Holds {b['share_top']:.1%} of the city's top-quartile areas but {b['share_high']:.1%} of its High areas. "
                f"The model ranks {b['top_medium']} of its {b['top']} top-quartile areas Medium and {b['top_low']} Low.")
    else:
        text = (f"Holds {b['share_high']:.1%} of the city's High areas but {b['share_top']:.1%} of its top-quartile areas. "
                f"{b['high'] - b['high_and_top']} of its {b['high']} High areas had fewer thefts in this fold than the top-quartile cut ({cut:g}).")
    if min(b["high"], b["top"]) < SMALL_NUMBERS_BELOW:
        text += " Small numbers: one area more or less changes the ratio a lot."
    return text
