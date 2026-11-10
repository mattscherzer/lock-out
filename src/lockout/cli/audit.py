"""Audit the police CSV: overview, street filter, LOR hierarchy, reporting lag, offence windows and cell sparsity.

Run from the repo root: uv run python -m lockout.cli.audit
"""
import sys

import numpy as np
import pandas as pd

from lockout.config import daytype_of
from lockout.geo.lor import polygon_ids
from lockout.ingest.fetch import find_raw_csv
from lockout.ingest.police_csv import AuditError, check_csv
from lockout.paths import RAW_DIR
from lockout.pipeline.clean import BAND_OF_HOUR, street_rows


def load():
    # handles daten.berlin.de delimiter and encoding quirks
    csv_path = find_raw_csv()
    if csv_path is None:
        sys.exit(f"No police CSV found in {RAW_DIR}; run `python -m lockout.cli.fetch` first.")
    try:
        return check_csv(csv_path)
    except AuditError as e:
        sys.exit(f"AUDIT FAILED: {e}")


def overview(df):
    print("=== 1. RAW DATASET OVERVIEW ===")
    print(f"Total Rows: {len(df):,}")
    print(f"Columns: {list(df.columns)}\n")


def indoor_outdoor(df):
    print("=== 2. INDOOR VS. OUTDOOR FILTERING (DELIKT & ERFASSUNGSGRUND) ===")
    if "DELIKT" in df.columns:
        print("DELIKT breakdown:")
        print(df["DELIKT"].value_counts(dropna=False), "\n")
    if "ERFASSUNGSGRUND" in df.columns:
        print("ERFASSUNGSGRUND breakdown:")
        print(df["ERFASSUNGSGRUND"].value_counts(dropna=False), "\n")

    df_outdoor = street_rows(df).copy()
    print(f"Outdoor rows retained: {len(df_outdoor):,} ({len(df_outdoor)/len(df):.1%} of total)\n")
    return df_outdoor


def lor_hierarchy(df, df_outdoor):
    print("=== 3. LOR HIERARCHY & GEOJSON ALIGNMENT ===")
    lor_col = [c for c in df_outdoor.columns if "lor" in c.lower() or "plr" in c.lower()][0]
    df_outdoor[lor_col] = df_outdoor[lor_col].astype(str).str.zfill(8)

    print(f"Unique Bezirke (digits 1-2):        {df_outdoor[lor_col].str[:2].nunique()} (Expected: 12)")
    print(f"Unique Prognoseräume (digits 1-4):  {df_outdoor[lor_col].str[:4].nunique()} (Expected: 58)")
    print(f"Unique Bezirksregionen (digits 1-6):{df_outdoor[lor_col].str[:6].nunique()} (Expected: 143)")
    print(f"Unique Planungsräume (digits 1-8):  {df_outdoor[lor_col].nunique()} (Expected: 542)")

    zero_areas = sorted(polygon_ids() - set(df[lor_col].str.zfill(8)))
    print(f"Street rows: {len(df_outdoor):,}")
    print(f"Areas with no record ({len(zero_areas)}): {zero_areas}\n")


def reporting_lag(df_outdoor):
    print("=== 4. REPORTING LAG DISTRIBUTION (HOLDOUT TRUNCATION CUTOFF) ===")
    angelegt = pd.to_datetime(df_outdoor["ANGELEGT_AM"], dayfirst=True, errors="coerce")
    ende_datum = pd.to_datetime(df_outdoor["TATZEIT_ENDE_DATUM"], dayfirst=True, errors="coerce")
    lag_days = (angelegt - ende_datum).dt.days.dropna()
    lag_days = lag_days[lag_days >= 0]

    print(f"50th percentile (Median) lag: {np.percentile(lag_days, 50):.0f} days")
    print(f"90th percentile lag:          {np.percentile(lag_days, 90):.0f} days")
    print(f"95th percentile lag (Cutoff): {np.percentile(lag_days, 95):.0f} days\n")


def offence_windows(df_outdoor):
    print("=== 5. OFFENSE WINDOW DURATION ===")
    time_start = pd.to_datetime(
        df_outdoor["TATZEIT_ANFANG_DATUM"].astype(str) + " " + df_outdoor["TATZEIT_ANFANG_STUNDE"].astype(str) + ":00",
        dayfirst=True, errors="coerce"
    )
    time_end = pd.to_datetime(
        df_outdoor["TATZEIT_ENDE_DATUM"].astype(str) + " " + df_outdoor["TATZEIT_ENDE_STUNDE"].astype(str) + ":00",
        dayfirst=True, errors="coerce"
    )
    duration_hours = (time_end - time_start).dt.total_seconds() / 3600.0
    valid_dur = duration_hours[(duration_hours >= 0) & (duration_hours <= 72)]

    print(f"Windows <= 1h:  {(valid_dur <= 1).mean():.1%}")
    print(f"Windows <= 4h:  {(valid_dur <= 4).mean():.1%}")
    print(f"Windows <= 6h:  {(valid_dur <= 6).mean():.1%}")
    print(f"Windows <= 24h: {(valid_dur <= 24).mean():.1%}\n")
    return time_start


def sparsity(df_outdoor, time_start):
    print("=== 6. SPARSITY CHECK: 28 CELLS VS. 12 CELLS PER AREA ===")
    # an hour outside every band (NaN) stays "Night", as the audit always had it
    df_outdoor["daypart"] = df_outdoor["TATZEIT_ANFANG_STUNDE"].apply(lambda h: BAND_OF_HOUR.get(h, "Night"))
    df_outdoor["weekday"] = time_start.dt.day_name()
    df_outdoor["daytype"] = time_start.dt.weekday.apply(daytype_of)

    n_lors = 542
    total_outdoor = len(df_outdoor)
    print(f"28-Cell Grid (542 x 7 x 4 = 15,176 cells) -> Mean total thefts/cell: {total_outdoor / (n_lors * 28):.2f}")
    print(f"12-Cell Grid (542 x 3 x 4 = 6,504 cells)  -> Mean total thefts/cell: {total_outdoor / (n_lors * 12):.2f}")


def main():
    df = load()
    overview(df)
    df_outdoor = indoor_outdoor(df)
    lor_hierarchy(df, df_outdoor)
    reporting_lag(df_outdoor)
    time_start = offence_windows(df_outdoor)
    sparsity(df_outdoor, time_start)


if __name__ == "__main__":
    main()
