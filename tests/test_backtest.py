import math
from pathlib import Path

import pandas as pd
import pytest

from audit_checks import polygon_ids
from models.backtest import backtest, baselines, counts, score
from pipeline.clean import clean

FIXTURE = Path(__file__).resolve().parent / "fixtures" / "fahrraddiebstahl_sample.csv"


def test_counts_use_end_date_with_both_days_included():
    df = pd.DataFrame({
        "LOR": ["A"] * 4,
        "TATZEIT_ENDE_DATUM": pd.to_datetime(["2026-03-31", "2026-04-01", "2026-06-30", "2026-07-01"]),
    })
    assert counts(df, ["A", "B"], "2026-04-01", "2026-06-30").tolist() == [2, 0]


def test_baselines_scale_to_fold_length_and_replace_zero():
    history = pd.Series([0, 10, 20], index=["A", "B", "C"])
    predicted = baselines(history, history_days=10, test_days=5)
    assert predicted["Citywide share"].tolist() == [5, 5, 5]
    assert predicted["Raw area history"].tolist() == [0.25, 5, 10]


def test_constant_prediction_has_no_spearman():
    deviance, rho = score(pd.Series([1, 2, 3]), pd.Series([2.0, 2.0, 2.0]))
    assert deviance > 0
    assert math.isnan(rho)


def test_backtest_reports_both_baselines_on_both_folds():
    raw = pd.read_csv(FIXTURE, encoding="iso-8859-1", dtype={"LOR": str})
    raw = raw[raw["LOR"] != "99999999"]
    table = backtest(clean(raw), sorted(polygon_ids()))
    assert len(table) == 4
    assert set(table["Baseline"]) == {"Citywide share", "Raw area history"}
    assert table["Fold"].nunique() == 2