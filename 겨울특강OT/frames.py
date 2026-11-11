# 앱 화면·개념서 쪽을 슬라이드용 그림으로 (휴대폰 틀, 둥근 모서리, 조금 어둡게)
# 실행: python3 frames.py  →  out/art/phone-*.png, phone-dashboard-wide.png, minimap-page.png
# 칠판에 쏘면 흰 화면이 너무 번쩍이므로 밝기를 조금(88%) 낮춘다.
from pathlib import Path
from PIL import Image, ImageDraw, ImageEnhance

ROOT = Path(__file__).resolve().parent
APP = ROOT / 'assets/app'
OUT = ROOT / 'out/art'
OUT.mkdir(parents=True, exist_ok=True)
DIM = 0.88
RIM = (86, 104, 122, 255)  # 휴대폰 테두리(회청색) — 검정 바탕에서도 틀이 보이게


def rounded(im, r):
    m = Image.new('L', im.size, 0)
    ImageDraw.Draw(m).rounded_rectangle((0, 0, im.size[0] - 1, im.size[1] - 1), r, fill=255)
    out = im.convert('RGBA')
    out.putalpha(m)
    return out


def phone(name):
    sc = Image.open(APP / f'{name}.png').convert('RGB')
    W = 780
    sc = sc.resize((W, round(sc.size[1] * W / sc.size[0])), Image.LANCZOS)
    sc = ImageEnhance.Brightness(sc).enhance(DIM)
    pad, rim = 26, 7
    bw, bh = sc.size[0] + 2 * pad, sc.size[1] + 2 * pad
    body = Image.new('RGBA', (bw, bh), (0, 0, 0, 0))
    d = ImageDraw.Draw(body)
    d.rounded_rectangle((0, 0, bw - 1, bh - 1), 108, fill=(10, 14, 18, 255), outline=RIM, width=rim)
    body.alpha_composite(rounded(sc, 84), (pad, pad))
    body.save(OUT / f'phone-{name}.png')


def wide(name, out_name):
    sc = Image.open(APP / f'{name}.png').convert('RGB')
    W = 1600
    sc = sc.resize((W, round(sc.size[1] * W / sc.size[0])), Image.LANCZOS)
    sc = ImageEnhance.Brightness(sc).enhance(DIM)
    pad = 6
    body = Image.new('RGBA', (sc.size[0] + 2 * pad, sc.size[1] + 2 * pad), (0, 0, 0, 0))
    ImageDraw.Draw(body).rounded_rectangle((0, 0, body.size[0] - 1, body.size[1] - 1), 30, fill=RIM)
    body.alpha_composite(rounded(sc, 26), (pad, pad))
    body.save(OUT / out_name)


for n in ['quiz', 'card', 'planner', 'timer', 'weak', 'scores']:
    phone(n)
wide('dashboard-wide', 'phone-dashboard-wide.png')
pg = Image.open(ROOT / 'assets/minimap-page.png').convert('RGB')
pg = ImageEnhance.Brightness(pg).enhance(DIM)
pg.resize((1200, round(pg.size[1] * 1200 / pg.size[0])), Image.LANCZOS).save(OUT / 'minimap-page.png')
print('틀 그림 완성 →', OUT)

# 미니맵 표지(기출변형/cover에서 만든 PNG) → 슬라이드용 JPEG(파일 크기 줄이기)
COVER = ROOT.parent / '기출변형/out/cover/png'
for n, name in [(1, '통합사회1'), (2, '통합사회2')]:
    src = COVER / f'MINIMAP-{name}-앞표지.png'
    if not src.exists():
        print('표지 없음(먼저 기출변형에서 node cover/build-cover.mjs mmapfinal):', src)
        continue
    im = Image.open(src).convert('RGB')
    im.resize((900, round(im.size[1] * 900 / im.size[0])), Image.LANCZOS).save(OUT / f'cover-t{n}.jpg', quality=90)
