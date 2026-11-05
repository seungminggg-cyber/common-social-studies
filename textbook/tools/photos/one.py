# 한 주제만 검색해서 candidates.json 에 넣기: python3 -I one.py candidates.json id kind "검색어"
import sys, json, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import search_lib as S
res = json.load(open(sys.argv[1]))
out = S.search({'id': sys.argv[2], 'kind': sys.argv[3], 'q': sys.argv[4]})
for i, x in enumerate(out): print(i, x['title'][:80], x['w'], x['h'], x['license'], x['score'])
res[sys.argv[2]] = out
json.dump(res, open(sys.argv[1], 'w'), ensure_ascii=False, indent=1)
