# 고른 사진을 천천히(위키미디어 요청 제한) 내려받아 교재용으로 줄이고, 출처를 credits.json 에 적는다
# 사용: python3 -I download.py picks.json candidates.json 출력폴더 [id ...]
import sys, json, subprocess, urllib.parse, time, os, io
from PIL import Image, ImageEnhance

UA = 'SeungminTextbookBuilder/1.0 (https://github.com/seungminggg-cyber/common-social-studies)'
picks = json.load(open(sys.argv[1]))
cands = json.load(open(sys.argv[2]))
out = sys.argv[3]
only = set(sys.argv[4:])
RAW = os.path.join(os.path.dirname(os.path.abspath(sys.argv[1])), 'raw')
os.makedirs(RAW, exist_ok=True)
cred_path = os.path.join(out, 'credits.json')
credits = json.load(open(cred_path)) if os.path.exists(cred_path) else {}

def thumb_url(url, w):
    # upload.wikimedia.org 는 요청 제한(429)이 심해서 commons 의 thumb.php 로 받는다
    name = urllib.parse.unquote(url.split('?')[0].split('/')[-1])
    return 'https://commons.wikimedia.org/w/thumb.php?' + urllib.parse.urlencode({'f': name, 'w': w})

def thumb_url_old(url, w):
    url = url.split('?')[0]
    # https://upload.wikimedia.org/wikipedia/commons/a/ab/Name.ext → .../thumb/a/ab/Name.ext/960px-Name.ext(.jpg)
    pre, rest = url.split('/wikipedia/commons/')
    name = rest.split('/')[-1]
    t = f'{pre}/wikipedia/commons/thumb/{rest}/{w}px-{name}'
    if name.lower().endswith(('.tif', '.tiff')):
        t = f'{pre}/wikipedia/commons/thumb/{rest}/lossy-page1-{w}px-{name}.jpg'
    return t

def fetch(url, dest):
    for k in range(10):
        r = subprocess.run(['curl', '-s', '-L', '--max-time', '120', '-A', UA, '-o', dest, '-w', '%{http_code}', url], capture_output=True, text=True)
        code = r.stdout.strip()
        if code == '200' and os.path.getsize(dest) > 5000:
            return True
        wait = min(600, 30 * (k + 1))
        print(f'   {code} → {wait}s 기다림', flush=True)
        time.sleep(wait)
    return False

for pid, p in sorted(picks.items(), key=lambda kv: (not kv[0].startswith('ph-'), kv[0])):
    if only and pid not in only: continue
    if pid in credits and os.path.exists(os.path.join(out, pid + '.jpg')) and not only: continue
    c = cands[pid][p['i']]
    url = thumb_url(c['url'], min(960, c['w'] - 1))
    raw = os.path.join(RAW, pid + '.img')
    print(pid, c['title'][:60], flush=True)
    if not fetch(url, raw):
        print('   실패', pid, flush=True); continue
    im = Image.open(raw).convert('RGB')
    if p.get('kind', 'photo') == 'portrait' or pid.startswith('pt-'):
        # 정사각형으로 자르기: 가로 가운데(cx), 세로는 위에서 top 비율
        W, H = im.size; s = min(W, H) * p.get('zoom', 1.0)
        cx = W * p.get('cx', 0.5); top = H * p.get('top', 0.08 if H > W else 0.0)
        box = [int(max(0, min(W - s, cx - s / 2))), int(max(0, min(H - s, top))), 0, 0]
        box[2] = int(box[0] + s); box[3] = int(box[1] + s)
        im = im.crop(box).resize((360, 360), Image.LANCZOS)
    else:
        if p.get('crop'):  # [왼, 위, 오, 아래] 비율
            W, H = im.size; l, t, r, b = p['crop']; im = im.crop((int(W * l), int(H * t), int(W * r), int(H * b)))
        if im.width > 1100: im = im.resize((1100, int(im.height * 1100 / im.width)), Image.LANCZOS)
    if p.get('bright'): im = ImageEnhance.Brightness(im).enhance(p['bright'])  # 어두운 옛 그림 밝게
    im.save(os.path.join(out, pid + '.jpg'), quality=84, optimize=True)
    credits[pid] = {'caption': p.get('caption', ''), 'title': c['title'], 'author': c['artist'] or c['credit'], 'license': c['license'],
                    'licenseUrl': c.get('licenseUrl', ''), 'page': c['page']}
    json.dump(credits, open(cred_path, 'w'), ensure_ascii=False, indent=1)
    time.sleep(6)
print('끝', len(credits))
