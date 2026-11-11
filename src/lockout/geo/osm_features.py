"""OpenStreetMap counts per planning area for the S1 test (issue #61, roadmap WP 2.1, scope S1, risk R4)."""

import time
from collections.abc import Callable
from typing import TypeAlias

import geopandas as gpd
import pandas as pd

from lockout.paths import POLYGONS

BBox: TypeAlias = tuple[float, float, float, float]
Tags: TypeAlias = dict[str, bool | str | list[str]]

# Places where bikes are left or where many people come and go: candidates for an exposure proxy (S1)
KINDS = {
    "bike_parking": {"amenity": "bicycle_parking"},
    "shops": {"shop": True},
    "food_drink": {"amenity": ["restaurant", "cafe", "bar", "pub", "fast_food", "biergarten", "nightclub"]},
    "transit_stops": {"railway": ["station", "halt", "tram_stop"], "highway": "bus_stop"},
    "education": {"amenity": ["school", "college", "university"]},
}


def planning_areas() -> gpd.GeoDataFrame:
    """The 542 planning areas: polygons and their size in km2 (finhalt is the area in m2)."""
    areas = gpd.read_file(POLYGONS)[["plr_id", "finhalt", "geometry"]].set_index("plr_id")
    areas["area_km2"] = areas["finhalt"] / 1e6
    return areas


def count_features(features: gpd.GeoDataFrame, areas: gpd.GeoDataFrame) -> pd.Series:
    """Features of one kind (points, lines or polygons) -> how many lie in each area; each counts once."""
    shapes = features.geometry.dropna()
    points = gpd.GeoDataFrame(geometry=shapes.representative_point(), crs=features.crs).to_crs(areas.crs)
    inside = gpd.sjoin(points, areas[["geometry"]], predicate="within", how="inner")
    return inside.groupby("plr_id").size().reindex(areas.index, fill_value=0)


def feature_table(areas: gpd.GeoDataFrame, download: Callable[[BBox, Tags], gpd.GeoDataFrame]) -> pd.DataFrame:
    """download(bbox, tags) -> GeoDataFrame; returns one row per area: size and a count per kind."""
    table = pd.DataFrame({"area_km2": areas["area_km2"].round(4)}, index=areas.index)
    bbox: BBox = tuple(areas.total_bounds)  # (west, south, east, north), the order osmnx 2 expects
    for kind, tags in KINDS.items():
        started = time.time()
        features = download(bbox, tags)
        table[kind] = count_features(features, areas)
        inside = f"{table[kind].sum():,} inside the {len(areas)} areas"
        print(f"{kind}: {len(features):,} features, {inside} ({time.time() - started:.0f} s)")
    return table
