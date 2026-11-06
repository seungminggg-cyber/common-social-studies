"""KoPub World OTF(CFF 윤곽) → TTF(TrueType 윤곽) 바꾸기.

크롬은 CFF 글꼴을 PDF에 'Type 3'으로 넣는데, 인쇄소 프로그램(RIP)이 Type 3을 싫어하는 경우가 많다.
TrueType 윤곽으로 바꿔 두면 일반 글꼴(CID TrueType)로 들어간다. 글자 모양은 같다(곡선을 2차로 근사, 오차 1단위 이하).
결과는 out/cover/fonts/ (커밋하지 않음). 필요: pip install fonttools
    python3 cover/otf2ttf.py
"""
import os
import sys
from fontTools.ttLib import TTFont, newTable
from fontTools.pens.cu2quPen import Cu2QuPen
from fontTools.pens.ttGlyphPen import TTGlyphPen

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, '../../textbook/node_modules/font-kopubworld/fonts')
DST = os.path.join(HERE, '../out/cover/fonts')


def convert(src, dst):
    font = TTFont(src)
    gs = font.getGlyphSet()
    glyf = newTable('glyf')
    glyf.glyphOrder = font.getGlyphOrder()
    glyf.glyphs = {}
    for name in font.getGlyphOrder():
        pen = TTGlyphPen(gs)
        gs[name].draw(Cu2QuPen(pen, max_err=1.0, reverse_direction=True))
        glyf[name] = pen.glyph()
    font['glyf'] = glyf
    font['loca'] = newTable('loca')
    maxp = font['maxp']
    maxp.tableVersion = 0x00010000
    for k in ('maxZones', 'maxTwilightPoints', 'maxStorage', 'maxFunctionDefs', 'maxInstructionDefs',
              'maxStackElements', 'maxSizeOfInstructions', 'maxComponentElements'):
        setattr(maxp, k, 0)
    maxp.maxZones = 1
    maxp.maxComponentDepth = 0
    font['head'].glyphDataFormat = 0
    font['post'].formatType = 3.0  # 글리프 이름 표 생략(크기 줄이기)
    del font['CFF ']
    if 'VORG' in font:
        del font['VORG']
    font.sfntVersion = '\x00\x01\x00\x00'
    font.save(dst)


def hahmlet_black():
    """제목 글꼴 후보 함렛: 가변 글꼴은 크롬이 Type 3으로 넣으므로 굵기 900 고정 글꼴을 만든다.
    원본: google/fonts 저장소의 Hahmlet[wght].ttf (SIL OFL 1.1)."""
    import urllib.request
    from fontTools.varLib import instancer
    dst = os.path.join(DST, 'Hahmlet-Black.ttf')
    if os.path.exists(dst) and '-f' not in sys.argv:
        return
    src = os.path.join(DST, 'Hahmlet-VF.ttf')
    if not os.path.exists(src):
        urllib.request.urlretrieve('https://raw.githubusercontent.com/google/fonts/main/ofl/hahmlet/Hahmlet%5Bwght%5D.ttf', src)
    font = instancer.instantiateVariableFont(TTFont(src), {'wght': 900})
    font['name'].setName('Hahmlet Black', 1, 3, 1, 0x409)
    font.save(dst)
    print('만듦', os.path.basename(dst))


os.makedirs(DST, exist_ok=True)
hahmlet_black()
for fam in ('Dotum', 'Batang'):
    for w in ('Light', 'Medium', 'Bold'):
        src = os.path.join(SRC, f'KoPubWorld-{fam}-{w}.otf')
        dst = os.path.join(DST, f'KoPubWorld-{fam}-{w}.ttf')
        if os.path.exists(dst) and '-f' not in sys.argv:
            continue
        convert(src, dst)
        print('만듦', os.path.basename(dst))
