"""개념서 → 한글 파일(.hwpx) 만들기 — 시안 B(카드형) 디자인

content/*.js 의 내용을 시안 B와 비슷한 모양의 한글 파일로 만듭니다.
PDF와 똑같지는 않습니다. 한글은 쪽 나누기를 스스로 하기 때문에
  - 빈칸 정답은 쪽 아래가 아니라 개념 부분 끝에 모아 둡니다.
  - 표·색 띠·상자는 한글 "표"로 만들어서, 한글에서 바로 고칠 수 있습니다.

사용법:
  pip install python-hwpx==6.11.0
  node -e "import('./content/t1-1.js').then(m=>console.log(JSON.stringify(m.default)))" > out/t1-1.json
  python3 hwpx_build.py out/t1-1.json out/개념서-B-학생용.hwpx           # 학생용
  python3 hwpx_build.py out/t1-1.json out/개념서-B-교사용.hwpx teacher   # 교사용 (빈칸·정답 채움)
"""
import json
import os
import re
import struct
import sys
import warnings

from hwpx import document

warnings.simplefilter('ignore', DeprecationWarning)

# ── 디자인 값 (시안 B) ──────────────────────────────
FONT = '맑은 고딕'      # Pretendard를 설치했다면 'Pretendard'로 바꾸면 PDF와 더 비슷해진다
SERIF = '함초롬바탕'    # 자료(제시문)용
TEAL, TEAL_DARK, TEAL_SOFT = '#0F766E', '#115E59', '#E6F4F1'
NAVY, HL, WARM, WARM_BAR = '#0B2545', '#FFE27A', '#FFF7D6', '#F2B705'
ORANGE, GRAY, LINE, CARD, NOTE = '#E8590C', '#66737D', '#DFE6E9', '#F7FBFA', '#F3F6F8'
MINT, WHITE, INK = '#8FE0D3', '#FFFFFF', '#1F2A33'
LEVEL_COLOR = {'하': '#2F9E44', '중': TEAL, '상': ORANGE}
CIRCLED = '①②③④⑤⑥⑦⑧⑨⑩'
GANADA = 'ㄱㄴㄷㄹㅁㅂ'

MM = 283.465                 # 1mm = 283.465 HWPUNIT
PAGE_W, M_LEFT, M_RIGHT = 210, 19, 17
TEXT_W = PAGE_W - M_LEFT - M_RIGHT          # 본문 폭(mm)
COL_GAP = 8
COL_W = (TEXT_W - COL_GAP) / 2              # 2단일 때 한 단 폭(mm)

# 개념서로 직접 실행할 때만 True. 문제집(기출변형/hwpx_wb.py)은 이 파일 앞부분을 '__name__ = hwpx_lib'로 빌려 쓰므로
# 2026-11-07 개념서 피드백(그림 설명 글씨·출처 크기, 개념 더하기 이름표, 열쇠말 칸 폭)은 문제집에 적용되지 않는다.
TEXTBOOK = __name__ == '__main__'
src, out = sys.argv[1], sys.argv[2]
TEACHER = len(sys.argv) > 3 and sys.argv[3] == 'teacher'
book = json.load(open(src, encoding='utf-8'))
# build.mjs가 찍어 둔 그래프·지도 그림 (out/fig/<단원>/<번호>.png)
FIG_DIR = os.path.join(os.path.dirname(os.path.abspath(src)), 'fig', os.path.splitext(os.path.basename(src))[0])
PHOTO_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'assets', 'photos')  # 사상가 초상
FIGS = ('chart', 'venn', 'map', 'diagram', 'photo')

doc = document.HwpxDocument.new()
doc.page.setup(paper_size='A4', margin_left_mm=M_LEFT, margin_right_mm=M_RIGHT, margin_top_mm=12, margin_bottom_mm=12)

_cache = {}


def cs(size=10, color=INK, bold=False, font=FONT, **kw):
    """글자 모양 id (같은 모양은 다시 씀)"""
    key = ('c', size, color, bold, font, tuple(sorted(kw.items())))
    if key not in _cache:
        _cache[key] = doc.ensure_run_style(size=size, color=color, bold=bold, font=font, **kw)
    return _cache[key]


def pp(align=None, spacing=160, before=0, after=0, page_break=False, left=0):
    """문단 모양 id"""
    key = ('p', align, spacing, before, after, page_break, left)
    if key not in _cache:
        _cache[key] = doc.styles.ensure_paragraph_format(
            alignment=align, line_spacing_percent=spacing,
            margins={'prev': int(before * 100), 'next': int(after * 100), 'left': int(left * MM)},
            break_setting={'page_break_before': page_break},
        )
    return _cache[key]


def bf(fill=None, border=LINE, sides=(), width='0.12 mm', kind='SOLID'):
    """칸 테두리·배경 id. sides: 선을 그을 쪽 ('left','right','top','bottom')"""
    key = ('b', fill, border, tuple(sides), width, kind)
    if key not in _cache:
        _cache[key] = doc.ensure_border_fill(border_color=border, border_width=width, fill_color=fill,
                                             active_borders=list(sides), border_type=kind)
    return _cache[key]


# ── 글자 넣기 ─────────────────────────────────────
blanks = []


def run(p, text, **style):
    p.add_run(text, char_pr_id_ref=cs(**style))


def chip(p, text, bg, color=WHITE, size=8, bold=True):
    """형광펜으로 만든 작은 이름표"""
    run(p, f' {text} ', size=size, color=color, bold=bold, highlight=bg)


def rich(p, text, size=10, color=INK, bold=False, font=FONT):
    """[[빈칸]] **굵게** ==형광== __밑줄__ 표시를 한글 글자 모양으로"""
    for part in re.split(r'(\[\[.+?\]\]|\*\*.+?\*\*|==.+?==|__.+?__)', text):
        if not part:
            continue
        if part.startswith('[['):
            ans = part[2:-2]
            blanks.append(ans)
            run(p, f'{len(blanks)})', size=max(6, size - 3), color=TEAL, bold=True, script='sup')
            if TEACHER:
                run(p, f' {ans} ', size=size, color=ORANGE, bold=True, underline=True, underline_color=NAVY)
            else:
                run(p, ' ' * max(6, int(len(ans) * 2.6)), size=size, underline=True, underline_color=NAVY)
        elif part.startswith('**'):
            run(p, part[2:-2], size=size, color=color, bold=True, font=font)
        elif part.startswith('=='):
            run(p, part[2:-2], size=size, color=color, bold=bold, font=font, highlight=HL)
        elif part.startswith('__'):
            run(p, part[2:-2], size=size, color=color, bold=bold, font=font, underline=True, underline_color=ORANGE)
        else:
            run(p, part, size=size, color=color, bold=bold, font=font)


def para(text='', size=10, color=INK, bold=False, **fmt):
    p = doc.add_paragraph('', para_pr_id_ref=pp(**fmt), inherit_style=False)
    if text:
        rich(p, text, size=size, color=color, bold=bold)
    return p


def gap(pt=5):
    return doc.add_paragraph('', para_pr_id_ref=pp(spacing=100), char_pr_id_ref=cs(size=pt), inherit_style=False)


# ── 표 도우미 ─────────────────────────────────────
def table(rows, cols, widths, width_mm=TEXT_W, page_break=False):
    t = doc.add_table(rows, cols, width=int(width_mm * MM), para_pr_id_ref=pp(page_break=page_break))
    t.set_column_widths(widths)
    for r in range(rows):
        for c in range(cols):
            t.set_cell_border_fill(r, c, bf())
    return t


def cell(t, r, c, fill=None, sides=(), border=LINE, width='0.12 mm', kind='SOLID', pad=(2.2, 2.2, 1.6, 1.6)):
    """칸 꾸미기 + 첫 문단 돌려주기"""
    t.set_cell_border_fill(r, c, bf(fill=fill, border=border, sides=sides, width=width, kind=kind))
    k = t.cell(r, c)
    k.set_margins(left=int(pad[0] * MM), right=int(pad[1] * MM), top=int(pad[2] * MM), bottom=int(pad[3] * MM))
    k.set_text('')
    return k.paragraphs[0]


def cell_para(t, r, c, **fmt):
    return t.cell(r, c).add_paragraph('', para_pr_id_ref=pp(**fmt))


# ── 블록 그리기 ───────────────────────────────────
def opener(u):
    t = table(1, 2, [16, 84])
    p = cell(t, 0, 0, fill=NAVY, pad=(6, 2, 7, 6))
    run(p, u['no'], size=34, color=WHITE, bold=True)
    p = cell(t, 0, 1, fill=NAVY, pad=(2, 6, 9, 6))
    run(p, f"{book['chapter']['no']}. {book['chapter']['title']}", size=9.5, color=MINT, bold=True)
    q = cell_para(t, 0, 1)
    run(q, u['title'], size=19, color=WHITE, bold=True)
    gap(6)
    g = table(1, 3, [48.5, 3, 48.5])
    p = cell(g, 0, 0, sides=('left', 'right', 'top', 'bottom'), pad=(4, 4, 2.6, 3))
    run(p, '● 핵심 질문', size=8.5, color=TEAL, bold=True)
    for i, q in enumerate(u['questions']):
        x = cell_para(g, 0, 0, before=2)
        chip(x, f'Q{i+1}', TEAL_SOFT, TEAL, size=7.5)
        run(x, ' ')
        rich(x, q, size=9)
    cell(g, 0, 1)
    p = cell(g, 0, 2, sides=('left', 'right', 'top', 'bottom'), pad=(4, 4, 2.6, 3))
    run(p, '● 수능 포인트', size=8.5, color=ORANGE, bold=True)
    rich(cell_para(g, 0, 2, before=2), u['point'], size=9)
    gap(8)


def side_note(s):
    # 날개 사진: 한글 파일에서는 본문 아래에 작게
    ph = os.path.join(PHOTO_DIR, f"{s.get('photo', '')}.jpg")
    if s.get('photo') and os.path.exists(ph):
        with open(ph, 'rb') as f:
            doc.add_picture(f.read(), 'jpg', width_mm=40, height_mm=30, align='LEFT')
        cap = s.get('caption') or CREDIT_CAPTION(s['photo'])
        if cap:
            run(para(after=2), cap, size=7.5, color=GRAY)
    if not (s.get('title') or s.get('text') or s.get('items')):
        return
    t = table(1, 2, [22, 78])
    p = cell(t, 0, 0, fill=NOTE, pad=(3.5, 1, 2.2, 2.2))
    # 개념서: 이름표와 제목의 글자 시작점을 맞추려고 형광펜 이름표(앞뒤 빈칸) 대신 색 글자로
    if TEXTBOOK:
        run(p, '개념 더하기', size=7.5, color=TEAL, bold=True)
    else:
        chip(p, '개념 더하기', NAVY, size=7)
    run(cell_para(t, 0, 0, before=1), s.get('title', ''), size=9, color=NAVY, bold=True)
    p = cell(t, 0, 1, fill=NOTE, pad=(2, 3.5, 2.2, 2.2))
    items = s.get('items') or [s['text']]
    for i, x in enumerate(items):
        rich(p if i == 0 else cell_para(t, 0, 1, before=1), x, size=8.8, color='#3D4852')


def kv(rows):
    # 열쇠말 칸은 가장 긴 열쇠말이 한 줄에 들어가는 폭으로(개념어가 두 줄로 쪼개지지 않게)
    longest = max(len(re.sub(r'\*\*|==|__|\[\[|\]\]', '', k)) for k, _ in rows)
    kw = min(34.0, max(15.5, (longest * 3.0 + 9) / TEXT_W * 100)) if TEXTBOOK else 15.5
    t = table(len(rows), 3, [1.3, kw, 98.7 - kw])
    for r, (k, v) in enumerate(rows):
        last = r == len(rows) - 1
        sides = () if last else ('bottom',)
        cell(t, r, 0, fill=TEAL, pad=(0, 0, 0, 0))
        p = cell(t, r, 1, fill=CARD, sides=sides, border='#E3ECEA', pad=(3, 1, 1.8, 1.8))
        chip(p, k, TEAL_SOFT, TEAL_DARK, size=8)
        rich(cell(t, r, 2, fill=CARD, sides=sides, border='#E3ECEA', pad=(1, 3.5, 1.8, 1.8)), v, size=9.8)
    if len(rows) > 1:
        t.merge_cells(0, 0, len(rows) - 1, 0)


def _cell_obj(c):
    return c if isinstance(c, dict) else {'text': '' if c is None else str(c)}


def _layout(rows):
    """합친 칸을 고려해 [(행, 열, 칸)]과 전체 열 수를 돌려준다."""
    taken, out, ncol = set(), [], 0
    for r, row in enumerate(rows):
        c = 0
        for v in row:
            while (r, c) in taken:
                c += 1
            o = _cell_obj(v)
            for i in range(o.get('rs', 1)):
                for j in range(o.get('cs', 1)):
                    taken.add((r + i, c + j))
            out.append((r, c, o))
            c += o.get('cs', 1)
            ncol = max(ncol, c)
    return out, ncol


def foot(b, width_mm=TEXT_W):
    """그림·표 아래 설명과 출처"""
    # 개념서: 자료 해석은 검정 글씨로 조금 크게, 출처는 아주 작게(2026-11 강사 피드백)
    if b.get('note'):
        rich(para(after=0.5), b['note'], size=8.8 if TEXTBOOK else 8, color=INK if TEXTBOOK else GRAY)
    if b.get('source'):
        run(para(align='RIGHT', after=2), b['source'], size=6.5 if TEXTBOOK else 7.8, color=GRAY)


def plain_table(b, width_mm=TEXT_W, head_fill=TEAL_SOFT, head_color=TEAL_DARK, size=9.2, boxed=False):
    if b.get('title'):
        para(b['title'], size=9.5, color=NAVY, bold=True, after=2)
    head = b.get('head') or []
    head_rows = head if head and isinstance(head[0], list) else ([head] if head else [])
    all_rows = head_rows + b['rows']
    cells, ncol = _layout(all_rows)
    nh = len(head_rows)
    widths = b.get('widths') or [1] * ncol
    if width_mm < TEXT_W and ncol >= 3:
        widths = [52] + [48 / (ncol - 1)] * (ncol - 1)   # 좁은 단에서는 "아니요"가 꺾이지 않게
    t = table(len(all_rows), ncol, widths, width_mm=width_mm)
    sides = ('left', 'right', 'top', 'bottom') if boxed else ('bottom',)
    bc = '#C3CCD1' if boxed else LINE
    aligns = b.get('align') or []
    row_head = b.get('rowHeader', True)
    for r, c, o in cells:
        is_head = r < nh
        fill = head_fill if is_head else {'hl': '#FFF4C2', 'hatch': '#F1F3F5'}.get(o.get('cls'))
        p = cell(t, r, c, fill=fill, sides=sides, border=bc)
        txt = o.get('text', '')
        al = o.get('align') or (aligns[c] if c < len(aligns) else None)
        if al == 'center' or (is_head and o.get('cs', 1) > 1) or (not is_head and c and len(txt) <= 4 and not al):
            p.para_pr_id_ref = pp(align='CENTER')
        elif al == 'right':
            p.para_pr_id_ref = pp(align='RIGHT')
        first = c == 0 and row_head and not boxed and not is_head
        rich(p, txt, size=size, color=head_color if is_head else (NAVY if first else INK),
             bold=is_head or first or o.get('cls') == 'em')
    for r, c, o in cells:
        if o.get('rs', 1) > 1 or o.get('cs', 1) > 1:
            t.merge_cells(r, c, r + o.get('rs', 1) - 1, c + o.get('cs', 1) - 1)
    if b.get('note') or b.get('source'):
        foot(b, width_mm)
    return t


def png_size(path):
    with open(path, 'rb') as f:
        head = f.read(24)
    return struct.unpack('>II', head[16:24])


def figure(b, width_mm=TEXT_W):
    """그래프·지도: build.mjs가 찍은 PNG를 넣고, 제목·출처는 글자로"""
    path = os.path.join(FIG_DIR, f"{b['_fig']}.png")
    if b.get('title'):
        p = para(align='CENTER', after=1.5)
        run(p, '● ', size=7.5, color=TEAL)
        run(p, b['title'], size=9.6, color=NAVY, bold=True)
    w = width_mm * (b.get('width') or 100) / 100
    pw, ph = png_size(path)
    with open(path, 'rb') as f:
        doc.add_picture(f.read(), 'png', width_mm=w, height_mm=w * ph / pw, align='CENTER')
    foot(b, width_mm)


def hub(b):
    t = table(3, 5, [41, 2, 14, 2, 41])
    spots = [(0, 0), (0, 4), (2, 0), (2, 4)]
    for (r, c), s in zip(spots, b['spokes']):
        p = cell(t, r, c, fill=CARD, sides=('top',), border=TEAL, width='0.7 mm', pad=(3.5, 3, 2, 2.2))
        run(p, s['title'], size=9.5, color=TEAL_DARK, bold=True)
        rich(cell_para(t, r, c), s['text'], size=8.8)
    for r in range(3):
        for c in (1, 3):
            cell(t, r, c, pad=(0, 0, 0, 0))
    for c in (0, 4):
        cell(t, 1, c, pad=(0, 0, 0.5, 0.5))
    p = cell(t, 0, 2, fill=NAVY, pad=(1, 1, 6, 6))
    t.merge_cells(0, 2, 2, 2)
    q = t.cell(0, 2).paragraphs[0]
    q.para_pr_id_ref = pp(align='CENTER')
    run(q, b['center'], size=9.5, color=WHITE, bold=True)


def compare(b):
    p = para(after=2)
    chip(p, '!', ORANGE, size=9)
    run(p, '  ' + b['title'], size=10.5, color=NAVY, bold=True)
    t = table(1, 3, [47, 6, 47])
    for i, col in enumerate(b['cols']):
        c = i * 2
        p = cell(t, 0, c, fill=CARD, sides=('left', 'right', 'top', 'bottom'), pad=(4, 4, 2.4, 2.8))
        run(p, col['title'], size=9.5, color=TEAL_DARK, bold=True)
        for j, x in enumerate(col['items']):
            rich(cell_para(t, 0, c), x, size=9.2, color=GRAY if j == 0 else INK)
    p = cell(t, 0, 1, pad=(0, 0, 6, 0))
    p.para_pr_id_ref = pp(align='CENTER')
    run(p, 'VS', size=8.5, color=ORANGE, bold=True)


def dialog_rows(t, start, rows, serif=True, size=9.5):
    for i, (who, text) in enumerate(rows):
        r = start + i
        p = cell(t, r, 0, pad=(4.5, 0.5, 0.6, 0.6))
        run(p, who, size=size, color=NAVY, bold=True, font=SERIF if serif else FONT)
        p = cell(t, r, 1, pad=(0.5, 4.5, 0.6, 0.6))
        rich(p, text, size=size, font=SERIF if serif else FONT)


def source(b):
    n = len(b.get('dialog') or [])
    if not n:  # 대화 없이 글만 있는 자료
        t = table(3, 1, [100])
        p = cell(t, 0, 0, fill=NAVY, pad=(4.5, 4.5, 2, 2))
        chip(p, '자료 읽기', HL, NAVY, size=8)
        run(p, '   ' + b['title'], size=10, color=WHITE, bold=True)
        rich(cell(t, 1, 0, pad=(4.5, 4.5, 2.4, 2.4)), b['text'], size=9.5, font=SERIF)
        p = cell(t, 2, 0, fill=TEAL_SOFT, pad=(4.5, 4.5, 2.4, 2.8))
        chip(p, '해석', TEAL, size=7.5)
        run(p, ' ')
        rich(p, b['interp'], size=9.2)
        return
    has_cap = bool(b.get('caption'))
    rows = 1 + has_cap + n + 1
    t = table(rows, 2, [10, 90])
    p = cell(t, 0, 0, fill=NAVY, pad=(4.5, 4.5, 2, 2))
    chip(p, '자료 읽기', HL, NAVY, size=8)
    run(p, '   ' + b['title'], size=10, color=WHITE, bold=True)
    t.merge_cells(0, 0, 0, 1)
    r = 1
    if has_cap:
        rich(cell(t, r, 0, pad=(4.5, 4.5, 2.4, 0.6)), b['caption'], size=8.5, color=GRAY)
        t.merge_cells(r, 0, r, 1)
        r += 1
    dialog_rows(t, r, b['dialog'])
    r += n
    p = cell(t, r, 0, fill=TEAL_SOFT, pad=(4.5, 4.5, 2.4, 2.8))
    chip(p, '해석', TEAL, size=7.5)
    run(p, ' ')
    rich(p, b['interp'], size=9.2)
    t.merge_cells(r, 0, r, 1)


def example(b):
    """해석 연습: 머리 줄 + (문제 설명) + 자료 표 + STEP 을 한 표에 (표 안에 표를 넣지 않는다)"""
    d = b['data']
    multi_head = d['t'] == 'table' and isinstance((d.get('head') or [None])[0], list)
    if d['t'] in FIGS or d['t'] == 'figrow' or multi_head:  # 자료가 그림이거나 여러 줄 머리 표면: 머리 줄 → 자료 → STEP
        t = table(1, 1, [100])
        p = cell(t, 0, 0, fill=TEAL_SOFT, pad=(4.5, 4.5, 2, 2))
        chip(p, '해석 연습', TEAL, size=8)
        run(p, '   ' + b['title'], size=10, color=NAVY, bold=True)
        if b.get('stem'):
            rich(para(before=2, after=1), b['stem'], size=9, color=GRAY)
        figure(d) if d['t'] in FIGS else (plain_table(d, boxed=True) if multi_head else block(d))
        for i, st in enumerate(b['steps']):
            x = para(before=1.2, left=2)
            chip(x, f'STEP {i+1}', TEAL_SOFT, TEAL, size=7.5)
            run(x, '  ')
            rich(x, st, size=9.2)
        return
    if d['t'] == 'dialog':  # 대화 자료: 머리 줄 없는 2칸 표로
        d = {'t': 'table', 'head': None, 'widths': [12, 88], 'rows': d['rows']}
    elif d['t'] == 'p':  # 글 자료: 한 칸짜리 표로
        d = {'t': 'table', 'head': None, 'widths': [100], 'rows': [[d['text']]]}
    head = d.get('head')
    ncol = len(head) if head else len(d['rows'][0])
    has_stem = bool(b.get('stem'))
    rows = 1 + has_stem + (1 if head else 0) + len(d['rows']) + 1
    t = table(rows, ncol, d.get('widths') or [1] * ncol)
    p = cell(t, 0, 0, fill=TEAL_SOFT, pad=(4.5, 4.5, 2, 2))
    chip(p, '해석 연습', TEAL, size=8)
    run(p, '   ' + b['title'], size=10, color=NAVY, bold=True)
    t.merge_cells(0, 0, 0, ncol - 1)
    r = 1
    if has_stem:
        rich(cell(t, r, 0, pad=(4.5, 4.5, 2.4, 1.2)), b['stem'], size=9, color=GRAY)
        t.merge_cells(r, 0, r, ncol - 1)
        r += 1
    for c, h in enumerate(head or []):
        q = cell(t, r, c, fill='#EEF2F4', sides=('bottom',), pad=(4.5 if c == 0 else 1.5, 1.5, 1.4, 1.4))
        if c:
            q.para_pr_id_ref = pp(align='CENTER')
        rich(q, h, size=8.8, bold=True)
    if not head:
        r -= 1  # 머리 줄이 없으면 자료 줄을 한 칸 위로
    for i, row in enumerate(d['rows']):
        for c, v in enumerate(row):
            o = _cell_obj(v)
            fill = {'hl': '#FFF4C2', 'hatch': '#F1F3F5'}.get(o.get('cls'))
            q = cell(t, r + 1 + i, c, fill=fill, sides=('bottom',), pad=(4.5 if c == 0 else 1.5, 1.5, 1.4, 1.4))
            if c and len(o.get('text', '')) <= 4:
                q.para_pr_id_ref = pp(align='CENTER')
            rich(q, o.get('text', ''), size=8.8)
    r += 1 + len(d['rows'])
    p = cell(t, r, 0, pad=(4.5, 4.5, 2.4, 2.8))
    t.merge_cells(r, 0, r, ncol - 1)
    for i, s in enumerate(b['steps']):
        x = p if i == 0 else t.cell(r, 0).add_paragraph('', para_pr_id_ref=pp(before=1.2))
        chip(x, f'STEP {i+1}', TEAL_SOFT, TEAL, size=7.5)
        run(x, '  ')
        rich(x, s, size=9.2)


def tip(b):
    t = table(1, 2, [1.3, 98.7])
    cell(t, 0, 0, fill=WARM_BAR, pad=(0, 0, 0, 0))
    p = cell(t, 0, 1, fill=WARM, pad=(4, 4.5, 2.6, 3))
    chip(p, 'T', NAVY, HL, size=9)
    run(p, '  승민T 한마디', size=8.5, color=NAVY, bold=True)
    rich(cell_para(t, 0, 1, before=2), b['text'], size=9.6)


def flow(b):
    n = len(b['steps'])
    widths = []
    for i in range(n):
        widths += [22.6] + ([3.2] if i < n - 1 else [])
    t = table(1, len(widths), widths)
    for i, s in enumerate(b['steps']):
        c = i * 2
        p = cell(t, 0, c, fill=CARD, sides=('top',), border=TEAL, width='0.7 mm', pad=(2.6, 2.4, 2.2, 2.6))
        run(p, f'STEP {i+1}', size=7.5, color=TEAL, bold=True)
        rich(cell_para(t, 0, c, before=0.5), s['title'], size=9.2, color=NAVY, bold=True)
        rich(cell_para(t, 0, c, before=0.8), s['text'], size=8.4, color='#46525C')
        if i < n - 1:
            p = cell(t, 0, c + 1, pad=(0, 0, 9, 0))
            p.para_pr_id_ref = pp(align='CENTER')
            run(p, '→', size=11, color=TEAL, bold=True)


def chain(b):
    p = para(after=1)
    if b.get('title'):
        run(p, b['title'] + '   ', size=9.5, color=NAVY, bold=True)
    for i, s in enumerate(b['steps']):
        if i:
            run(p, '  →  ', size=9.5, color=TEAL, bold=True)
        chip(p, s, TEAL, size=8.5)


def thinker(b):
    """사상가 카드: (초상) → 머리(남색) → 핵심 주장 → 용어 → 원전 읽기 → 기출 선지 O·X → 헷갈리지 말자"""
    face = os.path.join(PHOTO_DIR, f"{b.get('photo', '')}.jpg")
    if b.get('photo') and os.path.exists(face):
        with open(face, 'rb') as f:
            doc.add_picture(f.read(), 'jpg', width_mm=20, height_mm=20, align='LEFT')
    t = table(1, 1, [100])
    p = cell(t, 0, 0, fill=NAVY, pad=(4.5, 4.5, 2.4, 2.4))
    run(p, b['name'], size=14, color=WHITE, bold=True)
    if b.get('era'):
        run(p, '    ' + b['era'], size=8.5, color=MINT)
    if b.get('keywords'):
        q = cell_para(t, 0, 0, before=1.5)
        for k in b['keywords']:
            chip(q, k, HL, NAVY, size=7.8)
            run(q, ' ', size=7)
    p = para(before=3, after=1)
    run(p, '▌핵심 주장', size=8.5, color=TEAL, bold=True)
    for i, c in enumerate(b['claims']):
        q = para(after=1.2, left=2, spacing=165)
        chip(q, str(i + 1), TEAL_SOFT, TEAL, size=7.5)
        run(q, '  ')
        rich(q, c, size=9.5)
    if b.get('terms'):
        tt = table(len(b['terms']), 2, [28, 72])
        for r, (k, v) in enumerate(b['terms']):
            rich(cell(tt, r, 0, fill=NOTE, pad=(3, 1, 1.2, 1.2)), k, size=8.6, color=NAVY, bold=True)
            rich(cell(tt, r, 1, fill=NOTE, pad=(1, 3, 1.2, 1.2)), v, size=8.6)
        gap(2)
    for qt in b.get('quotes') or []:
        tq = table(1, 2, [1.2, 98.8])
        cell(tq, 0, 0, fill=NAVY, pad=(0, 0, 0, 0))
        p = cell(tq, 0, 1, fill='#F6F7F9', pad=(3.5, 3.5, 2.2, 2.2))
        run(p, '원전 읽기', size=7.8, color=TEAL, bold=True)
        rich(cell_para(tq, 0, 1, before=1, spacing=170), qt['text'], size=9.2, font=SERIF)
        x = cell_para(tq, 0, 1, align='RIGHT')
        run(x, '— ' + qt['from'], size=7.6, color=GRAY)
        if qt.get('note'):
            y = cell_para(tq, 0, 1, before=1)
            chip(y, '풀이', TEAL, size=7.2)
            run(y, ' ')
            rich(y, qt['note'], size=8.6)
        gap(2)
    if b.get('ox'):
        p = para(before=2, after=1)
        run(p, '▌기출 선지로 확인하기', size=8.5, color=TEAL, bold=True)
        to = table(len(b['ox']), 3, [60, 7, 33])
        for r, (st, a, why) in enumerate(b['ox']):
            last = r == len(b['ox']) - 1
            sides = () if last else ('bottom',)
            rich(cell(to, r, 0, sides=sides, kind='DASH', pad=(1, 2, 1.2, 1.2)), st, size=8.8)
            q = cell(to, r, 1, sides=sides, kind='DASH', pad=(0, 0, 1.2, 1.2))
            q.para_pr_id_ref = pp(align='CENTER')
            chip(q, a, TEAL if a == 'O' else ORANGE, size=8.5)
            rich(cell(to, r, 2, sides=sides, kind='DASH', pad=(2, 1, 1.2, 1.2)), why or '', size=8.2, color=GRAY)
    if b.get('vs'):
        tv = table(1, 1, [100])
        p = cell(tv, 0, 0, fill=WARM, pad=(3, 3, 1.8, 1.8))
        run(p, '헷갈리지 말자  ', size=8.5, color=ORANGE, bold=True)
        rich(p, b['vs'], size=8.8)
    gap(8)


def block(b):
    t = b['t']
    if t == 'thinker':
        thinker(b)
        return
    if t == 'sec':
        p = para(before=10, after=4)
        chip(p, f" {b['mark']} ", TEAL, size=10)
        run(p, '  ' + b['title'], size=14.5, color=NAVY, bold=True)
        return
    if t == 'concept':
        st = max(1, min(3, b.get('stars') or 1))
        p = para(before=10, after=3)
        chip(p, f" 개념 {b['no']} ", TEAL, size=10)
        run(p, '  ' + b['title'], size=13, color=NAVY, bold=True)
        run(p, '    ' + '★' * st + '☆' * (3 - st) + ' ' + FREQ[st], size=8.5, color=(ORANGE if st == 3 else TEAL if st == 2 else GRAY), bold=True)
        return
    if t == 'pattern':
        t2 = table(len(b['items']) + 1, 2, [88, 12])
        p = cell(t2, 0, 0, fill=TEAL_SOFT, pad=(3, 1, 1.4, 1.4))
        run(p, '이렇게 나온다', size=8.6, color=NAVY, bold=True)
        run(p, '   기출 선지 모양', size=7.5, color=GRAY)
        cell(t2, 0, 1, fill=TEAL_SOFT)
        for i, it in enumerate(b['items']):
            st, a = it[0], it[1]
            q = cell(t2, i + 1, 0, pad=(3, 1, 1.4, 1.4))
            rich(q, st, size=9)
            if len(it) > 2 and it[2]:
                run(cell_para(t2, i + 1, 0), '→ ' + it[2], size=7.8, color=GRAY)
            q2 = cell(t2, i + 1, 1, pad=(1, 1, 1.4, 1.4))
            q2.para_pr_id_ref = pp(align='CENTER')
            run(q2, a, size=10, color=(TEAL if a == 'O' else ORANGE), bold=True)
        gap(6)
        return
    if t == 'item':
        p = para(before=6, after=3)
        if b.get('no'):  # 개념 안 소항목은 번호 없이
            chip(p, b['no'], TEAL_SOFT, TEAL, size=9.5)
            run(p, '  ')
        run(p, b['title'], size=11.5, color=NAVY, bold=True)
        for x in b.get('body', []):
            block(x)
        if b.get('side'):
            gap(3)
            side_note(b['side'])
        gap(4)
        return
    if t == 'ul':
        for x in b['items']:
            p = para(after=1.5, left=1)
            run(p, '○  ', size=8, color=TEAL, bold=True)
            rich(p, x)
    elif t == 'ol':
        for i, x in enumerate(b['items']):
            p = para(after=1.5, left=1)
            run(p, CIRCLED[i] + ' ', size=10, color=TEAL, bold=True)
            rich(p, x)
    elif t == 'p':
        para(b['text'], before=3)
    elif t == 'kv':
        kv(b['rows'])
    elif t == 'table':
        plain_table(b)
    elif t == 'hub':
        hub(b)
    elif t == 'compare':
        compare(b)
    elif t == 'source':
        source(b)
    elif t == 'example':
        example(b)
    elif t == 'tip':
        tip(b)
    elif t == 'flow':
        flow(b)
    elif t == 'chain':
        chain(b)
    elif t in FIGS:
        figure(b)
    elif t == 'figrow':  # 나란한 그림들: build.mjs가 줄 전체를 한 장으로 찍어 둔다
        if b.get('title'):
            run(para(after=1.5), b['title'], size=9.6, color=NAVY, bold=True)
        path = os.path.join(FIG_DIR, f"{b['_fig']}.png")
        pw, ph = png_size(path)
        with open(path, 'rb') as f:
            doc.add_picture(f.read(), 'png', width_mm=TEXT_W, height_mm=TEXT_W * ph / pw, align='CENTER')
        foot(b)
    else:
        raise ValueError(f'모르는 블록: {t}')
    if b.get('side'):  # 표·그림 옆 메모도 아래 상자로
        gap(3)
        side_note(b['side'])
    gap(6)


def band(title, sub='', color=NAVY, page_break=True):
    t = table(1, 1, [100], page_break=page_break)
    p = cell(t, 0, 0, fill=color, pad=(5, 5, 2.8, 2.8))
    run(p, '● ', size=12, color=HL, bold=True)
    run(p, title, size=15, color=WHITE, bold=True)
    if sub:
        run(p, '      ' + sub, size=9, color='#D3F1EC' if color == TEAL else '#B8C7D6')
    gap(6)


def columns(n):
    """여기부터 n단 (한글의 '다단 설정 나누기')"""
    p = doc.add_paragraph('', para_pr_id_ref=pp(spacing=100), char_pr_id_ref=cs(size=2), inherit_style=False)
    doc.set_columns(n, paragraph=p, same_gap=int(COL_GAP * MM), separator_type='SOLID', separator_color=LINE) if n > 1 \
        else doc.set_columns(1, paragraph=p)


# ── 개념 확인 ─────────────────────────────────────
def check(u):
    band('개념 확인', f"{u['no']} {u['title']}", color=TEAL)
    p = para(after=3)
    run(p, '▌', size=10, color=TEAL)
    run(p, '다음 문장이 맞으면 O, 틀리면 X에 표시하시오.', size=10, color=NAVY, bold=True)
    ox = u['check']['ox']
    t = table(len(ox), 3, [8, 80, 12])
    for r, (q, a) in enumerate(ox):
        sides = ('bottom',)
        p = cell(t, r, 0, sides=sides, kind='DASH', pad=(1, 1, 1.8, 1.8))
        run(p, f'{r+1:02d}', size=9.5, color=TEAL, bold=True)
        rich(cell(t, r, 1, sides=sides, kind='DASH', pad=(1, 2, 1.8, 1.8)), q, size=9.6)
        p = cell(t, r, 2, sides=sides, kind='DASH', pad=(1, 1, 1.8, 1.8))
        p.para_pr_id_ref = pp(align='CENTER')
        for k in 'OX':
            on = TEACHER and k == a
            chip(p, k, ORANGE if on else '#EEF2F4', WHITE if on else GRAY, size=8.5)
            run(p, ' ', size=8)
    gap(8)
    p = para(after=3)
    run(p, '▌', size=10, color=TEAL)
    run(p, '다음 빈칸에 알맞은 말을 쓰시오.', size=10, color=NAVY, bold=True)
    for i, (q, a) in enumerate(u['check']['blank']):
        p = para(after=4, spacing=170)
        run(p, f'{len(ox) + i + 1:02d}   ', size=9.5, color=TEAL, bold=True)
        before, _, after = q.partition('(    )')
        rich(p, before, size=9.6)
        if TEACHER:
            run(p, f'  {a}  ', size=9.6, color=ORANGE, bold=True, underline=True, underline_color=NAVY)
        else:
            run(p, ' ' * 22, size=9.6, underline=True, underline_color=NAVY)
        rich(p, after, size=9.6)


# ── 수능형 문제 (2단) ─────────────────────────────
def data_box(items):
    """문제 자료: 글·대화는 테두리 상자에, 표는 표 그대로 (표 안에 표를 넣지 않는다)"""
    for d in items:
        if d['t'] in FIGS:
            figure(d, width_mm=COL_W)
            continue
        if d['t'] == 'figrow':
            path = os.path.join(FIG_DIR, f"{d['_fig']}.png")
            pw, ph = png_size(path)
            with open(path, 'rb') as f:
                doc.add_picture(f.read(), 'png', width_mm=COL_W, height_mm=COL_W * ph / pw, align='CENTER')
            continue
        if d['t'] == 'table':
            if d.get('title'):
                rich(para(align='CENTER', after=1.5), d['title'], size=8.8, bold=True)
            t = plain_table({**d, 'title': None}, width_mm=COL_W, size=8.4, head_fill='#EEF2F4', head_color=INK, boxed=True)
            continue
        t = table(1, 1, [100], width_mm=COL_W)
        first = cell(t, 0, 0, sides=('left', 'right', 'top', 'bottom'), border='#C3CCD1', pad=(3, 3, 2.2, 2.2))
        if d['t'] == 'dialog':
            for i, (who, text) in enumerate(d['rows']):
                p = first if i == 0 else t.cell(0, 0).add_paragraph('', para_pr_id_ref=pp(spacing=165, before=0.6))
                run(p, f'{who}  ', size=9, color=NAVY, bold=True)
                rich(p, text, size=9)
        else:
            rich(first, d['text'], size=9, font=SERIF if d.get('serif') else FONT)
    gap(3)


def question(q, n):
    p = para(before=2, after=2)
    chip(p, f'{n:02d}', TEAL, size=10.5)
    run(p, '   ')
    run(p, f"난이도 {q['level']}", size=8, color=LEVEL_COLOR[q['level']], bold=True)
    if q.get('concept'):
        run(p, f"   개념 {q['concept']}" + (f" · {q['type']}" if q.get('type') else ''), size=7.8, color=GRAY)
    rich(para(after=3, spacing=165), q['stem'], size=9.6, bold=True)
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
    choices = q['choices']
    mark = lambda i: TEACHER and q['answer'] == i + 1
    if all(len(c) <= 9 for c in choices):
        for line in (range(0, 3), range(3, len(choices))):
            p = para(after=1)
            for i in line:
                run(p, f'{CIRCLED[i]} {choices[i]}' + ' ' * 8, size=9.4,
                    color=ORANGE if mark(i) else INK, bold=mark(i))
    else:
        for i, c in enumerate(choices):
            p = para(after=1, spacing=160)
            run(p, CIRCLED[i] + ' ', size=9.4, color=ORANGE if mark(i) else INK, bold=mark(i))
            rich(p, c, size=9.4, color=ORANGE if mark(i) else INK)
    if TEACHER:
        p = para(before=2)
        run(p, f"정답 {CIRCLED[q['answer'] - 1]}  ", size=8.6, color=ORANGE, bold=True)
        rich(p, q['explain'], size=8.6, color=ORANGE)
    gap(12)


# ── 한 장 정리 (중단원 끝) ─────────────────────────
FREQ = {3: '최다 빈출', 2: '빈출', 1: '기본 개념'}


def CREDIT_CAPTION(pid):
    try:
        return json.load(open(os.path.join(PHOTO_DIR, 'credits.json'), encoding='utf-8')).get(pid, {}).get('caption', '')
    except Exception:
        return ''


def summary_page(u):
    S = u['summary']
    C = {b['no']: b for b in u['concept'] if b['t'] == 'concept'}
    band('한 장 정리', f"{u['no']} {u['title']}", color=TEAL)
    p = para(after=4, align='CENTER', spacing=170)
    run(p, '한 줄 요약  ', size=8, color=TEAL, bold=True)
    rich(p, S['core'], size=10.5)
    rows = S.get('concepts') or [c for br in S.get('branches', []) for c in br['concepts']]
    t = table(len(rows), 2, [30, 70])
    for i, c in enumerate(rows):
        cc = C.get(c['no'], {})
        st = max(1, min(3, cc.get('stars') or 1))
        q = cell(t, i, 0, fill=NOTE, pad=(3, 1, 1.6, 1.6))
        run(q, f"개념 {c['no']}", size=8, color=TEAL, bold=True)
        run(cell_para(t, i, 0), c.get('title') or cc.get('title', ''), size=9, color=NAVY, bold=True)
        run(cell_para(t, i, 0), '★' * st + '☆' * (3 - st) + ' ' + FREQ[st], size=7.6, color=(ORANGE if st == 3 else GRAY))
        q = cell(t, i, 1, pad=(2, 3, 1.6, 1.6))
        for k, line in enumerate(c['lines']):
            rich(q if k == 0 else cell_para(t, i, 1), '· ' + line, size=8.8)
    gap(6)
    if S.get('traps'):
        run(para(after=2), '헷갈리지 말자', size=9.5, color=ORANGE, bold=True)
        t = table(len(S['traps']), 2, [30, 70])
        for i, (a, b2) in enumerate(S['traps']):
            rich(cell(t, i, 0, pad=(3, 1, 1.4, 1.4)), a, size=8.6, bold=True)
            rich(cell(t, i, 1, pad=(2, 3, 1.4, 1.4)), b2, size=8.6)
        gap(6)
    if S.get('checks'):
        run(para(after=2), '시험 전 체크 — 말로 설명할 수 있으면 칸에 표시', size=9.5, color=NAVY, bold=True)
        for x in S['checks']:
            p = para(after=1.2)
            run(p, '□  ', size=10, color=NAVY)
            rich(p, x, size=9)


# ── 문서 만들기 ───────────────────────────────────
doc.paragraphs[0].text = ''
doc.page.set_header(text=f"{book['subject']}   {book['chapter']['no']}. {book['chapter']['title']}")
doc.page.set_page_number(position='BOTTOM_CENTER')

q_no = 1
starts = []
for ui, u in enumerate(book['units']):
    blanks.clear()
    if ui:
        doc.add_paragraph('', para_pr_id_ref=pp(page_break=True), inherit_style=False)
    opener(u)
    for b in u['concept']:
        block(b)
    if blanks and not TEACHER:
        p = para(before=4)
        run(p, '빈칸 정답   ', size=8.5, color=TEAL, bold=True)
        run(p, '   '.join(f'{i+1}) {a}' for i, a in enumerate(blanks)), size=8.5, color=GRAY)
    if u.get('summary'):
        summary_page(u)
    if u['check']['ox'] or u['check']['blank']:
        check(u)
    starts.append(q_no)
    if u['exam']:
        band('수능형 문제', f"{u['no']} {u['title']}")
        columns(2)
        for q in u['exam']:
            question(q, q_no)
            q_no += 1
        columns(1)

if any(u['exam'] for u in book['units']):
    band('정답과 해설')
    columns(2)
for ui, u in enumerate(book['units']):
    if not u['exam']:
        continue
    p = para(before=4 if ui else 0, after=3)
    chip(p, u['no'], TEAL, size=9.5)
    run(p, '  ' + u['title'], size=10, color=NAVY, bold=True)
    p = para(after=2)
    run(p, '개념 확인  ', size=8.6, color=TEAL, bold=True)
    ox = u['check']['ox']
    run(p, '  '.join(f'{i+1:02d} {a}' for i, (_, a) in enumerate(ox)), size=8.6)
    p = para(after=4)
    run(p, '  '.join(f'{len(ox)+i+1:02d} {a}' for i, (_, a) in enumerate(u['check']['blank'])), size=8.6)
    for i, q in enumerate(u['exam']):
        p = para(before=2)
        chip(p, f'{starts[ui] + i:02d}', TEAL, size=8.5)
        run(p, f"  정답 {CIRCLED[q['answer'] - 1]}", size=9, color=ORANGE, bold=True)
        rich(para(after=3, spacing=160), q['explain'], size=8.8)

# ── 사진 출처 (위키미디어 공용 사진의 저작자·라이선스) ──
def used_photos(x, acc):
    if isinstance(x, list):
        for y in x: used_photos(y, acc)
    elif isinstance(x, dict):
        if x.get('t') == 'photo':
            for it in x.get('items') or []: acc.append(it.get('src'))
        if x.get('t') == 'thinker' and x.get('photo'): acc.append(x['photo'])
        for v in x.values(): used_photos(v, acc)
    return acc

cred_path = os.path.join(PHOTO_DIR, 'credits.json')
CRED = json.load(open(cred_path, encoding='utf-8')) if os.path.exists(cred_path) else {}
ids = [i for i in dict.fromkeys(used_photos(book['units'], [])) if i in CRED and os.path.exists(os.path.join(PHOTO_DIR, f'{i}.jpg'))]
DATA = json.load(open(os.path.join(os.path.dirname(PHOTO_DIR), 'credits-data.json'), encoding='utf-8'))
columns(1)
band('사진·자료 출처')
if ids:
    rich(para(after=3, spacing=160), DATA['photoIntro'], size=8.6)
    for n, i in enumerate(ids):
        c = CRED[i]
        p = para(after=1.5, spacing=150)
        run(p, f'{n + 1}. ', size=8, color=TEAL, bold=True)
        run(p, c.get('caption', ''), size=8, color=NAVY, bold=True)
        who = c.get('attribution') or c.get('author') or '작자 미상'
        if c.get('authorUrl'):
            who += f" ({c['authorUrl']})"
        lic = c.get('license', '') + (f" ({c['licenseUrl']})" if c.get('licenseUrl') else '')
        run(p, f" — {who}, {lic}, 위키미디어 공용 「{c.get('title', '').replace('File:', '')}」 {c.get('page', '')}", size=8)
p = para(before=4, after=2)
run(p, DATA['dataTitle'], size=9.5, color=NAVY, bold=True)
for k, v in DATA['data']:
    if k == '글꼴':
        continue  # 한글 파일은 맑은 고딕을 쓰므로 PDF용 글꼴 표기는 뺀다
    p = para(after=1.2, spacing=150)
    run(p, k + '  ', size=8, color=TEAL, bold=True)
    run(p, v, size=8)
p = para(before=2, after=1, spacing=140)
run(p, 'AWS Terrain Tiles 원문 출처  ', size=7, color=GRAY, bold=True)
run(p, ' '.join(DATA['terrain']), size=7, color=GRAY)
run(para(before=2, spacing=140), DATA['mit'], size=7, color=GRAY)

report = doc.validate()
print('형식 검사:', '통과' if getattr(report, 'ok', False) else report)
doc.save_to_path(out)
print('저장:', out)
