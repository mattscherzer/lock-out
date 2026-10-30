import math
from pathlib import Path

import numpy as np
import pandas as pd
import pytest

from audit_checks import polygon_ids
from models.eb import LIMITED_DATA_BELOW, check_tier_shares, fit, generate, posterior_rate, share_in_top_quartile, strength, tiers
from pipeline.clean import clean

FIXTURE = Path(__file__).resolve().parent / "fixtures" / "fahrraddiebstahl_sample.csv"


def test_posterior_rate_by_hand():
    # Gamma(a=2) prior with mean 2, one unit of exposure, 4 thefts: (2 + 4) / (2 / 2 + 1) = 3
    assert posterior_rate(np.array([4]), 1, 2.0, 2.0)[0] == 3


def test_posterior_rate_with_a_zero_prior_mean_is_zero():
    assert posterior_rate(np.array([3]), 1, 0.0, 2.0).tolist() == [0]


def test_no_extra_variation_means_full_pooling():
    y = np.array([5, 5, 5, 5])
    a = strength(y, 1, 5.0)
    assert math.isinf(a)
    assert posterior_rate(y, 1, 5.0, a).tolist() == [5, 5, 5, 5]


def test_shrinkage_pulls_toward_parent_and_more_for_thin_areas():
    # Two Bezirksregionen with two areas each; the thin area (1 theft) moves further toward its parent.
    y = pd.Series([1, 30, 60, 90], index=["01100101", "01100102", "01100203", "01100204"])
    rate, a = fit(y)
    assert np.isfinite(a["area"])
    assert rate.iloc[0] > y.iloc[0] and rate.iloc[3] < y.iloc[3]  # pulled toward the parent
    assert (rate.iloc[0] - 1) / 1 > (90 - rate.iloc[3]) / 90  # the thin area moves further, relatively
    assert rate.is_monotonic_increasing  # shrinkage keeps the order here


def test_tiers_split_60_25_15():
    t = tiers(pd.Series(np.arange(1000, dtype=float)))
    assert t.value_counts().to_dict() == {"LOW": 600, "MEDIUM": 250, "HIGH": 150}
    assert t.iloc[-1] == "HIGH" and t.iloc[0] == "LOW"


def test_equal_rates_get_the_same_higher_tier():
    # Ten areas; the 6th to 8th share a rate across the 60% cut, so all three get MEDIUM, not LOW.
    t = tiers(pd.Series([1, 2, 3, 4, 5, 6, 6, 6, 9, 10], dtype=float))
    assert t.tolist() == ["LOW"] * 5 + ["MEDIUM"] * 3 + ["HIGH"] * 2


def test_tier_check_rejects_a_degenerate_split():
    with pytest.raises(AssertionError, match="LOW holds 0.0%"):
        check_tier_shares(tiers(pd.Series([1.0] * 10)))  # all 10 HIGH
    with pytest.raises(AssertionError, match="LOW holds 0.0%"):
        check_tier_shares(tiers(pd.Series([0.0] * 8 + [1.0] * 2)))  # 8 MEDIUM, 2 HIGH


def test_top_quartile_never_counts_zero_thefts():
    actual = pd.Series([0, 0, 0, 0])
    assert share_in_top_quartile(actual, pd.Series([True, False, False, False])) == 0


def cleaned_fixture():
    raw = pd.read_csv(FIXTURE, encoding="iso-8859-1", dtype={"LOR": str})
    raw = raw[raw["LOR"] != "99999999"]
    cleaned = clean(raw)
    cleaned["LOR"] = cleaned["LOR"].str.zfill(8)
    return raw, cleaned


def test_generator_emits_all_542_areas_with_flags_from_cleaned_data():
    raw, cleaned = cleaned_fixture()
    reports_up_to = cleaned["ANGELEGT_AM"].max()
    flags = {"time_band": {"pattern": "citywide pattern", "reason": "test"}}
    out = generate(cleaned, sorted(polygon_ids()), reports_up_to, reports_up_to - pd.Timedelta(days=14), "sample.csv", flags)
    areas = out["areas"]
    assert len(areas) == 542
    assert out["metadata"]["model_type"] == "eb_gamma_poisson"
    assert out["metadata"]["source_file"] == "sample.csv"
    assert out["metadata"]["selectors"] == flags
    no_street_theft = set(polygon_ids()) - set(cleaned["LOR"])
    assert {lor for lor, a in areas.items() if a["no_record"]} == no_street_theft
    cellar_only = set(raw["LOR"].str.zfill(8)) & no_street_theft
    assert cellar_only, "the fixture should contain an area with only cellar rows"
    assert all(areas[lor]["no_record"] for lor in cellar_only)
    assert all(a["limited_data"] == (a["reports_12m"] < LIMITED_DATA_BELOW) for a in areas.values())


def test_generator_raises_on_degenerate_rates():
    # A cutoff before the data leaves no theft in the window, so every area gets the same rate and lands in HIGH.
    _, cleaned = cleaned_fixture()
    with pytest.raises(AssertionError, match="LOW holds 0.0%"):
        generate(cleaned, sorted(polygon_ids()), cleaned["ANGELEGT_AM"].max(), pd.Timestamp("2000-01-01"), "sample.csv", {})