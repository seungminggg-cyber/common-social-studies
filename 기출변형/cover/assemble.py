"""MINIMAX 완성본 묶기 — 인쇄용 쪽 상자 맞추기 + 한 권 미리보기 PDF.

    python3 cover/assemble.py 02      (기출변형 폴더에서. 먼저 build-cover.mjs mmfinal, build.mjs 1 units mm)
    python3 cover/assemble.py maximin MAXIMIN 실전 모의고사(먼저 build.mjs 2 mock mx, build-cover.mjs maxifinal)
    python3 cover/assemble.py x1      합본 MINIMAX 기출분석 통합사회1(x2 = 통합사회2). 먼저 build.mjs vol t1, build-cover.mjs mmvol t1
    python3 cover/assemble.py t1      MINIMAP 개념서 통합사회1(t2 = 통합사회2). 먼저 textbook에서 build-book.mjs mm [t2],
                                      그다음 build-cover.mjs mmapfinal

1. 표지·속표지·간지(도련 3mm) PDF의 쪽 크기를 정확히 216×303mm로 맞추고,
   인쇄소 프로그램이 읽는 재단 상자(TrimBox, 210×297mm)와 도련 상자(BleedBox)를 넣는다.
   (크롬 PDF는 폭이 215.9mm로 0.1mm 모자라게 나온다.)
2. 완성본 미리보기: 앞표지(재단선 크기로 잘라 보임) + 본문(A4) + 뒷표지 → 한 파일.
3. 결과를 out/MINIMAX-<권>-완성본/ 에 모은다(커밋하지 않음).
"""
import os
import shutil
import sys
from pypdf import PdfReader, PdfWriter
from pypdf.generic import RectangleObject

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', 'out')
PT = 72 / 25.4
BLEED = 3 * PT
FULL = (216 * PT, 303 * PT)


def fix_boxes(src, dst):
    r = PdfReader(src)
    w = PdfWriter()
    for p in r.pages:
        p.mediabox = RectangleObject([0, 0, FULL[0], FULL[1]])
        p.bleedbox = RectangleObject([0, 0, FULL[0], FULL[1]])
        p.trimbox = RectangleObject([BLEED, BLEED, FULL[0] - BLEED, FULL[1] - BLEED])
        w.add_page(p)
    with open(dst, 'wb') as fh:
        w.write(fh)


def trimmed(path):
    """도련 PDF의 쪽을 재단선 크기로 잘라 보이게(미리보기용)."""
    r = PdfReader(path)
    pages = []
    for p in r.pages:
        box = RectangleObject([BLEED, BLEED, FULL[0] - BLEED, FULL[1] - BLEED])
        p.mediabox = box
        p.cropbox = box
        pages.append(p)
    return pages


def main(no):
    cover = os.path.join(OUT, 'cover')
    if no == 'maximin':  # MAXIMIN 실전 모의고사 10회
        tag = 'MAXIMIN'
        body = os.path.join(OUT, '2', 'MAXIMIN-본문.pdf')
        ndiv = '11쪽'
    elif no in ('t1', 't2'):  # MINIMAP 개념서
        sub = '통합사회1' if no == 't1' else '통합사회2'
        tag = f'MINIMAP-{sub}'
        body = os.path.join(HERE, '..', '..', 'textbook', 'out', f'{tag}-본문.pdf')
        ndiv = '6쪽'
    elif no in ('x1', 'x2'):  # 합본 MINIMAX 기출분석 통합사회1·2 (2026-11-07)
        tag = f"MINIMAX-통합사회{no[1]}"
        body = os.path.join(OUT, 'vol', f'{tag}-본문.pdf')
        ndiv = '7쪽'
    else:  # MINIMAX 기출분석
        ed = '1' if no == '02' else '2'
        tag = f'MINIMAX-{no}'
        body = os.path.join(OUT, ed, f'{tag}-본문.pdf')
        ndiv = '13쪽'
    dst = os.path.join(OUT, f'{tag}-완성본')
    os.makedirs(dst, exist_ok=True)
    files = {
        f'1_앞표지(도련 3mm).pdf': os.path.join(cover, f'{tag}-앞표지.pdf'),
        f'2_뒷표지(도련 3mm).pdf': os.path.join(cover, f'{tag}-뒷표지.pdf'),
        f'4_속표지·간지(도련 3mm, {ndiv}).pdf': os.path.join(cover, f'{tag}-속표지간지-도련.pdf'),
    }
    for name, src in files.items():
        fix_boxes(src, os.path.join(dst, name))
    shutil.copyfile(body, os.path.join(dst, '3_본문(A4, 속표지·간지 포함).pdf'))
    # 미리보기 한 권
    w = PdfWriter()
    for p in trimmed(files['1_앞표지(도련 3mm).pdf']):
        w.add_page(p)
    for p in PdfReader(body).pages:
        w.add_page(p)
    for p in trimmed(files['2_뒷표지(도련 3mm).pdf']):
        w.add_page(p)
    prev = os.path.join(dst, f'0_완성본 미리보기(앞표지~뒷표지 {len(w.pages)}쪽).pdf')
    with open(prev, 'wb') as fh:
        w.write(fh)
    # 합본 정답과 해설(별책 본문, 첫 쪽이 속표지)
    if no in ('x1', 'x2'):
        shutil.copyfile(os.path.join(OUT, 'vol', f'{tag}-정답과해설.pdf'), os.path.join(dst, '5_정답과 해설 별책(A4, 속표지 포함).pdf'))
    # MAXIMIN 정답과 해설 별책(강사 2026-11-07): 별책 앞표지 + 별책 본문 + 뒷표지(본책과 같은 그림)
    if no == 'maximin':
        afront = os.path.join(dst, '5_정답과 해설 별책 앞표지(도련 3mm).pdf')
        fix_boxes(os.path.join(cover, 'MAXIMIN-정답과해설-앞표지.pdf'), afront)
        abody = os.path.join(OUT, '2', 'MAXIMIN-정답과해설.pdf')
        shutil.copyfile(abody, os.path.join(dst, '6_정답과 해설 별책 본문(A4, 속표지 포함).pdf'))
        w = PdfWriter()
        for p in trimmed(afront):
            w.add_page(p)
        for p in PdfReader(abody).pages:
            w.add_page(p)
        for p in trimmed(files['2_뒷표지(도련 3mm).pdf']):
            w.add_page(p)
        with open(os.path.join(dst, f'0_정답과 해설 별책 미리보기({len(w.pages)}쪽).pdf'), 'wb') as fh:
            w.write(fh)
    for name in sorted(os.listdir(dst)):
        if name.endswith('.pdf'):
            n = len(PdfReader(os.path.join(dst, name)).pages)
            print(f'{name}: {n}쪽')


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else '02')
