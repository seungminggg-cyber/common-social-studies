"""한글 파일(.hwpx)이 PDF와 같은지 대조

  python3 -I tools/hwpx-check.py 2        2차 out/2 의 한글 파일 6개
  (먼저 node build.mjs 2 units t1 … 로 빌드하고 python3 hwpx_wb.py … 로 한글 파일을 만들어 둔다)

  보는 것: 문항 수, 문항 순서(PDF와 같은 order.json 순서), 보충 설명(note)이 다 들어갔는지, 그림 수(나란한 그림 줄은 한 장)
"""
import json, zipfile, re, os, sys, html

ed = sys.argv[1] if len(sys.argv) > 1 else '2'
here = os.path.dirname(os.path.abspath(__file__))
out = os.path.join(here, '..', 'out', ed)
norm = lambda s: re.sub(r'[\s*‘’“”"\'·]', '', s)
bad = 0
# vol: 합본 MINIMAX 기출분석 통합사회1·2(build.mjs vol t1|t2 → hwpx_wb.py) — JSON·HTML 이름이 '-본문'
vol = ed == 'vol'
for n in (['MINIMAX-통합사회1', 'MINIMAX-통합사회2'] if vol else ['단원별-통합사회1', '단원별-통합사회2', '모의고사']):
    suf = '-본문' if vol else '-학생용'
    src = os.path.join(out, f'{n}{suf}.json')
    if not os.path.exists(src):
        continue
    qs, top = [], []
    def walk(x, inrow=False):
        if isinstance(x, dict):
            if 'stem' in x and 'choices' in x:
                qs.append(x)
            if '_fig' in x and not inrow:
                top.append(x['_fig'])
            for v in x.values():
                walk(v, inrow or x.get('t') == 'figrow')
        elif isinstance(x, list):
            for v in x:
                walk(v, inrow)
    walk(json.load(open(src, encoding='utf-8')))
    hids = re.findall(r'data-qid="([^"]+)"', open(os.path.join(out, f'{n}{suf}.html'), encoding='utf-8').read())
    for kind in ['', '-교사용']:
        path = os.path.join(out, f'{n}{kind}.hwpx')
        if not os.path.exists(path):
            print(f'{n}{kind}.hwpx 없음'); bad += 1; continue
        z = zipfile.ZipFile(path)
        xml = ''.join(z.read(f).decode('utf-8') for f in sorted((f for f in z.namelist() if f.startswith('Contents/section')), key=lambda f: int(re.findall(r'\d+', f)[0])))
        text = norm(html.unescape(re.sub(r'<[^>]+>', '', xml)))
        pos, miss, order = -1, [], 0
        for q in qs:
            k = norm(q['stem'])[:25]
            p = text.find(k, pos + 1)
            if p < 0:
                (order := order + 1) if text.find(k) >= 0 else miss.append(q['id'])
            else:
                pos = p
        notes = [q['id'] for q in qs if q.get('note') and norm(q['note'])[:30] not in text]
        pics = len(re.findall(r'binaryItemIDRef=', xml))
        ok = hids == [q['id'] for q in qs] and not miss and not order and not notes and pics == len(top)
        bad += not ok
        print(f"{'통과' if ok else '확인 필요'}  {n}{kind}: 문항 {len(qs)} · 순서 {'같음' if hids == [q['id'] for q in qs] and not order else '다름'} · 못 찾은 문항 {miss[:5]} · 빠진 보충 설명 {notes[:5]} · 그림 {pics}/{len(top)}")
sys.exit(1 if bad else 0)
