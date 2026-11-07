"""2028 예시문항 원문 PDF에서 문항마다 그림을 잘라 낸다 (강의용 교재에 넣는 원문).

  python3 -I 특강/crop-orig.py <예시문항 문제지 PDF> <내보낼 폴더>

- 원문의 저작권은 한국교육과정평가원에 있다. 공개 저장소이므로 PDF와 잘라 낸 그림은 저장소에 올리지 않고,
  내보낼 폴더는 저장소 밖(세션 scratchpad 등)에 둔다. 강의용 빌드: `SP_ORIG=<내보낼 폴더> node 특강/build.mjs lecture`
- 방법: pdftotext -bbox로 문항 번호("1." ~ "25.")의 위치를 찾고, 같은 단의 다음 문항 번호(또는 단 아래 끝)까지 잘라
  300dpi PNG(ex-01.png …)로 저장한 뒤 흰 여백을 다듬는다.
"""
import os
import re
import subprocess
import sys

from PIL import Image, ImageChops

pdf, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)
html = subprocess.run(['pdftotext', '-bbox', pdf, '-'], capture_output=True, text=True, check=True).stdout
pages = html.split('<page ')[1:]
COLS = [(80, 418), (430, 768)]  # 왼쪽 단, 오른쪽 단 (pt) — 가운데 세로 줄(약 421pt)은 빼고
starts = []  # (문항 번호, 쪽, 단, y)
bottoms = {}
for pi, p in enumerate(pages, 1):
    words = [(float(a), float(b), float(c), float(d), w) for a, b, c, d, w in
             re.findall(r'<word xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">([^<]*)</word>', p)]
    for x0, y0, x1, y1, w in words:
        for ci, (cx0, _) in enumerate(COLS):
            if re.fullmatch(r'\d{1,2}\.', w) and abs(x0 - (cx0 + 8)) < 3:
                starts.append((int(w[:-1]), pi, ci, y0))
    # 마지막 쪽의 '* 확인 사항' 상자는 문항이 아니므로 그 위에서 자른다
    stop = min([y0 for x0, y0, x1, y1, w in words if w == '*'] or [1075])
    for ci, (cx0, cx1) in enumerate(COLS):  # 단 아래 끝: 쪽 번호(1080pt 아래)·저작권 줄을 뺀 가장 아래 글자
        ys = [y1 for x0, y0, x1, y1, w in words if cx0 <= x0 < cx1 and y1 < 1075 and not (ci == 1 and y0 >= stop - 1)]
        bottoms[(pi, ci)] = max(ys) if ys else 1050
starts.sort()
assert [s[0] for s in starts] == list(range(1, 26)), [s[0] for s in starts]
for no, pi, ci, y0 in starts:
    nxt = [s[3] for s in starts if s[1] == pi and s[2] == ci and s[3] > y0]
    y1 = min(nxt) - 6 if nxt else bottoms[(pi, ci)] + 6
    x0, x1 = COLS[ci]
    base = os.path.join(out, f'raw-{no:02d}')
    subprocess.run(['pdftoppm', '-r', '300', '-f', str(pi), '-l', str(pi), '-png', '-singlefile',
                    '-x', str(int(x0 * 300 / 72)), '-y', str(int((y0 - 6) * 300 / 72)),
                    '-W', str(int((x1 - x0) * 300 / 72)), '-H', str(int((y1 - y0 + 6) * 300 / 72)), pdf, base], check=True)
    im = Image.open(base + '.png').convert('RGB')
    box = ImageChops.difference(im, Image.new('RGB', im.size, 'white')).point(lambda v: 255 if v > 40 else 0).getbbox()
    if box:
        im = im.crop((max(0, box[0] - 12), max(0, box[1] - 12), min(im.width, box[2] + 12), min(im.height, box[3] + 12)))
    im.save(os.path.join(out, f'ex-{no:02d}.png'))
    os.remove(base + '.png')
    print(f'{no:2d}번: {pi}쪽 {"왼" if ci == 0 else "오른"}쪽 단 → {im.width}×{im.height}px')
