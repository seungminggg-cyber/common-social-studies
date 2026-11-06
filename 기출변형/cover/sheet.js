// 낱장 한 장(도련 포함) HTML 틀. 안쪽 .t 상자가 재단선(210×297mm)이고, 그 안의 위치는 모두 재단선 기준 mm.
import { PAGE, BLEED, FONT, fontFaces, CUT } from './tokens.js';

export const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export function doc(pages, { w = PAGE.w, h = PAGE.h, css = '' } = {}) {
  const W = w + 2 * BLEED, H = h + 2 * BLEED;
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><style>
${fontFaces()}
@page { size: ${W}mm ${H}mm; margin: 0; }
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { background: #888; }
body { font-family: '${FONT.dotum}'; -webkit-font-smoothing: antialiased; font-kerning: normal; }
.sheet { position: relative; width: ${W}mm; height: ${H}mm; overflow: hidden; break-after: page; }
.t { position: absolute; left: ${BLEED}mm; top: ${BLEED}mm; width: ${w}mm; height: ${h}mm; }
.abs { position: absolute; }
.cut { clip-path: polygon(0 0, calc(100% - var(--cut)) 0, 100% var(--cut), 100% 100%, 0 100%); }
.sans { font-family: '${FONT.dotum}'; } .serif { font-family: '${FONT.batang}'; }
.row { display: flex; justify-content: space-between; align-items: baseline; }
${css}
</style></head><body>${pages.join('\n')}</body></html>`;
}

// 앞 단어 상자: 높이의 18%를 오른쪽 위에서 자른다
export function wordBox(text, { h = 12, size = 19, bg, fg, pad = 4.6 }) {
  return `<span class="cut sans" style="--cut:${(h * CUT).toFixed(2)}mm;display:inline-flex;align-items:center;height:${h}mm;padding:0 ${pad}mm;background:${bg};color:${fg};font-weight:700;font-size:${size}pt;letter-spacing:.06em;line-height:1">${text}</span>`;
}
