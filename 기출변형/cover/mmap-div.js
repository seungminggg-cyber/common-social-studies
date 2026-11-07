// MINIMAP 개념서 속표지·대단원 간지 (강사 요청 2026-11-07: "속표지와 간지 만들어줘")
// 표지(1번 '네온 지구')와 같은 디자인 — MINIMAX 간지(mm-div.js)와 같은 짜임:
//   속표지(본문 첫 쪽) = 앞표지와 똑같은 그림
//   대단원 간지(홀수 쪽) = 단원 색 네온 번호(Ⅰ~Ⅴ) + 단원 색으로 빛나는 지구본 + 대단원 이름 + 중단원 표(쪽) + 대단원 핵심 개념
// 같은 HTML을 두 곳에서 쓴다: 표지 빌드(도련 3mm 낱장, build-cover.mjs mmapfinal)와 개념서 본문 빌드(textbook/build-book.mjs mm).
// 위치는 쪽(재단선) 기준 mm. 글꼴: 표지 빌드는 'KoPub Dotum', 본문 빌드는 MMAP_DIV_CSS가 --mm-sans를 'KoPubWorld Dotum'으로.
import { CH, BLEED } from './tokens.js';
import { C1, neonGlobe, m1Inner } from './mmap.js';
import { UNIT_NEON } from './mm-div.js';
import { layoutRoman, drawNeon, neonFilter, neonExtent } from './mm-letters.js';
import { esc } from './sheet.js';

const W = 210, H = 297, B = BLEED;
const mm = (v) => `${+(+v).toFixed(2)}mm`;
const f = (v) => +(+v).toFixed(2);
const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const hex = (a) => '#' + a.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
const mix = (a, b, t) => hex(rgb(a).map((v, i) => v + (rgb(b)[i] - v) * t));
const SANS = "var(--mm-sans, 'KoPub Dotum')";
const T = (s, o) => `<div class="abs" style="${o.right != null ? `right:${mm(o.right)};` : `left:${mm(o.x ?? 0)};`}top:${mm(o.y)};${o.w ? `width:${mm(o.w)};` : ''}text-align:${o.align || 'left'};font-family:${SANS};font-size:${o.size}pt;font-weight:${o.weight || 400};color:${o.color};letter-spacing:${o.ls || 0}em;line-height:${o.lh || 1.25};white-space:nowrap;${o.extra || ''}">${s}</div>`;
const svgFull = (bg, inner, defs) => `<svg class="abs" style="left:-${B}mm;top:-${B}mm;width:${W + 2 * B}mm;height:${H + 2 * B}mm" viewBox="${-B} ${-B} ${W + 2 * B} ${H + 2 * B}" xmlns="http://www.w3.org/2000/svg"><defs>${defs}</defs><rect x="${-B}" y="${-B}" width="${W + 2 * B}" height="${H + 2 * B}" fill="${bg}"/>${inner}</svg>`;
const wrap = (inner) => `<div class="mm-page" style="position:absolute;left:0;top:0;width:${W}mm;height:${H}mm;z-index:1">${inner}</div>`;
// 네온 로마 숫자: 보이는 관 기준 왼쪽 x, 위 y, 글자 높이 hMm
function neon(lay, { x, y, hMm, glow, id }) {
  const [lo, hi] = neonExtent(lay, 9);
  const k = hMm / 100, pad = 30, wv = hi - lo;
  return `<svg class="abs" style="left:${mm(x - pad * k)};top:${mm(y - pad * k)};overflow:visible" width="${mm((wv + 2 * pad) * k)}" height="${mm((100 + 2 * pad) * k)}" viewBox="${f(lo - pad)} ${-pad} ${f(wv + 2 * pad)} ${100 + 2 * pad}" xmlns="http://www.w3.org/2000/svg"><defs>${neonFilter(id, 4)}</defs>${drawNeon(lay, { w: 9, glow, blurId: id })}</svg>`;
}
// **굵게** → 흰 굵은 글자
const inl = (s, strong) => esc(s).replace(/\*\*(.+?)\*\*/g, `<b style="color:${strong};font-weight:700">$1</b>`);

// 개념서의 대단원 하나에서 간지에 쓸 값
export function chapterInfo(ch, k) {
  const units = ch.units.map((u) => ({
    no: u.no, title: u.title,
    concepts: (u.concept || []).filter((b) => b.t === 'concept').length,
    exam: u.exam?.length || 0,
  }));
  return { no: ch.chapter.no, title: ch.chapter.title, k, units, concepts: units.reduce((a, u) => a + u.concepts, 0), exam: units.reduce((a, u) => a + u.exam, 0) };
}

// 대단원 간지. v: MMAP.vols의 한 권, info: chapterInfo, keys: '대단원 핵심 개념'(**굵게**), pages: { 'u01': 12 … }(도련 낱장용; 본문에서는 쪽 나누기가 data-pg를 채운다)
export function mmapChapterPage(v, info, { keys = [], uid = 'c', tab = false, pages = null } = {}) {
  const c = C1[v.n], col = UNIT_NEON[info.no];
  const faint = mix(c.bg, '#ffffff', 0.16), sub = c.sub;
  const n = info.units.length;
  const rowH = Math.min(24, 66 / n); // 표 한 줄 높이(mm): 중단원 2개 24 · 3개 22 · 4개 16.5
  const td = `height:${mm(rowH)};padding:0;border-bottom:.35pt solid ${faint};vertical-align:middle;`;
  const pg = (u) => (pages ? (pages[`u${u.no}`] ?? '') : `<i data-pg="u${esc(u.no)}" style="font-style:normal"></i>`);
  const rows = info.units.map((u) => `<tr><td style="${td}width:14mm;color:${col};font-weight:700">${esc(u.no)}</td><td style="${td}">${esc(u.title)}</td><td style="${td}text-align:right;width:20mm">${pg(u)}</td></tr>`).join('');
  const keyHtml = keys.length
    ? `<div style="margin-top:9mm"><div style="font-size:10.5pt;font-weight:700;color:${col};letter-spacing:.04em;margin-bottom:2.6mm">대단원 핵심 개념</div>
      ${keys.map((k) => `<div style="display:flex;gap:2.6mm;font-size:11.5pt;line-height:1.5;color:${mix(sub, '#ffffff', 0.45)};margin-top:1.2mm"><span style="color:${col}">•</span><span>${inl(k, '#ffffff')}</span></div>`).join('')}</div>`
    : '';
  // 지구본: 단원 색으로 빛나게(우리나라는 흰빛)
  const G = neonGlobe({ ...c, neon: col, hot: mix(col, '#ffffff', 0.65), sea: mix(c.bg, col, 0.12) }, { cx: 151, cy: 72, R: 38, id: `g${uid}` });
  const ty = 38 + 30 * (info.k % 5);
  const tabHtml = tab // 도련 낱장용 엄지 색인(본문 쪽에서는 쪽 나누기가 같은 자리에 그린다)
    ? `<div class="abs" style="left:${mm(W - 6.5)};top:${mm(ty)};width:${mm(6.5 + B)};height:26mm;background:${CH[info.no]}"></div><div class="abs edge" style="left:${mm(W - 6.5)};top:${mm(ty)};width:6.5mm;height:26mm;display:flex;align-items:center;justify-content:center;font-family:'KoPub Batang','KoPubWorld Batang';font-weight:700;font-size:10pt;color:#fff">${info.no}</div>`
    : '';
  return wrap(`${svgFull(c.bg, G.svg, G.defs)}
    ${T('MINIMAP 개념서', { x: 16, y: 13, size: 8.6, color: sub })}
    ${T(esc(v.subject), { right: 22, y: 13, size: 8.6, weight: 700, color: '#fff' })}
    ${T('대단원', { x: 22, y: 32, size: 12, weight: 700, color: col, ls: 0.2 })}
    ${neon(layoutRoman(info.no), { x: 22, y: 44, hMm: 56, glow: col, id: `n${uid}` })}
    <div class="abs" style="left:22mm;top:124mm;width:166mm;font-family:${SANS};color:#fff">
      <div style="font-size:36pt;font-weight:700;line-height:1.15;letter-spacing:-.025em">${esc(info.title)}</div>
      <table style="width:100%;border-collapse:collapse;font-size:13pt;margin-top:10mm">
        <tr style="font-size:10pt;color:${sub}"><td colspan="2" style="padding-bottom:2.4mm;border-bottom:1pt solid ${col}">중단원</td><td style="text-align:right;padding-bottom:2.4mm;border-bottom:1pt solid ${col}">쪽</td></tr>
        ${rows}
      </table>
      ${keyHtml}
    </div>${tabHtml}`);
}

// ── 두 쪽 펼침 간지(2026-11-07 강사: "간지는 두 쪽으로") ──
// 왼쪽 쪽(짝수): 대단원 번호(네온) + 크게 빛나는 지구본. 서울에서 오른쪽으로 뻗은 가는 네온 선이 가운데 접히는 곳을 넘어
// 오른쪽 쪽(홀수)의 대단원 이름 밑줄이 된다. 오른쪽 쪽: 대단원 이름 + 중단원 표(쪽) + 대단원 핵심 개념.
// 접히는 쪽(제본 쪽) 20mm 안에는 글자를 두지 않는다.
const SEOUL_Y = (cy, R) => cy - R * (Math.cos(20 * Math.PI / 180) * Math.sin(37.57 * Math.PI / 180) - Math.sin(20 * Math.PI / 180) * Math.cos(37.57 * Math.PI / 180) * Math.cos(0.52 * Math.PI / 180));
const GL = { cx: 96, cy: 176, R: 76 }; // 왼쪽 쪽 지구본 자리
const LINE_Y = f(SEOUL_Y(GL.cy, GL.R)); // 두 쪽을 잇는 선의 높이(서울 높이)
export function mmapChapterLeft(v, info, { uid = 'c' } = {}) {
  const c = C1[v.n], col = UNIT_NEON[info.no];
  const G = neonGlobe({ ...c, neon: col, hot: mix(col, '#ffffff', 0.65), sea: mix(c.bg, col, 0.12) }, { ...GL, id: `g${uid}L` });
  const sx = GL.cx - 0.5;
  const line = `<line x1="${f(sx)}" y1="${LINE_Y}" x2="${W + B}" y2="${LINE_Y}" stroke="${col}" stroke-width=".3"/>`;
  return wrap(`${svgFull(c.bg, G.svg + line, G.defs)}
    ${T('대단원', { x: 22, y: 18, size: 12, weight: 700, color: col, ls: 0.2 })}
    ${neon(layoutRoman(info.no), { x: 22, y: 30, hMm: 58, glow: col, id: `n${uid}L` })}
    ${T(`MINIMAP 개념서 · ${esc(v.subject)}`, { x: 16, y: 280, size: 8.6, color: c.sub })}`);
}
export function mmapChapterRight(v, info, { keys = [], uid = 'c', pages = null } = {}) {
  const c = C1[v.n], col = UNIT_NEON[info.no];
  const faint = mix(c.bg, '#ffffff', 0.16), sub = c.sub;
  const n = info.units.length, rowH = Math.min(15, 52 / n);
  const td = `height:${mm(rowH)};padding:0;border-bottom:.35pt solid ${faint};vertical-align:middle;`;
  const pg = (u) => (pages ? (pages[`u${u.no}`] ?? '') : `<i data-pg="u${esc(u.no)}" style="font-style:normal"></i>`);
  const rows = info.units.map((u) => `<tr><td style="${td}width:14mm;color:${col};font-weight:700">${esc(u.no)}</td><td style="${td}">${esc(u.title)}</td><td style="${td}text-align:right;width:20mm">${pg(u)}</td></tr>`).join('');
  const keyHtml = keys.length
    ? `<div style="margin-top:12mm"><div style="font-size:10.5pt;font-weight:700;color:${col};letter-spacing:.04em;margin-bottom:2.6mm">대단원 핵심 개념</div>
      ${keys.map((k) => `<div style="display:flex;gap:2.6mm;font-size:11.5pt;line-height:1.5;color:${mix(sub, '#ffffff', 0.45)};margin-top:1.4mm"><span style="color:${col}">•</span><span>${inl(k, '#ffffff')}</span></div>`).join('')}</div>`
    : '';
  const line = `<line x1="${-B}" y1="${LINE_Y}" x2="${W - 22}" y2="${LINE_Y}" stroke="${col}" stroke-width=".3"/><circle cx="${W - 22}" cy="${LINE_Y}" r=".9" fill="${col}"/>`;
  return wrap(`${svgFull(c.bg, line, '')}
    <div class="abs" style="left:22mm;bottom:${mm(H - LINE_Y + 6)};width:166mm;font-family:${SANS};color:#fff">
      <div style="font-size:12pt;font-weight:700;color:${col};letter-spacing:.2em;margin-bottom:3mm">대단원 ${esc(info.no)}</div>
      <div style="font-size:36pt;font-weight:700;line-height:1.15;letter-spacing:-.025em">${esc(info.title)}</div>
    </div>
    <div class="abs" style="left:22mm;top:${mm(LINE_Y + 8)};width:166mm;font-family:${SANS};color:#fff">
      <table style="width:100%;border-collapse:collapse;font-size:13pt">
        <tr style="font-size:10pt;color:${sub}"><td colspan="2" style="padding-bottom:2.4mm;border-bottom:1pt solid ${col}">중단원</td><td style="text-align:right;padding-bottom:2.4mm;border-bottom:1pt solid ${col}">쪽</td></tr>
        ${rows}
      </table>
      ${keyHtml}
    </div>`);
}

// 속표지(본문 첫 쪽) = 앞표지와 똑같은 그림(MINIMAX와 같은 방식)
export const mmapTitlePage = (v) => wrap(m1Inner(v, 'tt'));

// 본문 빌드에 넣을 CSS: 속표지·간지 쪽은 머리글·쪽 번호를 숨기고, 표지와 같은 글꼴 변수를 쓴다(엄지 색인은 간지에만)
export const MMAP_DIV_CSS = `
.page-mmdiv .page-head, .page-mmdiv .page-foot, .page-mmtitle .page-head, .page-mmtitle .page-foot, .page-mmtitle .edge-tab { visibility: hidden; }
.page-mmdiv .mm-page, .page-mmtitle .mm-page { --mm-sans: 'KoPubWorld Dotum'; }
.page-mmdiv .edge-tab { z-index: 3; }
.mm-page .abs { position: absolute; }
`;
