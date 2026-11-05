# 검색 결과 후보마다 라이선스 근거(틀)와 출처를 함께 보기: python3 -I cands_lic.py "검색어" [개수]
import sys, json, os, re
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import search_lib as S
n = int(sys.argv[2]) if len(sys.argv) > 2 else 12
d = S.api({'action': 'query', 'generator': 'search', 'gsrnamespace': 6, 'gsrsearch': sys.argv[1] + ' filetype:bitmap', 'gsrlimit': n,
           'prop': 'imageinfo|templates', 'iiprop': 'url|size|extmetadata', 'tllimit': 'max', 'tlnamespace': 10})
for p in (d.get('query', {}).get('pages', {}) or {}).values():
    ii = (p.get('imageinfo') or [{}])[0]; md = ii.get('extmetadata', {})
    g = lambda k: S.strip(md.get(k, {}).get('value', ''))
    tl = [t['title'][9:] for t in p.get('templates', []) if re.search(r'PD|cc-|Cc-|CC|self|own|VRT|OTRS|Permission|Flickr|LicenseReview', t['title']) and '/' not in t['title']]
    print(f"{p['title'][5:75]:70} {ii.get('width')}x{ii.get('height')} | {g('LicenseShortName')[:18]} | {', '.join(tl)[:110]} | {g('Artist')[:40]}")
