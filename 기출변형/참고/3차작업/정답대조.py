# 사용: python3 정답대조.py <solve 폴더> "1-④, 2-②, …"  → 검토자 답과 정답.json 비교 (맞음 / 다른 번호)
import json,sys,re
d=sys.argv[1]; s=sys.argv[2]
key=[x['answer'] for x in json.load(open(d+'/정답.json'))]
C='①②③④⑤'
got=[C.index(m)+1 for m in re.findall(r'\d+-([①②③④⑤])',s)]
diff=[(i+1,C[key[i]-1],C[got[i]-1]) for i in range(min(len(key),len(got))) if key[i]!=got[i]]
print('맞음' if not diff and len(got)==25 else f'다름 {diff} (받은 답 {len(got)}개)')
