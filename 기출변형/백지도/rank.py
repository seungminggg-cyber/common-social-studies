# 백지도에 넣을 나라 후보 순위 — 나라목록.json에서
#   순위 기준: ① 나온 곳 수(다섯 학교 + 개념풀, 0~6) ② 그 여섯 곳의 횟수 합 (개념서는 참고라 뺌)
#   python3 -I rank.py → 후보목록.md
import json, os
HERE = os.path.dirname(os.path.abspath(__file__))
J = json.load(open(os.path.join(HERE, '나라목록.json')))
SRC = ['작전고', '계양고', '계산여고', '서운고', '인천국제고', '개념풀']
SHORT = {'작전고': '작', '계양고': '양', '계산여고': '산', '서운고': '서', '인천국제고': '국'}
REG = {  # 대륙(2단계 대륙별 나누기용)
 '아시아': '한국 중국 일본 북한 인도 인도네시아 베트남 미얀마 필리핀 말레이시아 방글라데시 대만 싱가포르 브루나이 스리랑카 파키스탄 태국 몽골 라오스 캄보디아 동티모르 네팔 카자흐스탄 투르크메니스탄 아프가니스탄',
 '서남아시아': '사우디아라비아 시리아 이란 카타르 팔레스타인 이스라엘 튀르키예 아랍에미리트 예멘 요르단 이라크 쿠웨이트 레바논 아제르바이잔 아르메니아 조지아 키프로스',
 '유럽': '러시아 영국 독일 프랑스 우크라이나 스페인 노르웨이 네덜란드 이탈리아 덴마크 아이슬란드 포르투갈 벨기에 벨라루스 불가리아 스위스 폴란드',
 '아프리카': '나이지리아 에티오피아 니제르 케냐 남수단 소말리아 콩고_민주_공화국 말리 수단 차드 가나 가봉 남아프리카_공화국 르완다 앙골라 우간다 이집트 적도_기니 탄자니아 리비아',
 '아메리카': '미국 멕시코 캐나다 브라질 아르헨티나 콜롬비아 칠레 베네수엘라 볼리비아 엘살바도르 파나마',
 '오세아니아': '오스트레일리아(호주) 뉴질랜드 투발루 키리바시 파푸아뉴기니 피지',
}
R = {n.replace('_', ' '): r for r, s in REG.items() for n in s.split()}
rows = []
names = {n for s in SRC for n, e in J[s]['items'].items() if e['kind'] in ('country', 'ambiguous')}
for n in names:
    per = [J[s]['items'].get(n, {}).get('total', 0) for s in SRC]
    kind = next(J[s]['items'][n]['kind'] for s in SRC if n in J[s]['items'])
    big = set()
    for s in SRC:
        for u in J[s]['items'].get(n, {}).get('units', {}):
            big.add('Ⅳ' if u in ('11', '12', '13', 'Ⅳ종합') else 'Ⅴ')
    rows.append(dict(n=n, kind=kind, per=per, src=sum(1 for v in per if v), tot=sum(per), big='·'.join(sorted(big)), reg=R.get(n, '?')))
rows.sort(key=lambda r: (-r['src'], -r['tot'], r['n']))
L = ['# 백지도 나라 후보 순위 (30개국 / 50개국)', '',
     '- 순위 기준: ① 나온 곳 수(다섯 학교 + 개념풀, 최대 6곳) → ② 여섯 곳 횟수 합. 개념서는 참고라 뺌.',
     '- 학교 줄임: 작=작전고, 양=계양고, 산=계산여고, 서=서운고, 국=인천국제고. ※ = 나라 지위가 애매한 곳(대만·팔레스타인).', '',
     '| 순위 | 나라 | 대륙 | 나온 학교 | 개념풀 | 합계 | 단원 |', '|---:|---|---|---|---:|---:|---|']
for i, r in enumerate(rows, 1):
    if i == 31: L.append('| | **— 여기까지 30 —** | | | | | |')
    if i == 51: L.append('| | **— 여기까지 50 —** | | | | | |')
    sch = ''.join(SHORT[s] for s, v in zip(SRC[:5], r['per'][:5]) if v) or '-'
    L.append(f"| {i} | {r['n']}{' ※' if r['kind'] == 'ambiguous' else ''} | {r['reg']} | {sch} | {r['per'][5]} | {r['tot']} | {r['big']} |")
open(os.path.join(HERE, '후보목록.md'), 'w').write('\n'.join(L) + '\n')
for k in (30, 50):
    print(k, ', '.join(r['n'] for r in rows[:k]))
print([r['n'] for r in rows[:50] if r['reg'] == '?'])
