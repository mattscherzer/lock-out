"""Per-area statistics and the confidence label for the area card (issue #57, roadmap WP 2.2, scope S2 and M6).

Everything uses the generator's 12-month window, so the counts match the report count on the card.
"""
from collections.abc import Sequence

import pandas as pd

from lockout.pipeline.clean import stolen_value

LIMITED_DATA_BELOW = 5  # street thefts in the window (M6)
OWN_MEDIAN_FROM = 20  # thefts with a usable value in 12 months for an area's own median stolen value (S2, issue #57)
LOCK_DEFEATED = "schwerer"  # ERFASSUNGSGRUND marks a theft where a lock was defeated ("schwerer Diebstahl")


def confidence(n: int) -> str:
    """LOW below LIMITED_DATA_BELOW (same line as "limited data", M6); HIGH from 20 thefts even if fewer have a usable value."""
    if n < LIMITED_DATA_BELOW:
        return "LOW"
    return "MEDIUM" if n < OWN_MEDIAN_FROM else "HIGH"


def confidence_thresholds() -> dict[str, int]:
    """plenty_from is OWN_MEDIAN_FROM: keep them one number."""
    return {"limited_below": LIMITED_DATA_BELOW, "plenty_from": OWN_MEDIAN_FROM}


def citywide_facts(window: pd.DataFrame) -> dict[str, float]:
    """Citywide lock-defeated share and median stolen value (#57)."""
    defeated = window["ERFASSUNGSGRUND"].str.contains(LOCK_DEFEATED, na=False)
    median = stolen_value(window).median()
    if pd.isna(median):
        raise ValueError("No usable stolen value in the window, so no citywide median")
    return {"lock_defeated_share": round(float(defeated.mean()), 4), "median_stolen_value_eur": round(float(median))}


def area_stats(window: pd.DataFrame, areas: Sequence[str]) -> pd.DataFrame:
    """One row per area: reports_12m, median stolen value, its source and the confidence.
    An area with OWN_MEDIAN_FROM usable values gets its own median ("area"), the rest the citywide one; every theft counts in reports_12m."""
    n = window.groupby("LOR").size().reindex(areas, fill_value=0)
    value = stolen_value(window).groupby(window["LOR"])
    own = value.median().reindex(areas)
    has_own = value.count().reindex(areas, fill_value=0) >= OWN_MEDIAN_FROM
    city = citywide_facts(window)["median_stolen_value_eur"]
    return pd.DataFrame({
        "reports_12m": n,
        "median_stolen_value_eur": own.where(has_own, city).round().astype(int),
        "median_source": has_own.map({True: "area", False: "citywide"}),
        "confidence": n.map(confidence),
    })
