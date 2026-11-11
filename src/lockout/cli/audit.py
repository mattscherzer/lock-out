"""Audit the police CSV: overview, street filter, LOR hierarchy, reporting lag, offence windows and cell sparsity.

Run from the repo root: uv run python -m lockout.cli.audit
"""

import sys

import numpy as np
import pandas as pd

from lockout.cli.common import load_raw
from lockout.geo.lor import polygon_ids
from lockout.pipeline.clean import street_rows


def overview(df: pd.DataFrame) -> None:
    print("=== 1. RAW DATASET OVERVIEW ===")
    print(f"Total Rows: {len(df):,}")
    print(f"Columns: {list(df.columns)}\n")


def indoor_outdoor(df: pd.DataFrame) -> pd.DataFrame:
    print("=== 2. INDOOR VS. OUTDOOR FILTERING (DELIKT & ERFASSUNGSGRUND) ===")
    print("DELIKT breakdown:")
    print(df["DELIKT"].value_counts(dropna=False), "\n")
    print("ERFASSUNGSGRUND breakdown:")
    print(df["ERFASSUNGSGRUND"].value_counts(dropna=False), "\n")

    street = street_rows(df)
    print(f"Outdoor rows retained: {len(street):,} ({len(street) / len(df):.1%} of total)\n")
    return street


def lor_hierarchy(df: pd.DataFrame, street: pd.DataFrame) -> None:
    print("=== 3. LOR HIERARCHY & GEOJSON ALIGNMENT ===")
    lor = street["LOR"].str.zfill(8)
    polygons = polygon_ids()

    print(f"Unique Bezirke (digits 1-2):        {lor.str[:2].nunique()} (Expected: 12)")
    print(f"Unique Prognoseräume (digits 1-4):  {lor.str[:4].nunique()} (Expected: 58)")
    print(f"Unique Bezirksregionen (digits 1-6):{lor.str[:6].nunique()} (Expected: 143)")
    print(f"Unique Planungsräume (digits 1-8):  {lor.nunique()} (Expected: {len(polygons)})")

    zero_areas = sorted(polygons - set(df["LOR"].str.zfill(8)))
    print(f"Street rows: {len(street):,}")
    print(f"Areas with no record ({len(zero_areas)}): {zero_areas}\n")


def reporting_lag(street: pd.DataFrame) -> None:
    print("=== 4. REPORTING LAG DISTRIBUTION (HOLDOUT TRUNCATION CUTOFF) ===")
    angelegt = pd.to_datetime(street["ANGELEGT_AM"], dayfirst=True, errors="coerce")
    ende_datum = pd.to_datetime(street["TATZEIT_ENDE_DATUM"], dayfirst=True, errors="coerce")
    lag_days = (angelegt - ende_datum).dt.days.dropna()
    lag_days = lag_days[lag_days >= 0]

    print(f"50th percentile (Median) lag: {np.percentile(lag_days, 50):.0f} days")
    print(f"90th percentile lag:          {np.percentile(lag_days, 90):.0f} days")
    print(f"95th percentile lag (Cutoff): {np.percentile(lag_days, 95):.0f} days\n")


def offence_windows(street: pd.DataFrame) -> None:
    print("=== 5. OFFENSE WINDOW DURATION ===")
    time_start = pd.to_datetime(
        street["TATZEIT_ANFANG_DATUM"].astype(str) + " " + street["TATZEIT_ANFANG_STUNDE"].astype(str) + ":00",
        dayfirst=True,
        errors="coerce",
    )
    time_end = pd.to_datetime(
        street["TATZEIT_ENDE_DATUM"].astype(str) + " " + street["TATZEIT_ENDE_STUNDE"].astype(str) + ":00",
        dayfirst=True,
        errors="coerce",
    )
    duration_hours = (time_end - time_start).dt.total_seconds() / 3600.0
    valid_dur = duration_hours[(duration_hours >= 0) & (duration_hours <= 72)]

    print(f"Windows <= 1h:  {(valid_dur <= 1).mean():.1%}")
    print(f"Windows <= 4h:  {(valid_dur <= 4).mean():.1%}")
    print(f"Windows <= 6h:  {(valid_dur <= 6).mean():.1%}")
    print(f"Windows <= 24h: {(valid_dur <= 24).mean():.1%}\n")


def sparsity(street: pd.DataFrame) -> None:
    print("=== 6. SPARSITY CHECK: 28 CELLS VS. 12 CELLS PER AREA ===")
    n_lors = len(polygon_ids())
    total_outdoor = len(street)
    print(
        f"28-Cell Grid ({n_lors} x 7 x 4 = {n_lors * 28:,} cells) -> Mean total thefts/cell: {total_outdoor / (n_lors * 28):.2f}"
    )
    print(
        f"12-Cell Grid ({n_lors} x 3 x 4 = {n_lors * 12:,} cells)  -> Mean total thefts/cell: {total_outdoor / (n_lors * 12):.2f}"
    )


def main() -> None:
    _, df = load_raw(sys.argv)
    overview(df)
    street = indoor_outdoor(df)
    lor_hierarchy(df, street)
    reporting_lag(street)
    offence_windows(street)
    sparsity(street)


if __name__ == "__main__":
    main()
