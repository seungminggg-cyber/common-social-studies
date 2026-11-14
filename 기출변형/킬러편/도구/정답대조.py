# 사용: python3 킬러편/도구/정답대조.py <solve 폴더> "1-④, 2-②, …"
#  → 검토자 답과 정답.json 비교(문항 수는 정답.json에 맞춤). 다른 문항은 id와 함께 보여 준다.
import json, sys, re
d, s = sys.argv[1], sys.argv[2]
key = json.load(open(d + '/정답.json'))
C = '①②③④⑤'
got = {int(n): C.index(a) + 1 for n, a in re.findall(r'(\d+)\s*-\s*([①②③④⑤])', s)}
diff = [(k['no'], k['id'], C[k['answer'] - 1], C[got[k['no']] - 1] if k['no'] in got else '없음') for k in key if got.get(k['no']) != k['answer']]
print('모두 맞음' if not diff else '다름: ' + ', '.join(f"{n}번({i}) 정답 {a} / 검토자 {g}" for n, i, a, g in diff), f'(받은 답 {len(got)}/{len(key)})')
