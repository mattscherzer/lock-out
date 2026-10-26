from pathlib import Path

import pytest

import config
from audit_checks import AuditError, check_csv, street_rows

FIXTURE = Path(__file__).resolve().parent / "fixtures" / "fahrraddiebstahl_sample.csv"


@pytest.fixture
def good_csv(tmp_path):
    # The fixture without its injected unknown area ID, so it passes every check
    lines = FIXTURE.read_text(encoding="iso-8859-1").splitlines(keepends=True)
    path = tmp_path / "good.csv"
    path.write_text("".join(l for l in lines if ",99999999," not in l), encoding="iso-8859-1")
    return path


def test_good_csv_passes(good_csv):
    assert len(check_csv(good_csv, min_rows=1000)) > 2900


def test_too_few_rows(good_csv):
    with pytest.raises(AuditError, match="rows"):
        check_csv(good_csv)


def test_bad_delimiter(good_csv):
    good_csv.write_text(good_csv.read_text(encoding="iso-8859-1").replace(",", "\t"), encoding="iso-8859-1")
    with pytest.raises(AuditError, match="delimiter"):
        check_csv(good_csv, min_rows=1000)


def test_truncated_file(good_csv):
    lines = good_csv.read_text(encoding="iso-8859-1").splitlines(keepends=True)
    good_csv.write_text("".join(lines[:500]), encoding="iso-8859-1")
    with pytest.raises(AuditError, match="rows"):
        check_csv(good_csv, min_rows=1000)


def test_missing_column(good_csv):
    text = good_csv.read_text(encoding="iso-8859-1")
    good_csv.write_text(text.replace("DELIKT", "OTHER", 1), encoding="iso-8859-1")
    with pytest.raises(AuditError, match="Missing columns"):
        check_csv(good_csv, min_rows=1000)


def test_unknown_area_id():
    with pytest.raises(AuditError, match="Area IDs"):
        check_csv(FIXTURE, min_rows=1000)


def test_unset_lag_cutoff(good_csv, monkeypatch):
    monkeypatch.setattr(config, "LAG_CUTOFF_DAYS", None)
    with pytest.raises(AuditError, match="Lag cutoff"):
        check_csv(good_csv, min_rows=1000)


def test_street_rows_exclude_cellar(good_csv):
    street = street_rows(check_csv(good_csv, min_rows=1000))
    assert not street["ERFASSUNGSGRUND"].str.contains("Keller").any()
    assert (street["DELIKT"] == "Fahrraddiebstahl").all()