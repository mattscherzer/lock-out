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


def test_backtest_windows_and_a_hand_computed_value():
    # Fold 1 history is 1 Apr 2025 to 31 Mar 2026 (365 days), the test is 1 Apr to 30 Jun 2026 (91 days).
    ends = {
        "A": ["2025-03-31", "2025-04-01", "2025-04-01", "2026-03-31", "2026-03-31", "2026-04-01"],
        "B": ["2026-05-15", "2026-06-30"],
    }
    df = pd.DataFrame(
        [(area, day) for area, days in ends.items() for day in days], columns=["LOR", "TATZEIT_ENDE_DATUM"]
    )
    df["TATZEIT_ENDE_DATUM"] = pd.to_datetime(df["TATZEIT_ENDE_DATUM"])
    row = backtest(df, ["A", "B"]).iloc[1]  # fold 1, raw area history
    # History: A = 4 (the day before the window is out, the first test day is not history), B = 0, so 0.5.
    # Predictions scaled by 91/365: A = 0.99726, B = 0.12466. Actual: A = 1, B = 2.
    # Deviance per area 2 * (y * ln(y / mu) - (y - mu)): A = 0.0000075, B = 7.3506; mean = 3.675.
    assert row["Baseline"] == "Raw area history"
    assert row["Thefts in fold"] == 3
    assert row["Mean Poisson deviance"] == "3.675"
    assert row["Spearman"] == "-1.000"