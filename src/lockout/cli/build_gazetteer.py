"""Build the place-search lookup (postcode, street, station -> planning areas) for the frontend.

Inputs, all downloaded into one directory (default data/raw/gazetteer/, git-ignored):
  plz.json     WFS https://gdi.berlin.de/services/wfs/postleitzahlen  typeNames=postleitzahlen:postleitzahlen
  strab.json   WFS https://gdi.berlin.de/services/wfs/rbs_strab       typeNames=rbs_strab:rbs_strab
               (both outputFormat=application/json&srsName=EPSG:4326; CC-BY-3.0, Amt fuer Statistik Berlin-Brandenburg)
  stops.txt    stops.txt from the VBB GTFS zip https://www.vbb.de/gtfs
Output, two files in frontend/public/:
  gazetteer.json          loaded with the page
    plz:       postcode -> [[lor_id, share_pct], ...] sorted by share, slivers dropped
    stations:  [[display name, kind, lor_id, lat, lon], ...]
  gazetteer_streets.json  fetched on the first search (the bulk of the bytes)
    ids:       [lor_id, ...] every area id used below, sorted; areas refer to it by index
    streets:   {bezirk: {type: {name: areas}}}
               type is the display type: Street, Square, Water, Motorway, Forest or Other.
               areas is [[ids_index, share_pct], ...]: share of length, largest first, slivers dropped.
               One name in several Bezirke, or under several types, is one entry per Bezirk and type.

Run from the repo root: uv run python -m lockout.cli.build_gazetteer [--src DIR] [--out FILE]
"""
import argparse
import json
from pathlib import Path

import geopandas as gpd
import pandas as pd

from lockout.geo.gazetteer import CRS, nest, shares, stations, with_keys
from lockout.paths import GAZETTEER, GAZETTEER_SRC, POLYGONS


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", type=Path, default=GAZETTEER_SRC)
    ap.add_argument("--out", type=Path, default=GAZETTEER)
    a = ap.parse_args()

    lor = gpd.read_file(POLYGONS).to_crs(CRS)
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
