"""Build the place-search lookup (postcode, street, station -> planning areas) for the demo.

Inputs, all downloaded into one directory (default data/raw/gazetteer/, git-ignored):
  plz.json     WFS https://gdi.berlin.de/services/wfs/postleitzahlen  typeNames=postleitzahlen:postleitzahlen
  strab.json   WFS https://gdi.berlin.de/services/wfs/rbs_strab       typeNames=rbs_strab:rbs_strab
               (both outputFormat=application/json&srsName=EPSG:4326; CC-BY-3.0, Amt fuer Statistik Berlin-Brandenburg)
  stops.txt    stops.txt from the VBB GTFS zip https://www.vbb.de/gtfs
Output: frontend/public/gazetteer.json (shared with the demo, see README)
  plz:           postcode -> [[lor_id, share_pct], ...] sorted by share, slivers dropped
  streets:       "name|type|bezirk" -> areas; name and Bezirk never contain "|", so key.split("|") reads them back.
                 type is the display type: Street, Square, Water, Motorway, Forest or Other.
                 areas is [[lor_id, share_pct], ...] (share of length, largest first, slivers dropped),
                 or just the lor_id string when the place lies in one area (the share would be 100).
  stations:      [[display name, kind, lor_id, lat, lon], ...]
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


def compact(areas):
    """A place in one area is stored as the bare id: its share would be 100."""
    return {k: v[0][0] if len(v) == 1 else v for k, v in areas.items()}


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

    res = {
        "plz": shares(plz, lor, "plz"),
        "streets": compact(shares(st, lor, "key")),
        "stations": [list(x) for x in stations(stops, lor)],
    }
    # self-check: a few places everybody knows, and no empty answers
    assert len(res["plz"]) > 150 and len(res["streets"]) > 8000 and len(res["stations"]) > 250
    assert all(res["plz"].values()) and all(res["streets"].values())
    assert any(x[0] == "Ostbahnhof" for x in res["stations"])
    assert isinstance(res["streets"]["Invalidenstraße|Street|Mitte"], list)  # spans several areas
    assert sum(k.startswith("Hauptstraße|Street|") for k in res["streets"]) > 1  # one result per Bezirk
    types = {k.split("|")[1] for k in res["streets"]}
    assert types >= {"Street", "Square", "Water", "Motorway", "Forest"}
    assert "Spandauer See|Water|Spandau" in res["streets"] and "Großer Stern|Square|Charlottenburg-Wilmersdorf" in res["streets"]
    assert any(k.startswith("A 100 BAB Stadtring|Motorway|") for k in res["streets"])
    a.out.write_text(json.dumps(res, ensure_ascii=False, separators=(",", ":")))
    print({k: len(v) for k, v in res.items()}, f"{a.out.stat().st_size / 1e3:.0f} kB")


if __name__ == "__main__":
    main()
