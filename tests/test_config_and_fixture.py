import ast
from datetime import date
from pathlib import Path

import pandas as pd

import config

ROOT = Path(__file__).resolve().parents[1]
FIXTURE = ROOT / "tests" / "fixtures" / "fahrraddiebstahl_sample.csv"


def load():
    return pd.read_csv(FIXTURE, encoding="iso-8859-1", dtype=str, keep_default_na=False)


def test_config_values():
    assert config.LAG_CUTOFF_DAYS == 14
    assert config.DATA_WINDOW_START == date(2025, 1, 1)


def test_every_weekday_has_exactly_one_daytype():
    days = [d for ds in config.DAYTYPES.values() for d in ds]
    assert sorted(days) == list(range(7))


def test_fixture_has_edge_cases():
    df = load()
    assert 2500 <= len(df) <= 5000
    assert df["ERFASSUNGSGRUND"].str.contains("Keller", case=False).sum() >= 100
    assert (df["TATZEIT_ANFANG_STUNDE"] == "").any()
    assert (df["LOR"] == "99999999").any()
    reported = pd.to_datetime(df["ANGELEGT_AM"], dayfirst=True)
    cutoff = reported.max() - pd.Timedelta(days=config.LAG_CUTOFF_DAYS)
    assert (reported > cutoff).sum() >= 100


def test_only_config_defines_daytype_names():
    for path in (ROOT / "src").rglob("*.py"):
        if path.name != "config.py":
            assert not {"Mon_Thu", "Friday", "Weekend"} & {n.value for n in ast.walk(ast.parse(path.read_text())) if isinstance(n, ast.Constant)}, path


def test_daytype_of():
    assert [config.daytype_of(d) for d in (0, 3, 4, 5, 6)] == ["Mon_Thu", "Mon_Thu", "Friday", "Weekend", "Weekend"]
    assert config.daytype_of(float("nan")) is None
