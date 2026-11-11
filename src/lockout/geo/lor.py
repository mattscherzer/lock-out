import json

import pandas as pd

from lockout.paths import POLYGONS


def _properties() -> list[dict]:
    return [f["properties"] for f in json.loads(POLYGONS.read_text(encoding="utf-8"))["features"]]


def polygon_ids() -> set[str]:
    return {p["plr_id"] for p in _properties()}


def area_names() -> dict[str, dict[str, str]]:
    """8-digit area id -> area name, Bezirksregion id and name, and Bezirk name ("01 - Mitte" -> "Mitte")."""
    return {
        p["plr_id"]: {
            "name": p["plr_name"],
            "bzr_id": p["bzr_id"],
            "bzr_name": p["bzr_name"],
            "bez_name": p["bez"].split(" - ", 1)[-1],
        }
        for p in _properties()
    }


def bezirke() -> pd.Series:
    """8-digit area id -> Bezirk name, from the planning-area polygons."""
    return pd.Series({lor: n["bez_name"] for lor, n in area_names().items()})
