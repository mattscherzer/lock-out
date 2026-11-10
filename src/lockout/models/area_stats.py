"""Per-area statistics and the confidence label for the area card (issue #57, roadmap WP 2.2, scope S2 and M6).

Everything uses the generator's 12-month window, so the counts match the report count on the card.
"""
import pandas as pd

from lockout.pipeline.clean import stolen_value

LIMITED_DATA_BELOW = 5  # street thefts in the window (M6)
OWN_MEDIAN_FROM = 20  # thefts with a usable value in 12 months for an area's own median stolen value (S2, issue #57)
LOCK_DEFEATED = "schwerer"  # ERFASSUNGSGRUND marks a theft where a lock was defeated ("schwerer Diebstahl")


def confidence(n):
    """Confidence from all of an area's street thefts in 12 months. Below 5 is LOW, the same line as "limited data" (M6),
    so a thin or empty area never gets a reassuring label; HIGH from 20 thefts, even if fewer than 20 have a usable value."""
    if n < LIMITED_DATA_BELOW:
        return "LOW"
    return "MEDIUM" if n < OWN_MEDIAN_FROM else "HIGH"


def confidence_thresholds():
    """plenty_from is OWN_MEDIAN_FROM: keep them one number."""
    return {"limited_below": LIMITED_DATA_BELOW, "plenty_from": OWN_MEDIAN_FROM}


def citywide_facts(window):
    """Facts for the whole city, not per area (issue #57): the lock-defeated share and the median stolen value."""
    defeated = window["ERFASSUNGSGRUND"].str.contains(LOCK_DEFEATED, na=False)
    median = stolen_value(window).median()
    if pd.isna(median):
        raise ValueError("No usable stolen value in the window, so no citywide median")
    return {"lock_defeated_share": round(float(defeated.mean()), 4), "median_stolen_value_eur": round(float(median))}


def area_stats(window, areas):
    """One row per area: street thefts in the window, the median stolen value, where that median comes from, the confidence.
    An area with at least OWN_MEDIAN_FROM thefts that have a usable value gets its own median ("area"), so the median always
    rests on at least that many values; every other area gets the citywide one ("citywide"). Every theft counts in reports_12m."""
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
