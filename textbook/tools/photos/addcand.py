# 파일 하나를 후보 목록 끝에 넣기: python3 -I addcand.py candidates.json id "File:A.jpg"  → 새 번호 출력
import sys, json, os, urllib.parse
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import search_lib as S
res = json.load(open(sys.argv[1]))
d = S.api({'action': 'query', 'titles': sys.argv[3], 'prop': 'imageinfo', 'iiprop': 'url|size|mime|extmetadata'})
p = list(d['query']['pages'].values())[0]; ii = p['imageinfo'][0]; md = ii.get('extmetadata', {})
lic = S.strip(md.get('LicenseShortName', {}).get('value', ''))
assert S.OK_LIC.match(lic) and not S.BAD_LIC.search(lic), lic
x = {'title': p['title'], 'page': ii.get('descriptionurl') or 'https://commons.wikimedia.org/wiki/' + urllib.parse.quote(p['title'].replace(' ', '_')),
     'url': ii['url'], 'w': ii['width'], 'h': ii['height'], 'license': lic, 'licenseUrl': md.get('LicenseUrl', {}).get('value', ''),
     'artist': S.strip(md.get('Artist', {}).get('value', ''))[:120], 'credit': S.strip(md.get('Credit', {}).get('value', ''))[:120], 'desc': '', 'score': 0}
res.setdefault(sys.argv[2], []).append(x)
json.dump(res, open(sys.argv[1], 'w'), ensure_ascii=False, indent=1)
print(len(res[sys.argv[2]]) - 1, x['title'], lic, x['artist'])
