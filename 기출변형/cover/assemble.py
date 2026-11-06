"""MINIMAX 완성본 묶기 — 인쇄용 쪽 상자 맞추기 + 한 권 미리보기 PDF.

    python3 cover/assemble.py 02      (기출변형 폴더에서. 먼저 build-cover.mjs mmfinal, build.mjs 1 units mm)

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
    ed = '1' if no == '02' else '2'
    cover = os.path.join(OUT, 'cover')
    dst = os.path.join(OUT, f'MINIMAX-{no}-완성본')
    os.makedirs(dst, exist_ok=True)
    files = {
        f'1_앞표지(도련 3mm).pdf': os.path.join(cover, f'MINIMAX-{no}-앞표지.pdf'),
        f'2_뒷표지(도련 3mm).pdf': os.path.join(cover, f'MINIMAX-{no}-뒷표지.pdf'),
        f'4_속표지·간지(도련 3mm, 13쪽).pdf': os.path.join(cover, f'MINIMAX-{no}-속표지간지-도련.pdf'),
    }
    for name, src in files.items():
        fix_boxes(src, os.path.join(dst, name))
    body = os.path.join(OUT, ed, f'MINIMAX-{no}-본문.pdf')
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
    for name in sorted(os.listdir(dst)):
        if name.endswith('.pdf'):
            n = len(PdfReader(os.path.join(dst, name)).pages)
            print(f'{name}: {n}쪽')


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else '02')
