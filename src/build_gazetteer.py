"""Build the place-search lookup (postcode, street, station -> planning areas) for the frontend and the demo.

Inputs, all downloaded into one directory (default data/raw/gazetteer/, git-ignored):
  plz.json     WFS https://gdi.berlin.de/services/wfs/postleitzahlen  typeNames=postleitzahlen:postleitzahlen
  strab.json   WFS https://gdi.berlin.de/services/wfs/rbs_strab       typeNames=rbs_strab:rbs_strab
               (both outputFormat=application/json&srsName=EPSG:4326; CC-BY-3.0, Amt fuer Statistik Berlin-Brandenburg)
  stops.txt    stops.txt from the VBB GTFS zip https://www.vbb.de/gtfs
Output, two files in frontend/public/ (shared with the demo, see README):
  gazetteer.json          loaded with the page
    plz:       postcode -> [[lor_id, share_pct], ...] sorted by share, slivers dropped
    stations:  [[display name, kind, lor_id, lat, lon], ...]
  gazetteer_streets.json  fetched on the first search (the bulk of the bytes)
    ids:       [lor_id, ...] every area id used below, sorted; areas refer to it by index
    streets:   {bezirk: {type: {name: areas}}}
               type is the display type: Street, Square, Water, Motorway, Forest or Other.
               areas is [[ids_index, share_pct], ...]: share of length, largest first, slivers dropped.
               One name in several Bezirke, or under several types, is one entry per Bezirk and type.
"""
import argparse
import json
import re
from pathlib import Path

import geopandas as gpd
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
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


def with_keys(st):
    """Key every named entry by name, display type and Bezirk."""
    st = st.assign(name=st.strname.str.strip())
    st = st[st.name.ne("") & st.name.notna()].copy()
    st["key"] = st.name + "|" + st.strabtypname.map(TYPES).fillna("Other") + "|" + st.bezname
    return st


def nest(areas):
    """{"name|type|bezirk": [[plr_id, pct], ...]} -> (ids, {bezirk: {type: {name: [[ids_index, pct], ...]}}})."""
    ids = sorted({i for v in areas.values() for i, _ in v})
    at = {i: n for n, i in enumerate(ids)}
    tree = {}
    for key, v in sorted(areas.items(), key=lambda kv: tuple(reversed(kv[0].split("|")))):
        name, kind, bezirk = key.split("|")
        tree.setdefault(bezirk, {}).setdefault(kind, {})[name] = [[at[i], pct] for i, pct in v]
    return ids, tree


def shares(layer, lor, key):
    """key value -> [[plr_id, pct]] by overlapping area (polygons) or length (lines)."""
    cut = gpd.overlay(layer[[key, "geometry"]], lor[["plr_id", "geometry"]], how="intersection", keep_geom_type=True)
    cut["w"] = cut.geometry.area if cut.geom_type.iloc[0].endswith("Polygon") else cut.geometry.length
    w = cut.groupby([key, "plr_id"])["w"].sum().reset_index()
    w["pct"] = (100 * w["w"] / w.groupby(key)["w"].transform("sum")).round().astype(int)
    out = {}
    for k, g in w[w["pct"] >= MIN_SHARE].sort_values("pct", ascending=False).groupby(key):
        out[k] = [[r.plr_id, int(r.pct)] for r in g.itertuples()]
    return out


def stations(stops, lor):
    # parent stations in Berlin named "S Foo (Berlin)", "U Foo (Berlin)" or "S+U Foo (Berlin)"
    s = stops[(stops.location_type == 1) & stops.stop_name.str.match(r"^(S\+U|S|U) .*\(Berlin\)$")].copy()
    s["kind"] = s.stop_name.str.extract(r"^(S\+U|S|U) ")[0]
    s["name"] = s.stop_name.str.replace(r"^(S\+U|S|U) ", "", regex=True).str.replace(r" \(Berlin\)$", "", regex=True)
    pts = gpd.GeoDataFrame(s, geometry=gpd.points_from_xy(s.stop_lon, s.stop_lat), crs="EPSG:4326").to_crs(CRS)
    hit = gpd.sjoin(pts, lor[["plr_id", "geometry"]], how="inner", predicate="within")
    return sorted({(r.name, r.kind, r.plr_id, round(r.stop_lat, 5), round(r.stop_lon, 5)) for r in hit.itertuples()})


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", type=Path, default=ROOT / "data/raw/gazetteer")
    ap.add_argument("--out", type=Path, default=ROOT / "frontend/public/gazetteer.json")
    a = ap.parse_args()

    lor = gpd.read_file(ROOT / "data/raw/lor_planungsraeume_2021.geojson").to_crs(CRS)
    plz = gpd.read_file(a.src / "plz.json").to_crs(CRS)
    st = gpd.read_file(a.src / "strab.json").to_crs(CRS)
    st = with_keys(st)
    stops = pd.read_csv(a.src / "stops.txt", dtype={"stop_name": str})

    ids, tree = nest(shares(st, lor, "key"))
    eager = {"plz": shares(plz, lor, "plz"), "stations": [list(x) for x in stations(stops, lor)]}
    lazy = {"ids": ids, "streets": tree}
    # self-check: a few places everybody knows, and no empty answers
    named = {(b, t, n): v for b, ts in tree.items() for t, ns in ts.items() for n, v in ns.items()}
    assert len(eager["plz"]) > 150 and len(named) > 8000 and len(eager["stations"]) > 250
    assert all(eager["plz"].values()) and all(named.values())
    assert any(x[0] == "Ostbahnhof" for x in eager["stations"])
    assert len(tree["Mitte"]["Street"]["Invalidenstraße"]) > 1  # spans several areas
    assert sum("Hauptstraße" in ts.get("Street", {}) for ts in tree.values()) > 1  # one result per Bezirk
    assert {t for ts in tree.values() for t in ts} >= {"Street", "Square", "Water", "Motorway", "Forest"}
    assert "Spandauer See" in tree["Spandau"]["Water"] and "Großer Stern" in tree["Charlottenburg-Wilmersdorf"]["Square"]
    assert any("A 100 BAB Stadtring" in ts.get("Motorway", {}) for ts in tree.values())
    for path, data in ((a.out, eager), (a.out.with_name("gazetteer_streets.json"), lazy)):
        path.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")))
        print(path.name, {k: len(v) for k, v in data.items()}, f"{path.stat().st_size / 1e3:.0f} kB")


if __name__ == "__main__":
    main()
