from pathlib import Path

import pytest

from lockout.ingest.police_csv import CsvError, load_police_csv
from lockout.pipeline.clean import street_rows

FIXTURE = Path(__file__).resolve().parent / "fixtures" / "fahrraddiebstahl_sample.csv"


@pytest.fixture
def good_csv(tmp_path):
    # The fixture without its injected unknown area ID, so it passes every check
    lines = FIXTURE.read_text(encoding="iso-8859-1").splitlines(keepends=True)
    path = tmp_path / "good.csv"
    path.write_text("".join(line for line in lines if ",99999999," not in line), encoding="iso-8859-1")
    return path


def test_good_csv_passes(good_csv):
    assert len(load_police_csv(good_csv, min_rows=1000)) > 2900


def test_too_few_rows(good_csv):
    with pytest.raises(CsvError, match="rows"):
        load_police_csv(good_csv)


def test_bad_delimiter(good_csv):
    good_csv.write_text(good_csv.read_text(encoding="iso-8859-1").replace(",", "\t"), encoding="iso-8859-1")
    with pytest.raises(CsvError, match="delimiter"):
        load_police_csv(good_csv, min_rows=1000)


def test_truncated_file(good_csv):
    lines = good_csv.read_text(encoding="iso-8859-1").splitlines(keepends=True)
    good_csv.write_text("".join(lines[:500]), encoding="iso-8859-1")
    with pytest.raises(CsvError, match="rows"):
        load_police_csv(good_csv, min_rows=1000)


def test_missing_column(good_csv):
    text = good_csv.read_text(encoding="iso-8859-1")
    good_csv.write_text(text.replace("DELIKT", "OTHER", 1), encoding="iso-8859-1")
    with pytest.raises(CsvError, match="Missing columns"):
        load_police_csv(good_csv, min_rows=1000)


def test_unknown_area_id():
    with pytest.raises(CsvError, match="Area IDs"):
        load_police_csv(FIXTURE, min_rows=1000)


def test_street_rows_exclude_cellar(good_csv):
    street = street_rows(load_police_csv(good_csv, min_rows=1000))
    assert not street["ERFASSUNGSGRUND"].str.contains("Keller").any()
    assert (street["DELIKT"] == "Fahrraddiebstahl").all()
