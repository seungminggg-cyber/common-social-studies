# 지형 바탕 칠하기: 고도(m) + 칸 크기(km) + 육지 마스크 → 지도책 색 + 음영 기복 → JPEG
# 사용: python3 -I color.py 작업이름 출력.jpg 너비 높이 [palette] [zf]
#   작업이름.elev.f32 (높이 x 너비), 작업이름.cell.f32 (칸 한 변 km), 작업이름.mask.u8 (0 바다, 1 육지, 2 지도 밖)
import sys, math, os
import numpy as np
from PIL import Image

base, out = sys.argv[1], sys.argv[2]
Wo, Ho = int(sys.argv[3]), int(sys.argv[4])
palette = sys.argv[5] if len(sys.argv) > 5 else 'atlas'
zf_arg = float(sys.argv[6]) if len(sys.argv) > 6 else 0
el = np.fromfile(base + '.elev.f32', np.float32).reshape(Ho, Wo)
cell = np.fromfile(base + '.cell.f32', np.float32).reshape(Ho, Wo)
mask = np.fromfile(base + '.mask.u8', np.uint8).reshape(Ho, Wo)
land = mask == 1
outside = mask == 2

# 타일 이음새 잡음 줄이기
sm = np.asarray(Image.fromarray(el, 'F').resize((max(1, Wo // 2), max(1, Ho // 2)), Image.BILINEAR).resize((Wo, Ho), Image.BICUBIC), np.float32)
el = sm * 0.45 + el * 0.55

# 음영 기복 (빛: 북서쪽 위). 축척이 작을수록 높이를 과장해야 산지가 보인다
cmean = float(np.median(cell[~outside])) if (~outside).any() else 1.0
zf = zf_arg or min(30.0, max(3.0, 3.5 * cmean ** 0.6))
elx = np.where(land, np.maximum(el, 0), np.minimum(el, 0) * 0.25)  # 바다는 아주 약하게
gy, gx = np.gradient(elx * zf)
c = np.maximum(cell, 1e-3) * 1000
gx = gx / c; gy = gy / c
slope = np.arctan(np.hypot(gx, gy))
aspect = np.arctan2(-gx, gy)
az, alt = math.radians(315), math.radians(45)
hs = np.sin(alt) * np.cos(slope) + np.cos(alt) * np.sin(slope) * np.cos(az - aspect + math.pi / 2)
hs = np.clip(hs, 0, 1)

def ramp(stops, v):
    xs = np.array([s[0] for s in stops], np.float32)
    cs = np.array([[int(s[1][i:i + 2], 16) for i in (1, 3, 5)] for s in stops], np.float32)
    return np.stack([np.interp(v, xs, cs[:, j]) for j in range(3)], -1)

LAND = [(0, '#a6cf8e'), (150, '#bbd899'), (400, '#d9e3a5'), (700, '#ebdea3'), (1000, '#e5c88e'),
        (1600, '#d8ac79'), (2500, '#c28f67'), (3800, '#aa795e'), (5000, '#b6a495'), (6500, '#efebe7')]
SEA = [(-9000, '#6e9ece'), (-6000, '#7eacd7'), (-4000, '#92bce1'), (-2000, '#a8cce9'),
       (-500, '#bcdbf0'), (-150, '#cce4f4'), (0, '#d9edf9')]
if palette == 'soft':  # 옅은 음영 기복 (높이 색 대신 베이지 한 가지 톤: 기후·분포도 바탕용)
    LAND = [(0, '#f2eddf'), (500, '#ece3cd'), (1500, '#e2d3b6'), (3000, '#d9c6a8'), (5000, '#e7e0d6'), (6500, '#f6f3ef')]
    SEA = [(-9000, '#b9d5ec'), (-3000, '#c8dff1'), (-200, '#d6e9f6'), (0, '#e0eff9')]

col = np.where(land[..., None], ramp(LAND, np.maximum(el, 0)), ramp(SEA, np.minimum(el, 0)))
sh = np.where(land, 0.6 + 0.5 * hs, 0.94 + 0.07 * hs)[..., None]
col = np.clip(col * sh, 0, 255)
col[outside] = 255
Image.fromarray(col.astype(np.uint8), 'RGB').save(out, quality=86, optimize=True)
print(f'  지형 바탕 {Wo}x{Ho} zf={zf:.1f} {os.path.getsize(out) / 1024:.0f}KB')
