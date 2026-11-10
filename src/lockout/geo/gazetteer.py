"""Place-search lookup: pure functions that turn street, postcode and station layers into planning-area shares."""
import geopandas as gpd
import pandas as pd

CRS = "EPSG:25833"
MIN_SHARE = 5  # percent; below this an overlap is a boundary sliver, not an area the place belongs to

# strabtypname -> display type; every entry stays searchable, unknown types are "Other"
TYPES = {
    "Strasse": "Street",
    "Verwaltungsweg": "Street",
    "fiktive Strasse Kreuzung1=Kreuzung2": "Square",
    "Gewässerabschnitt": "Water",
    "Autobahnabschnitt": "Motorway",
    "Forstamt/Jagenabschnitt": "Forest",
}


def with_keys(st: gpd.GeoDataFrame) -> gpd.GeoDataFrame:
    """Key every named entry by name, display type and Bezirk."""
    st = st.assign(name=st.strname.str.strip())
    st = st[st.name.ne("") & st.name.notna()].copy()
    st["key"] = st.name + "|" + st.strabtypname.map(TYPES).fillna("Other") + "|" + st.bezname
    return st


def nest(areas: dict[str, list[list]]) -> tuple[list[str], dict[str, dict[str, dict[str, list[list]]]]]:
    """{"name|type|bezirk": [[plr_id, pct], ...]} -> (ids, {bezirk: {type: {name: [[ids_index, pct], ...]}}})."""
    ids = sorted({i for v in areas.values() for i, _ in v})
    at = {i: n for n, i in enumerate(ids)}
    tree = {}
    for key, v in sorted(areas.items(), key=lambda kv: tuple(reversed(kv[0].split("|")))):
        name, kind, bezirk = key.split("|")
        tree.setdefault(bezirk, {}).setdefault(kind, {})[name] = [[at[i], pct] for i, pct in v]
    return ids, tree


def shares(layer: gpd.GeoDataFrame, lor: gpd.GeoDataFrame, key: str) -> dict[str, list[list]]:
    """key value -> [[plr_id, pct]] by overlapping area (polygons) or length (lines)."""
    cut = gpd.overlay(layer[[key, "geometry"]], lor[["plr_id", "geometry"]], how="intersection", keep_geom_type=True)
    cut["w"] = cut.geometry.area if cut.geom_type.iloc[0].endswith("Polygon") else cut.geometry.length
    w = cut.groupby([key, "plr_id"])["w"].sum().reset_index()
    w["pct"] = (100 * w["w"] / w.groupby(key)["w"].transform("sum")).round().astype(int)
    out = {}
    for k, g in w[w["pct"] >= MIN_SHARE].sort_values("pct", ascending=False).groupby(key):
        out[k] = [[r.plr_id, int(r.pct)] for r in g.itertuples()]
    return out


def stations(stops: pd.DataFrame, lor: gpd.GeoDataFrame) -> list[tuple[str, str, str, float, float]]:
    # parent stations in Berlin named "S Foo (Berlin)", "U Foo (Berlin)" or "S+U Foo (Berlin)"
    s = stops[(stops.location_type == 1) & stops.stop_name.str.match(r"^(S\+U|S|U) .*\(Berlin\)$")].copy()
    s["kind"] = s.stop_name.str.extract(r"^(S\+U|S|U) ")[0]
    s["name"] = s.stop_name.str.replace(r"^(S\+U|S|U) ", "", regex=True).str.replace(r" \(Berlin\)$", "", regex=True)
    pts = gpd.GeoDataFrame(s, geometry=gpd.points_from_xy(s.stop_lon, s.stop_lat), crs="EPSG:4326").to_crs(CRS)
    hit = gpd.sjoin(pts, lor[["plr_id", "geometry"]], how="inner", predicate="within")
    return sorted({(r.name, r.kind, r.plr_id, round(r.stop_lat, 5), round(r.stop_lon, 5)) for r in hit.itertuples()})
