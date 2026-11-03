import copy
from pathlib import Path

import pandas as pd
import pytest
from jsonschema import Draft202012Validator

from audit_checks import polygon_ids
from lookup_schema import FIXTURE, LOOKUP, SCHEMA, load, problems
from models.eb import SCHEMA_VERSION, evaluate, generate, selector_flags
from pipeline.clean import clean

SAMPLE = Path(__file__).resolve().parent / "fixtures" / "fahrraddiebstahl_sample.csv"


@pytest.fixture(scope="module")
def output():
    """The generator's output on the committed sample data."""
    raw = pd.read_csv(SAMPLE, encoding="iso-8859-1", dtype={"LOR": str})
    cleaned = clean(raw[raw["LOR"] != "99999999"])
    cleaned["LOR"] = cleaned["LOR"].str.zfill(8)
    areas = sorted(polygon_ids())
    reports_up_to = cleaned["ANGELEGT_AM"].max()
    flags = selector_flags(evaluate(cleaned, areas))
    return generate(cleaned, areas, reports_up_to, reports_up_to - pd.Timedelta(days=14), "sample.csv", flags)


def test_the_schema_itself_is_valid_and_at_the_generator_version():
    schema = load(SCHEMA)
    Draft202012Validator.check_schema(schema)
    assert schema["properties"]["metadata"]["properties"]["schema_version"]["const"] == SCHEMA_VERSION


def test_generator_output_matches_the_schema(output):
    assert problems(output) == []


@pytest.mark.parametrize("path", [LOOKUP, FIXTURE], ids=["committed lookup", "frontend fixture"])
def test_committed_files_match_the_schema(path):
    # LOOKUP is the real generator output (eb.py on the pinned CSV); FIXTURE is its copy for the frontend.
    assert problems(load(path)) == []


def test_attribution_carries_all_three_credits(output):
    # M10: Polizei Berlin (CC-BY 4.0), OSM (ODbL) and LOR (dl-de/by-2-0), each required by the schema
    credits = output["metadata"]["attribution"]
    assert "Polizei Berlin" in credits["police"] and "CC-BY 4.0" in credits["police"]
    assert "OpenStreetMap" in credits["osm"] and "ODbL" in credits["osm"]
    assert "dl-de/by-2-0" in credits["lor"]
    for key in credits:
        broken = copy.deepcopy(output)
        del broken["metadata"]["attribution"][key]
        assert any(f"'{key}' is a required property" in p for p in problems(broken))


def test_fields_for_later_may_be_absent_but_must_be_right_when_present(output):
    # 1.0.0 lets confidence, area_stats and citywide_facts be absent; filling them in later (#57) is additive
    assert "confidence" not in next(iter(output["areas"].values()))
    filled = copy.deepcopy(output)
    filled["metadata"]["citywide_facts"] = {"lock_defeated_share": 0.94, "median_stolen_value_eur": 899}
    for area in filled["areas"].values():
        area.update(confidence="LOW", area_stats={"median_stolen_value_eur": 899, "median_source": "citywide"})
    assert problems(filled) == []
    first = next(iter(filled["areas"]))
    filled["areas"][first]["confidence"] = "SAFE"
    assert problems(filled) == [f"areas/{first}/confidence: 'SAFE' is not one of ['LOW', 'MEDIUM', 'HIGH']"]


def test_the_schema_rejects_an_unknown_field_and_a_missing_area(output):
    extra = copy.deepcopy(output)
    extra["areas"][next(iter(extra["areas"]))]["colour"] = "#EF4444"
    assert any("Additional properties are not allowed ('colour'" in p for p in problems(extra))
    short = copy.deepcopy(output)
    short["areas"].pop(next(iter(short["areas"])))
    assert any("should be non-empty" in p or "does not have enough properties" in p for p in problems(short))