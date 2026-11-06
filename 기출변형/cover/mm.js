// MINIMAX 시리즈 앞표지·뒷표지 (강사 요청 2026-11-07)
//
// 원칙: 괘선 위주, 차분하고 묵직하게. 그라데이션·그림자·일러스트·둥근 모서리 없음.
//       로고 하나에 단정한 바탕 — 보는 순간 MINIMAX가 먼저 읽힌다.
//       로고는 모든 권에서 같은 자리·같은 크기(폭 178mm에 맞춰 build가 글자 크기를 정함, data-fit).
// 콘셉트
//   A 보수 행렬 — 가는 괘선 격자(4×5) 위에 안장점 한 칸만 모서리 자른 네모로 채움(그 칸 = 행의 최솟값이자 열의 최댓값)
//   B 굵기 대비 — MIN은 가늘게, MAX는 굵게(로고 자체가 '최소 → 최대'), MIN 아래 가는 선 · MAX 아래 굵은 선
//   C 겹친 네모 — 같은 중심의 모서리 자른 네모 5개, 안쪽부터 Ⅰ~Ⅴ 단원 색, 가장 작은 네모 = MIN · 가장 큰 네모 = MAX
// 위치는 재단선 기준 mm. 바탕은 도련(-3mm)까지 칠한다.
import { C, CH, CUT, BLEED, lift } from './tokens.js';
import { MM, mmName, mmSeries } from './mm-data.js';
import { esc } from './sheet.js';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const W = 210, H = 297, B = BLEED, M = 16; // M = 좌우 여백
const LW = W - 2 * M; // 로고 폭 178mm
const mm = (v) => `${+(+v).toFixed(2)}mm`;
const UNIT = ['Ⅰ', 'Ⅱ', 'Ⅲ', 'Ⅳ', 'Ⅴ'];

// ── 바탕별 색 ──
export const MM_GROUND = {
  paper: { bg: C.paper, fg: C.ink, sub: C.sub, rule: C.ink, faint: '#B9B4AA', inv: C.paper, dark: false },
  gray: { bg: C.paperGray, fg: C.ink, sub: C.sub, rule: C.ink, faint: '#A9A396', inv: C.paperGray, dark: false },
  ink: { bg: C.inkBg, fg: C.onDark, sub: C.onDarkSub, rule: C.onDarkSub, faint: '#4A4E55', inv: C.inkBg, dark: true },
};
const unitCol = (g, i) => (g.dark ? lift(CH[UNIT[i]], 0.3) : CH[UNIT[i]]);

// ── 로고 글꼴 (모두 출판물 무료: KoPub=한국출판인회의 약관, Archivo·IBM Plex=SIL OFL 1.1) ──
// ramp: B안에서 M·I·N·I·M·A·X 글자마다 쓰는 굵기(MIN 가늘게 → MAX 굵게)
const NM = join(dirname(fileURLToPath(import.meta.url)), '../../textbook/node_modules/@fontsource');
export const LOGO_FONTS = {
  kopub: { label: 'KoPub 돋움 Bold', family: 'KoPub Dotum', bold: 700, ramp: [300, 300, 300, 500, 700, 700, 700], ls: -0.01 },
  archivo: { label: 'Archivo (SIL OFL)', family: 'MM Archivo', bold: 800, ramp: [100, 200, 300, 500, 700, 800, 900], ls: -0.015, files: (w) => `${NM}/archivo/files/archivo-latin-${w}-normal.woff2`, weights: [100, 200, 300, 500, 700, 800, 900] },
  plex: { label: 'IBM Plex Sans (SIL OFL)', family: 'MM Plex', bold: 700, ramp: [200, 200, 300, 500, 700, 700, 700], ls: -0.02, files: (w) => `${NM}/ibm-plex-sans-kr/files/ibm-plex-sans-kr-latin-${w}-normal.woff2`, weights: [200, 300, 500, 700] },
};
export const MM_CSS = Object.values(LOGO_FONTS).filter((f) => f.files).flatMap((f) => f.weights.map((w) => `@font-face{font-family:'${f.family}';font-weight:${w};src:url('file://${f.files(w)}') format('woff2');}`)).join('\n');

// ── 조각 ──
const T = (s, o) => `<div class="abs" style="${o.right != null ? `right:${mm(o.right)};` : `left:${mm(o.x ?? M)};`}top:${mm(o.y)};${o.w ? `width:${mm(o.w)};` : ''}text-align:${o.align || 'left'};font-family:'${o.font || 'KoPub Dotum'}';font-size:${o.size}pt;font-weight:${o.weight || 400};color:${o.color};letter-spacing:${o.ls || 0}em;line-height:${o.lh || 1.25};white-space:nowrap">${s}</div>`;
const cutPoly = (x, y, w, h, k = CUT) => { const c = Math.min(w, h) * k; return `${x},${y} ${x + w - c},${y} ${x + w},${y + c} ${x + w},${y + h} ${x},${y + h}`; };
const svgFull = (inner) => `<svg class="abs" style="left:-${B}mm;top:-${B}mm;width:${W + 2 * B}mm;height:${H + 2 * B}mm" viewBox="${-B} ${-B} ${W + 2 * B} ${H + 2 * B}" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
const bg = (g) => `<rect x="${-B}" y="${-B}" width="${W + 2 * B}" height="${H + 2 * B}" fill="${g.bg}"/>`;

// 로고: 폭 LW에 맞춤(data-fit). mode 'solid' | 'ramp'
function logo(g, lf, mode = 'solid') {
  const letters = [...'MINIMAX'];
  const inner = mode === 'ramp'
    ? `<span class="mm-min" style="font-weight:${lf.ramp[0]}">${letters.slice(0, 3).map((ch, i) => `<span style="font-weight:${lf.ramp[i]}">${ch}</span>`).join('')}</span><span style="font-weight:${lf.ramp[3]}">I</span><span class="mm-max">${letters.slice(4).map((ch, i) => `<span style="font-weight:${lf.ramp[4 + i]}">${ch}</span>`).join('')}</span>`
    : 'MINIMAX';
  return `<span data-fit="${LW}" style="display:inline-block;font-family:'${lf.family}';font-weight:${lf.bold};font-size:30mm;line-height:.76;letter-spacing:${lf.ls}em;color:${g.fg};white-space:nowrap">${inner}</span>`;
}
// 위쪽 줄: 브랜드(왼쪽) + 권 번호 상자(오른쪽, 모서리 자른 네모)
const topRow = (v, g) => `${T(esc(MM.brand), { y: 13, size: 9.5, weight: 700, color: g.fg, ls: 0.02 })}
  <div class="abs" style="right:${mm(M)};top:10mm;display:flex;align-items:flex-end;gap:1.8mm">
    <div class="cut" style="--cut:${mm(11 * CUT)};width:11mm;height:11mm;background:${g.fg};color:${g.inv};display:flex;align-items:center;justify-content:center;font-family:'KoPub Dotum';font-weight:700;font-size:14pt;letter-spacing:-.02em">${esc(v.no)}</div>
    <div style="font-family:'KoPub Dotum';font-size:8.6pt;color:${g.sub};line-height:1;padding-bottom:.4mm">/ ${MM.total}</div></div>`;
// 로고 아래 글자 묶음
const titleBlock = (v, g, lf, y, mode) => `<div class="abs" style="left:${mm(M)};top:${mm(y)};width:${mm(LW)}">
    <div style="line-height:0">${logo(g, lf, mode)}</div>
    <div style="display:flex;justify-content:space-between;align-items:baseline;margin-top:4.2mm">
      <div style="font-family:'KoPub Dotum';font-weight:700;font-size:16pt;color:${g.fg};letter-spacing:-.01em">${esc(v.kind)}</div>
      <div style="font-family:'KoPub Dotum';font-weight:500;font-size:9.5pt;color:${g.sub};letter-spacing:.32em;margin-right:-.32em">${esc(MM.reading)}</div></div>
    <div style="font-family:'KoPub Dotum';font-weight:300;font-size:12pt;color:${g.sub};margin-top:1.6mm">${esc(v.subject)}</div></div>`;
const bottomRow = (g) => `<div class="abs" style="left:${mm(M)};width:${mm(LW)};top:272mm;border-top:.4pt solid ${g.rule}"></div>
  ${T(esc(MM.exam), { y: 275, size: 8.6, color: g.sub })}`;

// ── A 보수 행렬 ──
// 4×5 행렬. 안장점 (2행, 3열) = 6: 2행의 최솟값이면서 3열의 최댓값 → maximin = minimax = 6
export const PAYOFF = [[9, 2, 5, 8, 3], [7, 8, 6, 9, 7], [4, 9, 3, 6, 8], [8, 1, 5, 2, 9]];
export const SADDLE = [1, 2];
function matrixSvg(g, { x, y, w, h, numSize, lw = 0.35, numbers = true }) {
  const R = PAYOFF.length, Cn = PAYOFF[0].length, cw = w / Cn, ch = h / R;
  let o = '';
  for (let r = 0; r <= R; r++) o += `<line x1="${x}" y1="${y + r * ch}" x2="${x + w}" y2="${y + r * ch}" stroke="${g.fg}" stroke-width="${lw}"/>`;
  for (let c = 0; c <= Cn; c++) o += `<line x1="${x + c * cw}" y1="${y}" x2="${x + c * cw}" y2="${y + h}" stroke="${g.fg}" stroke-width="${lw}"/>`;
  const [sr, sc] = SADDLE, pad = Math.min(cw, ch) * 0.1;
  o += `<polygon points="${cutPoly(x + sc * cw + pad, y + sr * ch + pad, cw - 2 * pad, ch - 2 * pad)}" fill="${g.fg}"/>`;
  if (numbers) PAYOFF.forEach((row, r) => row.forEach((n, c) => {
    const on = r === sr && c === sc;
    o += `<text x="${x + c * cw + cw / 2}" y="${y + r * ch + ch / 2}" text-anchor="middle" dominant-baseline="central" font-family="KoPub Dotum" font-weight="${on ? 700 : 300}" font-size="${on ? numSize * 1.25 : numSize}" fill="${on ? g.inv : g.sub}">${n}</text>`;
  }));
  return o;
}
function frontA(v, g, lf) {
  return `${svgFull(bg(g) + matrixSvg(g, { x: M, y: 34, w: LW, h: 136, numSize: 7.4 }))}
  ${topRow(v, g)}${titleBlock(v, g, lf, 186)}${bottomRow(g)}`;
}

// ── B 굵기 대비 ──
// MIN 아래 가는 선, MAX 아래 굵은 선(로고 맞춤 뒤 글자 폭에 맞춰 build가 그림: data-under)
function frontB(v, g, lf) {
  // 왼쪽 위: 작은 네모 일곱 개가 커지는 줄(MIN → MAX), 바닥선을 맞춤
  const sizes = [2.4, 4.4, 6.4, 8.6, 10.8, 13, 15.4];
  let x = M, sq = '';
  for (const s of sizes) { sq += `<polygon points="${cutPoly(x, 128 - s, s, s)}" fill="${g.fg}"/>`; x += s + 3.2; }
  return `${svgFull(bg(g) + sq)}
  ${topRow(v, g)}
  <div class="abs" style="left:${mm(M)};top:140mm;width:${mm(LW)}">
    <div style="line-height:0;position:relative">${logo(g, lf, 'ramp')}</div>
    <div data-under="min" style="height:0;border-top:.6pt solid ${g.fg};margin-top:4mm;width:0"></div>
    <div data-under="max" style="height:0;border-top:4.2pt solid ${g.fg};margin-top:-2.2pt;width:0"></div>
  </div>
  ${titleBlockLower(v, g, 192)}${bottomRow(g)}`;
}
const titleBlockLower = (v, g, y) => `<div class="abs" style="left:${mm(M)};top:${mm(y)};width:${mm(LW)}">
    <div style="display:flex;justify-content:space-between;align-items:baseline">
      <div style="font-family:'KoPub Dotum';font-weight:700;font-size:16pt;color:${g.fg};letter-spacing:-.01em">${esc(v.kind)}</div>
      <div style="font-family:'KoPub Dotum';font-weight:500;font-size:9.5pt;color:${g.sub};letter-spacing:.32em;margin-right:-.32em">${esc(MM.reading)}</div></div>
    <div style="font-family:'KoPub Dotum';font-weight:300;font-size:12pt;color:${g.sub};margin-top:1.6mm">${esc(v.subject)}</div></div>`;

// ── C 겹친 네모 ──
// 강사가 준 꼭짓점(viewBox 0 0 520 520, 바깥 → 안). 안쪽부터 Ⅰ~Ⅴ 색: 가장 안 = Ⅰ, 가장 바깥 = Ⅴ
const NEST = [
  '2,2 425,2 518,95 518,518 2,518', '52,52 393,52 468,127 468,468 52,468', '104,104 360,104 416,160 416,416 104,416',
  '156,156 327,156 364,193 364,364 156,364', '208,208 293,208 312,227 312,312 208,312',
];
const NEST_CENTER = '240,240 273,240 280,247 280,280 240,280';
function nestSvg(g, { x, y, size, sw = 10, labels = true }) {
  const k = size / 520;
  const rings = NEST.map((p, i) => `<polygon points="${p}" fill="none" stroke="${unitCol(g, 4 - i)}" stroke-width="${sw}" stroke-linejoin="miter"/>`).join('');
  const lab = labels
    ? `<text x="260" y="297" text-anchor="middle" font-family="KoPub Dotum" font-weight="700" font-size="10" fill="${unitCol(g, 0)}" letter-spacing="1">MIN</text>
       <text x="${2 + 22}" y="${518 - 20}" font-family="KoPub Dotum" font-weight="700" font-size="15" fill="${unitCol(g, 4)}" letter-spacing="1.5">MAX</text>`
    : '';
  return `<g transform="translate(${x} ${y}) scale(${k})">${rings}<polygon points="${NEST_CENTER}" fill="${g.fg}"/>${lab}</g>`;
}
function frontC(v, g, lf) {
  const size = 146;
  return `${svgFull(bg(g) + nestSvg(g, { x: (W - size) / 2, y: 30, size }))}
  ${topRow(v, g)}${titleBlock(v, g, lf, 194)}${bottomRow(g)}`;
}

// ── 뒷표지 ──
function seriesLines(v, g) {
  const items = mmSeries().map((x) => {
    const s = `${x.no} ${esc(x.short)}`;
    return x.no === v.no ? `<b style="font-weight:700;color:${g.fg}">${s}</b>` : s;
  });
  const sep = `<span style="color:${g.faint};padding:0 2.2mm">|</span>`;
  return `${items.slice(0, 4).join(sep)}<br>${items.slice(4).join(sep)}`;
}
function backGraphic(concept, g) {
  if (concept === 'A') return matrixSvg(g, { x: M, y: 34, w: 60, h: 40, numSize: 3.4, lw: 0.3 });
  if (concept === 'B') {
    const sizes = [1.6, 2.9, 4.2, 5.6, 7, 8.4, 10];
    let x = M, o = '';
    for (const s of sizes) { o += `<polygon points="${cutPoly(x, 60 - s, s, s)}" fill="${g.fg}"/>`; x += s + 2.1; }
    return o;
  }
  return nestSvg(g, { x: M, y: 30, size: 46, sw: 14, labels: false });
}
function back(v, g, concept, mottoNo) {
  const mt = MM.motto[mottoNo];
  const mottoHtml = `${mt.label ? `<div style="font-family:'KoPub Dotum';font-weight:700;font-size:11pt;color:${g.fg};margin-bottom:4mm;display:flex;align-items:center;gap:2.4mm"><span class="cut" style="--cut:.4mm;display:inline-block;width:2.2mm;height:2.2mm;background:${g.fg}"></span>${esc(mt.label)}</div>` : ''}
    <div style="font-family:'KoPub Batang';font-weight:700;font-size:${mt.lines.length > 2 ? 30 : 34}pt;line-height:1.3;letter-spacing:-.02em;color:${g.fg}">${mt.lines.map(esc).join('<br>')}</div>`;
  return `${svgFull(bg(g) + backGraphic(concept, g))}
  ${T(esc(mmName(v)), { y: 13, size: 9, weight: 500, color: g.sub })}
  ${T(esc(MM.brand), { right: M, y: 13, size: 9.5, weight: 700, color: g.fg, ls: 0.02 })}
  <div class="abs" style="left:${mm(M)};top:96mm;width:${mm(LW)}">
    ${mottoHtml}
    <div style="font-family:'KoPub Dotum';font-weight:300;font-size:10.5pt;line-height:1.7;color:${g.fg};margin-top:10mm">${MM.desc.map(esc).join('<br>')}</div>
    <div style="font-family:'KoPub Dotum';font-weight:500;font-size:8.4pt;color:${g.sub};margin-top:5mm">${esc(MM.meaning)}</div>
  </div>
  <div class="abs" style="left:${mm(M)};top:214mm;font-family:'KoPub Dotum';font-size:8.6pt;line-height:1.85;color:${g.sub}">${seriesLines(v, g)}</div>
  <div class="abs" style="right:${mm(M)};top:240mm;width:44mm;height:24mm;background:#fff;outline:.4pt solid ${g.dark ? '#fff' : g.fg};display:flex;align-items:center;justify-content:center;font-family:'KoPub Dotum';font-size:8pt;color:${C.sub}">${esc(MM.isbn)}</div>
  <div class="abs" style="left:${mm(M)};width:${mm(LW)};top:272mm;border-top:.4pt solid ${g.rule}"></div>
  ${T(`<b style="font-weight:700;color:${g.fg}">${esc(MM.brand)}</b><span style="padding-left:3mm">${esc(MM.contact)}</span>`, { y: 275, size: 8.6, color: g.sub })}
  ${T(esc(MM.price), { right: M, y: 275, size: 8.6, color: g.sub })}`;
}

export const MM_CONCEPTS = { A: '보수 행렬', B: '굵기 대비', C: '겹친 네모' };
const FRONT = { A: frontA, B: frontB, C: frontC };
const sheet = (g, inner) => `<section class="sheet" style="background:${g.bg}"><div class="t">${inner}</div></section>`;
export function mmFront(v, concept, font = 'kopub') {
  const g = MM_GROUND[v.ground];
  return sheet(g, FRONT[concept](v, g, LOGO_FONTS[font]));
}
export function mmBack(v, concept, mottoNo = 1) {
  const g = MM_GROUND[v.ground];
  return sheet(g, back(v, g, concept, mottoNo));
}
