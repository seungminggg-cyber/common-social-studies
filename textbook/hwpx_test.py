"""한글(HWPX) 파일 만들기 — 시험판

content/t1-1.js 의 내용 중 "01 단원 개념" 부분을 한글 파일(.hwpx)로 만들어 봅니다.
한글에서 잘 열리는지, 표·색·빈칸이 어떻게 보이는지 확인하는 용도입니다.
(디자인을 고른 뒤 이 방식으로 전체 한글 파일을 만들 예정)

사용법:
  pip install python-hwpx==6.11.0
  node -e "import('./content/t1-1.js').then(m=>console.log(JSON.stringify(m.default)))" > out/t1-1.json
  python3 hwpx_test.py out/t1-1.json out/시험-01단원.hwpx
"""
import json
import re
import sys

from hwpx import document

MM = 283.465  # 1mm = 283.465 HWPUNIT
C1, C1_SOFT, PINK, ANS, GRAY = '#5A4FCF', '#EFEDFC', '#DF4B80', '#1F6FEB', '#707080'
FONT = '맑은 고딕'
CIRCLED = '❶❷❸❹❺❻❼❽❾❿⓫⓬⓭⓮⓯⓰⓱⓲⓳⓴'

src, out = sys.argv[1], sys.argv[2]
book = json.load(open(src, encoding='utf-8'))
unit = book['units'][0]

doc = document.HwpxDocument.new()
doc.set_page_margins(left=int(18 * MM), right=int(15 * MM), top=int(12 * MM), bottom=int(12 * MM))
blanks = []  # 빈칸 정답 (단원 끝에 모아서)


def runs(p, text, size=10, color=None, bold=False):
    """[[빈칸]] **굵게** ==형광== __밑줄__ 표시를 한글 글자 모양으로 바꿔 넣는다."""
    for part in re.split(r'(\[\[.+?\]\]|\*\*.+?\*\*|==.+?==|__.+?__)', text):
        if not part:
            continue
        if part.startswith('[['):
            ans = part[2:-2]
            blanks.append(ans)
            p.add_run(CIRCLED[len(blanks) - 1], color=C1, size=size, font=FONT)
            p.add_run(' ' * max(6, len(ans) * 3), underline=True, size=size, font=FONT)
        elif part.startswith('**'):
            p.add_run(part[2:-2], bold=True, size=size, color=color, font=FONT)
        elif part.startswith('=='):
            p.add_run(part[2:-2], highlight='#E3DEFD', size=size, color=color, font=FONT)
        elif part.startswith('__'):
            p.add_run(part[2:-2], underline=True, size=size, color=color, font=FONT)
        else:
            p.add_run(part, size=size, color=color, bold=bold, font=FONT)


def para(text='', size=10, color=None, bold=False):
    p = doc.add_paragraph('', inherit_style=False)
    runs(p, text, size=size, color=color, bold=bold)
    return p


def cell_text(table, r, c, text, size=9.5, color=None, bold=False):
    cell = table.cell(r, c)
    cell.set_text('')
    p = cell.paragraphs[0]
    runs(p, text, size=size, color=color, bold=bold)


def kv_table(rows):
    t = doc.add_table(len(rows), 2, width=int(170 * MM))
    t.set_column_widths([18, 82])
    for r, (k, v) in enumerate(rows):
        cell_text(t, r, 0, k, size=9, color=C1, bold=True)
        cell_text(t, r, 1, v)
        t.set_cell_shading(r, 0, C1_SOFT)
    return t


# ── 단원 첫머리 ──
doc.paragraphs[0].text = ''
para(f"{book['chapter']['no']}. {book['chapter']['title']}", size=10, color=C1, bold=True)
para(f"{unit['no']}  {unit['title']}", size=20, bold=True)
g = doc.add_table(1, 2, width=int(170 * MM))
cell_text(g, 0, 0, '핵심 질문  ' + '  '.join(f'Q{i+1} {q}' for i, q in enumerate(unit['questions'])), size=9)
cell_text(g, 0, 1, '수능 포인트  ' + unit['point'], size=9)
g.set_cell_shading(0, 0, C1_SOFT)
g.set_cell_shading(0, 1, '#FDF0F5')
para()


def render(b):
    t = b['t']
    if t == 'sec':
        para(f"{b['mark']}  {b['title']}", size=13, color=C1, bold=True)
    elif t == 'item':
        para(f"{b['no']}  {b['title']}", size=11, bold=True)
        for x in b.get('body', []):
            render(x)
        if b.get('side'):
            s = b['side']
            box = doc.add_table(1, 1, width=int(170 * MM))
            text = s.get('text') or '  /  '.join(s.get('items', []))
            cell_text(box, 0, 0, f"✎ 개념 더하기 | {s['title']}  —  {text}", size=8.5)
            box.set_cell_shading(0, 0, '#F4F4FA')
    elif t in ('ul', 'ol'):
        for i, x in enumerate(b['items']):
            para(('▪ ' if t == 'ul' else '①②③④⑤'[i] + ' ') + x)
    elif t == 'p':
        para(b['text'])
    elif t == 'kv':
        kv_table(b['rows'])
    elif t == 'table':
        if b.get('title'):
            para('■ ' + b['title'], size=9.5, bold=True)
        tb = doc.add_table(len(b['rows']) + 1, len(b['head']), width=int(170 * MM))
        if b.get('widths'):
            tb.set_column_widths(b['widths'])
        for c, h in enumerate(b['head']):
            cell_text(tb, 0, c, h, size=9, color='#FFFFFF', bold=True)
            tb.set_cell_shading(0, c, C1)
        for r, row in enumerate(b['rows']):
            for c, v in enumerate(row):
                cell_text(tb, r + 1, c, v, size=9, bold=(c == 0))
    elif t == 'hub':
        tb = doc.add_table(2, 2, width=int(170 * MM))
        for i, s in enumerate(b['spokes']):
            cell_text(tb, i // 2, i % 2, f"**{s['title']}**  {s['text']}", size=9)
    elif t == 'compare':
        para('⚠ ' + b['title'], size=10, color=C1, bold=True)
        tb = doc.add_table(1, 2, width=int(170 * MM))
        for c, col in enumerate(b['cols']):
            cell_text(tb, 0, c, f"**{col['title']}**  " + ' / '.join(col['items']), size=9)
    elif t == 'source':
        para('자료 읽기  ' + b['title'], size=10, color=C1, bold=True)
        tb = doc.add_table(len(b['dialog']) + 1, 2, width=int(170 * MM))
        tb.set_column_widths([10, 90])
        for r, (who, text) in enumerate(b['dialog']):
            cell_text(tb, r, 0, who, size=9, bold=True)
            cell_text(tb, r, 1, text, size=9)
        cell_text(tb, len(b['dialog']), 0, '해석', size=9, color=PINK, bold=True)
        cell_text(tb, len(b['dialog']), 1, b['interp'], size=9)
    elif t == 'example':
        para('해석 연습  ' + b['title'], size=10, color=PINK, bold=True)
        if b.get('stem'):
            para(b['stem'], size=9, color=GRAY)
        render(b['data'])
        for i, s in enumerate(b['steps']):
            para(f'STEP {i+1}  ' + s, size=9)
    elif t == 'tip':
        tb = doc.add_table(1, 1, width=int(170 * MM))
        cell_text(tb, 0, 0, '승민T 한마디  ' + b['text'], size=9.5)
        tb.set_cell_shading(0, 0, '#FDF0F5')
    para()


for b in unit['concept']:
    render(b)

para('빈칸 정답  ' + '  '.join(f'{CIRCLED[i]} {a}' for i, a in enumerate(blanks)), size=8.5, color=GRAY)

report = doc.validate()
print('검사:', getattr(report, 'ok', report))
doc.save_to_path(out)
print('저장:', out)
