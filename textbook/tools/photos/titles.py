# 파일 이름으로 정보 보기: python3 -I titles.py "File:A.jpg" "File:B.jpg"
import sys, json, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import search_lib as S
d = S.api({'action': 'query', 'titles': '|'.join(sys.argv[1:]), 'prop': 'imageinfo', 'iiprop': 'url|size|extmetadata'})
for p in d.get('query', {}).get('pages', {}).values():
    ii = (p.get('imageinfo') or [{}])[0]; md = ii.get('extmetadata', {})
    print(p['title'], ii.get('width'), ii.get('height'), S.strip(md.get('LicenseShortName', {}).get('value', '')), '|', S.strip(md.get('Artist', {}).get('value', ''))[:80])
