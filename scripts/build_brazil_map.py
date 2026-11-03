#!/usr/bin/env python3
"""Build data/brazil_map.json, the outline used by the talks map.

Source: Natural Earth 1:50m admin-1 states and provinces (public domain),
https://www.naturalearthdata.com/. Only needs to run again to change the
drawing (detail or projection); new cities go in data/talk_locations.yaml.

    curl -sSLO https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_1_states_provinces.geojson
    python3 scripts/build_brazil_map.py ne_50m_admin_1_states_provinces.geojson

Projection: equirectangular, x stretched by cos(15 deg) so Brazil keeps its
shape. The template (layouts/_partials/talk-map.html) uses the same numbers,
saved in the "projection" key of the output.
"""
import json
import math
import sys

TOLERANCE = 0.04  # degrees; Douglas-Peucker simplification
PAD = 10
SCALE = 20  # map units per degree of latitude
KX = SCALE * math.cos(math.radians(15))


def simplify(points, tol):
    if len(points) < 3:
        return points
    (x1, y1), (x2, y2) = points[0], points[-1]
    dx, dy = x2 - x1, y2 - y1
    norm = math.hypot(dx, dy) or 1e-12
    best, index = 0.0, 0
    for i in range(1, len(points) - 1):
        px, py = points[i]
        dist = abs(dy * px - dx * py + x2 * y1 - y2 * x1) / norm
        if dist > best:
            best, index = dist, i
    if best <= tol:
        return [points[0], points[-1]]
    return simplify(points[: index + 1], tol)[:-1] + simplify(points[index:], tol)


def rings(geometry):
    if geometry["type"] == "Polygon":
        return [geometry["coordinates"][0]]
    return [poly[0] for poly in geometry["coordinates"]]


def main(path):
    data = json.load(open(path, encoding="utf-8"))
    states = [f for f in data["features"] if f["properties"].get("adm0_a3") == "BRA"]
    lons = [p[0] for f in states for r in rings(f["geometry"]) for p in r]
    lats = [p[1] for f in states for r in rings(f["geometry"]) for p in r]
    lon0, lat0 = min(lons), max(lats)
    width = round((max(lons) - lon0) * KX + 2 * PAD)
    height = round((lat0 - min(lats)) * SCALE + 2 * PAD)

    def xy(lon, lat):
        return (lon - lon0) * KX + PAD, (lat0 - lat) * SCALE + PAD

    out = []
    for f in sorted(states, key=lambda f: f["properties"]["postal"]):
        parts = []
        for ring in rings(f["geometry"]):
            # A closed ring starts and ends on the same point: split it in two
            # at the point farthest from the start, then simplify each half.
            far = max(range(len(ring)), key=lambda i: math.dist(ring[0], ring[i]))
            simple = simplify(ring[: far + 1], TOLERANCE)[:-1] + simplify(ring[far:], TOLERANCE)
            if len(simple) < 4:
                continue
            pts = [xy(*p) for p in simple]
            parts.append("M" + "L".join(f"{x:.1f} {y:.1f}" for x, y in pts) + "Z")
        out.append({"uf": f["properties"]["postal"], "name": f["properties"]["name"], "d": "".join(parts)})

    result = {
        "source": "Natural Earth 1:50m admin-1 (public domain), simplified by scripts/build_brazil_map.py",
        "width": width,
        "height": height,
        "projection": {"lon0": round(lon0, 4), "lat0": round(lat0, 4), "kx": round(KX, 4), "ky": SCALE, "pad": PAD},
        "states": out,
    }
    with open("data/brazil_map.json", "w", encoding="utf-8") as fh:
        json.dump(result, fh, ensure_ascii=False, indent=1)
        fh.write("\n")
    print(f"{len(out)} states, {width}x{height}")


if __name__ == "__main__":
    main(sys.argv[1])
