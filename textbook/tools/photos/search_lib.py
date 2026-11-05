# 위키미디어 공용에서 주제별 후보 사진 찾기 (라이선스·크기·품질 표시로 점수)
# 사용: python3 -I search.py subjects.json candidates.json [id ...]
import sys, json, subprocess, urllib.parse, re, time, html

UA = 'SeungminTextbookBuilder/1.0 (https://github.com/seungminggg-cyber/common-social-studies)'
API = 'https://commons.wikimedia.org/w/api.php'
OK_LIC = re.compile(r'^(CC BY(-SA)? [0-9.]+.*|CC0.*|Public domain.*|PD.*|No restrictions|Attribution.*)$', re.I)
BAD_LIC = re.compile(r'NC|ND|fair use|GFDL$', re.I)

def api(params):
    q = API + '?' + urllib.parse.urlencode({**params, 'format': 'json'})
    for t in range(4):
        r = subprocess.run(['curl', '-s', '--max-time', '40', '-A', UA, q], capture_output=True, text=True)
        try:
            return json.loads(r.stdout)
        except Exception:
            time.sleep(5 * (t + 1))
    return {}

def strip(s):
    s = re.sub(r'<[^>]+>', '', s or '')
    return html.unescape(re.sub(r'\s+', ' ', s)).strip()

def search(sub):
    d = api({'action': 'query', 'generator': 'search', 'gsrnamespace': 6, 'gsrsearch': sub['q'] + ' filetype:bitmap',
             'gsrlimit': 25, 'prop': 'imageinfo', 'iiprop': 'url|size|mime|extmetadata'})
    out = []
    for p in (d.get('query', {}).get('pages', {}) or {}).values():
        ii = (p.get('imageinfo') or [{}])[0]
        md = ii.get('extmetadata', {})
        lic = strip(md.get('LicenseShortName', {}).get('value', ''))
        if not lic or BAD_LIC.search(lic) or not OK_LIC.match(lic):
            continue
        if ii.get('mime') not in ('image/jpeg', 'image/png', 'image/tiff'):
            continue
        w, h = ii.get('width', 0), ii.get('height', 0)
        cats = md.get('Categories', {}).get('value', '')
        desc = strip(md.get('ImageDescription', {}).get('value', ''))[:300]
        title = p['title']
        score = 0
        if 'Featured pictures' in cats: score += 6
        if 'Quality images' in cats: score += 4
        if 'Valued images' in cats: score += 3
        if sub.get('must') and sub['must'].lower() in (title + ' ' + desc).lower(): score += 3
        if sub['kind'] == 'photo':
            if w < 900: continue
            if w >= h: score += 2
        else:
            if min(w, h) < 300: continue
        if re.search(r'map|logo|stamp|coin|diagram|chart', title, re.I) and 'map' not in sub['q'].lower(): score -= 4
        score += min(3, (w * h) / 4e6)
        out.append({'title': title, 'page': p.get('fullurl') or 'https://commons.wikimedia.org/wiki/' + urllib.parse.quote(title.replace(' ', '_')),
                    'url': ii.get('url'), 'w': w, 'h': h, 'license': lic,
                    'licenseUrl': md.get('LicenseUrl', {}).get('value', ''),
                    'artist': strip(md.get('Artist', {}).get('value', ''))[:120],
                    'credit': strip(md.get('Credit', {}).get('value', ''))[:120],
                    'desc': desc, 'score': round(score, 2)})
    out.sort(key=lambda x: -x['score'])
    return out[:6]
