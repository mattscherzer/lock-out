"""Clean the police CSV for the model: street thefts only, lag-truncated, time bands allocated.

Run from the repo root: uv run python src/pipeline/clean.py
"""
import sys
from pathlib import Path

import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import config
from audit_checks import check_csv, street_rows
from fetch_police_csv import find_raw_csv

OUT = Path(__file__).resolve().parents[2] / "data" / "processed" / "street_thefts_clean.csv"
BAND_OF_HOUR = {h: band for band, hours in config.DAYPARTS.items() for h in hours}


def parse_dates(df):
    df = df.copy()
    for col in ["ANGELEGT_AM", "TATZEIT_ANFANG_DATUM", "TATZEIT_ENDE_DATUM"]:
        df[col] = pd.to_datetime(df[col], format="%d.%m.%Y")
    return df


def truncate(df, lag_days=config.LAG_CUTOFF_DAYS):
    # Drop thefts whose window ended within the last N days before the latest report: most are not reported yet.
    cutoff = df["ANGELEGT_AM"].max() - pd.Timedelta(days=lag_days)
    return df[df["TATZEIT_ENDE_DATUM"] <= cutoff]


def band_shares(start, end):
    # Share of the offence window in each time band, counted by the hours it covers.
    if pd.isna(start) or pd.isna(end):
        hours = list(range(24))  # no hours recorded: spread evenly over the day
    elif end < start:
        hours = [start.hour]
    else:
        n = int((end - start) / pd.Timedelta(hours=1)) + 1
        hours = [(start.hour + i) % 24 for i in range(n)]
    return {band: sum(BAND_OF_HOUR[h] == band for h in hours) / len(hours) for band in config.DAYPARTS}


def allocate(df):
    start = df["TATZEIT_ANFANG_DATUM"] + pd.to_timedelta(pd.to_numeric(df["TATZEIT_ANFANG_STUNDE"], errors="coerce"), unit="h")
    end = df["TATZEIT_ENDE_DATUM"] + pd.to_timedelta(pd.to_numeric(df["TATZEIT_ENDE_STUNDE"], errors="coerce"), unit="h")
    shares = pd.DataFrame([band_shares(s, e) for s, e in zip(start, end)], index=df.index)
    return df.join(shares)


def clean(df):
    street = parse_dates(street_rows(df))
    return allocate(truncate(street))


if __name__ == "__main__":
    raw = check_csv(Path(sys.argv[1]) if len(sys.argv) > 1 else find_raw_csv())
    street = street_rows(raw)
    cleaned = clean(raw)
    print(f"Street rows before truncation: {len(street):,}")
    print(f"Dropped by the {config.LAG_CUTOFF_DAYS}-day lag cutoff: {len(street) - len(cleaned):,}")
    print(f"Rows kept: {len(cleaned):,} | allocated total: {cleaned[list(config.DAYPARTS)].sum().sum():,.1f}")
    cleaned.to_csv(OUT, index=False)
    print(f"Wrote {OUT}")