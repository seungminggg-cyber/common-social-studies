# 움직이는 지구본 마무리: 장면 PNG → 반복 GIF, 화살표 PNG → 필요한 부분만 잘라 위치 기록
# 실행: python3 globe_post.py  (먼저 node globe-anim.mjs)
import json
import shutil
import subprocess
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent
ART = ROOT / 'out/art'
FR, RAW = ART / 'globe-frames', ART / 'globe-arc-raw'

# 1) 반복 GIF (색 256가지 — 장면 전체에서 고른 색표 + 장면마다 같은 무늬의 점묘라 용량이 작다)
gif = ART / 'globe-loop.gif'
pal = ART / 'globe-palette.png'
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-framerate', '10', '-i', str(FR / 'f%03d.png'),
                '-vf', 'palettegen=max_colors=256:stats_mode=full', str(pal)], check=True)
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-framerate', '10', '-i', str(FR / 'f%03d.png'), '-i', str(pal),
                '-lavfi', 'paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle', '-loop', '0', str(gif)], check=True)
pal.unlink()

# 2) 화살표: 보이는 부분만 잘라 저장하고, 지구본 그림 안에서의 위치(0~1)를 기록
meta = json.loads((RAW / 'meta.json').read_text())
S = meta['size']
allc = None
for a in meta['arcs']:
    im = Image.open(RAW / f"arc-{a['i']:02d}.png").convert('RGBA')
    allc = im.copy() if allc is None else Image.alpha_composite(allc, im)
    l, t, r, b = im.getchannel('A').point(lambda v: 255 if v > 6 else 0).getbbox()
    im.crop((l, t, r, b)).save(ART / f"globe-arc-{a['i']:02d}.png")
    a['box'] = [l / S, t / S, (r - l) / S, (b - t) / S]
    # 닦아내기 방향: 서울 쪽에서 시작(가로·세로 중 더 많이 움직이는 쪽)
    dx, dy = a['end'][0] - meta['seoul'][0], a['end'][1] - meta['seoul'][1]
    a['dir'] = ('l' if dx > 0 else 'r') if abs(dx) >= abs(dy) else ('t' if dy > 0 else 'b')
allc.save(ART / 'globe-arcs-all.png')
# 서울에서 시계 방향 순서로 뻗게
meta['arcs'].sort(key=lambda a: (a['angle'] + 120) % 360)
(ART / 'globe-arcs.json').write_text(json.dumps(meta, ensure_ascii=False, indent=1))
print('GIF:', gif, f'{gif.stat().st_size / 1e6:.1f}MB', '· 화살표', len(meta['arcs']), '개')
