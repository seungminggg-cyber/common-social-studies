# 학교 학습지(에이전트가 읽은 결과) + 개념풀 + 개념서 → 나라목록.md / 나라목록.json
#   python3 -I build.py <결과 폴더(학교 JSON·gp.json·tb.json)>
import sys, os, json, collections
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import names as N
HERE = os.path.dirname(os.path.abspath(__file__)); SRC = sys.argv[1]
NAMES = N.load(); OTH = N.others()
SCHOOLS = [('작전', '작전고', ['11', '12', '13', '14', '15', '16']), ('계양', '계양고', ['11', '12', '13', '15', '16']),
           ('계산여고', '계산여고', ['12', '13', '15', '16']), ('서운', '서운고', ['12', '13', '14', '15', '16']),
           ('인천국제고', '인천국제고', ['12', '13', '15', '16'])]
UNIT = {'11': '세계화의 양상', '12': '국제 사회와 평화', '13': '남북 분단·동아시아 갈등', '14': '세계의 인구', '15': '자원·지속가능발전',
        '16': '미래 사회·세계시민', 'Ⅳ종합': 'Ⅳ 대단원 문제', 'Ⅴ종합': 'Ⅴ 대단원 문제'}
BIG = lambda u: 'Ⅳ' if u in ('11', '12', '13', 'Ⅳ종합') else 'Ⅴ'
FIX = {'호주': '오스트레일리아(호주)', '오스트레일리아': '오스트레일리아(호주)', '터키': '튀르키예', '타이완': '대만', '대한민국': '한국', '우리나라': '한국'}

def norm(m):
    n = FIX.get(m['name'].strip(), m['name'].strip())
    if n in NAMES: n, k = NAMES[n]; return n, k, None
    k = m.get('kind') or 'other'
    if k == 'country': k = 'ambiguous' if n in ('대만', '팔레스타인', '코소보', '서사하라') else 'country'
    return n, k, m.get('otherType') or OTH.get(n) or ('기타' if k == 'other' else None)

def collect(rows, label):
    """rows → {name: {kind, otherType, total, units{u: n}, where{w: n}, places[]}}"""
    out = {}
    for m in rows:
        n, k, t = norm(m); c = int(m.get('count') or 1)
        u = str(m.get('unit') or '?').replace('중단원', '').strip()
        e = out.setdefault(n, dict(kind=k, otherType=t, total=0, units=collections.Counter(), where=collections.Counter(), places=collections.Counter()))
        e['total'] += c; e['units'][u] += c; e['where'][m.get('where') or '?'] += c
        pl = m.get('img') or m.get('page') or ''
        if m.get('page') and m.get('img'): pl = f"{m['img']}({m['page']})"
        e['places'][f"{u} {pl} {m.get('where') or ''}{' 손글씨' if m.get('hand') else ''}".strip()] += c
    return out

data = {}
for key, name, units in SCHOOLS:
    f = os.path.join(SRC, f'{key}.json')
    if not os.path.exists(f): print('없음:', f); continue
    d = json.load(open(f))
    st = {u: (d.get('units', {}).get(u, {}) or {}).get('status', '?') for u in units}
    data[name] = dict(type='school', units=units, status=st, items=collect(d['mentions'], name))
for key, name, units in (('gp', '개념풀', ['11', '12', '13', 'Ⅳ종합', '14', '15', '16', 'Ⅴ종합']), ('tb', '개념서', ['11', '12', '13', '14', '15', '16'])):
    rows = json.load(open(os.path.join(SRC, f'{key}.json')))
    data[name] = dict(type='book', units=units, status={}, items=collect(rows, name))

def ctry(it, big=None, amb=False):
    ks = ('country', 'ambiguous') if amb else ('country',)
    return {n for n, e in it.items() if e['kind'] in ks and (big is None or any(BIG(u) == big for u in e['units']))}

cols = list(data)
L = ['# 백지도 테스트 1단계 — 통합사회2 Ⅳ·Ⅴ에 나오는 나라', '',
     '> 만든 도구: `build.py`(합치기), `count.py`(개념풀·개념서 글자 세기), `names.py`(나라 이름 사전). 학습지 사진·문제집 글은 저장소에 넣지 않았다.', '',
     '## 한눈에 보기', '', '| | ' + ' | '.join(cols) + ' |', '|---|' + '---:|' * len(cols)]
row = lambda t, f: L.append(f'| {t} | ' + ' | '.join(f(data[c]) for c in cols) + ' |')
row('나라 수', lambda d: str(len(ctry(d['items']))))
row('Ⅳ에서', lambda d: str(len(ctry(d['items'], 'Ⅳ'))))
row('Ⅴ에서', lambda d: str(len(ctry(d['items'], 'Ⅴ'))))
row('지위 애매(따로)', lambda d: '·'.join(sorted(ctry(d['items'], amb=True) - ctry(d['items']))) or '-')
row('학습지 없는 중단원', lambda d: ('·'.join(u for u, s in d['status'].items() if '없음' in s) or '없음') if d['type'] == 'school' else '-')
L += ['', '- 나라 수 = 서로 다른 주권 국가 수(대만·팔레스타인 등 지위가 애매한 곳은 빼고 따로 적음). Ⅳ·Ⅴ 양쪽에 나온 나라는 두 줄에 모두 들어가므로 Ⅳ+Ⅴ가 나라 수보다 클 수 있다.',
      '- 학교 범위: ' + ', '.join(f"{n} {'·'.join(u)}" for _, n, u in SCHOOLS) + ' (개념서 중단원 번호).', '']

sch = [c for c in cols if data[c]['type'] == 'school']
allc = collections.Counter(); where = collections.defaultdict(list)
for c in sch:
    for n in ctry(data[c]['items']): where[n].append(c)
tot = lambda n, cs: sum(data[c]['items'][n]['total'] for c in cs if n in data[c]['items'])
fmt = lambda ns, cs: ', '.join(f'{n}({tot(n, cs)})' for n in sorted(ns, key=lambda n: (-tot(n, cs), n))) or '없음'
five = [n for n, cs in where.items() if len(cs) == len(sch)]
L += ['## ① 다섯 학교에 모두 나오는 나라', '', f'{len(five)}개: ' + fmt(five, sch) + '  (괄호 = 다섯 학교 합친 횟수)', '',
      '## ② 학교 한 곳에만 나오는 나라', '']
for c in sch:
    one = [n for n, cs in where.items() if cs == [c]]
    L.append(f'- **{c}** {len(one)}개: ' + fmt(one, [c]))
gp = data['개념풀']['items']; only = [n for n in ctry(gp) if n not in where]
L += ['', '## ③ 학습지에는 없고 개념풀에만 나오는 나라', '', f'{len(only)}개 (횟수 순): ' + fmt(only, ['개념풀']), '']
if '개념서' in data:
    L += ['- 참고: 개념풀·학습지 어디에도 없고 개념서에만 나오는 나라 — ' + fmt([n for n in ctry(data['개념서']['items']) if n not in where and n not in gp], ['개념서']), '']

def places(e, k=6):
    ps = [f'{p}×{n}' if n > 1 else p for p, n in e['places'].most_common()]
    return '; '.join(ps[:k]) + (f' 외 {len(ps) - k}곳' if len(ps) > k else '')
L += ['## 자세한 목록', '', '형식: 나라(횟수) — 나온 곳(중단원 사진/쪽 위치). 학교는 사진 파일 이름, 개념풀은 PDF 쪽, 개념서는 중단원.', '']
for c in cols:
    d = data[c]; it = d['items']
    L += [f'### {c}', '']
    if d['type'] == 'school':
        L.append('- 중단원: ' + ', '.join(f"{u} {UNIT[u]}({s})" for u, s in d['status'].items()))
    for big in ('Ⅳ', 'Ⅴ'):
        us = [u for u in d['units'] if BIG(u) == big]
        if not us: continue
        L += ['', f'**{big}** ({"·".join(us)})', '']
        for kind, lab in (('country', '나라'), ('ambiguous', '지위 애매')):
            ns = [n for n, e in it.items() if e['kind'] == kind and any(BIG(u) == big for u in e['units'])]
            sub = lambda n: sum(v for u, v in it[n]['units'].items() if BIG(u) == big)
            ns.sort(key=lambda n: (-sub(n), n))
            if not ns: continue
            L.append(f'- {lab} {len(ns)}개')
            for n in ns:
                e = it[n]; ex = ''
                if c == '개념풀':
                    w = e['where']; ex = f" [개념 {w.get('개념', 0)} · 문제 {w.get('문제', 0)}]"
                L.append(f'  - {n}({sub(n)}){ex} — ' + places({**e, 'places': collections.Counter({p: v for p, v in e['places'].items() if BIG(p.split()[0]) == big})}))
    oth = collections.defaultdict(list)
    for n, e in sorted(it.items(), key=lambda x: -x[1]['total']):
        if e['kind'] == 'other': oth[e['otherType'] or '기타'].append(f"{n}({e['total']})")
    if oth:
        L += ['', '- 나라가 아닌 것'] + [f'  - {t}: ' + ', '.join(v) for t, v in oth.items()]
    L.append('')
L += ['## 세는 기준', '',
      '- 주권 국가(유엔 회원국 + 바티칸). 대만·팔레스타인·코소보·서사하라는 \'지위 애매\'로 따로.',
      '- 같은 나라 다른 이름은 하나로: 대한민국·우리나라·남한 → 한국, 조선민주주의인민공화국 → 북한, 호주 → 오스트레일리아(호주), 터키 → 튀르키예, 타이완·중화민국 → 대만.',
      '- 학교 학습지: 인쇄 글자 + 손글씨(필기) 모두, 지도 속 이름 포함. 그림 속 A·B·C처럼 이름이 없는 것은 세지 않음. 사진을 눈으로 읽어 센 것.',
      '- 개념풀: 글자 PDF(교사용, 정답·해설이 문제 쪽에 함께 있음)를 프로그램으로 셈. 개념 = 개념 설명·교과서 자료 쪽, 문제 = 개념 Check·내공 Full·수능 Preview·등급 UP(해설 포함). 그림으로만 들어간 지도 글자는 빠졌을 수 있음.',
      '- 개념서: `textbook/content/_t2-4`, `_t2-5`(+ `_cc` 문제)를 프로그램으로 셈. 지도 블록은 번호 표시라 나라 이름이 글로 있을 때만 셈.',
      '- 작전고의 영국 2번은 모두 그래프 출처("영국 국영 석유 회사")에서 나온 것이다. 빼면 "다섯 학교 모두"에서 영국이 빠진다.',
      '- 서운고 15(자원)는 따로 된 학습지가 없고 Ⅳ 학습지 속 SDGs 표 한 쪽뿐이라 "학습지 없음"으로 셈. 계양고 16·인천국제고 16은 학습지는 있으나 나라 이름이 없음.',
      '- 인천국제고 학습노트는 15쪽 사진이 없음. 16쪽 동아시아 영역 분쟁은 학습지 위치대로 15(자원 분쟁)에 넣음.',
      '- 낱말이 겹치는 이름(인도주의·수단·~이란 등)은 걸러 냈지만 프로그램으로 센 개념풀·개념서 횟수는 한두 번 오차가 있을 수 있다.', '']
open(os.path.join(HERE, '나라목록.md'), 'w').write('\n'.join(L))
J = {c: dict(type=d['type'], units=d['units'], status=d['status'],
             items={n: dict(kind=e['kind'], otherType=e['otherType'], total=e['total'], units=dict(e['units']), where=dict(e['where']), places=dict(e['places']))
                    for n, e in sorted(d['items'].items(), key=lambda x: -x[1]['total'])}) for c, d in data.items()}
json.dump(J, open(os.path.join(HERE, '나라목록.json'), 'w'), ensure_ascii=False, indent=1)
print('\n'.join(L[4:12]))
