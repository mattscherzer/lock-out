"""Build frontend/public files from the LOR GeoJSON.

Writes areas.geojson (simplified boundaries) and lookup_schema_v1.json, a copy of the generator output
data/processed/lookup_schema_v1.json, so the copy follows schemas/lookup_v1.schema.json (checked in pytest).
Run from the repo root after lockout.cli.build_lookup: uv run python -m lockout.cli.build_public
"""
import json

from lockout.geo.simplify import simplify_ring
from lockout.paths import LOOKUP, POLYGONS, PUBLIC_AREAS, PUBLIC_LOOKUP


def main():
    src = json.loads(POLYGONS.read_text(encoding="utf-8"))
    lookup = json.loads(LOOKUP.read_text(encoding="utf-8"))

    features, dropped = [], 0
    for f in src["features"]:
        p = f["properties"]
        polys = []
        for poly in f["geometry"]["coordinates"]:
            rings = [simplify_ring(r) for r in poly]
            if rings[0]:  # outer ring collapsed below 4 points: drop the part, holes included
                polys.append([r for r in rings if r])
            else:
                dropped += 1
        features.append({"type": "Feature", "properties": {"id": p["plr_id"]},
                         "geometry": {"type": "MultiPolygon", "coordinates": polys}})

    print(f"dropped {dropped} collapsed polygon parts")
    assert len(features) == 542 and len(lookup["areas"]) == 542
    assert {f["properties"]["id"] for f in features} == set(lookup["areas"])
    PUBLIC_AREAS.write_text(json.dumps({"type": "FeatureCollection", "features": features}, separators=(",", ":")), encoding="utf-8")
    PUBLIC_LOOKUP.write_text(json.dumps(lookup, ensure_ascii=False, indent=1), encoding="utf-8")


if __name__ == "__main__":
    main()
