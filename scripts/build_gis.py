"""
Kyrgyzstan Geography Explorer — GIS data pipeline.

Builds every geographic layer used by the site from open data:
  * Natural Earth 10m (public domain): country border, oblasts, Issyk-Kul & Toktogul
    polygons, glaciated areas, peaks, cities.
  * AWS Terrain Tiles / Terrarium (Mapzen; SRTM, GMTED, ETOPO): elevation model.

Derived layers (all computed, never drawn by hand):
  * hydrography: priority-flood depression filling + D8 flow directions + flow
    accumulation; named rivers are traced up/downstream from a gauge/town point that
    lies on the river; the unnamed network = cells with catchment > threshold.
  * mountain ridges: crest line = DEM maximum searched across an approximate axis.
  * lakes Son-Kul / Chatyr-Kul: flat water surface grown from a seed point.
  * altitudinal belts raster: DEM classified by belt limits (see VEG_BELTS).
  * hillshade raster, heightmap for the 3D model.

Usage: python3 -I build_gis.py <natural_earth_dir> <dem_tiles_dir> <out_dir>
"""
import heapq
import json
import math
import os
import sys

import numpy as np
from PIL import Image, ImageDraw
from shapely.geometry import LineString, Point, mapping, shape
from shapely.ops import unary_union

NE, DEMDIR, OUT = sys.argv[1:4]
os.makedirs(OUT, exist_ok=True)
Z, X0, X1, Y0, Y1 = 8, 177, 185, 93, 97
TS = 256
W, H = (X1 - X0 + 1) * TS, (Y1 - Y0 + 1) * TS


def load(n):
    with open(os.path.join(NE, n + '.geojson')) as f:
        return json.load(f)


# ---------- projection helpers (web mercator pixel space of the mosaic) ----------
N = 2 ** Z * TS


def lonlat_to_px(lon, lat):
    x = (lon + 180) / 360 * N - X0 * TS
    r = math.radians(lat)
    y = (1 - math.log(math.tan(r) + 1 / math.cos(r)) / math.pi) / 2 * N - Y0 * TS
    return x, y


def px_to_lonlat(x, y):
    lon = (x + X0 * TS) / N * 360 - 180
    n = math.pi - 2 * math.pi * (y + Y0 * TS) / N
    lat = math.degrees(math.atan(math.sinh(n)))
    return lon, lat


WEST, NORTH = px_to_lonlat(0, 0)
EAST, SOUTH = px_to_lonlat(W, H)
print('mosaic', W, H, 'bounds', WEST, SOUTH, EAST, NORTH)

# ---------- DEM mosaic ----------
dem = np.zeros((H, W), dtype=np.float32)
for tx in range(X0, X1 + 1):
    for ty in range(Y0, Y1 + 1):
        a = np.asarray(Image.open(os.path.join(DEMDIR, f'z8_{tx}_{ty}.png')).convert('RGB')).astype(np.float32)
        e = a[..., 0] * 256 + a[..., 1] + a[..., 2] / 256 - 32768
        dem[(ty - Y0) * TS:(ty - Y0 + 1) * TS, (tx - X0) * TS:(tx - X0 + 1) * TS] = e
print('dem range', dem.min(), dem.max())

# ---------- vectors from Natural Earth ----------
countries = load('ne_10m_admin_0_countries')
kg_feat = [f for f in countries['features'] if f['properties']['ADM0_A3'] == 'KGZ'][0]
KG = shape(kg_feat['geometry'])
KGBUF = KG.buffer(0.02)
print('KG area deg2', KG.area, 'bounds', KG.bounds)


def rnd(coords, p=4):
    if isinstance(coords[0], (int, float)):
        return [round(coords[0], p), round(coords[1], p)]
    return [rnd(c, p) for c in coords]


def feat(geom, props):
    g = mapping(geom)
    return {'type': 'Feature', 'properties': props, 'geometry': {'type': g['type'], 'coordinates': rnd(g['coordinates'])}}


def fc(features):
    return {'type': 'FeatureCollection', 'features': features}


def dump(name, obj):
    with open(os.path.join(OUT, name), 'w') as f:
        json.dump(obj, f, ensure_ascii=False, separators=(',', ':'))
    print('wrote', name, os.path.getsize(os.path.join(OUT, name)) // 1024, 'KB')


dump('country.json', fc([feat(KG.simplify(0.003), {'id': 'KG'})]))

# neighbours (for context shading)
nb = []
for f in countries['features']:
    if f['properties']['ADM0_A3'] in ('KAZ', 'UZB', 'TJK', 'CHN'):
        g = shape(f['geometry']).intersection(KG.envelope.buffer(1.5)).simplify(0.01)
        if not g.is_empty:
            nb.append(feat(g, {'iso': f['properties']['ADM0_A3']}))
dump('neighbours.json', fc(nb))

adm = load('ne_10m_admin_1_states_provinces')
ID = {'KG-C': 'chuy', 'KG-T': 'talas', 'KG-Y': 'issykkul', 'KG-N': 'naryn', 'KG-J': 'jalalabad',
      'KG-O': 'osh', 'KG-B': 'batken', 'KG-GB': 'bishkek'}
regions = []
for f in adm['features']:
    p = f['properties']
    if p['adm0_a3'] == 'KGZ':
        g = shape(f['geometry']).intersection(KG).simplify(0.003)
        regions.append(feat(g, {'id': ID[p['iso_3166_2']], 'iso': p['iso_3166_2']}))
dump('regions.json', fc(regions))

lakes_ne = load('ne_10m_lakes')
lakes = []
for f in lakes_ne['features']:
    nm = f['properties'].get('name')
    if nm == 'Issyk-Kul':
        lakes.append(feat(shape(f['geometry']).simplify(0.002), {'id': 'issykkul', 'kind': 'lake'}))
    if nm == 'Toktogul Suu Saktagychy':
        lakes.append(feat(shape(f['geometry']).simplify(0.002), {'id': 'toktogul', 'kind': 'reservoir'}))

glac = load('ne_10m_glaciated_areas')
gl = [shape(f['geometry']).intersection(KGBUF) for f in glac['features']]
gl = unary_union([g for g in gl if not g.is_empty]).simplify(0.004)
dump('glaciers.json', fc([feat(gl, {'id': 'glaciers'})]))

# ---------- raster masks ----------
def raster_mask(geom):
    im = Image.new('L', (W, H), 0)
    d = ImageDraw.Draw(im)
    polys = [geom] if geom.geom_type == 'Polygon' else list(geom.geoms)
    for pg in polys:
        d.polygon([lonlat_to_px(x, y) for x, y in pg.exterior.coords], fill=1)
        for hole in pg.interiors:
            d.polygon([lonlat_to_px(x, y) for x, y in hole.coords], fill=0)
    return np.asarray(im).astype(bool)


kgmask = raster_mask(KG)
kgbufmask = raster_mask(KG.buffer(0.06))
issyk = shape([f for f in lakes_ne['features'] if f['properties'].get('name') == 'Issyk-Kul'][0]['geometry'])
issykmask = raster_mask(issyk)

# ---------- lakes grown from the DEM water surface ----------
def grow_lake(lon, lat, tol=1.5):
    x, y = lonlat_to_px(lon, lat)
    x, y = int(round(x)), int(round(y))
    # choose the flattest nearby pixel as the seed
    best = None
    for dy in range(-3, 4):
        for dx in range(-3, 4):
            yy, xx = y + dy, x + dx
            win = dem[yy - 1:yy + 2, xx - 1:xx + 2]
            s = float(win.max() - win.min())
            if best is None or s < best[0]:
                best = (s, yy, xx)
    _, y, x = best
    lvl = dem[y, x]
    seen = np.zeros_like(kgmask)
    st = [(y, x)]
    seen[y, x] = True
    while st:
        cy, cx = st.pop()
        for ny, nx in ((cy + 1, cx), (cy - 1, cx), (cy, cx + 1), (cy, cx - 1)):
            if 0 <= ny < H and 0 <= nx < W and not seen[ny, nx] and abs(dem[ny, nx] - lvl) <= tol:
                seen[ny, nx] = True
                st.append((ny, nx))
    ys, xs = np.nonzero(seen)
    from shapely.geometry import box
    cells = [box(*px_to_lonlat(cx, cy + 1), *px_to_lonlat(cx + 1, cy)) for cy, cx in zip(ys, xs)]
    poly = unary_union(cells).buffer(0.002).buffer(-0.002).simplify(0.004)
    print('lake', lon, lat, 'level', lvl, 'cells', len(xs), 'area km2 ~', round(len(xs) * (40075 / N) ** 2 * math.cos(math.radians(lat)) ** 2 * 1, 1))
    return poly, float(lvl), seen


son_poly, son_lvl, son_mask = grow_lake(75.13, 41.83)
chat_poly, chat_lvl, chat_mask = grow_lake(75.30, 40.62)
lakes.append(feat(son_poly, {'id': 'songkol', 'kind': 'lake', 'dem_level': round(son_lvl)}))
lakes.append(feat(chat_poly, {'id': 'chatyrkol', 'kind': 'lake', 'dem_level': round(chat_lvl)}))
dump('lakes.json', fc(lakes))

# ---------- hydrology: priority flood + D8 ----------
print('priority flood ...')
sink = issykmask | chat_mask          # endorheic lakes act as outlets
filled = dem.copy().astype(np.float64)
done = np.zeros((H, W), dtype=bool)
heap = []
cnt = 0
for y in range(H):
    for x in range(W):
        if y == 0 or x == 0 or y == H - 1 or x == W - 1 or sink[y, x]:
            heapq.heappush(heap, (filled[y, x], cnt, y, x))
            cnt += 1
            done[y, x] = True
NB = [(-1, -1), (-1, 0), (-1, 1), (0, -1), (0, 1), (1, -1), (1, 0), (1, 1)]
fdir = np.full((H, W), -1, dtype=np.int8)  # index into NB of the downstream cell
EPS = 1e-4
while heap:
    e, _, y, x = heapq.heappop(heap)
    for k, (dy, dx) in enumerate(NB):
        ny, nx = y + dy, x + dx
        if 0 <= ny < H and 0 <= nx < W and not done[ny, nx]:
            done[ny, nx] = True
            if filled[ny, nx] <= e:
                filled[ny, nx] = e + EPS
            fdir[ny, nx] = 7 - k  # neighbour drains back towards (y,x)
            cnt += 1
            heapq.heappush(heap, (filled[ny, nx], cnt, ny, nx))
print('accumulation ...')
order = np.argsort(-filled, axis=None)
acc = np.ones(H * W, dtype=np.float64)
fd = fdir.ravel()
DY = np.array([d[0] for d in NB])
DX = np.array([d[1] for d in NB])
for idx in order:
    k = fd[idx]
    if k < 0:
        continue
    y, x = divmod(idx, W)
    acc[(y + DY[k]) * W + x + DX[k]] += acc[idx]
acc = acc.reshape(H, W)
# cell area in km2 at the mosaic latitude
lat_c = 41.5
cell_km2 = (40075 / N * math.cos(math.radians(lat_c))) ** 2
print('cell km2', cell_km2)


def down(y, x):
    k = fdir[y, x]
    if k < 0:
        return None
    return y + NB[k][0], x + NB[k][1]


def ups(y, x):
    r = []
    for k, (dy, dx) in enumerate(NB):
        ny, nx = y + dy, x + dx
        if 0 <= ny < H and 0 <= nx < W and fdir[ny, nx] >= 0:
            if (ny + NB[fdir[ny, nx]][0], nx + NB[fdir[ny, nx]][1]) == (y, x):
                r.append((ny, nx))
    return r


def snap(lon, lat, r=4):
    x, y = lonlat_to_px(lon, lat)
    x, y = int(round(x)), int(round(y))
    win = acc[y - r:y + r + 1, x - r:x + r + 1]
    iy, ix = np.unravel_index(np.argmax(win), win.shape)
    return y - r + iy, x - r + ix


def region_max(lon0, lat0, lon1, lat1):
    xa, ya = lonlat_to_px(lon0, lat1)
    xb, yb = lonlat_to_px(lon1, lat0)
    xa, ya, xb, yb = int(xa), int(ya), int(xb), int(yb)
    win = np.where(kgmask[ya:yb, xa:xb], acc[ya:yb, xa:xb], 0)
    iy, ix = np.unravel_index(np.argmax(win), win.shape)
    return ya + iy, xa + ix


def trace(y, x, stop_ratio=None, min_up_km2=25):
    # downstream
    dn = []
    cy, cx = y, x
    a0 = acc[y, x]
    while True:
        nx_ = down(cy, cx)
        if nx_ is None:
            break
        ny, nx = nx_
        if sink[ny, nx]:
            dn.append((ny, nx))
            break
        if not kgbufmask[ny, nx]:
            dn.append((ny, nx))
            break
        if stop_ratio and acc[ny, nx] > stop_ratio * acc[cy, cx] and acc[cy, cx] > a0 * 0.5:
            dn.append((ny, nx))  # joined a larger river
            break
        dn.append((ny, nx))
        cy, cx = ny, nx
    # upstream following the largest branch
    up = []
    cy, cx = y, x
    while True:
        u = ups(cy, cx)
        if not u:
            break
        ny, nx = max(u, key=lambda p: acc[p])
        if acc[ny, nx] * cell_km2 < min_up_km2:
            break
        up.append((ny, nx))
        cy, cx = ny, nx
    pts = list(reversed(up)) + [(y, x)] + dn
    coords = [px_to_lonlat(px + 0.5, py + 0.5) for py, px in pts]
    line = LineString(coords).simplify(0.006)
    basin = float(acc[pts[-2] if len(pts) > 1 else pts[-1]] * cell_km2)
    src = coords[0]
    return line, basin, src, coords[-1], float(dem[pts[0]]), float(dem[pts[-1]])


RIVERS = [
    # id, seed (lon, lat) on the river (town / gauge), stop when joining larger river?
    ('naryn', ('pt', 76.00, 41.43), None),
    ('chuy', ('pt', 75.78, 42.56), None),
    ('talas', ('pt', 72.24, 42.52), None),
    ('karadarya', ('pt', 73.30, 40.77), None),
    ('chatkal', ('box', 70.3, 41.3, 71.6, 42.0), None),
    ('kyzylsuu', ('pt', 72.20, 39.55), None),
    ('akbuura', ('pt', 72.80, 40.53), None),
    ('atbashy', ('box', 75.2, 40.95, 76.6, 41.16), 3.0),
    ('kokomeren', ('pt', 73.98, 42.15), 3.0),
    ('saryjaz', ('box', 78.6, 41.6, 80.3, 42.4), None),
]
rivers = []
for rid, seed, stop in RIVERS:
    if seed[0] == 'pt':
        y, x = snap(seed[1], seed[2])
    else:
        y, x = region_max(*seed[1:])
    line, basin, src, mouth, e0, e1 = trace(y, x, stop)
    line = line.intersection(KG.buffer(0.08))
    if line.geom_type == 'MultiLineString':
        line = max(line.geoms, key=lambda g: g.length)
    km = line.length * 111 * math.cos(math.radians(41.5)) * 1.1
    print(f'river {rid}: snapped acc {acc[y, x] * cell_km2:.0f} km2, len in KG ~{km:.0f} km, src {src} z {e0:.0f}, end {mouth} z {e1:.0f}')
    rivers.append(feat(line, {'id': rid, 'src_elev': round(e0), 'end_elev': round(e1)}))
dump('rivers.json', fc(rivers))

# unnamed network: catchment > 600 km2
print('network ...')
TH = 600 / cell_km2
strm = (acc > TH) & kgmask & ~issykmask
segs = []
vis = np.zeros_like(strm)
heads = [(y, x) for y, x in zip(*np.nonzero(strm)) if not any(strm[p] for p in ups(y, x))]
for y, x in heads:
    pts = [(y, x)]
    cy, cx = y, x
    while True:
        n = down(cy, cx)
        if n is None:
            break
        pts.append(n)
        if vis[n] or not strm[n]:
            break
        vis[n] = True
        cy, cx = n
    if len(pts) > 2:
        c = [px_to_lonlat(px + 0.5, py + 0.5) for py, px in pts]
        o = float(acc[pts[-1]] * cell_km2)
        segs.append(feat(LineString(c).simplify(0.006), {'o': 3 if o > 8000 else 2 if o > 2500 else 1}))
dump('streams.json', fc(segs))

# ---------- ridges: crest search across approximate axes ----------
sm = dem.copy()
for _ in range(5):
    sm = (sm + np.roll(sm, 1, 0) + np.roll(sm, -1, 0) + np.roll(sm, 1, 1) + np.roll(sm, -1, 1)) / 5
RIDGES = {
    'kyrgyz': [(72.95, 42.50), (73.8, 42.58), (74.6, 42.58), (75.5, 42.62)],
    'kungey': [(76.3, 42.85), (77.2, 42.95), (78.0, 43.0), (78.7, 42.98)],
    'terskey': [(76.3, 42.05), (77.2, 42.08), (78.0, 42.15), (78.8, 42.3), (79.3, 42.45)],
    'talas': [(71.3, 42.25), (72.2, 42.25), (73.0, 42.2), (73.4, 42.1)],
    'chatkal': [(70.6, 41.2), (71.2, 41.55), (71.7, 41.85), (72.2, 42.05)],
    'fergana': [(73.1, 41.55), (73.7, 41.15), (74.3, 40.8), (74.8, 40.45)],
    'alay': [(70.3, 39.85), (71.2, 39.85), (72.2, 39.85), (73.2, 39.75)],
    'transalay': [(72.2, 39.33), (72.9, 39.35), (73.6, 39.38)],
    'turkestan': [(69.4, 39.65), (70.0, 39.62), (70.6, 39.6)],
    'kokshaal': [(75.6, 40.45), (76.6, 40.65), (77.6, 40.95), (78.6, 41.35), (79.6, 41.8), (80.1, 42.0)],
    'atbashy': [(75.0, 40.95), (75.8, 41.02), (76.5, 41.08)],
    'narynto': [(75.8, 41.32), (76.5, 41.35), (77.2, 41.4)],
    'moldoto': [(74.6, 41.65), (75.1, 41.65), (75.6, 41.7)],
}
ridges = []
for rid, axis in RIDGES.items():
    ax = LineString(axis)
    n = max(8, int(ax.length / 0.03))
    S = np.linspace(-0.2, 0.2, 41)
    rows = []
    for i in range(n + 1):
        p = ax.interpolate(i / n, normalized=True)
        q = ax.interpolate(min(1, i / n + 0.01), normalized=True)
        r_ = ax.interpolate(max(0, i / n - 0.01), normalized=True)
        dx, dy = q.x - r_.x, q.y - r_.y
        L = math.hypot(dx, dy) or 1
        nx_, ny_ = -dy / L, dx / L
        row = []
        for s_ in S:
            lon, lat = p.x + nx_ * s_, p.y + ny_ * s_
            x, y = lonlat_to_px(lon, lat)
            e = float(sm[int(y), int(x)]) if 0 <= x < W and 0 <= y < H else -9999
            row.append((e - abs(s_) * 600, lon, lat, e))
        rows.append(row)
    K = len(S)
    score = [r[0] for r in rows[0]]
    back = []
    for i in range(1, len(rows)):
        ns, bk = [], []
        for k in range(K):
            best = max(range(K), key=lambda j: score[j] - 60 * (j - k) ** 2)
            ns.append(score[best] - 60 * (best - k) ** 2 + rows[i][k][0])
            bk.append(best)
        score = ns
        back.append(bk)
    k = max(range(K), key=lambda j: score[j])
    path = [k]
    for bk in reversed(back):
        k = bk[k]
        path.append(k)
    path.reverse()
    crest = [rows[i][path[i]] for i in range(len(rows))]
    coords = [(c[1], c[2]) for c in crest]
    # smooth the crest polyline
    cs = [coords[0]] + [((coords[i - 1][0] + coords[i][0] + coords[i + 1][0]) / 3, (coords[i - 1][1] + coords[i][1] + coords[i + 1][1]) / 3) for i in range(1, len(coords) - 1)] + [coords[-1]]
    mx = max(c[3] for c in crest)
    mean = sum(c[3] for c in crest) / len(crest)
    print(f'ridge {rid}: crest max {mx:.0f} mean {mean:.0f}')
    rl = LineString(cs).simplify(0.008).intersection(KG.buffer(0.04))
    if rl.geom_type == 'MultiLineString':
        rl = max(rl.geoms, key=lambda g: g.length)
    ridges.append(feat(rl, {'id': rid, 'dem_max': round(mx), 'dem_mean': round(mean)}))
dump('ridges.json', fc(ridges))

# peaks & cities from NE
peaks = []
for f in load('ne_10m_geography_regions_elevation_points')['features']:
    g = shape(f['geometry'])
    if g.within(KG.buffer(0.1)) and f['properties'].get('name'):
        peaks.append(feat(g, {'name_en': f['properties']['name'], 'elev': f['properties']['elevation']}))
dump('peaks_ne.json', fc(peaks))
cities = []
for f in load('ne_10m_populated_places_simple')['features']:
    if f['properties']['adm0_a3'] == 'KGZ':
        p = f['properties']
        cities.append(feat(shape(f['geometry']), {'name_en': p['name'], 'pop_ne': p['pop_max']}))
dump('cities_ne.json', fc(cities))

# ---------- rasters ----------
x0, y0 = map(int, lonlat_to_px(KG.bounds[0] - 0.3, KG.bounds[3] + 0.3))
x1, y1 = map(int, lonlat_to_px(KG.bounds[2] + 0.3, KG.bounds[1] - 0.3))
x0, y0 = max(0, x0), max(0, y0)
x1, y1 = min(W, x1), min(H, y1)
cw, ch = x1 - x0, y1 - y0
crop_w, crop_n = px_to_lonlat(x0, y0)
crop_e, crop_s = px_to_lonlat(x1, y1)
bounds = [[round(crop_s, 5), round(crop_w, 5)], [round(crop_n, 5), round(crop_e, 5)]]
d = dem[y0:y1, x0:x1]
m = kgmask[y0:y1, x0:x1]

# hillshade (sun from NW, 45 deg)
gy, gx = np.gradient(d, 600.0)
slope = np.arctan(np.hypot(gx, gy) * 1.6)
aspect = np.arctan2(-gx, gy)
az, alt = math.radians(315), math.radians(45)
hs = np.sin(alt) * np.cos(slope) + np.cos(alt) * np.sin(slope) * np.cos(az - aspect)
hs = np.clip(hs, 0, 1)

# hypsometric tint (relief layer) — public/rasters/relief.png
STOPS = [(0, (86, 140, 92)), (500, (124, 168, 103)), (1000, (196, 200, 132)), (1500, (222, 205, 147)),
         (2000, (205, 170, 120)), (2500, (178, 134, 96)), (3000, (150, 108, 82)), (3500, (164, 140, 128)),
         (4000, (200, 190, 186)), (4500, (232, 232, 236)), (7500, (255, 255, 255))]


def tint(e):
    out = np.zeros(e.shape + (3,), np.float32)
    for (a, ca), (b, cb) in zip(STOPS[:-1], STOPS[1:]):
        t = np.clip((e - a) / (b - a), 0, 1)[..., None]
        sel = ((e >= a) & (e < b))[..., None]
        out = np.where(sel, np.array(ca) * (1 - t) + np.array(cb) * t, out)
    return out


water = (issykmask | son_mask | chat_mask)[y0:y1, x0:x1]
col = tint(d) * (0.55 + 0.6 * hs[..., None])
col = np.where(water[..., None], np.array([72, 140, 200]), col)
rgba = np.dstack([np.clip(col, 0, 255), np.where(m, 235, 0)]).astype(np.uint8)
pub = os.path.join(OUT, '..', '..', '..', 'public', 'rasters')
os.makedirs(pub, exist_ok=True)
Image.fromarray(rgba, 'RGBA').save(os.path.join(pub, 'relief.webp'), quality=82, method=6)

# altitudinal belts (vegetation) — thresholds from VEG_BELTS, northern/southern variants
# south (Fergana / Alay side) belts are ~200-300 m higher; latitude switch at 41.2 N.
lat_grid = np.array([px_to_lonlat(0, yy)[1] for yy in range(y0, y1)])[:, None] * np.ones((1, cw))
south = lat_grid < 41.2
shift = np.where(south, 300, 0)
belts = np.select(
    [d < 1200 + shift, d < 1800 + shift, d < 2800 + shift, d < 3300 + shift, d < 3700 + shift],
    [1, 2, 3, 4, 5], 6)
BCOL = {1: (214, 190, 128), 2: (190, 205, 120), 3: (70, 140, 85), 4: (130, 185, 110), 5: (165, 205, 165), 6: (238, 242, 248)}
bimg = np.zeros((ch, cw, 4), np.uint8)
for k, c in BCOL.items():
    bimg[belts == k, :3] = c
bimg[..., :3] = (bimg[..., :3] * (0.7 + 0.4 * hs[..., None])).clip(0, 255)
bimg[water, :3] = (72, 140, 200)
bimg[..., 3] = np.where(m, 210, 0)
Image.fromarray(bimg, 'RGBA').save(os.path.join(pub, 'belts.webp'), quality=82, method=6)

# forest-type potential areas (teaching model): DEM belt x literature region x slope aspect
lon_grid = np.array([px_to_lonlat(xx, 0)[0] for xx in range(x0, x1)])[None, :] * np.ones((ch, 1))
gmag = np.hypot(gx, gy) + 1e-9
north = gy / gmag > 0.34            # slope faces north (elevation grows southward)
nonnorth = gy / gmag < 0.3
steep = np.degrees(np.arctan(gmag)) > 4


def ell(cx, cy, rx, ry, ang=0.0):
    """rotated ellipse in lon/lat degrees (soft region instead of a hard box)"""
    t = math.radians(ang)
    dx, dy = lon_grid - cx, lat_grid - cy
    u = dx * math.cos(t) + dy * math.sin(t)
    v = -dx * math.sin(t) + dy * math.cos(t)
    return (u / rx) ** 2 + (v / ry) ** 2 <= 1


acc_c = acc[y0:y1, x0:x1] * cell_km2
fz = np.zeros((ch, cw), np.uint8)
# regions after Golovkova (1990) / Atlas KirgSSR (1987), generalised to ellipses
juniper = steep & ~north & (
    (ell(71.2, 39.9, 2.6, 0.5) & (d > 1500) & (d < 3500))            # Turkestan & Alay ranges (south)
    | (ell(74.0, 40.85, 1.2, 0.5, -32) & (d > 2000) & (d < 3200))    # Fergana range
    | (ell(74.4, 42.5, 1.1, 0.22) & (d > 2600) & (d < 3300)))        # Kyrgyz range (upper border)
spruce = steep & north & (d > 1800) & (d < 3000) & (
    ell(77.2, 42.45, 2.6, 0.7) | ell(74.4, 42.55, 1.2, 0.25) | ell(75.6, 41.6, 1.7, 0.45) | ell(74.1, 41.2, 0.8, 0.4, -32))
fir = steep & north & (d > 1800) & (d < 2800) & ell(71.65, 41.85, 1.0, 0.42, 25)
walnut = steep & nonnorth & (d > 1000) & (d < 2000) & ell(72.8, 41.35, 1.25, 0.38, -30)
river = (acc_c > 400) & (d > 800) & (d < 2800)
fz[juniper] = 1
fz[spruce] = 2
fz[fir] = 3
fz[walnut] = 4
fz[river & (fz == 0)] = 5
fz[~m | water] = 0
FCOL = {1: (164, 140, 72), 2: (47, 110, 74), 3: (31, 90, 94), 4: (139, 191, 63), 5: (199, 164, 58)}
fimg = np.zeros((ch, cw, 4), np.uint8)
for k, c in FCOL.items():
    fimg[fz == k, :3] = c
    fimg[fz == k, 3] = 225
Image.fromarray(fimg, 'RGBA').save(os.path.join(pub, 'forests.webp'), quality=85, method=6)
print('forest model share of KG %:', {k: round(float(((fz == k) & m).sum() / m.sum() * 100), 2) for k in FCOL})

# hillshade only (for the general map) — grey, transparent outside KG
hsimg = np.dstack([np.full_like(hs, 40), np.full_like(hs, 50), np.full_like(hs, 70), (1 - hs) * 150 * m]).astype(np.uint8)
Image.fromarray(hsimg, 'RGBA').save(os.path.join(pub, 'hillshade.webp'), quality=82, method=6)

# heightmap for three.js (downsampled, 16-bit packed into R,G)
HM_W = 512
dh = d.copy()
iss = issykmask[y0:y1, x0:x1]
dh[iss] = 1607  # Issyk-Kul surface (reference level); DEM contains bathymetry
dh[son_mask[y0:y1, x0:x1]] = son_lvl
dh[chat_mask[y0:y1, x0:x1]] = chat_lvl
dh = np.maximum(dh, 0)
HM_H = int(round(HM_W * ch / cw))
hm = np.asarray(Image.fromarray(dh.astype(np.float32), 'F').resize((HM_W, HM_H), Image.BILINEAR))
cls = np.where(water, 128, np.where(m, 255, 0)).astype(np.uint8)
mk = np.asarray(Image.fromarray(cls).resize((HM_W, HM_H), Image.NEAREST))
v = np.clip(hm, 0, 65535).astype(np.uint16)
hmimg = np.dstack([(v >> 8).astype(np.uint8), (v & 255).astype(np.uint8), mk, np.full_like(mk, 255)])
Image.fromarray(hmimg, 'RGBA').save(os.path.join(pub, 'heightmap.png'), optimize=True)

meta = {'bounds': bounds, 'heightmap': {'w': HM_W, 'h': HM_H, 'max': float(d[m].max()), 'min': float(d[m].min())},
        'dem_max_in_kg': float(d[m].max()), 'dem_min_in_kg': float(d[m].min()),
        'belt_area_share': {int(k): round(float(((belts == k) & m).sum() / m.sum()), 4) for k in BCOL},
        'pixel_m': round(40075000 / N * math.cos(math.radians(41.5)))}
dump('rasters.json', meta)
print(meta)

# ---------- country statistics from the DEM (land only, lakes excluded) ----------
land = m & ~water
cos = np.cos(np.radians(lat_grid))
wgt = np.where(land, cos ** 2, 0)   # mercator pixel area scales with cos^2(lat)
tot = wgt.sum()
stats = {
    'mean_elev': round(float((d * wgt).sum() / tot)),
    'min_elev_land': round(float(d[land].min())),
    'share_above': {str(t): round(float(wgt[d >= t].sum() / tot) * 100, 1) for t in (1000, 1500, 2000, 3000, 4000)},
    'extent': [round(v, 3) for v in KG.bounds],
    'glacier_area_ne_km2': round(gl.area * (111.32 ** 2) * math.cos(math.radians(41.5))),
}
river_len = {}
for f in rivers:
    ls = shape(f['geometry'])
    km = 0
    cs = list(ls.coords)
    for (a, b), (c, e2) in zip(cs[:-1], cs[1:]):
        km += math.hypot((c - a) * 111.32 * math.cos(math.radians((b + e2) / 2)), (e2 - b) * 110.57)
    river_len[f['properties']['id']] = round(km)
stats['river_trace_km'] = river_len
dump('stats.json', stats)
print(stats)
