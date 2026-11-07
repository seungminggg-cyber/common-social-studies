"""2028 예시문항 특강 교재 → 한글 파일(.hwpx)

문제집의 hwpx_wb.py(문항 그리기)와 개념서의 hwpx_build.py(표·띠·그림 도구)를 불러 쓰고,
특강에만 있는 부분(안내, 유형 머리, 예시문항 분석 카드, 함정·점검표, 쌍둥이 세트)만 여기서 만든다.
먼저 `node 특강/build.mjs`가 out/sp/예시문항특강-학생용.json 과 그림(out/sp/fig/예시문항특강-학생용/)을 만들어 두어야 한다.

  python3 특강/hwpx_sp.py out/sp/예시문항특강-학생용.json out/sp/예시문항특강-학생용.hwpx
  python3 특강/hwpx_sp.py out/sp/예시문항특강-학생용.json out/sp/예시문항특강-교사용.hwpx teacher
  강의용(평가원 원문 그림 수록, `build.mjs lecture` 뒤): out/sp/예시문항특강-강의용-학생용.json 으로 같은 방식
"""
import os

HERE = os.path.dirname(os.path.abspath(__file__))
WB = os.path.join(HERE, '..', 'hwpx_wb.py')
# hwpx_wb.py의 앞부분(도구 + 문항 그리기)만 실행한다. 아래쪽 문서 만들기는 문제집 전용이라 뺀다.
code = open(WB, encoding='utf-8').read().split("doc.paragraphs[0].text = ''")[0]
G = {'__file__': WB, '__name__': 'hwpx_wb_lib'}
exec(compile(code, WB, 'exec'), G)
doc, para, run, rich, chip, table, cell, gap, band, columns, question = (
    G[k] for k in ('doc', 'para', 'run', 'rich', 'chip', 'table', 'cell', 'gap', 'band', 'columns', 'question'))
block, book, TEACHER, CIRCLED, GANADA, pp = G['G']['block'], G['book'], G['TEACHER'], G['CIRCLED'], G['GANADA'], G['pp']
NAVY, GRAY, INK, ORANGE = G['NAVY'], G['GRAY'], G['INK'], G['ORANGE']
out = G['out']
RED = '#C8102E'
COLOR = {'01': '#7D3566', '02': '#5B3D8A', '03': '#3C7A37', '04': '#234E8A', '05': '#B5651D', '06': '#7A5A2E', '07': '#1D6C74'}
TYPES, ITEMS, OV, SET = book['TYPES'], book['ITEMS'], book['OVERVIEW'], book['set']


def kv_rows(rows, color, key_w=20):
    t = table(len(rows), 2, [key_w, 100 - key_w])
    for r, (k, v) in enumerate(rows):
        p = cell(t, r, 0, fill='#F5F3F0', sides=('bottom',), border='#D9D4CE', pad=(2.5, 1.5, 1.6, 1.6))
        rich(p, k, size=8.8, color=color, bold=True)
        rich(cell(t, r, 1, sides=('bottom',), border='#D9D4CE', pad=(2, 2.5, 1.6, 1.6)), v, size=9.2)
    gap(5)


def sec(mark, title, color):
    p = para(before=8, after=3)
    chip(p, f' {mark} ', color, size=10)
    run(p, '  ' + title, size=13.5, color=INK, bold=True)


def item_card(no, it, color, strat=None):
    form_bogi = any(w in it['form'] for w in ('보기', '적어도', '벤'))
    p = para(before=8, after=2)
    chip(p, f' 예시 {int(no):02d} ', color, size=10)
    run(p, '  ' + it['topic'], size=11.5, color=INK, bold=True)
    p = para(after=3)
    refs = ' / '.join(f"{k[-2:]} 단원 개념 {'·'.join(f'{c:02d}' for c in cs)}" for k, cs in it['units'])
    run(p, f"{it['pts']}점 · {it['form']} · 개념서 {refs}", size=8, color=GRAY)
    if strat:
        run(p, f"    전략 {strat[0]} {strat[1]}", size=8.4, color=INK, bold=True)
    if TEACHER:
        run(p, f"    정답 {CIRCLED[it['ans'] - 1]}", size=9, color=RED, bold=True)
    else:
        run(p, '    내 답 (     )', size=9, color=GRAY)
    ORIG = book.get('orig')  # 강의용: 평가원 원문 그림을 넣고, 핵심 자료 요약·묻는 것은 뺀다
    if ORIG:
        path = os.path.join(ORIG, f'ex-{int(no):02d}.png')
        pw, ph = G['G']['png_size'](path)
        w = 112
        with open(path, 'rb') as f:
            doc.add_picture(f.read(), 'png', width_mm=w, height_mm=w * ph / pw, align='CENTER')
        p = para(after=3, align='RIGHT')
        run(p, f'2028학년도 수능 예시문항 {int(no)}번 원문 · 저작권: 한국교육과정평가원', size=7, color=GRAY)
    rows = ([] if ORIG else [('핵심 자료', it['data']), ('묻는 것', it['ask'])]) + [('결정적 단서', it['clue']),
            ('풀이 순서', '\n'.join(f'{i + 1}) {s}' for i, s in enumerate(it['steps']))),
            ('함정 선지', '\n'.join(f'{n} {w}' for n, w in it['traps']))]
    t = table(len(rows), 2, [17, 83])
    for r, (k, v) in enumerate(rows):
        p = cell(t, r, 0, fill='#F5F3F0', sides=('bottom',), border='#D9D4CE', pad=(2.5, 1.5, 1.4, 1.4))
        rich(p, k, size=8.4, color=RED if k == '함정 선지' else color, bold=True)
        lines = v.split('\n')
        p = cell(t, r, 1, sides=('bottom',), border='#D9D4CE', pad=(2, 2.5, 1.4, 1.4))
        rich(p, lines[0], size=8.9)
        for ln in lines[1:]:
            rich(t.cell(r, 1).add_paragraph('', para_pr_id_ref=pp(spacing=160)), ln, size=8.9)
    if TEACHER:
        label = GANADA if form_bogi else CIRCLED
        t = table(len(it['judge']) + 1, 3, [7, 7, 86])
        p = cell(t, 0, 0, fill='#FBEFF1', pad=(2, 2, 1.2, 1.2))
        run(p, '판서 노트 · 선지 판정', size=8.4, color=RED, bold=True)
        t.merge_cells(0, 0, 0, 2)
        for i, (ox, why) in enumerate(it['judge']):
            run(cell(t, i + 1, 0, pad=(2, 1, 1, 1)), label[i], size=8.6, bold=True)
            run(cell(t, i + 1, 1, pad=(1, 1, 1, 1)), ox, size=8.6, bold=True, color='#2F6B2A' if ox == 'O' else RED)
            rich(cell(t, i + 1, 2, pad=(1, 2, 1, 1)), why, size=8.6)
    gap(4)


doc.paragraphs[0].text = ''
doc.page.set_page_number(position='BOTTOM_CENTER')
doc.page.set_header(text=f"승민T 통합사회 {book['title']}" + (' 강의용' if book.get('orig') else '') + (' (교사용)' if TEACHER else ''))

# 표지 대신 첫 쪽 머리
p = para(after=2)
run(p, '승민T 통합사회 · 예비 고3 겨울 특강', size=10, color=GRAY)
p = para(after=4)
run(p, book['title'], size=24, color=INK, bold=True)
p = para(after=10)
n_practice = sum(len(v) for v in book['practice'].values())
run(p, f"2028학년도 수능 예시문항 25문항 · 풀이 전략 7 · 연습 {n_practice}문항 · 쌍둥이 세트 {len(SET['questions'])}문항" + (' · 교사용' if TEACHER else ' · 학생용'), size=10, color=GRAY)

# 안내
band('예시문항 25문항 한눈에', '2028학년도 대학수학능력시험 · 사회탐구 영역(통합사회)', color=NAVY, page_break=False)
sec('1', '2028 수능 통합사회, 무엇이 달라졌나', NAVY)
kv_rows([(f'{i + 1}. {k}', v) for i, (k, v) in enumerate(OV['trends'])], NAVY, key_w=24)
sec('2', '25문항 지도 — 번호 · 배점 · 주제 · 형식 · 풀이 전략', NAVY)
type_of = {n: t['no'] for t in TYPES for n in t['items']}
cols = ['번호', '배점', '주제', '형식', '전략'] + (['정답'] if TEACHER else [])
widths = [7, 7, 52, 22, 6] + ([6] if TEACHER else [])
t = table(len(ITEMS) + 1, len(cols), widths)
for c, h in enumerate(cols):
    p = cell(t, 0, c, fill='#EEEAE5', pad=(1, 1, 1, 1))
    p.para_pr_id_ref = pp(align='CENTER')
    run(p, h, size=8.4, bold=True)
for r, (no, it) in enumerate(ITEMS.items()):
    vals = [no, str(it['pts']), it['topic'].split(' — ')[0], it['form'].split(' (')[0], type_of[int(no)]] + ([CIRCLED[it['ans'] - 1]] if TEACHER else [])
    for c, v in enumerate(vals):
        p = cell(t, r + 1, c, pad=(1.2, 1.2, .8, .8))
        if c != 2:
            p.para_pr_id_ref = pp(align='CENTER')
        rich(p, v, size=8.2)
gap(6)

# 풀이 전략 7가지 (짧게)
band('풀이 전략 7가지', '문항의 모양에 따라 푸는 법 · 뒤 문항 분석 카드의 “전략 NN”', color=NAVY)
for ty in TYPES:
    p = para(before=8, after=2)
    chip(p, f" 전략 {ty['no']} ", NAVY, size=10)
    run(p, '  ' + ty['title'].split(' — ')[0], size=12, color=INK, bold=True)
    run(p, '   예시문항 ' + ' · '.join(f'{n}번' for n in ty['items']), size=8, color=GRAY)
    rich(para(after=3, spacing=165), ty['intent'], size=9.2)
    kv_rows([(f'STEP {i + 1} {a}', b) for i, (a, b) in enumerate(ty['steps'])] + [('함정 · ' + k, v) for k, v in ty['traps']], NAVY, key_w=26)
    rich(para(after=4), '점검  ' + '  ☐ '.join([''] + ty['check']).strip(), size=8.6, color=GRAY)

# 대단원(개념서 단원 순서)
type_no = {n: (t['no'], t['title'].split(' — ')[0]) for t in TYPES for n in t['items']}
CH = {'Ⅰ': '#1D6C74', 'Ⅱ': '#7D3566', 'Ⅲ': '#3C7A37', 'Ⅳ': '#B5651D', 'Ⅴ': '#234E8A'}
for c in book['CHAPTERS']:
    b = book['books'][c['key']]
    color = CH[b['chapter']['no']]
    ex = '예시문항 ' + ' · '.join(f'{n}번' for n in c['items']) if c['items'] else '예시문항 없음 · 학력평가 1번 단원'
    band(f"{b['subject']} {b['chapter']['no']}. {b['chapter']['title']}", ex, color=color)
    p = para(after=2)
    run(p, '중단원  ', size=8.4, color=color, bold=True)
    run(p, ' · '.join(f"{u['no']} {u['title']}" for u in b['units']), size=8.4, color=GRAY)
    p = para(before=2, after=1)
    run(p, '출제 포인트', size=9.4, color=color, bold=True)
    run(p, f"   전 범위 시험 4회(2028 예시문항 + 2026 고2 학력평가 3회) 100문항 중 {c['freq']}문항", size=8, color=GRAY)
    for pt in c['points']:
        rich(para(after=1, spacing=165), '· ' + pt, size=9)
    gap(4)
    for n in c['items']:
        item_card(str(n), ITEMS[str(n)], color, type_no[n])
    qs = book['practice'][c['key']]
    if qs:
        lv = ' · '.join(f"{l} {sum(1 for q in qs if q['level'] == l)}" for l in ('상', '중상', '중', '하'))
        band(f"{b['chapter']['no']}단원 연습 문항", f"{len(qs)}문항 · {lv}", color=color)
        columns(2)
        for i, q in enumerate(qs):
            question(q, i + 1, color=color)
        columns(1)

# 쌍둥이 세트
band('예시문항 쌍둥이 세트', f"{SET['range']} · {len(SET['questions'])}문항 · 50점 · 30분 · 표시 없는 문항은 2점", color=NAVY)
columns(2)
for i, q in enumerate(SET['questions']):
    question(q, i + 1, mock=True)
columns(1)

if TEACHER:
    band('빠른 정답', '', color=NAVY)
    for c in book['CHAPTERS']:
        qs = book['practice'][c['key']]
        if not qs:
            continue
        b = book['books'][c['key']]
        p = para(after=2)
        run(p, f"{b['subject']} {b['chapter']['no']}단원 연습  ", size=9, bold=True)
        run(p, '  '.join(f"{i + 1:02d} {CIRCLED[q['answer'] - 1]}" for i, q in enumerate(qs)), size=9, color=ORANGE)
    p = para(after=2)
    run(p, '쌍둥이 세트  ', size=9, bold=True)
    run(p, '  '.join(f"{i + 1:02d} {CIRCLED[q['answer'] - 1]}" for i, q in enumerate(SET['questions'])), size=9, color=ORANGE)
else:
    G['answers']([(f"{book['books'][c['key']]['subject']} {book['books'][c['key']]['chapter']['no']}단원 연습 문항", book['practice'][c['key']]) for c in book['CHAPTERS'] if book['practice'][c['key']]] + [('쌍둥이 세트', SET['questions'])])

report = doc.validate()
print('형식 검사:', '통과' if getattr(report, 'ok', False) else report)
doc.save_to_path(out)
print('저장:', out)
