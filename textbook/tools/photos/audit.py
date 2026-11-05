# 사용한 사진의 저작권 상태를 위키미디어 공용에서 다시 조회: python3 -I audit.py credits.json audit.json
import sys, json, os, time, re
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import search_lib as S
cred = json.load(open(sys.argv[1]))
ids = sorted(cred)
out = {}
for k in range(0, len(ids), 8):
    chunk = ids[k:k + 8]
    titles = {cred[i]['title']: i for i in chunk}
    for t in range(5):
        d = S.api({'action': 'query', 'titles': '|'.join(titles), 'prop': 'imageinfo|categories|templates', 'iiprop': 'extmetadata|url',
                   'cllimit': 'max', 'tllimit': 'max', 'tlnamespace': 10, 'redirects': 1})
        if 'query' in d: break
        time.sleep(4)
    q = d.get('query', {})
    norm = {x['from']: x['to'] for x in q.get('normalized', []) + q.get('redirects', [])}
    for p in q.get('pages', {}).values():
        title = p['title']
        src = next((v for tt, v in titles.items() if tt == title or norm.get(tt) == title), None)
        if src is None: continue
        md = (p.get('imageinfo') or [{}])[0].get('extmetadata', {})
        g = lambda key: S.strip(md.get(key, {}).get('value', ''))
        out[src] = {'title': title, 'missing': 'missing' in p,
                    'LicenseShortName': g('LicenseShortName'), 'License': g('License'), 'UsageTerms': g('UsageTerms'),
                    'AttributionRequired': g('AttributionRequired'), 'Copyrighted': g('Copyrighted'), 'Restrictions': g('Restrictions'),
                    'NonFree': g('NonFree'), 'Artist': g('Artist')[:200], 'Credit': g('Credit')[:200], 'Attribution': g('Attribution')[:200],
                    'Permission': g('Permission')[:300], 'DateTimeOriginal': g('DateTimeOriginal')[:60],
                    'categories': [c['title'].replace('Category:', '') for c in p.get('categories', [])],
                    'templates': [x['title'].replace('Template:', '') for x in p.get('templates', [])]}
    print(k + len(chunk), flush=True)
    time.sleep(1.5)
json.dump(out, open(sys.argv[2], 'w'), ensure_ascii=False, indent=1)
print('끝', len(out), '/', len(ids))
