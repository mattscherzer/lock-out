import math
from pathlib import Path

import numpy as np
import pandas as pd

from audit_checks import polygon_ids
from models.eb import fit, generate, posterior_rate, strength, tiers
from pipeline.clean import clean

FIXTURE = Path(__file__).resolve().parent / "fixtures" / "fahrraddiebstahl_sample.csv"


def test_posterior_rate_by_hand():
    # Gamma(a=2) prior with mean 2, one unit of exposure, 4 thefts: (2 + 4) / (2 / 2 + 1) = 3
    assert posterior_rate(np.array([4]), 1, 2.0, 2.0)[0] == 3


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


def test_generator_emits_all_542_areas_with_flags():
    raw = pd.read_csv(FIXTURE, encoding="iso-8859-1", dtype={"LOR": str})
    raw = raw[raw["LOR"] != "99999999"]
    cleaned = clean(raw)
    cleaned["LOR"] = cleaned["LOR"].str.zfill(8)
    reports_up_to = cleaned["ANGELEGT_AM"].max()
    out = generate(cleaned, raw, sorted(polygon_ids()), reports_up_to, reports_up_to - pd.Timedelta(days=14))
    areas = out["areas"]
    assert len(areas) == 542
    assert out["metadata"]["model_type"] == "eb_gamma_poisson"
    missing = set(polygon_ids()) - set(raw["LOR"].str.zfill(8))
    assert {lor for lor, a in areas.items() if a["no_record"]} == missing
    assert all(a["limited_data"] == (a["reports_12m"] < 5) for a in areas.values())