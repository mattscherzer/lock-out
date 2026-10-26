from pathlib import Path

import pandas as pd
import pytest

import config
from pipeline.clean import band_shares, clean, parse_dates, truncate

FIXTURE = Path(__file__).resolve().parent / "fixtures" / "fahrraddiebstahl_sample.csv"
BANDS = list(config.DAYPARTS)


@pytest.fixture
def raw():
    return pd.read_csv(FIXTURE, encoding="iso-8859-1", dtype={"LOR": str})


def test_allocation_conserves_counts(raw):
    cleaned = clean(raw)
    assert cleaned[BANDS].sum().sum() == pytest.approx(len(cleaned))
    assert cleaned[BANDS].sum(axis=1).round(9).eq(1).all()


def test_truncation_removes_exactly_rows_newer_than_cutoff(raw):
    df = parse_dates(raw)
    cutoff = df["ANGELEGT_AM"].max() - pd.Timedelta(days=config.LAG_CUTOFF_DAYS)
    newer = (df["TATZEIT_ENDE_DATUM"] > cutoff).sum()
    kept = truncate(df)
    assert newer > 0
    assert len(df) - len(kept) == newer
    assert (kept["TATZEIT_ENDE_DATUM"] <= cutoff).all()


def test_street_filter_applied(raw):
    assert not clean(raw)["ERFASSUNGSGRUND"].str.contains("Keller").any()


def hours(day, hour):
    return pd.Timestamp(day) + pd.Timedelta(hours=hour)


@pytest.mark.parametrize("start, end, expected", [
    (hours("2026-10-01", 13), hours("2026-10-01", 13), {"Afternoon": 1}),
    (hours("2026-10-01", 21), hours("2026-10-01", 23), {"Evening": 1 / 3, "Night": 2 / 3}),
    (hours("2026-10-01", 22), hours("2026-10-02", 5), {"Night": 1}),
    (pd.NaT, pd.NaT, {"Morning": 5 / 24, "Afternoon": 6 / 24, "Evening": 5 / 24, "Night": 8 / 24}),
])
def test_band_shares(start, end, expected):
    shares = band_shares(start, end)
    assert shares == pytest.approx({band: expected.get(band, 0) for band in BANDS})