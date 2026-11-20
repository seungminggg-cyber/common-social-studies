"""시범강의 칠판 PPT용 원문 그림 만들기 — 예시문항 문제지에서 5·15·21번을 부분별로 잘라 '분필색' PNG로.

  python3 -I 기출변형/특강/칠판/crop-chalk.py <예시문항 문제지 PDF> <내보낼 폴더>

- 원문 저작권은 한국교육과정평가원. 내보낼 폴더는 저장소에 올리지 않는다(기출변형/out/ 아래나 저장소 밖).
- 부분: 발문(stem), 자료(data), 뒷장용 작은 자료(mini), 〈보기〉(bogi), 선지(choices).
  문항 번호·선지 줄 위치는 pdftotext -bbox로 찾고, 자료 상자의 위·아래 테두리는 600dpi 그림에서 긴 가로줄로 찾는다.
- 분필색: 어두운 정도 → 흰색의 불투명도(바탕은 투명). 검정 바탕 슬라이드에 놓으면 빔이 흰 글씨·선만 쏜다.
  선이 가늘면 빔에서 흐려지므로 1px(600dpi) 굵게 하고, 발문의 문항 번호만 분필 노랑으로 칠한다.
- 결과: <폴더>/q5-stem.png … 와 parts.json(부분마다 원본 크기 pt) — build-deck.cjs가 읽는다.
"""
import html as htmllib
import json
import os
import re
import subprocess
import sys

import numpy as np
from PIL import Image, ImageFilter

pdf, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)
DPI = 600
K = DPI / 72
YELLOW = (255, 228, 92)

html = subprocess.run(['pdftotext', '-bbox', pdf, '-'], capture_output=True, text=True, check=True).stdout
PAGES = [[(float(a), float(b), float(c), float(d), htmllib.unescape(w)) for a, b, c, d, w in
          re.findall(r'<word xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">([^<]*)</word>', p)]
         for p in html.split('<page ')[1:]]
COLS = [(82, 412), (432, 762)]
_cache = {}


def page_img(pi):
    if pi not in _cache:
        base = os.path.join(out, f'_p{pi}')
        subprocess.run(['pdftoppm', '-r', str(DPI), '-f', str(pi), '-l', str(pi), '-gray', '-png', '-singlefile', pdf, base], check=True)
        _cache[pi] = np.array(Image.open(base + '.png').convert('L'))
        os.remove(base + '.png')
    return _cache[pi]


def words(pi, col, y0=0, y1=9999):
    cx0, cx1 = COLS[col]
    return [w for w in PAGES[pi - 1] if cx0 <= w[0] < cx1 and y0 <= w[1] < y1]


def find(pi, col, text, after=0):
    """단 안에서 글자(어절)가 처음 나오는 위치(pt)"""
    for w in sorted(words(pi, col, after), key=lambda w: (w[1], w[0])):
        if w[4] == text:
            return w
    raise SystemExit(f'{pi}쪽에서 "{text}"를 찾지 못함')


def hlines(pi, col, y0, y1, frac=0.6):
    """단 안 y0~y1(pt) 사이의 긴 가로줄 y(pt) 목록"""
    g = page_img(pi)
    cx0, cx1 = [int(v * K) for v in COLS[col]]
    a, b = int(y0 * K), int(y1 * K)
    dark = (g[a:b, cx0:cx1] < 110).sum(1)
    ys = np.where(dark > (cx1 - cx0) * frac)[0]
    groups = []
    for y in ys:
        if groups and y - groups[-1][-1] <= 2:
            groups[-1].append(y)
        else:
            groups.append([y])
    return [(a + (gr[0] + gr[-1]) / 2) / K for gr in groups]


parts = {}


def save(name, pi, x0, y0, x1, y1, number_until=None, number_y=None):
    """잘라서 흰 여백을 다듬고 분필색 PNG로 저장. number_until·number_y: 이 x(pt) 왼쪽, 이 y(pt) 위는 노랑(문항 번호)"""
    g = page_img(pi)[int(y0 * K):int(y1 * K), int(x0 * K):int(x1 * K)]
    ink = g < 200
    rows, cols = np.where(ink.any(1))[0], np.where(ink.any(0))[0]
    m = int(2 * K)  # 2pt 여백
    r0, r1 = max(0, rows[0] - m), min(g.shape[0], rows[-1] + m + 1)
    c0, c1 = max(0, cols[0] - m), min(g.shape[1], cols[-1] + m + 1)
    g = g[r0:r1, c0:c1]
    g = np.array(Image.fromarray(g).filter(ImageFilter.MinFilter(3))).astype(float)  # 1px 굵게
    alpha = 255 * ((255 - g) / 255) ** 0.6
    alpha[alpha < 10] = 0
    rgba = np.zeros(g.shape + (4,), np.uint8)
    rgba[..., :3] = 255
    rgba[..., 3] = alpha.clip(0, 255).astype(np.uint8)
    if number_until:
        nx = max(0, int((number_until - x0) * K) - c0)
        ny = max(0, int((number_y - y0) * K) - r0)
        rgba[:ny, :nx, 0], rgba[:ny, :nx, 1], rgba[:ny, :nx, 2] = YELLOW
    Image.fromarray(rgba, 'RGBA').save(os.path.join(out, name + '.png'), optimize=True)
    parts[name] = {'x': round(x0 + c0 / K, 2), 'y': round(y0 + r0 / K, 2), 'w': round((c1 - c0) / K, 2), 'h': round((r1 - r0) / K, 2)}
    print(f'{name}: {parts[name]["w"]}×{parts[name]["h"]} pt')


def stem(key, pi, col, no, last_word):
    n = find(pi, col, f'{no}.')
    end = find(pi, col, last_word, n[1])
    save(f'{key}-stem', pi, COLS[col][0], n[1] - 3, COLS[col][1], end[3] + 3, number_until=n[2] + 1, number_y=n[3] + 2)
    return n, end


def choices(key, pi, col, after, last_word):
    c1 = find(pi, col, '①', after)
    c5 = find(pi, col, '⑤', c1[1])
    end = find(pi, col, last_word, c5[1] - 1)
    save(f'{key}-choices', pi, COLS[col][0], c1[1] - 3, COLS[col][1], end[3] + 3)
    return c1


# ---- 5번 (2쪽 왼쪽 단) ----
n, e = stem('q5', 2, 0, 5, '[2.5점]')
c1 = find(2, 0, '①', e[3])
box = [y for y in hlines(2, 0, e[3] + 2, c1[1] - 2)]
top, bot = box[0], box[-1]
save('q5-data', 2, COLS[0][0], top - 2, COLS[0][1], bot + 2)
# 뒷장용: 상자 안의 지도·그래프만 (공식 아래 ~ 상자 아래 테두리 위)
f12 = max(w[3] for w in words(2, 0, top, bot) if w[4] in ('12', '󰀙'))
save('q5-mini', 2, 103, f12 + 3, 401, bot - 2)
choices('q5', 2, 0, e[3], '많다.')

# ---- 15번 (4쪽 오른쪽 단) ----
n, e = stem('q15', 4, 1, 15, '[2.5점]')
bogi_t = find(4, 1, '<보', e[3])
lines = hlines(4, 1, e[3] + 2, bogi_t[1] - 1, frac=0.7)
top, bot = lines[0], lines[-1]
save('q15-data', 4, COLS[1][0], top - 2, COLS[1][1], bot + 2)
# (가)와 (나) 사이 가로줄 → 뒷장용 (나)
na = find(4, 1, '(나)', top)
mid = max(y for y in hlines(4, 1, top + 3, na[1], frac=0.5) if y < na[1])
save('q15-mini', 4, COLS[1][0], mid - 0.6, COLS[1][1], bot + 2)
c1 = find(4, 1, '①', bogi_t[1])
bl = hlines(4, 1, bogi_t[3], c1[1] - 1, frac=0.7)
save('q15-bogi', 4, COLS[1][0], bogi_t[1] - 2, COLS[1][1], bl[-1] + 2)
choices('q15', 4, 1, bogi_t[1], 'ㄹ')

# ---- 21번 (5쪽 오른쪽 단) ----
n, e = stem('q21', 5, 1, 21, '[2.5점]')
c1 = find(5, 1, '①', e[3])
save('q21-data', 5, COLS[1][0], e[3] + 3, COLS[1][1], c1[1] - 4)
# 뒷장용: 칠판 속 〈상황 1〉·〈상황 2〉 표만 (말풍선 아래 ~ 칠판 받침 위, 교사 그림 왼쪽)
# 표 두 개(x 약 466~671pt)의 가로 테두리 = 두 표를 거의 다 가로지르되 두 표 사이 틈(x 약 567~570pt)은 비어 있는 줄
#  (말풍선 아래 테두리·칠판 받침은 틈까지 이어져 있어 빠진다) → 위로 표 제목(〈상황 1〉)까지
g5 = page_img(5)
def table_line(y):
    row = g5[int(y * K), :]
    span = (row[int(466 * K):int(671 * K)] < 110).mean()
    gap = (row[int(567.5 * K):int(570 * K)] < 110).any()
    return span > 0.85 and not gap
ty = [y / K for y in range(int((e[3] + 40) * K), int((c1[1] - 4) * K)) if table_line(y / K)]
save('q21-mini', 5, 460, ty[0] - 16, 673, ty[-1] + 1.5)
choices('q21', 5, 1, e[3], '있다.')

with open(os.path.join(out, 'parts.json'), 'w', encoding='utf-8') as f:
    json.dump(parts, f, ensure_ascii=False, indent=1)
print('저장:', out)
