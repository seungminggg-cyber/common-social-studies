# 파일 설명 페이지 원문 보기: python3 -I wikitext.py credits.json id id ...
import sys, json, os, re
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import search_lib as S
c = json.load(open(sys.argv[1]))
for i in sys.argv[2:]:
    t = c[i]['title'] if i in c else i
    d = S.api({'action': 'query', 'titles': t, 'prop': 'revisions', 'rvprop': 'content', 'rvslots': 'main'})
    for p in d.get('query', {}).get('pages', {}).values():
        txt = p['revisions'][0]['slots']['main']['*']
        txt = re.sub(r'\n\[\[Category:.*', '', txt)  # 분류 줄은 생략
        print('=' * 8, i, p['title']); print(txt[:1800])
