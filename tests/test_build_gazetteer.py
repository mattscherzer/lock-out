import geopandas as gpd
from shapely.geometry import LineString, box

from build_gazetteer import CRS, nest, shares, with_keys

LOR = gpd.GeoDataFrame({"plr_id": ["A", "B"]}, geometry=[box(0, 0, 10, 10), box(10, 0, 20, 10)], crs=CRS)


def streets(rows):
    """rows: (name, strabtypname, bezname, x0, x1) -> a horizontal line from x0 to x1."""
    return gpd.GeoDataFrame(
        [{"strname": n, "strabtypname": t, "bezname": b} for n, t, b, _, _ in rows],
        geometry=[LineString([(x0, 5), (x1, 5)]) for *_, x0, x1 in rows],
        crs=CRS,
    )


def build(rows):
    """{(bezirk, type, name): area ids as [[id, pct], ...] or a bare id} for the given street rows."""
    ids, tree = nest(shares(with_keys(streets(rows)), LOR, "key"))
    decode = lambda v: ids[v] if isinstance(v, int) else [[ids[i], pct] for i, pct in v]
    return {(b, t, n): decode(v) for b, ts in tree.items() for t, ns in ts.items() for n, v in ns.items()}


def test_each_entry_type_gets_its_display_type():
    rows = [
        ("S", "Strasse", "Mitte", 1, 2),
        ("W", "Verwaltungsweg", "Mitte", 1, 2),
        ("Platz", "fiktive Strasse Kreuzung1=Kreuzung2", "Mitte", 1, 2),
        ("See", "Gewässerabschnitt", "Mitte", 1, 2),
        ("A 1", "Autobahnabschnitt", "Mitte", 1, 2),
        ("Wald", "Forstamt/Jagenabschnitt", "Mitte", 1, 2),
        ("X", "Something new", "Mitte", 1, 2),
    ]
    types = {n: t for _, t, n in build(rows)}
    assert types == {"S": "Street", "W": "Street", "Platz": "Square", "See": "Water", "A 1": "Motorway", "Wald": "Forest", "X": "Other"}


def test_name_in_two_bezirke_is_split_and_same_name_other_type_stays_apart():
    out = build([
        ("Hauptstraße", "Strasse", "Pankow", 1, 9),
        ("Hauptstraße", "Strasse", "Spandau", 11, 19),
        ("Hauptstraße", "Gewässerabschnitt", "Pankow", 1, 9),
    ])
    assert out == {("Pankow", "Street", "Hauptstraße"): "A", ("Spandau", "Street", "Hauptstraße"): "B", ("Pankow", "Water", "Hauptstraße"): "A"}


def test_sliver_is_dropped_and_multi_area_keeps_shares():
    out = build([("Lang", "Strasse", "Mitte", 0, 10.3), ("Quer", "Strasse", "Mitte", 5, 15)])
    assert out[("Mitte", "Street", "Lang")] == "A"  # 0.3 of 10.3 is under MIN_SHARE, so one bare id
    assert out[("Mitte", "Street", "Quer")] == [["A", 50], ["B", 50]]
