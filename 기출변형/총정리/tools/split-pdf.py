# 드라이브 업로드용: PDF를 쪽 단위로 나눠 파일마다 limit 바이트 이하로 만든다(드라이브 연결은 한 번에 약 3MB까지).
# python3 -I 기출변형/총정리/tools/split-pdf.py <원본.pdf> <나눌 이름 앞부분> 3000000  → <앞부분>-1(1~34쪽).pdf …
import sys, os, io
from pypdf import PdfReader, PdfWriter
src, prefix, limit = sys.argv[1], sys.argv[2], int(sys.argv[3])
r = PdfReader(src); n = len(r.pages)
def size(a, b):
    w = PdfWriter()
    for i in range(a, b): w.add_page(r.pages[i])
    w.compress_identical_objects(remove_identicals=True, remove_orphans=True)
    buf = io.BytesIO(); w.write(buf); return buf.getvalue()
a = 0; parts = []
while a < n:
    b = a + 1
    while b < n and len(size(a, b + 1)) <= limit: b += 1
    parts.append((a, b)); a = b
for k, (a, b) in enumerate(parts, 1):
    data = size(a, b)
    f = f"{prefix}-{k}({a+1}~{b}쪽).pdf" if len(parts) > 1 else f"{prefix}.pdf"
    open(f, 'wb').write(data); print(f, len(data))
