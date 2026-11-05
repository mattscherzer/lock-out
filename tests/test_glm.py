from pathlib import Path

import numpy as np
import pandas as pd
import pytest

from audit_checks import polygon_ids
from models.eb import evaluate
from models.glm import CANDIDATES, LABELS, compare, design, eb_toward, glm_rate, markdown, verdict
from models.osm_features import KINDS
from pipeline.clean import clean

FIXTURE = Path(__file__).resolve().parent / "fixtures" / "fahrraddiebstahl_sample.csv"


def synthetic_features(index, seed=1):
    rng = np.random.default_rng(seed)
    table = pd.DataFrame({k: rng.poisson(20, len(index)) for k in KINDS}, index=index)
    table["area_km2"] = rng.uniform(0.2, 5, len(index))
    return table


def test_every_kind_has_a_label():
    assert set(LABELS) == set(KINDS)


def test_design_takes_log_counts_and_log_size():
    features = pd.DataFrame({**{k: [0, 9] for k in KINDS}, "area_km2": [1.0, np.e]}, index=["A", "B"])
    x = design(features)
    assert list(x.columns) == ["const", *KINDS, "log_area_km2"]
    assert x["const"].tolist() == [1, 1]
    assert x[list(KINDS)[0]].tolist() == pytest.approx([0, np.log(10)])
    assert x["log_area_km2"].tolist() == pytest.approx([0, 1])


def test_glm_finds_the_count_that_drives_thefts():
    # Thefts rise with shops (coefficient 0.8) and ignore the other kinds.
    index = [f"{i:08d}" for i in range(400)]
    features = synthetic_features(index)
    features["shops"] = np.random.default_rng(2).integers(0, 200, len(index))
    x = design(features)
    history = pd.Series(np.random.default_rng(3).poisson(np.exp(0.5 + 0.8 * x["shops"])), index=index)
    predicted, coefficients = glm_rate(history, x)
    assert coefficients["shops"] == pytest.approx(0.8, abs=0.1)
    assert all(abs(coefficients[k]) < 0.2 for k in KINDS if k != "shops")
    assert (predicted > 0).all() and predicted.index.equals(history.index)


def test_eb_toward_pulls_each_area_toward_its_prior():
    history = pd.Series([0, 2, 10, 40, 100], index=list("ABCDE"))
    prior = pd.Series([5.0, 5.0, 20.0, 20.0, 60.0], index=history.index)
    rate = eb_toward(history, prior)
    low, high = np.minimum(history, prior), np.maximum(history, prior)
    assert ((rate >= low) & (rate <= high)).all()
    assert not np.allclose(rate, prior) and not np.allclose(rate, history)  # in between, not at either end
    assert rate.index.equals(history.index)


def fold(deviances, rates):
    return {"fold": "f", "scores": {name: {"deviance": d} for name, d in deviances.items()}, "rates": rates}


def test_verdict_keeps_only_a_candidate_that_passes_every_check():
    index = list("ABCDEFGHIJ")
    same = pd.Series(np.arange(10.0), index=index)
    shuffled = pd.Series([3.0, 9, 0, 6, 1, 8, 2, 7, 4, 5], index=index)
    glm, toward = CANDIDATES
    folds = [
        fold({"EB v0": 1.0, glm: 0.9, toward: 0.9}, {"EB v0": same, glm: same, toward: same}),
        fold({"EB v0": 1.0, glm: 0.9, toward: 1.1}, {"EB v0": same, glm: same, toward: same}),
    ]
    result = verdict(folds)
    assert result[glm]["keep"] is True
    assert result[toward]["keep"] is False  # worse than EB v0 on the second fold
    assert [ok for _, _, ok in result[toward]["checks"]] == [True, False, True]
    folds[1]["rates"][glm] = shuffled  # better on both folds, but the ranking changes between folds
    result = verdict(folds)
    assert result[glm]["keep"] is False
    assert [ok for _, _, ok in result[glm]["checks"]] == [True, True, False]


def cleaned_fixture():
    raw = pd.read_csv(FIXTURE, encoding="iso-8859-1", dtype={"LOR": str})
    cleaned = clean(raw[raw["LOR"] != "99999999"])
    cleaned["LOR"] = cleaned["LOR"].str.zfill(8)
    return cleaned


def test_compare_scores_every_model_on_both_folds():
    areas = sorted(polygon_ids())
    folds = compare(cleaned_fixture(), areas, synthetic_features(areas))
    assert len(folds) == 2
    for f in folds:
        assert list(f["scores"]) == ["Citywide share", "Raw area history", "EB v0", *CANDIDATES]
        assert all(np.isfinite(s["deviance"]) for s in f["scores"].values())
        assert all(len(r) == 542 and (r > 0).all() for r in f["rates"].values())
        assert list(f["coefficients"].index) == ["const", *KINDS, "log_area_km2"]
    # EB v0 scores as in docs/eb-model-results.md: the same model, windows and scaling
    assert [f["scores"]["EB v0"]["deviance"] for f in folds] == pytest.approx([r["deviance"] for r in evaluate(cleaned_fixture(), areas)])
    result = verdict(folds)
    assert set(result) == set(CANDIDATES)
    assert all(r["keep"] == all(ok for _, _, ok in r["checks"]) for r in result.values())


def test_compare_refuses_a_table_that_misses_areas():
    areas = sorted(polygon_ids())
    with pytest.raises(ValueError, match="no counts for some planning areas"):
        compare(cleaned_fixture(), areas, synthetic_features(areas).iloc[1:])


def test_results_file_names_the_snapshot_date_and_leaves_adoption_to_the_log():
    areas = sorted(polygon_ids())
    features = synthetic_features(areas)
    folds = compare(cleaned_fixture(), areas, features)
    dates = pd.Timestamp("2026-10-26"), pd.Timestamp("2026-10-12")
    text = markdown(folds, verdict(folds), features, *dates, "sample.csv", pd.Timestamp("2026-11-05"))
    assert "The counts table was written on 05 Nov 2026" in text
    assert "may be adopted" not in text
    last = text.strip().splitlines()[-1]
    assert "adoption is a separate decision (D-22" in last or "S1 is cut" in last
