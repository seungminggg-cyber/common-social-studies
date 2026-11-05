"""기출변형 문제집 → 한글 파일(.hwpx)

개념서의 hwpx_build.py(표·색 띠·그림 넣기 도구)를 그대로 불러 쓰고, 문제집 모양(단원 띠 + 2단 문제, 모의고사, 해설)만 여기서 만든다.
build.mjs가 먼저 out/<차수>/<이름>.json 과 그림(out/<차수>/fig/<이름>/*.png)을 만들어 두어야 한다.

  python3 hwpx_wb.py out/1/단원별-통합사회1-학생용.json out/1/단원별-통합사회1.hwpx           # 학생용
  python3 hwpx_wb.py out/1/단원별-통합사회1-학생용.json out/1/단원별-통합사회1-교사용.hwpx teacher   # 정답·해설을 문제 아래에
  python3 hwpx_wb.py out/1/모의고사-학생용.json out/1/모의고사.hwpx
"""
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
LIB = os.path.join(HERE, '..', 'textbook', 'hwpx_build.py')

# hwpx_build.py의 앞부분(도구 함수)만 실행한다. '# ── 문서 만들기' 아래는 개념서 전용이라 뺀다.
code = open(LIB, encoding='utf-8').read().split('# ── 문서 만들기')[0]
G = {'__file__': LIB, '__name__': 'hwpx_lib'}
exec(compile(code, LIB, 'exec'), G)
doc, para, run, rich, chip, table, cell, gap, band, columns, data_box = (
    G[k] for k in ('doc', 'para', 'run', 'rich', 'chip', 'table', 'cell', 'gap', 'band', 'columns', 'data_box'))
book, TEACHER, CIRCLED, GANADA, pp = G['book'], G['TEACHER'], G['CIRCLED'], G['GANADA'], G['pp']
TEAL, NAVY, ORANGE, GRAY, INK, COL_W = G['TEAL'], G['NAVY'], G['ORANGE'], G['GRAY'], G['INK'], G['COL_W']
LV = {'상': '#C8102E', '중상': '#A0522D', '중': TEAL, '하': GRAY}
CH_COLOR = {'Ⅰ': '#1D6C74', 'Ⅱ': '#7D3566', 'Ⅲ': '#3C7A37', 'Ⅳ': '#B5651D', 'Ⅴ': '#234E8A'}
out = sys.argv[2]


def concept_text(q):
    c = q.get('concept')
    c = c if isinstance(c, list) else [c] if c else []
    return '·'.join(f'{int(x):02d}' for x in c)


def question(q, n, mock=False, color=TEAL):
    p = para(before=2, after=2)
    chip(p, f'{n:02d}' if not mock else str(n), color if not mock else NAVY, size=10.5)
    if not mock:
        run(p, f"   난이도 {q['level']}", size=8, color=LV.get(q['level'], GRAY), bold=True)
        meta = (f"개념 {concept_text(q)}" if concept_text(q) else '') + (f" · {q['type']}" if q.get('type') else '')
        run(p, '   ' + meta, size=7.8, color=GRAY)
    stem = q['stem'] + (f" [{q['points']}점]" if mock and q.get('points') and q['points'] != 2 else '')
    rich(para(after=3, spacing=165), stem, size=9.6, bold=True)
    if q.get('data'):
        data_box(q['data'])
    if q.get('bogi'):
        t = table(1, 1, [100], width_mm=COL_W)
        p = cell(t, 0, 0, sides=('left', 'right', 'top', 'bottom'), border='#C3CCD1', pad=(3, 3, 1.6, 2.2))
        p.para_pr_id_ref = pp(align='CENTER', after=1)
        run(p, '< 보 기 >', size=8.5)
        for i, x in enumerate(q['bogi']):
            y = t.cell(0, 0).add_paragraph('', para_pr_id_ref=pp(spacing=165, before=0.6))
            run(y, f'{GANADA[i]}. ', size=9, bold=True)
            rich(y, x, size=9)
        gap(3)
    ch = q['choices']
    mark = lambda i: TEACHER and q['answer'] == i + 1
    if all(len(c) <= 9 for c in ch):
        for line in (range(0, 3), range(3, len(ch))):
            p = para(after=1)
            for i in line:
                run(p, f'{CIRCLED[i]} {ch[i]}' + ' ' * 8, size=9.4, color=ORANGE if mark(i) else INK, bold=mark(i))
    else:
        for i, c in enumerate(ch):
            p = para(after=1, spacing=160)
            run(p, CIRCLED[i] + ' ', size=9.4, color=ORANGE if mark(i) else INK, bold=mark(i))
            rich(p, c, size=9.4, color=ORANGE if mark(i) else INK)
    if TEACHER:
        p = para(before=2)
        run(p, f"정답 {CIRCLED[q['answer'] - 1]}  ", size=8.6, color=ORANGE, bold=True)
        rich(p, q['explain'], size=8.6, color=ORANGE)
    gap(12)


def answers(groups):
    band('정답과 해설')
    columns(2)
    for gi, (title, qs) in enumerate(groups):
        p = para(before=4 if gi else 0, after=2)
        run(p, title, size=10, color=NAVY, bold=True)
        p = para(after=3)
        run(p, '  '.join(f'{i + 1:02d} {CIRCLED[q["answer"] - 1]}' for i, q in enumerate(qs)), size=8.6, color=TEAL, bold=True)
        for i, q in enumerate(qs):
            p = para(before=2)
            chip(p, f'{i + 1:02d}', TEAL, size=8.5)
            run(p, f"  정답 {CIRCLED[q['answer'] - 1]}   {q.get('level', '')}", size=9, color=ORANGE, bold=True)
            rich(para(after=3, spacing=160), q['explain'], size=8.8)
    columns(1)


doc.paragraphs[0].text = ''
doc.page.set_page_number(position='BOTTOM_CENTER')
groups = []
if book['kind'] == 'units':
    doc.page.set_header(text=f"승민T 통합사회 기출변형 문제집 {book['ed']}차")
    for k, s in enumerate(book['sets']):
        u = s['unit']
        sub = '통합사회1' if u['key'].startswith('t1') else '통합사회2'
        ch = {'t1-1': 'Ⅰ', 't1-2': 'Ⅱ', 't1-3': 'Ⅲ', 't1-4': 'Ⅳ', 't1-5': 'Ⅴ', 't2-1': 'Ⅰ', 't2-2': 'Ⅱ', 't2-3': 'Ⅲ', 't2-4': 'Ⅳ', 't2-5': 'Ⅴ'}[u['book']]
        color = CH_COLOR[ch]
        band(f"{u['no']} {u['title']}", f"{sub} {ch} · {len(s['qs'])}문항", color=color, page_break=k > 0)
        columns(2)
        for i, q in enumerate(s['qs']):
            question(q, i + 1, color=color)
        columns(1)
        groups.append((f"{sub} {u['no']} {u['title']}", s['qs']))
else:
    doc.page.set_header(text=f"승민T 통합사회 실전 모의고사 {book['ed']}차")
    for k, m in enumerate(book['mocks']):
        band(f"실전 모의고사 {m['no']}회", f"{m['range']} · 25문항 · 50점 · 표시 없는 문항은 2점", color=NAVY, page_break=k > 0)
        columns(2)
        for i, q in enumerate(m['questions']):
            question(q, i + 1, mock=True)
        columns(1)
        groups.append((f"모의고사 {m['no']}회 ({m['range']})", m['questions']))
if not TEACHER:
    answers(groups)

report = doc.validate()
print('형식 검사:', '통과' if getattr(report, 'ok', False) else report)
doc.save_to_path(out)
print('저장:', out)
