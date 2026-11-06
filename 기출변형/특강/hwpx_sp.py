"""2028 예시문항 특강 교재 → 한글 파일(.hwpx)

문제집의 hwpx_wb.py(문항 그리기)와 개념서의 hwpx_build.py(표·띠·그림 도구)를 불러 쓰고,
특강에만 있는 부분(안내, 유형 머리, 예시문항 분석 카드, 함정·점검표, 쌍둥이 세트)만 여기서 만든다.
먼저 `node 특강/build.mjs`가 out/sp/예시문항특강-학생용.json 과 그림(out/sp/fig/예시문항특강-학생용/)을 만들어 두어야 한다.

  python3 특강/hwpx_sp.py out/sp/예시문항특강-학생용.json out/sp/예시문항특강-학생용.hwpx
  python3 특강/hwpx_sp.py out/sp/예시문항특강-학생용.json out/sp/예시문항특강-교사용.hwpx teacher
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


def item_card(no, it, color):
    form_bogi = any(w in it['form'] for w in ('보기', '적어도', '벤'))
    p = para(before=8, after=2)
    chip(p, f' 예시 {int(no):02d} ', color, size=10)
    run(p, '  ' + it['topic'], size=11.5, color=INK, bold=True)
    p = para(after=3)
    refs = ' / '.join(f"{k[-2:]} 단원 개념 {'·'.join(f'{c:02d}' for c in cs)}" for k, cs in it['units'])
    run(p, f"{it['pts']}점 · {it['form']} · 개념서 {refs}", size=8, color=GRAY)
    if TEACHER:
        run(p, f"    정답 {CIRCLED[it['ans'] - 1]}", size=9, color=RED, bold=True)
    else:
        run(p, '    내 답 (     )', size=9, color=GRAY)
    rows = [('핵심 자료', it['data']), ('묻는 것', it['ask']), ('결정적 단서', it['clue']),
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
doc.page.set_header(text=f"승민T 통합사회 {book['title']}" + (' (교사용)' if TEACHER else ''))

# 표지 대신 첫 쪽 머리
p = para(after=2)
run(p, '승민T 통합사회 · 예비 고3 겨울 특강', size=10, color=GRAY)
p = para(after=4)
run(p, book['title'], size=24, color=INK, bold=True)
p = para(after=10)
n_practice = sum(len(t['qs']) for t in TYPES)
run(p, f"2028학년도 수능 예시문항 25문항 · 유형별 전략 7 · 연습 {n_practice}문항 · 쌍둥이 세트 {len(SET['questions'])}문항" + (' · 교사용' if TEACHER else ' · 학생용'), size=10, color=GRAY)

# 안내
band('예시문항 25문항 한눈에', '2028학년도 대학수학능력시험 · 사회탐구 영역(통합사회)', color=NAVY, page_break=False)
sec('1', '2028 수능 통합사회, 무엇이 달라졌나', NAVY)
kv_rows([(f'{i + 1}. {k}', v) for i, (k, v) in enumerate(OV['trends'])], NAVY, key_w=24)
sec('2', '25문항 지도 — 번호 · 배점 · 주제 · 형식 · 유형', NAVY)
type_of = {n: t['no'] for t in TYPES for n in t['items']}
cols = ['번호', '배점', '주제', '형식', '유형'] + (['정답'] if TEACHER else [])
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

# 유형별
for ty in TYPES:
    color = COLOR[ty['no']]
    band(f"유형 {ty['no']}  {ty['title']}", '예시문항 ' + ' · '.join(f'{n}번' for n in ty['items']), color=color)
    sec('A', '출제 의도 — 이 유형은 무엇을 재는가', color)
    rich(para(after=4, spacing=170), ty['intent'], size=9.6)
    sec('B', '풀이 순서 — 3단계 전략', color)
    kv_rows([(f'STEP {i + 1} {a}', b) for i, (a, b) in enumerate(ty['steps'])], color, key_w=24)
    sec('C', '예시문항 분석', color)
    for n in ty['items']:
        item_card(str(n), ITEMS[str(n)], color)
    sec('D', '함정 선지는 이렇게 만들어진다', color)
    kv_rows(ty['traps'], RED, key_w=24)
    p = para(after=2)
    run(p, '풀고 나서 점검', size=9, color=color, bold=True)
    for c in ty['check']:
        rich(para(after=1), '☐ ' + c, size=9)
    if ty['qs']:
        lv = ' · '.join(f"{l} {sum(1 for q in ty['qs'] if q['level'] == l)}" for l in ('상', '중상', '중', '하'))
        band(f"유형 {ty['no']} 연습 문항", f"{len(ty['qs'])}문항 · {lv}", color=color)
        columns(2)
        for i, q in enumerate(ty['qs']):
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
    for ty in TYPES:
        p = para(after=2)
        run(p, f"유형 {ty['no']} 연습  ", size=9, bold=True)
        run(p, '  '.join(f"{i + 1:02d} {CIRCLED[q['answer'] - 1]}" for i, q in enumerate(ty['qs'])), size=9, color=ORANGE)
    p = para(after=2)
    run(p, '쌍둥이 세트  ', size=9, bold=True)
    run(p, '  '.join(f"{i + 1:02d} {CIRCLED[q['answer'] - 1]}" for i, q in enumerate(SET['questions'])), size=9, color=ORANGE)
else:
    G['answers']([(f"유형 {t['no']} 연습 문항", t['qs']) for t in TYPES] + [('쌍둥이 세트', SET['questions'])])

report = doc.validate()
print('형식 검사:', '통과' if getattr(report, 'ok', False) else report)
doc.save_to_path(out)
print('저장:', out)
