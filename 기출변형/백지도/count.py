# 글에서 나라·지역 이름을 세는 도구 (개념풀 글자 PDF, 개념서 내용)
#   python3 -I count.py gp <개념풀 글 파일(pdftotext -layout)> <결과.json>
#   python3 -I count.py tb <결과.json>   (개념서 t2-4·t2-5, node로 내용을 읽음)
import sys, re, json, os, subprocess
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import names as N

NAMES = N.load(); NAMES.pop('타이', None); OTH = N.others()
KEYS = {k: (v[0], v[1], None) for k, v in NAMES.items()}
for k, t in OTH.items():
    if k not in KEYS: KEYS[k] = (k, 'other', t)
def pat(k):
    if len(k) >= 4: return r'\s?'.join(map(re.escape, k.replace(' ', '')))
    return re.escape(k)
ORDER = sorted(KEYS, key=lambda k: -len(k.replace(' ', '')))
RX = re.compile('|'.join(f'({pat(k)})' for k in ORDER))
HANGUL = re.compile(r'[가-힣]')
# 다른 뜻으로 많이 쓰이는 짧은 이름: 앞 글자가 한글이면 버리고, 뒤 글자도 따로 본다
BAD_AFTER = {'인도': ('주의', '적', '하', '되', '받', '에 따라'), '수단': ('과', '와', '으로', '을', '이', '을 ', '·', '이다', '은', '에'),
             '가나': ('다',), '말리': ('는', '고', '지', '아'), '오만': ('한', '함', '과'), '통가': ('능', ''), '조선': ()}
def find(text):
    out = []
    for m in RX.finditer(text):
        k = ORDER[m.lastindex - 1]; s, e = m.span()
        std, kind, typ = KEYS[k]
        short = len(k) <= 2
        prev = text[s-1] if s else ' '
        if short and HANGUL.match(prev): continue
        if k in BAD_AFTER and any(text[e:e+len(b)] == b for b in BAD_AFTER[k] if b): continue
        if k == '수단' and re.search(r'(적|송|통|결|법|한|는|의|단)\s*$', text[max(0, s-6):s]): continue  # 평화적 수단·운송 수단 등
        if k == '통가': continue  # '통가'는 거의 다른 뜻(유통가 등) — 필요하면 손으로
        out.append((std, kind, typ, text[max(0, s-15):e+15].replace('\n', ' ')))
    return out

def gp(src, dst):
    pages = open(src).read().split('\f')
    # 개념풀 통합사회2 Ⅳ·Ⅴ: PDF 쪽 → 중단원, 부분(개념/문제)
    U = [(123, 131, '11'), (132, 139, '12'), (140, 147, '13'), (148, 152, 'Ⅳ종합'),
         (153, 165, '14'), (166, 177, '15'), (178, 183, '16'), (184, 188, 'Ⅴ종합')]
    CONCEPT = set(range(123, 127)) | set(range(132, 135)) | set(range(140, 143)) | set(range(153, 160)) | set(range(166, 172)) | set(range(178, 180))
    rows = []
    for a, b, u in U:
        for p in range(a, b + 1):
            for std, kind, typ, ctx in find(pages[p - 1]):
                rows.append(dict(name=std, kind=kind, otherType=typ, unit=u, page=f'PDF {p}쪽',
                                 where='개념' if p in CONCEPT else '문제', ctx=ctx))
    json.dump(rows, open(dst, 'w'), ensure_ascii=False, indent=0)
    print(len(rows), 'mentions')

JS = r'''
const [f, cc] = process.argv.slice(1);
const d = (await import(f)).default; const c = cc ? (await import(cc)).default[d.no] : null;
const out = []; const FIG = new Set(['map','fig','chart','bar','line','table','photo','diagram','data','pyramid','radar','venn','climate','scatter','pie','src','source']);
function walk(x, where) { if (x == null) return; if (typeof x === 'string') { out.push([where, x]); return; }
  if (Array.isArray(x)) { x.forEach((y) => walk(y, where)); return; }
  if (typeof x === 'object') { let w = where; if (where === '본문' && (FIG.has(x.t) || x.t === 'box' && /자료/.test(x.title || ''))) w = '자료·지도';
    for (const [k, v] of Object.entries(x)) { if (k === 't' || k === 'cls' || k === 'pos') continue; walk(v, w); } } }
walk(d.concept, '본문'); walk(d.check, '문제'); walk(d.exam, '문제'); if (c) walk(c, '문제');
console.log(JSON.stringify(out));
'''
def tb(dst):
    root = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'textbook', 'content')
    rows = []
    for book, us in (('t2-4', ('11', '12', '13')), ('t2-5', ('14', '15', '16'))):
        for u in us:
            f = os.path.abspath(f'{root}/_{book}/u{u}.js'); cc = os.path.abspath(f'{root}/_cc/{book}.js')
            r = subprocess.run(['node', '--input-type=module', '-e', JS, f'file://{f}', f'file://{cc}'], capture_output=True, text=True)
            if r.returncode: print(r.stderr); sys.exit(1)
            for where, s in json.loads(r.stdout):
                for std, kind, typ, ctx in find(s):
                    rows.append(dict(name=std, kind=kind, otherType=typ, unit=u, page=f'중단원 {u}', where=where, ctx=ctx))
    json.dump(rows, open(dst, 'w'), ensure_ascii=False, indent=0)
    print(len(rows), 'mentions')

if __name__ == '__main__':
    if sys.argv[1] == 'gp': gp(sys.argv[2], sys.argv[3])
    else: tb(sys.argv[2])
