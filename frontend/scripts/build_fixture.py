"""Build frontend/public fixtures from the LOR GeoJSON (stdlib only).

Writes areas.geojson (simplified boundaries) and lookup_fixture.json
(draft lookup_schema_v1 shape: metadata, risk_bands, areas without predictions).
Run from the repo root: python3 frontend/scripts/build_fixture.py
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
TOL = 0.0002  # degrees, about 15 m


def dp(pts, tol):
    if len(pts) < 3:
        return pts
    (x1, y1), (x2, y2) = pts[0], pts[-1]
    dx, dy = x2 - x1, y2 - y1
    norm = (dx * dx + dy * dy) ** 0.5 or 1e-12
    idx, dmax = 0, 0.0
    for i in range(1, len(pts) - 1):
        d = abs(dy * pts[i][0] - dx * pts[i][1] + x2 * y1 - y2 * x1) / norm
        if d > dmax:
            idx, dmax = i, d
    if dmax <= tol:
        return [pts[0], pts[-1]]
    return dp(pts[: idx + 1], tol)[:-1] + dp(pts[idx:], tol)


def ring(r):
    # closed ring: split at the point farthest from the start so dp has a real baseline
    pts = [[round(x, 5), round(y, 5)] for x, y in r[:-1]]
    k = max(range(len(pts)), key=lambda i: (pts[i][0] - pts[0][0]) ** 2 + (pts[i][1] - pts[0][1]) ** 2)
    out = dp(pts[: k + 1], TOL)[:-1] + dp(pts[k:] + [pts[0]], TOL)
    return out if len(out) >= 4 else None


src = json.loads((ROOT / "data/raw/lor_planungsraeume_2021.geojson").read_text())
schema = json.loads((ROOT / "data/processed/lookup_schema_v1.json").read_text())

features, areas = [], {}
for f in src["features"]:
    p = f["properties"]
    polys = []
    for poly in f["geometry"]["coordinates"]:
        rings = [ring(r) for r in poly]
        if rings[0]:
            polys.append([r for r in rings if r])
    features.append({"type": "Feature", "properties": {"id": p["plr_id"]},
                     "geometry": {"type": "MultiPolygon", "coordinates": polys}})
    areas[p["plr_id"]] = {"name": p["plr_name"], "bzr_id": p["bzr_id"], "bzr_name": p["bzr_name"]}

assert len(features) == 542 and len(areas) == 542
out = ROOT / "frontend/public"
(out / "areas.geojson").write_text(json.dumps({"type": "FeatureCollection", "features": features}, separators=(",", ":")))
fixture = {"metadata": schema["metadata"], "risk_bands": schema["risk_bands"], "areas": areas}
(out / "lookup_fixture.json").write_text(json.dumps(fixture, ensure_ascii=False, indent=1))
