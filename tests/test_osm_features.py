import geopandas as gpd
import pandas as pd
from shapely.geometry import LineString, Point, box

from lockout.geo.osm_features import KINDS, count_features, feature_table, planning_areas


def two_areas():
    areas = gpd.GeoDataFrame({"area_km2": [1.0, 2.0]}, geometry=[box(0, 0, 1, 1), box(1, 0, 3, 1)],
                             index=pd.Index(["A", "B"], name="plr_id"), crs="EPSG:4326")
    return areas


def test_each_feature_counts_once_in_the_area_it_lies_in():
    features = gpd.GeoDataFrame(geometry=[
        Point(0.5, 0.5), Point(0.2, 0.8),  # A
        Point(2.0, 0.5),  # B
        LineString([(1.5, 0.5), (2.5, 0.5)]),  # a line inside B counts once
        box(0.1, 0.1, 0.3, 0.3),  # a polygon inside A counts once
        Point(5.0, 5.0),  # outside both areas
        None,  # a feature without a geometry is skipped
    ], crs="EPSG:4326")
    assert count_features(features, two_areas()).to_dict() == {"A": 3, "B": 2}


def test_a_feature_across_a_border_counts_once():
    features = gpd.GeoDataFrame(geometry=[box(0.8, 0.2, 1.6, 0.8)], crs="EPSG:4326")  # a building over the A-B border
    assert count_features(features, two_areas()).sum() == 1


def test_an_area_without_features_counts_zero():
    features = gpd.GeoDataFrame(geometry=[Point(0.5, 0.5)], crs="EPSG:4326")
    assert count_features(features, two_areas()).to_dict() == {"A": 1, "B": 0}


def test_feature_table_asks_once_per_kind_for_the_whole_bounding_box():
    calls = []

    def download(bbox, tags):
        calls.append((bbox, tags))
        return gpd.GeoDataFrame(geometry=[Point(2.0, 0.5)], crs="EPSG:4326")

    table = feature_table(two_areas(), download)
    assert [tags for _, tags in calls] == list(KINDS.values())
    assert {bbox for bbox, _ in calls} == {(0.0, 0.0, 3.0, 1.0)}  # (west, south, east, north)
    assert list(table.columns) == ["area_km2", *KINDS]
    assert table.loc["B", list(KINDS)].tolist() == [1] * len(KINDS)


def test_planning_areas_are_the_542_with_their_size():
    areas = planning_areas()
    assert len(areas) == 542 and areas.index.is_unique
    assert (areas["area_km2"] > 0).all()
    assert 880 < areas["area_km2"].sum() < 895  # Berlin is about 891 km2
