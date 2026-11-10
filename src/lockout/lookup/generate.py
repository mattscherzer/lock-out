"""The lookup file: the JSON contract with the frontend (issue #38, #40, #63)."""
import json
from collections.abc import Sequence
from pathlib import Path

import numpy as np
import pandas as pd

from lockout import config
from lockout.geo.lor import area_names
from lockout.lookup.schema import problems
from lockout.models.area_stats import LIMITED_DATA_BELOW, area_stats, citywide_facts, confidence_thresholds
from lockout.models.backtest import HISTORY_MONTHS, counts
from lockout.models.eb import TIERS, check_tier_shares, fit, tiers
from lockout.models.selectors import SELECTORS, Flag, levels
from lockout.paths import LOOKUP

SCHEMA_VERSION = "1.1.0"  # schemas/lookup_v1.schema.json; additive changes are a minor bump (issue #40)
MODEL_TYPE = "eb_gamma_poisson"
ATTRIBUTION = {
    "police": "Datenquelle: Polizei Berlin (CC-BY 4.0)",
    "osm": "© OpenStreetMap contributors (ODbL)",
    "lor": "Datenquelle: Amt für Statistik Berlin-Brandenburg / Senatsverwaltung für Stadtentwicklung, Bauen und Wohnen – ODIS Berlin (dl-de/by-2-0)",
}


def citywide_multipliers(df: pd.DataFrame) -> dict[str, dict[str, float]]:
    """Share of thefts in each level of each selector: the same for every area (D-18)."""
    out = {}
    for s in SELECTORS:
        n = levels(df, s).sum()
        out[s] = {level: round(float(v / n.sum()), 4) for level, v in n.items()}
    return out


def generator_window(df: pd.DataFrame, cutoff: pd.Timestamp) -> tuple[pd.DataFrame, pd.Timestamp]:
    """The thefts the generator counts: those whose window ended in the 12 months up to the cutoff; also that first day."""
    start = cutoff - pd.DateOffset(months=HISTORY_MONTHS) + pd.Timedelta(days=1)
    return df[df["TATZEIT_ENDE_DATUM"].between(start, cutoff)], start


def generate(df: pd.DataFrame, areas: Sequence[str], reports_up_to: pd.Timestamp, cutoff: pd.Timestamp, source: str,
             selectors: dict[str, Flag]) -> dict:
    """The generator output. selectors: the per-selector flags from selector_flags()."""
    window, start = generator_window(df, cutoff)
    y = counts(window, areas, start, cutoff)
    rate, a = fit(y)
    tier = tiers(rate)
    check_tier_shares(tier)
    stats = area_stats(window, areas)
    # the confidence label rests on the same counts as reports_12m and limited_data
    assert (stats["reports_12m"] == y.reindex(stats.index)).all(), "area_stats and the generator count different thefts"
    street_record = set(df["LOR"])  # no_record: no street theft at all in the cleaned data
    shares = citywide_multipliers(window)
    names = area_names()
    bounds = [0.0] + [top for _, top in TIERS]
    out = {
        "metadata": {
            "schema_version": SCHEMA_VERSION,
            "reports_up_to": f"{reports_up_to:%Y-%m-%d}",
            "data_window": {"start": f"{start:%Y-%m-%d}", "end": f"{cutoff:%Y-%m-%d}"},
            "truncation_lag_days": config.LAG_CUTOFF_DAYS,
            "source_file": source,
            "model_type": MODEL_TYPE,
            "shrinkage_strength": {k: (None if np.isinf(v) else round(v, 3)) for k, v in a.items()},
            "attribution": ATTRIBUTION,
            "citywide_facts": citywide_facts(window),
            "confidence_thresholds": confidence_thresholds(),
        },
        "risk_bands": {name: {"min_percentile": low, "max_percentile": top} for (name, top), low in zip(TIERS, bounds)},
        # citywide shares and the hold-out flag per selector; 1.0.0 carries no area values for any selector
        "selectors": {s: {"shares": shares[s], **selectors[s], "area_values": False} for s in SELECTORS},
        "areas": {
            lor: {
                **names[lor],
                "tier": tier[lor],
                "expected_per_year": round(float(rate[lor]), 2),
                "reports_12m": int(y[lor]),
                "limited_data": bool(y[lor] < LIMITED_DATA_BELOW),
                "no_record": lor not in street_record,
                "confidence": stats.at[lor, "confidence"],
                "area_stats": {
                    "median_stolen_value_eur": int(stats.at[lor, "median_stolen_value_eur"]),
                    "median_source": stats.at[lor, "median_source"],
                },
            }
            for lor in areas
        },
    }
    assert len(out["areas"]) == 542
    return out


def write_lookup(lookup: dict, path: Path = LOOKUP) -> None:
    """Write only a schema-valid lookup, else raise ValueError; the schema lets NaN/inf through but they would break JSON.parse."""
    if found := problems(lookup):
        raise ValueError("The output does not match schemas/lookup_v1.schema.json:\n" + "\n".join(found[:20]))
    try:
        text = json.dumps(lookup, ensure_ascii=False, separators=(",", ":"), allow_nan=False)
    except ValueError as e:
        raise ValueError(f"The output holds NaN or infinity, which JSON cannot hold ({e})") from e
    path.write_text(text, encoding="utf-8")
