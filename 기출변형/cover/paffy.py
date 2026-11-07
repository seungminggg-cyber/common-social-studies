"""Paffy 견본 주문용 파일 만들기 (2026-11-07) — 기출변형 폴더에서 실행

    python3 cover/paffy.py        (먼저 textbook: node build-book.mjs mm, mm t2 / 기출변형: node cover/build-cover.mjs mmappaffy)

Paffy 자동 검수: 페이지 크기 같음, 글자 윤곽선(아웃라인) 처리, 주석 없음, (권장) CMYK.
1. 표지: 펼침 표지(뒷표지+책등+앞표지)의 쪽 크기를 정확히 (213+책등+213) × 303mm로 맞추고 재단 상자(도련 3mm 안쪽)를 넣는다.
   (크롬 PDF는 폭이 0.1mm 모자라게 나온다)
2. 내지: 무선 제본은 쪽수가 짝수여야 해서 홀수면 끝에 빈 쪽을 하나 붙인다.
3. 둘 다 Ghostscript로 글자를 윤곽선(도형)으로 바꾼다(-dNoOutputFonts). 그림 화질은 줄이지 않는다.
결과: out/paffy/ (커밋하지 않음)
"""
import glob, os, re, subprocess, sys, tempfile
from pypdf import PdfReader, PdfWriter
from pypdf.generic import RectangleObject

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', 'out')
TB = os.path.join(HERE, '..', '..', 'textbook', 'out')
PT = 72 / 25.4


def outline(src, dst):
    """글자를 윤곽선으로(글꼴 없이 도형으로) — Paffy '아웃라인 처리' 검수용"""
    # /prepress: 그림은 최고 화질로 다시 압축(사진 JPEG는 그대로 통과), 해상도는 줄이지 않는다
    subprocess.run(['gs', '-q', '-dBATCH', '-dNOPAUSE', '-dSAFER', '-sDEVICE=pdfwrite', '-dNoOutputFonts',
                    '-dPDFSETTINGS=/prepress', '-dCompatibilityLevel=1.7', '-dAutoRotatePages=/None',
                    '-dDownsampleColorImages=false', '-dDownsampleGrayImages=false', '-dDownsampleMonoImages=false',
                    '-dPassThroughJPEGImages=true',
                    f'-sOutputFile={dst}', src], check=True)


def fonts_left(path):
    out = subprocess.run(['pdffonts', path], capture_output=True, text=True).stdout.strip().splitlines()
    return max(0, len(out) - 2)


def main():
    os.makedirs(os.path.join(OUT, 'paffy'), exist_ok=True)
    for n in ('1', '2'):
        sub = f'통합사회{n}'
        covers = sorted(glob.glob(os.path.join(OUT, 'cover', f'MINIMAP-{sub}-펼침표지-*mm.pdf')), key=os.path.getmtime)
        body = os.path.join(TB, f'MINIMAP-{sub}-본문.pdf')
        if not covers or not os.path.exists(body):
            print(f'{sub}: 표지 또는 본문이 없습니다'); continue
        cover = covers[-1]
        S = float(re.search(r'펼침표지-([\d.]+)mm', cover).group(1))
        W, H = (426 + S) * PT, 303 * PT
        with tempfile.TemporaryDirectory() as tmp:
            # 1) 표지 크기 맞추기
            r, w = PdfReader(cover), PdfWriter()
            for p in r.pages:
                p.mediabox = RectangleObject([0, 0, W, H])
                p.cropbox = RectangleObject([0, 0, W, H])
                p.bleedbox = RectangleObject([0, 0, W, H])
                p.trimbox = RectangleObject([3 * PT, 3 * PT, W - 3 * PT, H - 3 * PT])
                w.add_page(p)
            c1 = os.path.join(tmp, 'cover.pdf')
            with open(c1, 'wb') as fh: w.write(fh)
            cdst = os.path.join(OUT, 'paffy', f'MINIMAP {sub} 표지(펼침, 책등 {S:g}mm).pdf')
            outline(c1, cdst)
            # 2) 내지: 홀수면 빈 쪽 하나
            # 쪽 크기는 정확히 A4(210×297mm)로(크롬 PDF는 209.9mm)
            r = PdfReader(body)
            w = PdfWriter()
            A4 = RectangleObject([0, 0, 210 * PT, 297 * PT])
            for p in r.pages:
                p.mediabox = A4; p.cropbox = A4; p.trimbox = A4; p.bleedbox = A4
                w.add_page(p)
            if len(r.pages) % 2:
                w.add_blank_page(width=210 * PT, height=297 * PT)
            b1 = os.path.join(tmp, 'body.pdf')
            with open(b1, 'wb') as fh: w.write(fh)
            bdst = os.path.join(OUT, 'paffy', f'MINIMAP {sub} 내지({len(w.pages)}쪽).pdf')
            outline(b1, bdst)
        for f in (cdst, bdst):
            rr = PdfReader(f)
            sizes = {(round(float(p.mediabox.width) / PT, 1), round(float(p.mediabox.height) / PT, 1)) for p in rr.pages}
            print(f'{os.path.basename(f)}: {len(rr.pages)}쪽, 크기 {sizes}, 남은 글꼴 {fonts_left(f)}개, {os.path.getsize(f) / 1e6:.1f}MB')


if __name__ == '__main__':
    main()
