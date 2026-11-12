import type { FeatureCollection, Position } from "geojson";

type Ring = Position[];
type Shape = {
  id: string;
  bbox: [west: number, south: number, east: number, north: number];
  polygons: Ring[][];
};

type Where = "outside" | "inside" | "edge";

// Ray casting, with an edge test so a point on a shared border is not decided by rounding.
function inRing(ring: Ring, lon: number, lat: number): Where {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [x1, y1] = ring[j];
    const [x2, y2] = ring[i];
    const cross = (lon - x1) * (y2 - y1) - (lat - y1) * (x2 - x1);
    const within = lon >= Math.min(x1, x2) && lon <= Math.max(x1, x2) && lat >= Math.min(y1, y2) && lat <= Math.max(y1, y2); // prettier-ignore
    if (cross === 0 && within) return "edge";
    if (y1 > lat !== y2 > lat && lon < ((x2 - x1) * (lat - y1)) / (y2 - y1) + x1) inside = !inside;
  }
  return inside ? "inside" : "outside";
}

// The outer ring (edge included) minus the inside of the holes: a hole's edge still belongs to the polygon.
const inPolygon = ([outer, ...holes]: Ring[], lon: number, lat: number) =>
  inRing(outer, lon, lat) !== "outside" && !holes.some((h) => inRing(h, lon, lat) === "inside");

function toShape(id: string, polygons: Ring[][]): Shape {
  const all = polygons.flatMap((p) => p[0]);
  const lons = all.map((p) => p[0]);
  const lats = all.map((p) => p[1]);
  return {
    id,
    bbox: [Math.min(...lons), Math.min(...lats), Math.max(...lons), Math.max(...lats)],
    polygons,
  };
}

/**
 * The id of the planning area that holds a position, or null for a position in none of them.
 * Built once from the polygons the map already loaded; a point on a shared border goes to the first area in the file.
 */
export function buildAreaFinder(
  areas: FeatureCollection,
): (lat: number, lon: number) => string | null {
  const shapes: Shape[] = [];
  for (const { properties, geometry } of areas.features) {
    const id = properties?.id;
    if (typeof id !== "string") continue;
    if (geometry?.type === "Polygon") shapes.push(toShape(id, [geometry.coordinates]));
    else if (geometry?.type === "MultiPolygon") shapes.push(toShape(id, geometry.coordinates));
  }
  return (lat, lon) => {
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
    const hit = shapes.find(
      ({ bbox: [w, s, e, n], polygons }) =>
        lon >= w &&
        lon <= e &&
        lat >= s &&
        lat <= n &&
        polygons.some((p) => inPolygon(p, lon, lat)),
    );
    return hit?.id ?? null;
  };
}
