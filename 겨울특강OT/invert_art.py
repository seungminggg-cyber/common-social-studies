# '반전용' PPT 그림 만들기: 학원 PC나 빔이 화면 색을 반전시킬 때를 대비해, 그림 색을 미리 반대로 뒤집어 둔다.
# (반전 × 반전 = 원래 색) → 반전된 화면에서 원래 디자인(검정 바탕 + 네온)대로 보인다.
# 실행: python3 invert_art.py  →  out/art-inv/  (그다음 OT_INVERT=1 node build.mjs)
import shutil
import subprocess
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent
SRC, DST = ROOT / 'out/art', ROOT / 'out/art-inv'
shutil.rmtree(DST, ignore_errors=True)
DST.mkdir(parents=True)


def inv(src: Path, dst: Path):
    im = Image.open(src)
    if im.mode in ('RGBA', 'LA', 'P'):
        im = im.convert('RGBA')
        rgb, a = im.convert('RGB'), im.getchannel('A')
        out = ImageOps.invert(rgb)
        out.putalpha(a)  # 투명한 곳은 그대로 투명
    else:
        out = ImageOps.invert(im.convert('RGB'))
    if dst.suffix.lower() in ('.jpg', '.jpeg'):
        out.convert('RGB').save(dst, quality=92)
    else:
        out.save(dst)


n = 0
for f in SRC.iterdir():
    if f.is_dir() or f.name == 'globe-loop.gif':
        continue
    if f.suffix.lower() in ('.png', '.jpg', '.jpeg'):
        inv(f, DST / f.name)
        n += 1
    else:
        shutil.copy(f, DST / f.name)  # json 등
# 학원 로고
inv(ROOT / 'assets/academy-logo-white.png', DST / 'academy-logo-white.png')
# 반짝이는 지구본 GIF: 장면 PNG를 뒤집어서 다시 GIF로
fr = DST / 'globe-frames'
fr.mkdir()
for f in sorted((SRC / 'globe-frames').glob('f*.png')):
    inv(f, fr / f.name)
pal = DST / 'pal.png'
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-framerate', '10', '-i', str(fr / 'f%03d.png'), '-vf', 'palettegen=max_colors=256:stats_mode=full', str(pal)], check=True)
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-framerate', '10', '-i', str(fr / 'f%03d.png'), '-i', str(pal),
                '-lavfi', 'paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle', '-loop', '0', str(DST / 'globe-loop.gif')], check=True)
pal.unlink()
shutil.rmtree(fr)
print(f'반전 그림 {n + 2}개 → {DST}')
