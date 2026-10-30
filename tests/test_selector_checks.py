import math
from pathlib import Path

import numpy as np
import pandas as pd
import pytest

from audit_checks import polygon_ids
from models.eb import evaluate, selector_flags
from models.selector_checks import MIN_MEDIAN_PER_LEVEL, area_shares, flag, holdout, level_counts, share_strength
from pipeline.clean import clean

FIXTURE = Path(__file__).resolve().parent / "fixtures" / "fahrraddiebstahl_sample.csv"


def thefts(rows):
    """rows: (area, end date, start date, bike value, morning share) -> a cleaned-style frame.
    Each theft is 0.1 afternoon and 0.1 evening; the rest of its time-band weight is night."""
    df = pd.DataFrame(rows, columns=["LOR", "TATZEIT_ENDE_DATUM", "TATZEIT_ANFANG_DATUM", "SCHADENSHOEHE", "Morning"])
    for col in ["TATZEIT_ENDE_DATUM", "TATZEIT_ANFANG_DATUM"]:
        df[col] = pd.to_datetime(df[col])
    return df.assign(Afternoon=0.1, Evening=0.1, Night=0.8 - df["Morning"])


def test_level_counts_per_selector():
    # 2026-06-01 is a Monday, 06-05 a Friday, 06-06 a Saturday; the July row is outside the period.
    df = thefts([
        ("A", "2026-06-01", "2026-06-01", "500", 0.5),
        ("A", "2026-06-05", "2026-06-05", "1000", 0.8),
        ("B", "2026-06-06", "2026-06-06", None, 0.0),
        ("B", "2026-07-01", "2026-07-01", "2000", 0.8),
    ])
    count = lambda s: level_counts(df, ["A", "B", "C"], s, "2026-06-01", "2026-06-30")
    assert count("time_band").loc["A"].tolist() == pytest.approx([1.3, 0.2, 0.2, 0.3])
    assert count("day_group").to_dict("index")["A"] == {"Mon_Thu": 1, "Friday": 1, "Weekend": 0}
    assert count("day_group").loc["B", "Weekend"] == 1
    assert count("bike_value").loc["A"].tolist() == [1, 1]  # under EUR 1000, EUR 1000 or more
    assert count("bike_value").loc["B"].tolist() == [0, 0]  # an unknown value counts in neither level
    assert count("time_band").loc["C"].sum() == 0  # an area without thefts is kept with zeros


def test_no_extra_variation_means_citywide_shares():
    n = pd.DataFrame([[2, 8], [4, 16], [1, 4]], columns=["x", "y"])
    city = n.sum() / n.to_numpy().sum()
    assert math.isinf(share_strength(n, city))
    assert np.allclose(area_shares(n, city, float("inf")), [[0.2, 0.8]] * 3)


def test_areas_that_differ_keep_part_of_their_own_shares():
    n = pd.DataFrame([[20, 0], [0, 20], [10, 10]], columns=["x", "y"])
    city = n.sum() / n.to_numpy().sum()
    k = share_strength(n, city)
    shares = area_shares(n, city, k)
    assert np.isfinite(k)
    assert 0.5 < shares[0, 0] < 1 and 0 < shares[1, 0] < 0.5  # pulled toward 0.5, not all the way


def test_area_without_thefts_gets_the_citywide_shares():
    n = pd.DataFrame([[20, 0], [0, 20], [0, 0]], columns=["x", "y"])
    city = n.sum() / n.to_numpy().sum()
    assert area_shares(n, city, share_strength(n, city))[2].tolist() == [0.5, 0.5]


def test_a_sparse_selector_is_a_citywide_pattern_even_if_area_shares_win():
    sparse = {"median": MIN_MEDIAN_PER_LEVEL - 0.5, "citywide": 0.9, "area": 0.5}
    result = flag([sparse, sparse])
    assert result["pattern"] == "citywide pattern"
    assert result["reason"].startswith("too sparse")


def test_an_area_pattern_needs_a_win_in_every_fold():
    win = {"median": 9, "citywide": 0.9, "area": 0.5}
    loss = {"median": 9, "citywide": 0.5, "area": 0.9}
    assert flag([win, loss])["pattern"] == "citywide pattern"
    assert flag([win, win])["pattern"] == "area pattern"


def test_holdout_finds_area_patterns_when_areas_really_differ():
    # Area A is stolen from mostly in the morning, B mostly at night, in the history and the fold alike.
    rows = []
    for day in ["2026-01-05", "2026-04-06"]:
        rows += [("A", day, day, "500", 0.8)] * 30 + [("B", day, day, "500", 0.0)] * 30
    df = thefts(rows)
    result = holdout(df, ["A", "B"], [30, 30], ("2026-01-01", "2026-03-31"), ("2026-04-01", "2026-06-30"), "time_band")
    assert result["median"] == 3  # per area: 24 or 0 morning, 3 afternoon, 3 evening, 0 or 24 night
    assert result["area"] < result["citywide"]

def test_flag_through_holdout_at_low_and_ten_times_the_counts():
    # Area A loses mostly bikes worth EUR 1000 or more, B mostly cheaper ones, in the history and both folds alike.
    def flagged(n):
        rows = []
        for day in ["2026-01-05", "2026-04-06", "2026-07-06"]:
            rows += [("A", day, day, "2000", 0.0)] * (2 * n) + [("A", day, day, "500", 0.0)] * n
            rows += [("B", day, day, "2000", 0.0)] * n + [("B", day, day, "500", 0.0)] * (2 * n)
        df = thefts(rows)
        folds = [(("2026-01-01", "2026-03-31"), ("2026-04-01", "2026-06-30")), (("2026-01-01", "2026-06-30"), ("2026-07-01", "2026-09-30"))]
        return flag([holdout(df, ["A", "B"], [3 * n, 3 * n], history, fold, "bike_value") for history, fold in folds])

    assert flagged(1)["pattern"] == "citywide pattern" and flagged(1)["reason"].startswith("too sparse")
    assert flagged(10)["pattern"] == "area pattern"


def test_sample_data_is_too_sparse_for_every_selector():
    raw = pd.read_csv(FIXTURE, encoding="iso-8859-1", dtype={"LOR": str})
    cleaned = clean(raw[raw["LOR"] != "99999999"])
    cleaned["LOR"] = cleaned["LOR"].str.zfill(8)
    flags = selector_flags(evaluate(cleaned, sorted(polygon_ids())))
    assert set(flags) == {"time_band", "day_group", "bike_value"}
    assert all(f["pattern"] == "citywide pattern" and f["reason"].startswith("too sparse") for f in flags.values())