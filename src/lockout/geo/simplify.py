"""Boundary simplification for the frontend map (stdlib only)."""

TOL = 0.0002  # degrees, about 15 m


def simplify_line(pts: list[list[float]], tol: float) -> list[list[float]]:
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
    return simplify_line(pts[: idx + 1], tol)[:-1] + simplify_line(pts[idx:], tol)


def simplify_ring(r: list[list[float]]) -> list[list[float]] | None:
    # closed ring: split at the point farthest from the start so simplify_line has a real baseline
    pts = [[round(x, 5), round(y, 5)] for x, y in r[:-1]]
    k = max(range(len(pts)), key=lambda i: (pts[i][0] - pts[0][0]) ** 2 + (pts[i][1] - pts[0][1]) ** 2)
    out = simplify_line(pts[: k + 1], TOL)[:-1] + simplify_line(pts[k:] + [pts[0]], TOL)
    return out if len(out) >= 4 else None
