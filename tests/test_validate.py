from pathlib import Path

import pandas as pd

from audit_checks import polygon_ids
from models.eb import evaluate, selector_flags
from models.validate import bezirke, calibration, explain, fairness, markdown
from pipeline.clean import clean

FIXTURE = Path(__file__).resolve().parent / "fixtures" / "fahrraddiebstahl_sample.csv"


def test_calibration_passes_when_means_rise_and_high_is_twice_low():
    tier = pd.Series(["LOW", "LOW", "MEDIUM", "HIGH"])
    means, ok = calibration(pd.Series([1, 3, 3, 4]), tier)
    assert means.tolist() == [2, 3, 4] and ok
    assert not calibration(pd.Series([1, 3, 3, 3.9]), tier)[1]  # High is under 2x Low
    assert not calibration(pd.Series([1, 1, 3, 2]), tier)[1]  # High below Medium


def test_fairness_compares_shares_of_the_city():
    # Bezirk X holds 2 of 3 High areas but 1 of 4 top-quartile areas: (2/3) / (1/4) = 2.67, flagged.
    tier = pd.Series(["HIGH", "HIGH", "MEDIUM", "LOW", "HIGH", "MEDIUM", "LOW"])
    top = pd.Series([True, False, False, False, True, True, True])
    t = fairness(tier, top, pd.Series(["X"] * 4 + ["Y"] * 3))
    assert t.loc["X", ["high", "top", "high_and_top"]].tolist() == [2, 1, 1]
    assert round(t.loc["X", "ratio"], 2) == 2.67 and t.loc["X", "flagged"]
    assert round(t.loc["Y", "ratio"], 2) == 0.44 and t.loc["Y", "flagged"]


def test_zero_on_one_side_is_flagged_only_from_three_on_the_other():
    tier = pd.Series(["MEDIUM"] * 5 + ["HIGH"] * 5)
    bezirk = pd.Series(["X"] * 5 + ["Y"] * 5)
    three = fairness(tier, pd.Series([True] * 3 + [False] * 2 + [True] * 5), bezirk)
    two = fairness(tier, pd.Series([True] * 2 + [False] * 3 + [True] * 5), bezirk)
    assert three.loc["X", "flagged"] and not two.loc["X", "flagged"]


def test_explanation_names_the_areas_behind_the_flag():
    t = fairness(pd.Series(["MEDIUM", "LOW", "HIGH", "HIGH"]), pd.Series([True, True, True, False]), pd.Series(["X", "X", "Y", "Y"]))
    under = explain(t.loc["X"], cut=4)
    over = explain(t.loc["Y"], cut=4)
    assert "ranks 1 of its 2 top-quartile areas Medium and 1 Low" in under and "Small numbers" in under
    assert "1 of its 2 High areas had fewer thefts in this fold than the top-quartile cut (4)" in over


def test_every_area_has_one_of_the_twelve_bezirke():
    b = bezirke()
    assert set(b.index) == polygon_ids()
    assert b.nunique() == 12 and b["01100101"] == "Mitte"


def test_report_on_the_sample_data():
    raw = pd.read_csv(FIXTURE, encoding="iso-8859-1", dtype={"LOR": str})
    cleaned = clean(raw[raw["LOR"] != "99999999"])
    cleaned["LOR"] = cleaned["LOR"].str.zfill(8)
    areas = sorted(polygon_ids())
    rows = evaluate(cleaned, areas)
    end = cleaned["ANGELEGT_AM"].max()
    md = markdown(rows, selector_flags(rows), bezirke().reindex(areas), end, end - pd.Timedelta(days=14), "sample.csv")
    for heading in ["## Calibration", "## District fairness", "### Flagged Bezirke", "## Selectors"]:
        assert heading in md
    assert md.count("| citywide pattern |") == 3