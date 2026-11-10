import json

import pandas as pd

from lockout.paths import POLYGONS


def polygon_ids() -> set[str]:
    geo = json.loads(POLYGONS.read_text(encoding="utf-8"))
    return {f["properties"]["plr_id"] for f in geo["features"]}


def area_names() -> dict[str, dict[str, str]]:
    """8-digit area id -> area name, Bezirksregion id and name, and Bezirk name ("01 - Mitte" -> "Mitte")."""
    geo = json.loads(POLYGONS.read_text(encoding="utf-8"))
    return {p["plr_id"]: {"name": p["plr_name"], "bzr_id": p["bzr_id"], "bzr_name": p["bzr_name"], "bez_name": p["bez"].split(" - ", 1)[-1]}
            for p in (f["properties"] for f in geo["features"])}


def bezirke() -> pd.Series:
    """8-digit area id -> Bezirk name, from the planning-area polygons ("01 - Mitte" -> "Mitte")."""
    geo = json.loads(POLYGONS.read_text(encoding="utf-8"))
    return pd.Series({f["properties"]["plr_id"]: f["properties"]["bez"].split(" - ", 1)[-1] for f in geo["features"]})
