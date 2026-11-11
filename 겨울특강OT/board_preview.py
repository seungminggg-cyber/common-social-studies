# 초록 칠판에 빔으로 쏘았을 때의 대략적인 모습 (촬영 전 감 잡기용 — 실제는 빔 밝기·카메라에 따라 다름)
#   python3 board_preview.py                 → out/칠판미리보기.jpg (대표 6장, 보통 조명)
#   python3 board_preview.py --all           → out/칠판미리보기-전체.pdf (모든 장, 보통 조명 — 폰으로 넘겨 보기)
#   python3 board_preview.py --light         → out/칠판미리보기-조명비교.jpg (대표 3장 × 조명 3가지)
#   python3 board_preview.py --pdf 파일.pdf --all --out 이름   → 다른 PDF(예: 칠판 테스트용)
# 원리: 빔은 빛을 '더하는' 것이므로 (칠판색) + (슬라이드 색 × 칠판이 되돌리는 빛의 비율).
#   검정 = 빛을 안 쏨 = 칠판 색 그대로. 초록 칠판은 초록 빛을 많이 되돌려서 흰색은 옅은 민트, 노랑은 연두 쪽으로 보인다.
#   조명을 켜면 칠판 자체가 밝아져서(카메라 노출도 내려가서) 빔 글자가 상대적으로 흐려진다.
import argparse
import subprocess
import tempfile
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parent
REFL = np.array([0.58, 1.0, 0.77])  # 칠판이 되돌리는 빛(초록이 가장 많음)
AWB = np.array([1.12, 1.0, 1.04])  # 카메라 자동 화이트밸런스가 조금 보정해 준다고 가정
# 조명 조건: (칠판 색, 빔 세기)
LIGHT = {
    '어둡게 (칠판 쪽 조명 끔)': (np.array([22, 40, 31.0]), 1.0),
    '보통 (조명 일부 켬)': (np.array([40, 70, 55.0]), 0.85),
    '밝게 (조명 모두 켬)': (np.array([66, 104, 85.0]), 0.62),
}
NORMAL = '보통 (조명 일부 켬)'
W, H = 1280, 720
PADX, PADY = 100, 60  # 화면 둘레에 보이는 칠판
FRAME, WALL = 12, 26  # 칠판 틀, 둘레 벽
try:
    FONT = ImageFont.truetype(str(Path.home() / '.fonts/pretendard/Pretendard-SemiBold.otf'), 30)
except OSError:
    FONT = ImageFont.load_default()


def board_texture(w, h, color, seed):
    rng = np.random.default_rng(seed)
    base = np.ones((h, w, 3)) * color
    base += rng.normal(0, 3.0, (h, w, 1))  # 고운 결
    smear = Image.new('L', (w, h), 0)
    d = ImageDraw.Draw(smear)
    for _ in range(14):  # 지우개 자국
        x, y = rng.integers(0, w), rng.integers(0, h)
        d.ellipse((x - 160, y - 30, x + 160, y + 30), fill=int(rng.integers(6, 16)))
    smear = np.array(smear.filter(ImageFilter.GaussianBlur(28)), float)[..., None]
    return base + smear * np.array([0.9, 1.0, 0.95])


def project(slide_rgb, light, seed):
    color, gain = LIGHT[light]
    bw, bh = W + 2 * PADX, H + 2 * PADY
    board = board_texture(bw, bh, color, seed)
    sw, sh = slide_rgb.size
    slide_rgb = slide_rgb.crop((0, 0, sw - 3, sh - 3)).resize((W, H), Image.LANCZOS)
    slide_rgb = slide_rgb.filter(ImageFilter.GaussianBlur(0.8))  # 빔 초점·카메라 흐림
    p = np.array(slide_rgb, float)
    yy, xx = np.mgrid[0:H, 0:W]
    r2 = ((xx - W / 2) / (W / 2)) ** 2 * 0.5 + ((yy - H / 2) / (H / 2)) ** 2 * 0.5
    hot = (1 - 0.16 * r2)[..., None]  # 빔 가운데가 조금 더 밝다
    board[PADY:PADY + H, PADX:PADX + W] += p * REFL * gain * hot
    board = np.clip(board * AWB, 0, 255).astype(np.uint8)
    # 벽 + 칠판 틀 + 분필 받침
    tw, th = bw + 2 * (FRAME + WALL), bh + 2 * (FRAME + WALL) + 10
    wall = 0.55 + 0.45 * (color.mean() / 80)
    img = Image.new('RGB', (tw, th), tuple(int(v * wall) for v in (150, 146, 136)))
    d = ImageDraw.Draw(img)
    d.rectangle((WALL, WALL, tw - WALL - 1, WALL + bh + 2 * FRAME - 1), fill=tuple(int(v * wall) for v in (168, 170, 172)))
    img.paste(Image.fromarray(board), (WALL + FRAME, WALL + FRAME))
    ty = WALL + bh + 2 * FRAME
    d.rectangle((WALL - 6, ty - 4, tw - WALL + 5, ty + 12), fill=tuple(int(v * wall) for v in (120, 122, 124)))
    return img


def page_png(pdf, n, tmp):
    out = tmp / f'p{n}'
    subprocess.run(['pdftoppm', '-png', '-r', '110', '-f', str(n), '-l', str(n), '-singlefile', str(pdf), str(out)], check=True)
    return Image.open(f'{out}.png').convert('RGB')


def page_count(pdf):
    info = subprocess.run(['pdfinfo', str(pdf)], capture_output=True, text=True).stdout
    return int(next(l for l in info.splitlines() if l.startswith('Pages:')).split()[1])


def sheet(tiles, cols, title, labels=None):
    tw, th = tiles[0].size
    rows = (len(tiles) + cols - 1) // cols
    lab = 46 if labels else 0
    img = Image.new('RGB', (cols * tw + (cols - 1) * 16, 70 + rows * (th + lab) + (rows - 1) * 16), (24, 24, 24))
    d = ImageDraw.Draw(img)
    d.text((20, 18), title, fill=(230, 230, 230), font=FONT)
    for i, t in enumerate(tiles):
        x, y = (i % cols) * (tw + 16), 70 + (i // cols) * (th + lab + 16)
        if labels:
            d.text((x + 8, y + 6), labels[i], fill=(255, 224, 102), font=FONT)
        img.paste(t, (x, y + lab))
    return img


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--pdf', default=str(ROOT / 'out/승민T-통합사회-겨울특강-OT.pdf'))
    ap.add_argument('--all', action='store_true')
    ap.add_argument('--light', action='store_true')
    ap.add_argument('--out', default='칠판미리보기')
    ap.add_argument('pages', nargs='*', type=int)
    a = ap.parse_args()
    pdf, tmp = Path(a.pdf), Path(tempfile.mkdtemp())
    note = '대략적인 미리보기 — 실제 색은 빔 밝기·칠판·카메라 설정에 따라 다릅니다'
    if a.all:
        pages = a.pages or list(range(1, page_count(pdf) + 1))
        imgs = [project(page_png(pdf, n, tmp), NORMAL, n) for n in pages]
        dst = ROOT / f'out/{a.out}-전체.pdf'
        imgs[0].save(dst, save_all=True, append_images=imgs[1:], resolution=110, quality=85)
    elif a.light:
        pages = a.pages or [1, 8, 28]
        tiles, labels = [], []
        for n in pages:
            src = page_png(pdf, n, tmp)
            for k in LIGHT:
                tiles.append(project(src, k, n))
                labels.append(f'{n}번 슬라이드 · {k}')
        dst = ROOT / f'out/{a.out}-조명비교.jpg'
        sheet(tiles, 3, f'조명에 따라 칠판 위 화면이 어떻게 보이는지 ({note})', labels).save(dst, quality=88)
    else:
        pages = a.pages or [1, 6, 20, 28, 33, 34]
        tiles = [project(page_png(pdf, n, tmp), NORMAL, n) for n in pages]
        dst = ROOT / f'out/{a.out}.jpg'
        sheet(tiles, 2, f'초록 칠판에 쏜 모습 ({note})').save(dst, quality=88)
    print('미리보기:', dst)


if __name__ == '__main__':
    main()
