# 초록 칠판에 빔으로 쏘았을 때의 대략적인 모습 (촬영 전 감 잡기용 — 실제는 빔 밝기·카메라에 따라 다름)
# 실행: python3 board_preview.py [쪽 번호 ...]  →  out/칠판미리보기.png
# 원리: 빔은 빛을 '더하는' 것이므로, 칠판색 + (슬라이드 색 × 칠판이 되돌리는 빛의 비율).
#       검정 = 빛을 안 쏨 = 칠판 색 그대로. 칠판은 초록 빛을 많이 되돌려서 흰색은 옅은 민트, 노랑은 연두 쪽으로 보인다.
import subprocess
import sys
import tempfile
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parent
PDF = ROOT / 'out/승민T-통합사회-겨울특강-OT.pdf'
PAGES = [int(a) for a in sys.argv[1:]] or [1, 6, 20, 28, 33, 34]
BOARD = np.array([36, 64, 50], float)  # 칠판 색(실내 조명)
REFL = np.array([0.58, 1.0, 0.77])  # 칠판이 되돌리는 빛(초록이 가장 많음)
GAIN = 0.88
AWB = np.array([1.12, 1.0, 1.04])  # 카메라 자동 화이트밸런스가 조금 보정해 준다고 가정
W, H = 1280, 720
PADX, PADY = 110, 70  # 화면 둘레에 보이는 칠판


def board_texture(w, h, seed):
    rng = np.random.default_rng(seed)
    base = np.ones((h, w, 3)) * BOARD
    base += rng.normal(0, 3.2, (h, w, 1))  # 고운 결
    smear = Image.new('L', (w, h), 0)
    d = ImageDraw.Draw(smear)
    for _ in range(14):  # 지우개 자국
        x, y = rng.integers(0, w), rng.integers(0, h)
        d.ellipse((x - 160, y - 30, x + 160, y + 30), fill=int(rng.integers(6, 16)))
    smear = np.array(smear.filter(ImageFilter.GaussianBlur(28)), float)[..., None]
    return base + smear * np.array([0.9, 1.0, 0.95])


def project(slide_rgb, seed):
    tw, th = W + 2 * PADX, H + 2 * PADY
    out = board_texture(tw, th, seed)
    sw, sh = slide_rgb.size
    slide_rgb = slide_rgb.crop((0, 0, sw - 3, sh - 3))  # PDF 그림 가장자리의 얇은 줄 빼기
    p = np.array(slide_rgb.resize((W, H), Image.LANCZOS), float)
    out[PADY:PADY + H, PADX:PADX + W] += p * REFL * GAIN
    out = np.clip(out * AWB, 0, 255).astype(np.uint8)
    return Image.fromarray(out)


def main():
    tmp = Path(tempfile.mkdtemp())
    tiles = []
    for n in PAGES:
        subprocess.run(['pdftoppm', '-png', '-r', '110', '-f', str(n), '-l', str(n), '-singlefile', str(PDF), str(tmp / f'p{n}')], check=True)
        tiles.append(project(Image.open(tmp / f'p{n}.png').convert('RGB'), n))
    tw, th = tiles[0].size
    cols = 2
    rows = (len(tiles) + cols - 1) // cols
    sheet = Image.new('RGB', (cols * tw + (cols - 1) * 16, rows * th + (rows - 1) * 16 + 70), (24, 24, 24))
    d = ImageDraw.Draw(sheet)
    try:
        font = ImageFont.truetype(str(Path.home() / '.fonts/pretendard/Pretendard-SemiBold.otf'), 30)
    except OSError:
        font = ImageFont.load_default()
    d.text((20, 18), '초록 칠판에 쏜 모습 (대략적인 미리보기 — 실제 색은 빔 밝기·카메라 설정에 따라 다릅니다)', fill=(230, 230, 230), font=font)
    for i, t in enumerate(tiles):
        sheet.paste(t, ((i % cols) * (tw + 16), 70 + (i // cols) * (th + 16)))
    dst = ROOT / 'out/칠판미리보기.png'
    sheet.save(dst)
    print('미리보기:', dst, sheet.size)


if __name__ == '__main__':
    main()
