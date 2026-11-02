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
from pipeline.clean import clean

OWN_MEDIAN_FROM = 20  # street thefts in 12 months for an area's own median stolen value (S2, issue #57)
LOCK_DEFEATED = "schwerer"  # ERFASSUNGSGRUND marks a theft where a lock was defeated ("schwerer Diebstahl")


def confidence(n):
    """Confidence from an area's street thefts in 12 months. Below 5 is LOW, the same line as "limited data" (M6),
    so a thin or empty area never gets a reassuring label; HIGH starts where the area gets its own median."""
    if n < LIMITED_DATA_BELOW:
        return "LOW"
    return "MEDIUM" if n < OWN_MEDIAN_FROM else "HIGH"


def stolen_value(df):
    """SCHADENSHOEHE in euros; a blank or unreadable value is NaN and left out of every median."""
    return pd.to_numeric(df["SCHADENSHOEHE"], errors="coerce")


def citywide_facts(window):
    """Facts for the whole city, not per area (issue #57): the lock-defeated share and the median stolen value."""
    defeated = window["ERFASSUNGSGRUND"].str.contains(LOCK_DEFEATED, na=False)
    return {"lock_defeated_share": round(float(defeated.mean()), 4), "median_stolen_value_eur": round(float(stolen_value(window).median()))}


def area_stats(window, areas):
    """One row per area: street thefts in the window, the median stolen value, where that median comes from, the confidence.
    An area with at least OWN_MEDIAN_FROM thefts gets its own median ("area"); every other area gets the citywide one ("citywide").
    A theft with a blank value still counts toward the threshold, as in the EDA."""
    n = window.groupby("LOR").size().reindex(areas, fill_value=0)
    own = stolen_value(window).groupby(window["LOR"]).median().reindex(areas)
    has_own = (n >= OWN_MEDIAN_FROM) & own.notna()
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
    print(f"Window: {start:%d %b %Y} to {cutoff:%d %b %Y}, {len(window):,} street thefts")
    print(f"Areas with their own median stolen value: {(table['median_source'] == 'area').sum()} of {len(table)}")
    print(f"Citywide: median stolen value EUR {facts['median_stolen_value_eur']:,}, lock-defeated share {facts['lock_defeated_share']:.0%}")
    print("Confidence:", ", ".join(f"{k} {v}" for k, v in table["confidence"].value_counts().reindex(["LOW", "MEDIUM", "HIGH"], fill_value=0).items()))