"""강사 구글 드라이브의 기출·문제집 자료 받기 (저장소 밖에 둔다 — 공개 저장소라 원문을 올리면 안 됨)

  python3 -I scripts/fetch-sources.py <폴더 주소 또는 ID> [받을 곳]

  - 받을 곳 기본값: /home/user/자료  (pdf/ 에 원본, txt/ 에 pdftotext -layout 글자본)
  - 폴더 안의 하위 폴더까지 모두 받는다. 이미 받은 파일은 건너뛴다.
  - 드라이브 폴더가 '링크가 있는 모든 사용자'에게 보기 공유되어 있어야 한다.
  - 폴더 주소는 저장소에 적지 않는다(누구나 자료를 받을 수 있게 되므로). 환경 설정의 준비 스크립트에만 적는다.
"""
import html
import os
import re
import subprocess
import sys

if len(sys.argv) < 2:
    print(__doc__)
    sys.exit(1)
arg = sys.argv[1]
m = re.search(r'folders/([A-Za-z0-9_-]+)', arg) or re.search(r'id=([A-Za-z0-9_-]+)', arg)
root_id = m.group(1) if m else arg
dest = sys.argv[2] if len(sys.argv) > 2 else '/home/user/자료'
os.makedirs(os.path.join(dest, 'pdf'), exist_ok=True)
os.makedirs(os.path.join(dest, 'txt'), exist_ok=True)


def get(url, out=None):
    cmd = ['curl', '-sSL', '--retry', '3', '--max-time', '600', url]
    if out:
        cmd[1:1] = ['-o', out]
    r = subprocess.run(cmd, capture_output=True)
    if r.returncode:
        raise RuntimeError(f'받기 실패({r.returncode}): {url}')
    return r.stdout.decode('utf-8', 'replace') if not out else None


def listing(folder_id):
    """폴더 안 목록: [(종류, id, 이름)] — 종류는 'folder' 또는 'file'"""
    page = get(f'https://drive.google.com/embeddedfolderview?id={folder_id}')
    items = []
    for chunk in page.split('class="flip-entry"')[1:]:
        link = re.search(r'href="https://drive\.google\.com/(file/d|drive/folders)/([A-Za-z0-9_-]+)', chunk)
        if not link:
            continue
        title = re.search(r'flip-entry-title">(.*?)<', chunk, re.S)
        name = html.unescape(title.group(1)).strip() if title else link.group(2)
        items.append(('folder' if link.group(1) == 'drive/folders' else 'file', link.group(2), name))
    return items


def safe(name):
    return re.sub(r'[\\/:*?"<>|]', '_', name)


got = skipped = failed = 0
def walk(folder_id, rel=''):
    global got, skipped, failed
    for kind, fid, name in listing(folder_id):
        if kind == 'folder':
            walk(fid, os.path.join(rel, safe(name)))
            continue
        pdf_dir = os.path.join(dest, 'pdf', rel)
        os.makedirs(pdf_dir, exist_ok=True)
        path = os.path.join(pdf_dir, safe(name))
        if os.path.exists(path) and os.path.getsize(path) > 0:
            skipped += 1
        else:
            try:
                get(f'https://drive.usercontent.google.com/download?id={fid}&export=download&confirm=t', path)
                with open(path, 'rb') as f:
                    head = f.read(5)
                if not head.startswith(b'%PDF') and name.lower().endswith('.pdf'):
                    raise RuntimeError('PDF가 아닌 응답(공유 설정을 확인)')
                got += 1
                print(f'받음  {os.path.join(rel, name)}')
            except Exception as e:  # 하나가 안 돼도 나머지는 계속
                failed += 1
                print(f'실패  {os.path.join(rel, name)} — {e}')
                if os.path.exists(path):
                    os.remove(path)
                continue
        if name.lower().endswith('.pdf'):
            txt_dir = os.path.join(dest, 'txt', rel)
            os.makedirs(txt_dir, exist_ok=True)
            txt = os.path.join(txt_dir, safe(name)[:-4] + '.txt')
            if not os.path.exists(txt):
                subprocess.run(['pdftotext', '-layout', path, txt], capture_output=True)


if not listing(root_id):
    print('폴더 안 목록을 읽지 못했습니다 — 주소가 맞는지, 폴더가 "링크가 있는 모든 사용자"에게 공유되었는지 확인해 주세요.')
    sys.exit(1)
walk(root_id)
print(f'끝: 새로 받음 {got} · 이미 있음 {skipped} · 실패 {failed} → {dest}/pdf, {dest}/txt')
sys.exit(1 if failed and not got and not skipped else 0)
