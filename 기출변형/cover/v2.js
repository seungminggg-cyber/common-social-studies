// 정조준 시리즈 2차 시안 (강사 의견 2026-11-06: A·C가 낫다, 회색 바탕 싫음, 일타강사 교재처럼 시선을 끌게, 제목 글꼴 ①KoPub 바탕 · ③본명조)
//
// 한 가지만 강하게: 과녁. 흰 종이 위에 아주 큰 제목과 큰 과녁, 나머지(작은 글자·괘선)는 조용하게.
//   A2 '선 과녁'   — 굵은 다섯 색 선 과녁 + 아주 큰 제목 + 아래 먹 띠
//   C2 '색면 과녁' — 다섯 색 면 과녁을 크게 + 아주 큰 제목 + 아래 먹 띠
//   F  '과녁 액자' — 표지 전체가 과녁: 다섯 색 띠가 표지를 둘러싸고, 한가운데(흰 판)에 제목
// 면마다 앞표지·뒷표지·책등·대단원 간지·과목 간지를 같은 문법으로 만든다.
// 위치는 모두 재단선 기준 mm(0,0 = 재단선 왼쪽 위). 도련은 -3mm까지 칠한다.
import { GROUND, RINGS, CH, C, lift, CUT, TITLE_FONTS, BLEED } from './tokens.js';
import { SERIES_TOTAL, BRAND, VOLUMES, shortName } from './series.js';
import { target, cutSquare } from './target.js';
import { esc, wordBox } from './sheet.js';

const W = 210, H = 297, B = BLEED;
const two = (n) => String(n).padStart(2, '0');
const TOTAL = two(SERIES_TOTAL);
const mm = (v) => `${+v.toFixed(2)}mm`;

// ── 공통 조각 ──
const bg = (color) => `<div class="abs" style="left:-${B}mm;top:-${B}mm;right:-${B}mm;bottom:-${B}mm;background:${color}"></div>`;
const text = (s, { x = 0, y, w, align = 'left', size, weight = 400, color, font = 'sans', ls = 0, lh = 1.2, right, extra = '' }) => {
  const pos = right != null ? `right:${mm(right)};` : `left:${mm(x)};`;
  const fam = font === 'serif' ? "font-family:'KoPub Batang';" : font === 'sans' ? '' : `font-family:'${font}';`;
  return `<div class="abs ${font === 'sans' ? 'sans' : ''}" style="${pos}top:${mm(y)};${w != null ? `width:${mm(w)};` : ''}text-align:${align};${fam}font-size:${size}pt;font-weight:${weight};color:${color};letter-spacing:${ls}em;line-height:${lh};white-space:nowrap;${extra}">${s}</div>`;
};
const rule = (x, y, w, color, t = 0.4) => `<div class="abs" style="left:${mm(x)};top:${mm(y)};width:${mm(w)};border-top:${t}pt solid ${color}"></div>`;
// 제목 '정조준'
const title = (tf, { y, size, color, x = 0, w = W, align = 'center' }) =>
  `<div class="abs" style="left:${mm(x)};top:${mm(y)};width:${mm(w)};text-align:${align};font-family:'${tf.family}';font-weight:${tf.weight};font-size:${(size * tf.scale).toFixed(1)}pt;line-height:1;letter-spacing:${tf.spacing ?? -0.02}em;color:${color};white-space:nowrap">정조준</div>`;
const box = (v, g, tf, o = {}) => wordBox(esc(v.word), { bg: g.boxBg, fg: g.boxFg, font: tf.box, h: o.h || 15, size: o.size || 24, pad: o.pad || 5.6 });
const at = (x, y, w, h, inner, extra = '') => `<div class="abs" style="left:${mm(x)};top:${mm(y)};width:${mm(w)};height:${mm(h)};${extra}">${inner}</div>`;
// 모서리 자른 네모(채움)
const cutBox = (x, y, w, h, color, extra = '') => `<div class="abs cut" style="--cut:${mm(Math.min(w, h) * CUT)};left:${mm(x)};top:${mm(y)};width:${mm(w)};height:${mm(h)};background:${color};${extra}"></div>`;

// 바탕별 과녁 색
function ringSet(g, mode) {
  if (!g.dark) return { colors: RINGS, center: C.ink };
  return mode === 'fill' ? { colors: RINGS.map((c) => lift(c, 0.1)), center: C.onDark } : { colors: RINGS.map((c) => lift(c, 0.4)), center: C.onDark };
}

// ── 과녁 액자(F): 재단선 상자 안쪽으로 b씩 들어간 모서리 자른 네모를 겹친다 ──
// colors: 바깥 띠부터(첫 색은 도련까지 칠함), panel: 가운데 판 색, mirror: 자른 모서리를 왼쪽 위로(뒷표지)
function frame({ colors, panel, b = 6.5, cut1 = 36, gap = 0.9, gapColor = '#fff', mirror = false, w = W, h = H, edges = { l: 1, r: 1, t: 1, b: 1 } }) {
  const shapes = [];
  const n = colors.length;
  const poly = (k) => {
    const ins = (side) => (edges[side] ? k * b : k === 0 ? -B : k * b - b * 0); // 띠를 두르지 않는 쪽(책등 쪽)은 그대로
    const x0 = edges.l ? k * b : -B, y0 = k * b, x1 = edges.r ? w - k * b : w + B, y1 = h - k * b;
    if (k === 0) return `${-B},${-B} ${w + B},${-B} ${w + B},${h + B} ${-B},${h + B}`;
    const c = cut1 - (k - 1) * b * (2 - Math.SQRT2);
    void ins;
    return mirror
      ? `${x0 + c},${y0} ${x1},${y0} ${x1},${y1} ${x0},${y1} ${x0},${y0 + c}`
      : `${x0},${y0} ${x1 - c},${y0} ${x1},${y0 + c} ${x1},${y1} ${x0},${y1}`;
  };
  for (let k = 0; k <= n; k++) {
    const fill = k < n ? colors[k] : panel;
    shapes.push(`<polygon points="${poly(k)}" fill="${fill}"${k > 0 && gap ? ` stroke="${gapColor}" stroke-width="${gap}" stroke-linejoin="miter"` : ''}/>`);
  }
  return `<svg class="abs" style="left:-${B}mm;top:-${B}mm;width:${w + 2 * B}mm;height:${h + 2 * B}mm" viewBox="${-B} ${-B} ${w + 2 * B} ${h + 2 * B}">${shapes.join('')}</svg>`;
}
const FB = 7.5; // 액자 띠 폭
const panelBox = (k = 5) => ({ x: k * FB, y: k * FB, w: W - 2 * k * FB, h: H - 2 * k * FB });

// ── 앞표지 ──
function frontLarge(v, g, tf, mode) {
  const r = ringSet(g, mode);
  const fill = mode === 'fill';
  const T = fill ? { x: 25, y: 19, s: 160 } : { x: 28, y: 22, s: 154 };
  const tBottom = T.y + T.s * (518 / 520);
  const svg = fill ? target({ ...r, mode: 'fill', gap: 6, bg: g.bg }) : target({ ...r, stroke: g.dark ? 8 : 7 });
  const ty = tBottom + 10; // 제목 위치(모든 권 같음)
  return `${bg(g.bg)}
  ${text(esc(BRAND.name), { x: 16, y: 11, size: 10, weight: 700, color: g.fg, ls: 0.02 })}
  ${text('2028 수능 대비', { right: 16, y: 11, size: 10, weight: 500, color: g.sub })}
  ${at(T.x, T.y, T.s, T.s, svg)}
  <div class="abs" style="left:0;width:${W}mm;top:${mm(tBottom - 7.5)};text-align:center">${box(v, g, tf)}</div>
  ${title(tf, { y: ty, size: 150, color: g.fg })}
  ${rule(97, ty + 60, 16, g.fg, 0.9)}
  ${text(esc(v.sub), { x: 0, w: W, align: 'center', y: ty + 65, size: 15.5, weight: 500, color: g.fg })}
  ${text(esc(v.subject), { x: 0, w: W, align: 'center', y: ty + 74, size: 12, weight: 300, color: g.sub })}
  <div class="abs" style="left:-${B}mm;right:-${B}mm;top:272mm;bottom:-${B}mm;background:${g.band}"></div>
  ${text('2022 개정 교육과정', { x: 16, y: 280.5, size: 9, weight: 500, color: g.bandFg })}
  ${text(`정조준 시리즈 <b style="font-weight:700">${esc(v.no)}</b> <span style="color:${g.bandSub}">/ ${TOTAL}</span>`, { right: 16, y: 280.5, size: 9, weight: 500, color: g.bandFg })}`;
}

function frontFrame(v, g, tf) {
  const P = panelBox();
  const cx = W / 2;
  const fg = g.fg;
  const bull = 20;
  return `${frame({ colors: RINGS, panel: g.bg, gapColor: C.white, b: FB })}
  ${text(esc(BRAND.name), { x: P.x + 10, y: P.y + 10, size: 10, weight: 700, color: fg, ls: 0.02 })}
  ${text('2028 수능 대비', { x: P.x + 10, y: P.y + 16, size: 9, weight: 500, color: g.sub })}
  ${cutBox(cx - bull / 2, 86, bull, bull, g.dark ? C.onDark : C.ink)}
  <div class="abs" style="left:0;width:${W}mm;top:124mm;text-align:center">${box(v, g, tf)}</div>
  ${title(tf, { y: 143, size: 124, color: fg })}
  ${rule(cx - 8, 195, 16, fg, 0.9)}
  ${text(esc(v.sub), { x: 0, w: W, align: 'center', y: 200, size: 15, weight: 500, color: fg })}
  ${text(esc(v.subject), { x: 0, w: W, align: 'center', y: 208.5, size: 12, weight: 300, color: g.sub })}
  ${rule(P.x + 10, P.y + P.h - 19, P.w - 20, g.rule, 0.4)}
  ${text('2022 개정 교육과정', { x: P.x + 10, y: P.y + P.h - 16, size: 8.6, color: g.sub })}
  ${text(`정조준 시리즈 <b style="font-weight:700;color:${fg}">${esc(v.no)}</b> / ${TOTAL}`, { right: W - P.x - P.w + 10, y: P.y + P.h - 16, size: 8.6, color: g.sub })}`;
}

// ── 뒷표지 ── full: 설명 2줄·시리즈 순서까지 (시안 4 그대로), 아니면 최소(문장 3줄 + 맨 아래 줄만)
const SERIES_LINE = () => {
  const seen = new Set();
  return VOLUMES.filter((x) => !seen.has(x.no) && seen.add(x.no));
};
function seriesList(v, g, { x, y, align = 'left', w }) {
  const items = SERIES_LINE().map((x) => {
    const name = `${x.no} ${esc(x.word)} 정조준${x.no === '02' ? ' 기본편' : x.no === '03' ? ' 심화편' : ''}`;
    return x.no === v.no ? `<b style="font-weight:700;color:${g.fg}">${name}</b>` : name;
  });
  const half = Math.ceil(items.length / 2);
  return `<div class="abs sans" style="left:${mm(x)};top:${mm(y)};${w ? `width:${mm(w)};` : ''}text-align:${align};font-size:8.8pt;line-height:1.75;color:${g.sub}">${items.slice(0, half).join('<span style="padding:0 2.2mm;color:' + g.rule + '">|</span>')}<br>${items.slice(half).join('<span style="padding:0 2.2mm;color:' + g.rule + '">|</span>')}</div>`;
}
const DESC = ['기출 문항이 묻는 방식은 그대로 살리고,', '문장과 자료는 모두 새로 썼습니다.'];
const isbnBox = (x, y, g) => `<div class="abs sans" style="left:${mm(x)};top:${mm(y)};width:44mm;height:24mm;background:#fff;border:.5pt solid ${g.dark ? '#fff' : C.ink};display:flex;align-items:center;justify-content:center;font-size:8pt;color:${C.sub}">[ISBN·바코드]</div>`;

function backLarge(v, g, tf, mode, full) {
  const r = ringSet(g, mode);
  const svg = mode === 'fill' ? target({ ...r, mode: 'fill', gap: 10, bg: g.bg }) : target({ ...r, stroke: 12 });
  return `${bg(g.bg)}
  ${text(esc(shortName(v)), { x: 16, y: 11, size: 9, weight: 500, color: g.sub })}
  ${text(esc(BRAND.name), { right: 16, y: 11, size: 9, weight: 700, color: g.fg })}
  ${at(16, 40, 36, 36, svg)}
  <div class="abs" style="left:16mm;top:92mm;font-family:'${tf.family}';font-weight:${tf.weight};font-size:${(44 * tf.scale).toFixed(1)}pt;line-height:1.26;letter-spacing:-.01em;color:${g.fg}">${BRAND.motto.map(esc).join('<br>')}</div>
  ${full ? `<div class="abs sans" style="left:16mm;top:156mm;font-size:11pt;font-weight:300;line-height:1.7;color:${g.fg}">${DESC.join('<br>')}</div>${seriesList(v, g, { x: 16, y: 178 })}` : ''}
  ${isbnBox(W - 16 - 44, 242, g)}
  <div class="abs" style="left:-${B}mm;right:-${B}mm;top:272mm;bottom:-${B}mm;background:${g.band}"></div>
  ${text(`<b style="font-weight:700">${esc(BRAND.name)}</b><span style="color:${g.bandSub};padding-left:3mm">${esc(BRAND.contact)}</span>`, { x: 16, y: 280.5, size: 9, weight: 500, color: g.bandFg })}
  ${text('[정가 또는 비매품]', { right: 16, y: 280.5, size: 9, weight: 500, color: g.bandFg })}`;
}

function backFrame(v, g, tf, full) {
  const P = panelBox();
  return `${frame({ colors: RINGS, panel: g.bg, gapColor: C.white, mirror: true, b: FB })}
  ${text(esc(shortName(v)), { right: W - P.x - P.w + 10, y: P.y + 10, size: 9, weight: 500, color: g.sub })}
  ${cutBox(P.x + 10, 66, 9, 9, g.dark ? C.onDark : C.ink)}
  <div class="abs" style="left:${mm(P.x + 10)};top:82mm;font-family:'${tf.family}';font-weight:${tf.weight};font-size:${(38 * tf.scale).toFixed(1)}pt;line-height:1.26;letter-spacing:-.01em;color:${g.fg}">${BRAND.motto.map(esc).join('<br>')}</div>
  ${full ? `<div class="abs sans" style="left:${mm(P.x + 10)};top:140mm;font-size:10.5pt;font-weight:300;line-height:1.7;color:${g.fg}">${DESC.join('<br>')}</div>${seriesList(v, g, { x: P.x + 10, y: 160, w: P.w - 20 })}` : ''}
  ${isbnBox(P.x + P.w - 10 - 44, P.y + P.h - 52, g)}
  ${rule(P.x + 10, P.y + P.h - 19, P.w - 20, g.rule, 0.4)}
  ${text(`<b style="font-weight:700;color:${g.fg}">${esc(BRAND.name)}</b>`, { x: P.x + 10, y: P.y + P.h - 16, size: 8.6, color: g.sub })}
  ${text(esc(BRAND.contact), { x: P.x + 10, y: P.y + P.h - 11, size: 8.2, color: g.sub })}
  ${text('[정가 또는 비매품]', { right: W - P.x - P.w + 10, y: P.y + P.h - 16, size: 8.6, color: g.sub })}`;
}

// ── 책등 (폭 S mm) ──
function spine(v, g, tf, design, S) {
  const frameD = design === 'F';
  const sbg = frameD ? RINGS[0] : g.dark ? C.onDark : C.ink;
  const fg = frameD ? C.white : g.dark ? C.ink : C.white;
  const sub = frameD ? lift(RINGS[0], 0.6, '#ffffff') : g.dark ? C.sub : C.onDarkSub;
  const fs = Math.min(21, (S - 3) / 0.353); // 글자 크기(pt): 책등 폭 - 여백 3mm
  const small = Math.min(8.6, fs * 0.45);
  const mt = Math.min(S - 3.5, 7); // 맨 위 작은 과녁
  const mini = frameD ? target({ colors: [C.white, C.white, C.white], center: C.white, stroke: 26 }) : target({ colors: RINGS.map((c) => (g.dark ? c : lift(c, 0.25, '#ffffff'))), center: fg, mode: 'fill', gap: 22, bg: sbg });
  // 세로쓰기: 글자를 바로 세우고(upright) 위에서 아래로 쌓는다
  const vt = (s, size, weight, color, family = "'KoPub Dotum'", ls = 0.02) => `<div style="writing-mode:vertical-rl;text-orientation:upright;font-family:${family};font-size:${size}pt;font-weight:${weight};color:${color};letter-spacing:${ls}em;line-height:1;white-space:nowrap">${s}</div>`;
  const col = (top, inner, gap = 3, bottom = false) => `<div class="abs" style="left:0;width:${mm(S)};${bottom ? `bottom:${mm(top)}` : `top:${mm(top)}`};display:flex;flex-direction:column;align-items:center;gap:${gap}mm">${inner}</div>`;
  const subj = v.subject.replace(' + 통합사회', '·');
  return `<div class="abs" style="left:0;top:-${B}mm;width:${mm(S)};bottom:-${B}mm;background:${sbg}"></div>
  ${at((S - mt) / 2, 12, mt, mt, mini)}
  ${col(26, `${vt(esc(v.word), small * 1.15, 700, sub)}${vt('정조준', fs, tf.weight, fg, `'${tf.family}'`, 0.02)}${vt(esc((v.sub.split('·')[1] || v.sub).trim()), small * 1.1, 500, fg)}`, 3.2)}
  ${col(136, vt(esc(subj), small, 300, sub, "'KoPub Dotum'", 0.04))}
  ${col(13, `<div style="font-family:'KoPub Batang';font-weight:700;font-size:${Math.min(13, fs * 0.8)}pt;color:${fg};line-height:1">${esc(v.no)}</div>${vt(esc(BRAND.name), small, 700, fg)}`, 4, true)}`;
}

// ── 대단원 간지 (홀수 쪽) ──
// 엄지 색인: 10자리, 위 = 150 + k×82px(시안 4) → mm. 폭 48px·높이 78px
const PX = 25.4 / 96;
export const TAB = { top: (k) => (150 + k * 82) * PX, w: 48 * PX, h: 78 * PX };
function thumb(ch, color, fg = '#fff') {
  const t = TAB.top(ch.k);
  return `<div class="abs" style="left:${mm(W - TAB.w)};top:${mm(t)};width:${mm(TAB.w + B)};height:${mm(TAB.h)};background:${color}"></div>
  <div class="abs edge" style="left:${mm(W - TAB.w)};top:${mm(t)};width:${mm(TAB.w - 1)};height:${mm(TAB.h)};display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1mm;color:${fg};line-height:1">
    <span style="font-family:'KoPub Batang';font-weight:700;font-size:15pt">${ch.no}</span><span class="sans" style="font-size:6.4pt;font-weight:500;opacity:.85">통합${ch.subject.slice(-1)}</span></div>`;
}
function unitTable(ch, col, { x, y, w }) {
  const head = `<tr><th style="text-align:left">중단원</th><th>문항 번호</th><th>문항 수</th></tr>`;
  const rows = ch.units.map((u) => `<tr><td style="text-align:left"><b style="color:${col};font-weight:700;padding-right:2.4mm">${u.no}</b>${esc(u.title)}</td><td>${u.range}</td><td>${u.count}</td></tr>`).join('');
  const sum = `<tr class="sum"><td style="text-align:left">단원 합계</td><td></td><td>${ch.total}</td></tr>`;
  return `<table class="abs sans ut" style="left:${mm(x)};top:${mm(y)};width:${mm(w)};--col:${col}">${head}${rows}${sum}</table>`;
}
export const DIVIDER_CSS = `
.ut { border-collapse: collapse; font-size: 10.6pt; color: ${C.ink}; }
.ut th { font-weight: 700; font-size: 8.8pt; color: ${C.sub}; padding: 0 0 2.2mm; border-bottom: 1.2pt solid var(--col); text-align: right; }
.ut td { padding: 4.2mm 0; border-bottom: .4pt solid #cfcac4; text-align: right; font-variant-numeric: tabular-nums; }
.ut th:nth-child(2), .ut td:nth-child(2) { width: 30mm; } .ut th:nth-child(3), .ut td:nth-child(3) { width: 20mm; }
.ut tr.sum td { border-bottom: 0; border-top: .9pt solid ${C.ink}; font-weight: 700; }
`;
function record(col, { x, y, w }) {
  const gapX = 5, bw = (w - 2 * gapX) / 3;
  return ['1회독', '2회독', '오답 다시 풀기'].map((t, i) => `<div class="abs cut sans" style="--cut:3mm;left:${mm(x + i * (bw + gapX))};top:${mm(y)};width:${mm(bw)};height:24mm;background:${col}"></div>
    <div class="abs cut sans" style="--cut:2.6mm;left:${mm(x + i * (bw + gapX) + 0.5)};top:${mm(y + 0.5)};width:${mm(bw - 1)};height:23mm;background:#fff;padding:3mm 3.4mm;font-size:8.8pt">
      <b style="font-weight:700;color:${col}">${t}</b>
      <div style="position:absolute;left:3.4mm;right:3.4mm;bottom:3.6mm;display:flex;justify-content:space-between;color:${C.sub};font-size:8.2pt"><span>월&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;일</span><span>맞은 수&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;/ ${''}</span></div></div>`).join('');
}

function divider(ch, v, tf, design) {
  const col = CH[ch.no];
  const head = `${text(esc(ch.subject), { x: 16, y: 11, size: 9, weight: 700, color: C.ink })}${text(esc(shortName(v)), { right: 22, y: 11, size: 9, weight: 500, color: C.sub })}`;
  const body = (y0) => `${unitTable(ch, col, { x: 22, y: y0, w: 160 })}
    <div class="abs sans" style="left:22mm;top:${mm(y0 + 21 + ch.units.length * 13.4 + 12)};width:160mm;border-top:.4pt solid ${C.ink};border-bottom:.4pt solid ${C.ink};padding:3.6mm 0;font-size:10.4pt;color:${C.ink}"><b style="font-weight:700;color:${col};padding-right:4mm">기출 포인트</b>${esc(ch.point)}</div>
    ${record(col, { x: 22, y: 236, w: 160 })}`;
  if (design === 'F') {
    // 단원 색 3겹 액자 + 흰 판 (액자 아래쪽 띠는 짧게)
    const tints = [col, lift(col, 0.45, '#ffffff'), lift(col, 0.75, '#ffffff')];
    return `${bg('#fff')}
    <div class="abs" style="left:0;top:0;width:${W}mm;height:112mm;overflow:visible">${frame({ colors: tints, panel: '#fff', b: 6.5, cut1: 30, h: 112, gap: 0.9, edges: { l: 1, r: 1, t: 1, b: 1 } })}</div>
    ${text(esc(ch.subject), { x: 29.5, y: 30, size: 9.5, weight: 700, color: col })}
    ${text(`대단원 ${ch.no}`, { x: 29.5, y: 36, size: 9.5, weight: 500, color: C.sub })}
    ${text(ch.no, { right: 32, y: 26, size: 64, weight: 700, color: col, font: 'serif', lh: 1 })}
    <div class="abs" style="left:29.5mm;top:58mm;width:120mm;font-family:'${tf.family}';font-weight:${tf.weight};font-size:${(34 * tf.scale).toFixed(1)}pt;line-height:1.18;letter-spacing:-.02em;color:${C.ink}">${esc(ch.title)}</div>
    ${body(126)}${thumb(ch, col)}`;
  }
  // A2 · C2: 왼쪽 위 단원 색 과녁 3겹(안쪽 채움 + 흰 로마 숫자)
  const fill = design === 'C2';
  const tg = fill
    ? target({ colors: [lift(col, 0.72, '#ffffff'), lift(col, 0.4, '#ffffff'), col], center: null, mode: 'fill', gap: 8, bg: '#fff', numeral: ch.no, numeralColor: '#fff' })
    : target({ colors: [col, col, col], center: null, stroke: 9 }).replace('</svg>', `<polygon points="${cutSquare(1 / 3)}" fill="${col}"/><text x="258" y="262" text-anchor="middle" dominant-baseline="central" fill="#fff" font-family="KoPub Batang" font-weight="700" font-size="92">${ch.no}</text></svg>`);
  return `${bg('#fff')}${head}
  ${at(22, 28, 70, 70, tg)}
  ${text(`대단원 ${ch.no}`, { x: 100, y: 36, size: 11, weight: 700, color: col })}
  <div class="abs" style="left:100mm;top:44mm;width:82mm;font-family:'${tf.family}';font-weight:${tf.weight};font-size:${(34 * tf.scale).toFixed(1)}pt;line-height:1.18;letter-spacing:-.02em;color:${C.ink}">${esc(ch.title)}</div>
  ${text(`${ch.units.length}개 중단원 · ${ch.total}문항`, { x: 100, y: 88, size: 10, weight: 300, color: C.sub })}
  ${rule(22, 110, 160, C.ink, 1.2)}
  ${body(122)}${thumb(ch, col)}`;
}

// ── 과목 간지 (통합사회1 / 통합사회2 시작 쪽) ──
function subjectDivider(subject, chs, v, tf, design) {
  const g = GROUND.ink;
  const list = chs.map((ch, i) => `<div class="abs" style="left:0;top:${mm(i * 16.5)};width:100%;display:flex;align-items:center;gap:5mm;border-bottom:.4pt solid #3a3f45;height:16.5mm">
      <span class="cut" style="--cut:1.8mm;flex:none;width:10mm;height:10mm;background:${lift(CH[ch.no], 0.12)};display:flex;align-items:center;justify-content:center;font-family:'KoPub Batang';font-weight:700;font-size:13pt;color:#fff">${ch.no}</span>
      <span style="flex:1;font-family:'${tf.family}';font-weight:${tf.weight};font-size:${(15 * tf.scale).toFixed(1)}pt;color:${g.fg}">${esc(ch.title)}</span>
      <span class="sans" style="font-size:9pt;color:${g.sub}">${ch.units.map((u) => u.no).join(' · ')}</span>
      <span class="sans" style="width:16mm;text-align:right;font-size:9.5pt;color:${g.fg}">${ch.total}문항</span></div>`).join('');
  const sum = chs.reduce((a, c) => a + c.total, 0);
  const deco = design === 'F'
    ? frame({ colors: RINGS.map((c) => lift(c, 0.1)), panel: g.bg, gapColor: g.bg, b: FB })
    : `${bg(g.bg)}${at(96, -40, 150, 150, design === 'C2' ? target({ colors: RINGS.map((c) => lift(c, 0.1)), center: C.onDark, mode: 'fill', gap: 6, bg: g.bg }) : target({ colors: RINGS.map((c) => lift(c, 0.4)), center: C.onDark, stroke: 7 }))}`;
  const P = design === 'F' ? panelBox() : { x: 0, y: 0, w: W, h: H };
  const L = P.x + (design === 'F' ? 10 : 22);
  const Rw = (design === 'F' ? P.w - 20 : W - 44);
  return `${deco}
  ${text(esc(shortName(v)), { x: L, y: design === 'F' ? P.y + 10 : 11, size: 9, weight: 500, color: g.sub })}
  <div class="abs" style="left:${mm(L)};top:${design === 'F' ? 108 : 122}mm;font-family:'${tf.family}';font-weight:${tf.weight};font-size:${(design === 'F' ? 50 : 64) * tf.scale}pt;line-height:1;letter-spacing:-.02em;color:${g.fg}">${esc(subject)}</div>
  ${text(`대단원 ${chs.length}개 · 단원별 ${sum}문항`, { x: L, y: design === 'F' ? 130 : 148, size: 10.5, weight: 300, color: g.sub })}
  <div class="abs" style="left:${mm(L)};top:${design === 'F' ? 146 : 168}mm;width:${mm(Rw)};height:${mm(chs.length * 16.5)};border-top:.9pt solid ${g.fg}">${list}</div>`;
}

// ── 내보내기 ──
export const DESIGNS = { A2: '선 과녁', C2: '색면 과녁', F: '과녁 액자' };
const face = (inner, gbg) => `<section class="sheet" style="background:${gbg}"><div class="t">${inner}</div></section>`;

export function front2(v, design, font = 'kopub') {
  const g = GROUND[v.ground], tf = TITLE_FONTS[font];
  return face(design === 'F' ? frontFrame(v, g, tf) : frontLarge(v, g, tf, design === 'C2' ? 'fill' : 'line'), g.bg);
}
export function back2(v, design, font = 'kopub', full = false) {
  const g = GROUND[v.ground], tf = TITLE_FONTS[font];
  return face(design === 'F' ? backFrame(v, g, tf, full) : backLarge(v, g, tf, design === 'C2' ? 'fill' : 'line', full), g.bg);
}
// 펼침면: 뒷표지 + 책등 + 앞표지 (재단선 기준 폭 = 210×2 + S)
export function spread2(v, design, S, font = 'kopub', full = false) {
  const g = GROUND[v.ground], tf = TITLE_FONTS[font];
  const backInner = design === 'F' ? backFrame(v, g, tf, full) : backLarge(v, g, tf, design === 'C2' ? 'fill' : 'line', full);
  const frontInner = design === 'F' ? frontFrame(v, g, tf) : frontLarge(v, g, tf, design === 'C2' ? 'fill' : 'line');
  return `<section class="sheet" style="background:${g.bg}"><div class="t">
    <div class="abs" style="left:0;top:0;width:${W}mm;height:${H}mm">${backInner}</div>
    <div class="abs" style="left:${mm(W + S)};top:0;width:${W}mm;height:${H}mm">${frontInner}</div>
    <div class="abs" style="left:${mm(W)};top:0;width:${mm(S)};height:${H}mm">${spine(v, g, tf, design, S)}</div>
    <div class="abs guide" style="left:${mm(W)};top:-${B}mm;bottom:-${B}mm;width:0;border-left:.2pt dashed transparent"></div>
  </div></section>`;
}
export function divider2(ch, v, design, font = 'kopub') {
  return face(divider(ch, v, TITLE_FONTS[font], design), '#fff');
}
export function subject2(subject, chs, v, design, font = 'kopub') {
  return face(subjectDivider(subject, chs, v, TITLE_FONTS[font], design), GROUND.ink.bg);
}
