# PPT → PDF (예비용: PowerPoint가 없거나 글꼴이 없는 PC에서 띄울 때)
# 실행: python3 pdf.py  →  out/승민T-통합사회-겨울특강-OT.pdf
# LibreOffice는 한글과 숫자·영문 사이에 자동으로 빈칸을 더 넣는데("10 주"), PowerPoint는 그렇지 않다.
# 그래서 변환 전에 모든 문단의 그 설정(ParaIsCharacterDistance)을 끈다.
import os
import socket
import subprocess
import sys
import tempfile
import time
from pathlib import Path

import uno
from com.sun.star.beans import PropertyValue

ROOT = Path(__file__).resolve().parent
SRC = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / 'out/승민T-통합사회-겨울특강-OT.pptx'
DST = Path(sys.argv[2]) if len(sys.argv) > 2 else SRC.with_suffix('.pdf')


def prop(name, value):
    p = PropertyValue()
    p.Name, p.Value = name, value
    return p


def free_port():
    with socket.socket() as s:
        s.bind(('127.0.0.1', 0))
        return s.getsockname()[1]


def fix_text(shape):
    # 묶음 도형이면 안쪽까지
    if shape.supportsService('com.sun.star.drawing.GroupShape'):
        for i in range(shape.getCount()):
            fix_text(shape.getByIndex(i))
        return
    if not hasattr(shape, 'getText'):
        return
    try:
        en = shape.getText().createEnumeration()
    except Exception:
        return
    while en.hasMoreElements():
        para = en.nextElement()
        try:
            para.setPropertyValue('ParaIsCharacterDistance', False)
        except Exception:
            pass


def main():
    port = free_port()
    profile = tempfile.mkdtemp(prefix='lo_profile_')
    env = dict(os.environ, SAL_USE_VCLPLUGIN='svp')
    proc = subprocess.Popen(['soffice', f'-env:UserInstallation={Path(profile).as_uri()}', '--headless', '--invisible', '--nologo', '--norestore',
                             f'--accept=socket,host=127.0.0.1,port={port};urp;'], env=env, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        local = uno.getComponentContext()
        resolver = local.ServiceManager.createInstanceWithContext('com.sun.star.bridge.UnoUrlResolver', local)
        for _ in range(60):
            try:
                ctx = resolver.resolve(f'uno:socket,host=127.0.0.1,port={port};urp;StarOffice.ComponentContext')
                break
            except Exception:
                time.sleep(0.5)
        else:
            raise SystemExit('LibreOffice에 연결하지 못했습니다')
        desktop = ctx.ServiceManager.createInstanceWithContext('com.sun.star.frame.Desktop', ctx)
        doc = desktop.loadComponentFromURL(SRC.resolve().as_uri(), '_blank', 0, (prop('Hidden', True),))
        pages = doc.getDrawPages()
        for i in range(pages.getCount()):
            pg = pages.getByIndex(i)
            for j in range(pg.getCount()):
                fix_text(pg.getByIndex(j))
        masters = doc.getMasterPages()
        for i in range(masters.getCount()):
            mp = masters.getByIndex(i)
            for j in range(mp.getCount()):
                fix_text(mp.getByIndex(j))
        doc.storeToURL(DST.resolve().as_uri(), (prop('FilterName', 'impress_pdf_Export'),))
        doc.close(True)
        print('PDF:', DST)
    finally:
        try:
            desktop.terminate()
        except Exception:
            pass
        time.sleep(1)
        proc.kill()


if __name__ == '__main__':
    main()
