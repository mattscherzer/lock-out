from pathlib import Path

import pandas as pd
import pytest

import config
from audit_checks import polygon_ids
from models.area_stats import area_stats, citywide_facts, confidence
from models.eb import generate, generator_window
from models.selector_checks import SELECTORS
from pipeline.clean import clean

FIXTURE = Path(__file__).resolve().parent / "fixtures" / "fahrraddiebstahl_sample.csv"


def thefts(counts, value="1500", reason="Fahrraddiebstahl, schwerer Fall"):
    """counts: area -> number of thefts, each with the same stolen value and recording reason."""
    rows = [(area, value, reason) for area, n in counts.items() for _ in range(n)]
    return pd.DataFrame(rows, columns=["LOR", "SCHADENSHOEHE", "ERFASSUNGSGRUND"])


def test_confidence_lines():
    assert [confidence(n) for n in [0, 4, 5, 19, 20]] == ["LOW", "LOW", "MEDIUM", "MEDIUM", "HIGH"]


def test_19_thefts_get_the_citywide_median_and_20_their_own():
    # A: 19 thefts at EUR 100, B: 20 at EUR 2,000, C: 30 at EUR 500. The city median over all 69 is EUR 500.
    window = pd.concat([thefts({"A": 19}, value="100"), thefts({"B": 20}, value="2000"), thefts({"C": 30}, value="500")])
    t = area_stats(window, ["A", "B"])
    assert t.loc["A"].tolist() == [19, 500, "citywide", "MEDIUM"]  # not its own EUR 100
    assert t.loc["B"].tolist() == [20, 2000, "area", "HIGH"]


def test_zero_record_and_thin_areas_are_low_with_the_citywide_median():
    window = pd.concat([thefts({"B": 20}, value="800"), thefts({"T": 3}, value="5000")])
    t = area_stats(window, ["B", "T", "Z"])
    assert t.loc["Z"].tolist() == [0, 800, "citywide", "LOW"]  # no record at all
    assert t.loc["T"].tolist() == [3, 800, "citywide", "LOW"]  # thin: its own EUR 5,000 is not shown


def test_only_thefts_with_a_usable_value_count_toward_the_own_median():
    # A: 20 values at EUR 600 plus 2 blank and 1 zero. B: 20 thefts, but 2 of them at EUR 0. N: 20 blank.
    # The citywide median ignores blanks and zeros: 20 x 600, 18 x 1000 and 5 x 900 give EUR 900.
    window = pd.concat([
        thefts({"A": 20}, value="600"), thefts({"A": 2}, value=None), thefts({"A": 1}, value="0"),
        thefts({"B": 18}, value="1000"), thefts({"B": 2}, value="0"), thefts({"N": 20}, value=None), thefts({"C": 5}, value="900"),
    ])
    t = area_stats(window, ["A", "B", "N"])
    assert t.loc["A"].tolist() == [23, 600, "area", "HIGH"]  # every theft counts in reports_12m
    assert t.loc["B"].tolist() == [20, 900, "citywide", "HIGH"]  # 20 thefts, but only 18 usable values
    assert t.loc["N"].tolist() == [20, 900, "citywide", "HIGH"]  # no usable value at all


def test_zero_is_not_a_stolen_value():
    window = pd.concat([thefts({"A": 3}, value="0"), thefts({"B": 2}, value="500")])
    assert citywide_facts(window)["median_stolen_value_eur"] == 500  # with the zeros it would be 0


def test_a_window_without_any_usable_value_raises_a_clear_error():
    with pytest.raises(ValueError, match="no citywide median"):
        area_stats(thefts({"A": 20}, value=None), ["A"])


def test_lock_defeated_share_is_citywide_only():
    window = pd.concat([thefts({"A": 3}), thefts({"B": 1}, reason="Fahrraddiebstahl")])
    assert citywide_facts(window)["lock_defeated_share"] == 0.75
    assert "lock_defeated_share" not in area_stats(window, ["A", "B"]).columns


def test_report_counts_match_the_generator():
    raw = pd.read_csv(FIXTURE, encoding="iso-8859-1", dtype={"LOR": str})
    cleaned = clean(raw[raw["LOR"] != "99999999"])
    cleaned["LOR"] = cleaned["LOR"].str.zfill(8)
    cutoff = cleaned["ANGELEGT_AM"].max() - pd.Timedelta(days=config.LAG_CUTOFF_DAYS)
    areas = sorted(polygon_ids())
    t = area_stats(generator_window(cleaned, cutoff)[0], areas)
    out = generate(cleaned, areas, cleaned["ANGELEGT_AM"].max(), cutoff, "sample.csv", {s: {"pattern": "citywide pattern", "reason": "test"} for s in SELECTORS})
    assert t["reports_12m"].to_dict() == {lor: a["reports_12m"] for lor, a in out["areas"].items()}
    assert (t["confidence"] == "LOW").to_dict() == {lor: a["limited_data"] for lor, a in out["areas"].items()}  # the same line