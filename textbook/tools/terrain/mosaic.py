# 고도 타일을 이어 붙여 float32 원자료로 저장
# 사용: python3 -I mosaic.py 타일폴더 z w s e n 출력이름   → 출력이름.f32, 출력이름.json
import sys, math, os, json
import numpy as np
from PIL import Image
tdir, z = sys.argv[1], int(sys.argv[2])
w, s, e, n = map(float, sys.argv[3:7]); out = sys.argv[7]
N = 256 * 2 ** z
def X(lon): return (lon + 180) / 360 * N
def Y(lat):
    r = math.radians(lat); return (1 - math.log(math.tan(r) + 1 / math.cos(r)) / math.pi) / 2 * N
x0, x1, y0, y1 = int(X(w)), int(X(e)), int(Y(n)), int(Y(s))
tx0, tx1, ty0, ty1 = x0 // 256, x1 // 256, y0 // 256, y1 // 256
mos = np.zeros(((ty1 - ty0 + 1) * 256, (tx1 - tx0 + 1) * 256), np.float32)
for ix in range(tx0, tx1 + 1):
    for iy in range(ty0, ty1 + 1):
        a = np.asarray(Image.open(os.path.join(tdir, str(z), str(ix), f'{iy}.png')).convert('RGB'), np.float32)
        mos[(iy - ty0) * 256:(iy - ty0 + 1) * 256, (ix - tx0) * 256:(ix - tx0 + 1) * 256] = a[..., 0] * 256 + a[..., 1] + a[..., 2] / 256 - 32768
cx0, cy0 = x0 - tx0 * 256, y0 - ty0 * 256
h = np.ascontiguousarray(mos[cy0:cy0 + (y1 - y0), cx0:cx0 + (x1 - x0)])
h.tofile(out + '.f32')
json.dump({'z': z, 'X0': x0, 'Y0': y0, 'R': int(h.shape[0]), 'C': int(h.shape[1])}, open(out + '.json', 'w'))
print('mosaic', h.shape, float(h.min()), float(h.max()))

# 육지 마스크 (Natural Earth 나라 경계 안 = 육지) → 강 하류가 해발 0m 이하여도 바다로 보지 않게
if len(sys.argv) > 8:
    from PIL import ImageDraw
    feats = json.load(open(sys.argv[8]))['features']
    m = Image.new('L', (h.shape[1], h.shape[0]), 0)
    dr = ImageDraw.Draw(m)
    def ring(rg): return [(X(lo) - x0, Y(la) - y0) for lo, la in rg]
    for f in feats:
        g = f['geometry']
        polys = g['coordinates'] if g['type'] == 'MultiPolygon' else [g['coordinates']]
        for poly in polys:
            xs = [p[0] for p in poly[0]]; ys = [p[1] for p in poly[0]]
            if max(xs) < w - 1 or min(xs) > e + 1 or max(ys) < s - 1 or min(ys) > n + 1: continue
            dr.polygon(ring(poly[0]), fill=1)
            for hole in poly[1:]: dr.polygon(ring(hole), fill=0)
    np.asarray(m, np.uint8).tofile(out + '.mask')
    print('mask land', int(np.asarray(m).sum()))
