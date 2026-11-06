// MINIMAX 간지 — 과목 간지(통합사회1·2)와 대단원 간지 10장 (강사 요청 2026-11-07: "완성본, 대단원 간지·통합사회1/2 간지 포함")
// 표지(X5 네온 길)와 같은 디자인: 밤색 남색 바탕 + 네온 미로 + 직접 그린 네온 글자.
//   과목 간지(짝수 쪽)  — 표지와 같은 큰 미로, 네온 '통합사회1', 대단원 다섯 줄 → 오른쪽 쪽의 Ⅰ 간지와 펼침면을 이룬다
//   대단원 간지(홀수 쪽) — 단원 색 네온 번호(Ⅰ~Ⅴ), 대단원 이름, 단원 색으로 빛나는 작은 미로, 중단원 표(문항 번호·문항 수·합계)
// 같은 HTML을 두 곳에서 쓴다: 표지 빌드(도련 3mm 낱장)와 본문 빌드(build.mjs mm — 쪽 나누기 안의 한 쪽).
// 위치는 쪽(재단선) 기준 mm. 글꼴 이름은 CSS 변수 --mm-sans(표지: 'KoPub Dotum', 본문: 'KoPubWorld Dotum').
import { CH, BLEED } from './tokens.js';
import { X5, X5MAZE, X5NEON, maze, ng } from './mmx.js';
import { layout, layoutHangul, layoutRoman, drawNeon, neonFilter, neonExtent } from './mm-letters.js';
import { esc } from './sheet.js';

const W = 210, H = 297, B = BLEED;
const mm = (v) => `${+(+v).toFixed(2)}mm`;
const f = (v) => +(+v).toFixed(2);
// 대단원 네온 색(단원 색을 어두운 바탕에서 빛나게 밝힌 것) Ⅰ~Ⅴ
export const UNIT_NEON = { 'Ⅰ': '#2FE6D8', 'Ⅱ': '#FF5DBE', 'Ⅲ': '#74F06F', 'Ⅳ': '#FFA640', 'Ⅴ': '#5AA2FF' };
const SANS = "var(--mm-sans, 'KoPub Dotum')"; // 본문 빌드에서는 MM_DIV_CSS가 'KoPubWorld Dotum'으로 바꾼다
const T = (s, o) => `<div class="abs" style="${o.right != null ? `right:${mm(o.right)};` : `left:${mm(o.x ?? 0)};`}top:${mm(o.y)};${o.w ? `width:${mm(o.w)};` : ''}text-align:${o.align || 'left'};font-family:${SANS};font-size:${o.size}pt;font-weight:${o.weight || 400};color:${o.color};letter-spacing:${o.ls || 0}em;line-height:${o.lh || 1.25};white-space:nowrap;${o.extra || ''}">${s}</div>`;
const svgFull = (inner, defs) => `<svg class="abs" style="left:-${B}mm;top:-${B}mm;width:${W + 2 * B}mm;height:${H + 2 * B}mm" viewBox="${-B} ${-B} ${W + 2 * B} ${H + 2 * B}" xmlns="http://www.w3.org/2000/svg"><defs>${defs}</defs><rect x="${-B}" y="${-B}" width="${W + 2 * B}" height="${H + 2 * B}" fill="${X5.bg}"/>${inner}</svg>`;
// 네온 글자 묶음을 놓기: 보이는 관 기준 왼쪽 x(또는 가운데 cx), 위 y, 글자 높이 hMm
function neon(lay, { x, cx, y, hMm, glow, id }) {
  const [lo, hi] = neonExtent(lay, X5NEON.w);
  const k = hMm / 100, pad = 30, wv = hi - lo;
  const left = cx != null ? cx - (wv * k) / 2 : x;
  return `<svg class="abs" style="left:${mm(left - pad * k)};top:${mm(y - pad * k)};overflow:visible" width="${mm((wv + 2 * pad) * k)}" height="${mm((100 + 2 * pad) * k)}" viewBox="${f(lo - pad)} ${-pad} ${f(wv + 2 * pad)} ${100 + 2 * pad}" xmlns="http://www.w3.org/2000/svg"><defs>${neonFilter(id, 4)}</defs>${drawNeon(lay, { w: X5NEON.w, glow, blurId: id })}</svg>`;
}
const wrap = (inner) => `<div class="mm-page" style="position:absolute;left:0;top:0;width:${W}mm;height:${H}mm;z-index:1">${inner}</div>`;

// 과목 간지. chs: chapters()의 그 과목 대단원 다섯 개, name: 책 이름("MINIMAX 기출분석 · 기본편")
export function mmSubjectPage(subject, chs, { name, uid = 's' }) {
  const { c, gx, gy } = X5MAZE;
  const total = chs.reduce((a, ch) => a + ch.total, 0);
  const rows = chs.map((ch, i) => `<div style="display:flex;align-items:baseline;gap:4mm;height:8.4mm;border-bottom:.3pt solid ${X5.faint}">
      <span style="width:9mm;font-family:'KoPub Batang','KoPubWorld Batang';font-weight:700;font-size:12pt;color:${UNIT_NEON[ch.no]}">${ch.no}</span>
      <span style="flex:1;font-size:12pt;font-weight:700;color:#fff">${esc(ch.title)}</span>
      <span style="font-size:10pt;color:${X5.sub}">${ch.total}문항</span></div>`).join('');
  return wrap(`${svgFull(maze(gx, gy, c, { glowId: `g${uid}`, gradId: `p${uid}` }), ng(2.2, `g${uid}`))}
    ${T(esc(name), { x: 16, y: 13, size: 8.6, color: X5.sub })}
    ${neon(layoutHangul(subject), { cx: W / 2, y: 194, hMm: 22, glow: X5.cyan, id: `n${uid}` })}
    <div class="abs" style="left:40mm;width:130mm;top:228mm;font-family:${SANS}">${rows}
      <div style="display:flex;justify-content:flex-end;padding-top:2.4mm;font-size:10pt;color:${X5.sub}">단원별 <b style="color:#fff;padding-left:1.6mm;font-weight:700">${total}문항</b></div></div>`);
}

// 대단원 간지. ch: chapters()의 한 대단원
// 2026-11-07 강사: 아래 '단원 분석'(최다 빈출 개념·난이도 구성)은 빼고, 남은 요소를 키워 아래 여백을 줄임.
//   번호·미로·대단원 이름·표를 키우고, 표 줄 높이는 중단원 수에 맞춰 늘린다(중단원이 적을수록 줄이 높음) → 짧은 단원도 쪽 아래까지 찬다.
export function mmChapterPage(ch, { name, uid = 'c', tab = false }) {
  const col = UNIT_NEON[ch.no];
  const n = ch.units.length;
  const rowH = Math.min(30, 80 / n); // 표 한 줄 높이(mm): 중단원 2개 30 · 3개 26.7 · 4개 20
  const td = `height:${mm(rowH)};padding:0;border-bottom:.35pt solid ${X5.faint};vertical-align:middle;`;
  const rows = ch.units.map((u) => `<tr><td style="${td}width:14mm;color:${col};font-weight:700">${u.no}</td><td style="${td}">${esc(u.title)}</td><td style="${td}text-align:right;color:${X5.sub};width:28mm">${u.range}</td><td style="${td}text-align:right;width:20mm">${u.count}</td></tr>`).join('');
  const types = ch.types.slice(0, 3).map(([t, c]) => `${esc(t)} <span style="color:${X5.sub}">${c}문항</span>`).join(`<span style="color:${X5.faint};padding:0 3mm">|</span>`);
  const tabHtml = tab // 도련 낱장용 엄지 색인(본문 쪽에서는 쪽 나누기가 같은 자리에 그린다)
    ? `<div class="abs" style="left:${mm(W - 6.5)};top:${mm(38 + 30 * (ch.k % 5))};width:${mm(6.5 + B)};height:26mm;background:${CH[ch.no]}"></div><div class="abs edge" style="left:${mm(W - 6.5)};top:${mm(38 + 30 * (ch.k % 5))};width:6.5mm;height:26mm;display:flex;align-items:center;justify-content:center;font-family:'KoPub Batang','KoPubWorld Batang';font-weight:700;font-size:10pt;color:#fff">${ch.no}</div>`
    : '';
  return wrap(`${svgFull(maze(118, 28, 11, { glowId: `g${uid}`, gradId: `p${uid}`, from: col, to: '#ffffff' }), ng(1.8, `g${uid}`))}
    ${T(esc(name), { x: 16, y: 13, size: 8.6, color: X5.sub })}
    ${T(esc(ch.subject), { right: 22, y: 13, size: 8.6, weight: 700, color: '#fff' })}
    ${T('대단원', { x: 22, y: 32, size: 12, weight: 700, color: col, ls: 0.2 })}
    ${neon(layoutRoman(ch.no), { x: 22, y: 44, hMm: 56, glow: col, id: `n${uid}` })}
    <div class="abs" style="left:22mm;top:124mm;width:166mm;font-family:${SANS};color:#fff">
      <div style="font-size:36pt;font-weight:700;line-height:1.15;letter-spacing:-.025em">${esc(ch.title)}</div>
      <div style="font-size:14pt;color:${X5.sub};margin-top:2.6mm">${n}개 중단원 · ${ch.total}문항</div>
      <table style="width:100%;border-collapse:collapse;font-size:13pt;margin-top:12mm">
        <tr style="font-size:10pt;color:${X5.sub}"><td colspan="2" style="padding-bottom:2.4mm;border-bottom:1pt solid ${col}">중단원</td><td style="text-align:right;padding-bottom:2.4mm;border-bottom:1pt solid ${col}">문항 번호</td><td style="text-align:right;padding-bottom:2.4mm;border-bottom:1pt solid ${col}">문항 수</td></tr>
        ${rows}
        <tr style="font-weight:700;font-size:14pt"><td colspan="3" style="padding-top:4mm">단원 합계</td><td style="text-align:right;padding-top:4mm;color:${col}">${ch.total}</td></tr>
      </table>
      <div style="margin-top:9mm;font-size:12pt;white-space:nowrap"><b style="color:${col};font-size:10.5pt;font-weight:700;letter-spacing:.04em;padding-right:4mm">많이 나온 유형</b>${types}</div>
    </div>${tabHtml}`);
}

// 속표지(본문 첫 쪽): 네온 MINIMAX + 책 종류·과목 + 브랜드. v: mm-data의 권
export function mmTitlePage(v, { uid = 't' } = {}) {
  return wrap(`${svgFull('', '')}
    ${neon(layout('MINIMAX', { s: 8, d: 9, wf: 1 }, 18), { cx: W / 2, y: 110, hMm: 28, glow: X5.cyan, id: `n${uid}` })}
    ${T(esc(v.kind), { x: 0, w: W, align: 'center', y: 152, size: 20, weight: 700, color: '#fff', ls: -0.01 })}
    ${T(esc(v.subject), { x: 0, w: W, align: 'center', y: 163, size: 13, weight: 300, color: X5.sub })}
    ${T('승민T 통합사회', { x: 0, w: W, align: 'center', y: 262, size: 10, weight: 700, color: '#fff', ls: 0.04 })}
    ${T('2028 수능 대비 · 2022 개정 교육과정', { x: 0, w: W, align: 'center', y: 270, size: 8.6, color: X5.sub })}`);
}

// 본문 빌드에 넣을 CSS: 간지 쪽은 머리글·쪽 번호를 숨기고, 표지와 같은 글꼴 변수를 쓴다
export const MM_DIV_CSS = `
.page-mmdiv .page-head, .page-mmdiv .page-foot, .page-mmsub .page-head, .page-mmsub .page-foot, .page-mmsub .edge-tab,
.page-mmtitle .page-head, .page-mmtitle .page-foot, .page-mmtitle .edge-tab { visibility: hidden; }
.page-mmdiv .mm-page, .page-mmsub .mm-page, .page-mmtitle .mm-page { --mm-sans: 'KoPubWorld Dotum'; }
.page-mmdiv .edge-tab { z-index: 3; }
.mm-page .abs { position: absolute; }
`;
