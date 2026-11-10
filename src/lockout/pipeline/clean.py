"""Clean the police CSV for the model: street thefts only, lag-truncated, time bands allocated."""
import pandas as pd

from lockout import config

BAND_OF_HOUR = {h: band for band, hours in config.DAYPARTS.items() for h in hours}


def street_rows(df):
    cellar = (df["DELIKT"] == "Keller- und Bodeneinbruch") | df["ERFASSUNGSGRUND"].str.contains("Keller", na=False)
    return df[~cellar]


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


def stolen_value(df):
    """SCHADENSHOEHE in euros. A blank, unreadable or 0 value is NaN: it is left out of every median (#57) and counts in
    neither bike value level (#103). A stolen bike worth EUR 0 is not a real value, and we have no field description
    that defines 0, so we treat it as unknown."""
    value = pd.to_numeric(df["SCHADENSHOEHE"], errors="coerce")
    return value.where(value > 0)

