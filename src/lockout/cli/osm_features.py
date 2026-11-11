"""Download OSM feature counts per planning area into data/raw/osm/osm_features.csv (issue #61, risk R4).

Run from the repo root: uv run python -m lockout.cli.osm_features
Aggregate counts only, one Overpass request per kind cached in data/raw/osm/cache; not in Git until the ODbL question (R4)
is answered. Data © OpenStreetMap contributors, ODbL.
"""

import osmnx as ox

from lockout.geo.osm_features import feature_table, planning_areas
from lockout.paths import OSM_DIR, OSM_FEATURES


def main() -> None:
    OSM_DIR.mkdir(parents=True, exist_ok=True)
    ox.settings.cache_folder = OSM_DIR / "cache"
    table = feature_table(planning_areas(), ox.features_from_bbox)
    table.to_csv(OSM_FEATURES)
    print(f"Wrote {OSM_FEATURES} ({len(table)} areas). Data © OpenStreetMap contributors, ODbL.")


if __name__ == "__main__":
    main()
