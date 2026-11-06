"""Per-area statistics and the confidence label for the area card (issue #57, roadmap WP 2.2, scope S2 and M6).

Run from the repo root: uv run python src/models/area_stats.py [path to the police CSV]
Prints how many areas get their own median stolen value, the citywide facts and the confidence counts.
Everything uses the generator's 12-month window, so the counts match the report count on the card.
"""
import sys
from pathlib import Path

import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import config
from audit_checks import check_csv, polygon_ids
from fetch_police_csv import find_raw_csv
from models.eb import LIMITED_DATA_BELOW, generator_window
from pipeline.clean import clean, stolen_value

OWN_MEDIAN_FROM = 20  # thefts with a usable value in 12 months for an area's own median stolen value (S2, issue #57)
LOCK_DEFEATED = "schwerer"  # ERFASSUNGSGRUND marks a theft where a lock was defeated ("schwerer Diebstahl")


def confidence(n):
    """Confidence from all of an area's street thefts in 12 months. Below 5 is LOW, the same line as "limited data" (M6),
    so a thin or empty area never gets a reassuring label; HIGH from 20 thefts, even if fewer than 20 have a usable value."""
    if n < LIMITED_DATA_BELOW:
        return "LOW"
    return "MEDIUM" if n < OWN_MEDIAN_FROM else "HIGH"


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


if __name__ == "__main__":
    path = Path(sys.argv[1]) if len(sys.argv) > 1 else find_raw_csv()
    cleaned = clean(check_csv(path))
    cleaned["LOR"] = cleaned["LOR"].str.zfill(8)
    cutoff = cleaned["ANGELEGT_AM"].max() - pd.Timedelta(days=config.LAG_CUTOFF_DAYS)
    window, start = generator_window(cleaned, cutoff)
    table = area_stats(window, sorted(polygon_ids()))
    facts = citywide_facts(window)
    print(f"Window: {start:%d %b %Y} to {cutoff:%d %b %Y}, {len(window):,} street thefts, {stolen_value(window).isna().sum():,} without a usable value (blank or 0)")
    print(f"Areas with their own median stolen value: {(table['median_source'] == 'area').sum()} of {len(table)}")
    print(f"Citywide: median stolen value EUR {facts['median_stolen_value_eur']:,}, lock-defeated share {facts['lock_defeated_share']:.0%}")
    print("Confidence:", ", ".join(f"{k} {v}" for k, v in table["confidence"].value_counts().reindex(["LOW", "MEDIUM", "HIGH"], fill_value=0).items()))
