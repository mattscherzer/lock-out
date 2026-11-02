from pathlib import Path

import pandas as pd

from audit_checks import polygon_ids
from models.area_stats import OWN_MEDIAN_FROM, area_stats, citywide_facts, confidence
from models.eb import generate, generator_window
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
    assert OWN_MEDIAN_FROM == 20


def test_zero_record_and_thin_areas_are_low_with_the_citywide_median():
    window = pd.concat([thefts({"B": 20}, value="800"), thefts({"T": 3}, value="5000")])
    t = area_stats(window, ["B", "T", "Z"])
    assert t.loc["Z"].tolist() == [0, 800, "citywide", "LOW"]  # no record at all
    assert t.loc["T"].tolist() == [3, 800, "citywide", "LOW"]  # thin: its own EUR 5,000 is not shown


def test_blank_values_count_toward_the_threshold_but_not_the_median():
    window = pd.concat([thefts({"A": 18}, value="600"), thefts({"A": 2}, value=None), thefts({"N": 20}, value=None), thefts({"C": 5}, value="900")])
    t = area_stats(window, ["A", "N"])
    assert t.loc["A"].tolist() == [20, 600, "area", "HIGH"]
    assert t.loc["N", "median_source"] == "citywide"  # 20 thefts, but no value to take a median of


def test_lock_defeated_share_is_citywide_only():
    window = pd.concat([thefts({"A": 3}), thefts({"B": 1}, reason="Fahrraddiebstahl")])
    assert citywide_facts(window)["lock_defeated_share"] == 0.75
    assert "lock_defeated_share" not in area_stats(window, ["A", "B"]).columns


def test_report_counts_match_the_generator():
    raw = pd.read_csv(FIXTURE, encoding="iso-8859-1", dtype={"LOR": str})
    cleaned = clean(raw[raw["LOR"] != "99999999"])
    cleaned["LOR"] = cleaned["LOR"].str.zfill(8)
    cutoff = cleaned["ANGELEGT_AM"].max() - pd.Timedelta(days=14)
    areas = sorted(polygon_ids())
    t = area_stats(generator_window(cleaned, cutoff)[0], areas)
    out = generate(cleaned, areas, cleaned["ANGELEGT_AM"].max(), cutoff, "sample.csv", {})
    assert t["reports_12m"].to_dict() == {lor: a["reports_12m"] for lor, a in out["areas"].items()}