// 정조준 시리즈 7차 시안 — 제목 자리를 바꾼 후보 5개 (강사 2026-11-06: "글자가 꼭 왼쪽 아래에 있지 않았으면.
// 세로로 써질 수도 있고. 훨씬 더 유니크하게, 일타강사 시안처럼.")
// 바탕(남색 조준경)과 블록 레터링은 그대로 두고 구성만 바꾼다. 위치는 재단선 기준 mm.
//
//   P1 세로 기둥 — 오른쪽에 세로로 쌓은 큰 제목, 과녁은 왼쪽 위
//   P2 과녁 안   — 표지 전체가 과녁, 한가운데 틈에 제목이 가로로 박힘(조준선이 제목을 지남)
//   P3 넘침     — 제목이 표지보다 커서 왼쪽·오른쪽이 잘림, 과녁은 글자 틈으로 보임
//   P4 대각선   — 제목을 11° 기울여 왼쪽 위에서 오른쪽 아래로 흐르게, 아래에 사선 띠
//   P5 가운데 세로 — 세로 제목을 한가운데에, 과녁 한가운데 = '정'의 과녁 ㅇ (조준선이 표지를 넷으로 나눔)
import { CUT } from './tokens.js';
import { BRAND } from './series.js';
import { esc } from './sheet.js';
import { svg, bgRect, cutSq, T, blurb, backFoot, crosshair, TOTAL, mm } from './v3.js';
import { NAVY, SUB, HOT, LIT, UNIT, RULE, rings, tabs, word, bullet, numBox, footRule, fade, FADE } from './v4.js';
import { wordmark, wordmarkStacked } from './lettering.js';

const W = 210, H = 297;
const TF = { box: { family: 'KoPub Dotum', weight: 700 } };
const mark = (o) => { const m = wordmark({ style: 'block', color: '#fff', bg: NAVY, hot: HOT, ...o }); return { ...m, html: (x, y, extra = '') => `<div class="abs" style="left:${mm(x - m.padMm)};top:${mm(y)};${extra}">${m.svg}</div>` }; };
const stacked = (o) => { const m = wordmarkStacked({ style: 'block', color: '#fff', bg: NAVY, hot: HOT, ...o }); return { ...m, html: (x, y, extra = '') => `<div class="abs" style="left:${mm(x)};top:${mm(y)};${extra}">${m.svg}</div>` }; };
// 세로쓰기 작은 글자
const vtext = (s, { x, y, size, weight = 500, color = '#fff', ls = 0.08, from = 'top' }) =>
  `<div class="abs" style="left:${mm(x)};${from === 'bottom' ? `bottom:${mm(y)}` : `top:${mm(y)}`};writing-mode:vertical-rl;text-orientation:mixed;font-family:'KoPub Dotum';font-size:${size}pt;font-weight:${weight};color:${color};letter-spacing:${ls}em;line-height:1;white-space:nowrap">${s}</div>`;
const top = (v, { light = true } = {}) => `${T(esc(BRAND.name), { x: 16, y: 12, size: 10, weight: 700, color: '#fff', ls: 0.02 })}${T('2028 수능 대비', { right: 16, y: 12, size: 9.5, weight: 500, color: SUB })}`;

// ───── P1 세로 기둥 ─────
function p1(v) {
  const cx = 78, cy = 96;
  const m = stacked({ wMm: 56, gap: 9 });
  const x = W - 16 - 56;
  return `${svg(`${bgRect(NAVY)}${rings(cx, cy, { n: 26, step: 9, s0: 9, w: 0.55, mode: 'band', fade: 0.55 })}${crosshair(cx, cy, '#fff', { gap: 7, op: 0.5 })}<polygon points="${cutSq(cx, cy, 6.4)}" fill="${HOT}"/>
    <rect x="${x - 10}" y="-3" width="${W - x + 13}" height="303" fill="${NAVY}" fill-opacity=".86"/>`)}
  ${top(v)}
  ${word(v, TF, { x: x + 2, y: 30 })}
  ${m.html(x, 48)}
  ${numBox(v.no, { x: x + 2, y: 48 + m.hMm + 8, s: 17, size: 18 })}
  ${vtext(`정조준 시리즈 / ${TOTAL}`, { x: x + 24, y: 48 + m.hMm + 8, size: 7.6, color: SUB })}
  ${bullet(esc(v.sub), { x: 16, y: 236, size: 13, weight: 700, color: '#fff' })}
  ${T(esc(v.subject), { x: 20.1, y: 244, size: 11, weight: 300, color: SUB })}
  ${blurb(v, { x: 16, y: 253, w: 76, color: SUB, size: 6.4 })}
  ${footRule('2022 개정 교육과정', `정조준 시리즈 ${esc(v.no)} / ${TOTAL}`)}`;
}

// ───── P2 과녁 안 ─────
function p2(v) {
  const cx = 105, cy = 150;
  const m = mark({ wMm: 150 });
  const y = cy - m.hMm / 2 + 2;
  // 제목이 앉을 자리만 바탕색으로 비우고, 그 위아래로 과녁 선이 이어진다
  return `${svg(`${bgRect(NAVY)}${rings(cx, cy, { n: 40, step: 9, s0: 9, w: 0.55, mode: 'band', fade: 0.5 })}${crosshair(cx, cy, '#fff', { gap: 0, op: 0.45, ticks: 0 })}
    <rect x="-3" y="${y - 12}" width="216" height="${m.hMm + 24}" fill="${NAVY}" fill-opacity=".94"/>
    <line x1="-3" y1="${y - 12}" x2="213" y2="${y - 12}" stroke="#fff" stroke-opacity=".35" stroke-width=".3"/><line x1="-3" y1="${y + m.hMm + 12}" x2="213" y2="${y + m.hMm + 12}" stroke="#fff" stroke-opacity=".35" stroke-width=".3"/>`)}
  ${top(v)}
  <div class="abs" style="left:0;width:${W}mm;top:${mm(y - 24)};text-align:center">${word(v, TF, { x: 0, y: 0, extra: 'position:relative;display:inline-flex' })}</div>
  ${m.html((W - 150) / 2 + m.padMm, y)}
  ${T(esc(v.sub), { x: 0, w: W, align: 'center', y: y + m.hMm + 16, size: 13.5, weight: 700, color: '#fff' })}
  ${T(esc(v.subject), { x: 0, w: W, align: 'center', y: y + m.hMm + 24, size: 11, weight: 300, color: SUB })}
  ${numBox(v.no, { right: 16, y: 258, s: 17, size: 18 })}
  ${vtext(`정조준 시리즈 / ${TOTAL}`, { x: 16, y: 16, size: 7.6, color: SUB, from: 'bottom' })}
  ${footRule('2022 개정 교육과정', '', 276)}`;
}

// ───── P3 넘침 ─────
function p3(v) {
  const cx = 150, cy = 92;
  const m = mark({ wMm: 262 }); // 표지보다 넓게 → 좌우가 조금 잘림
  return `${svg(`${bgRect(NAVY)}${rings(cx, cy, { n: 34, step: 9, s0: 9, w: 0.55, mode: 'band', fade: 0.5 })}${crosshair(cx, cy, '#fff', { gap: 7, op: 0.5 })}<polygon points="${cutSq(cx, cy, 6.4)}" fill="${HOT}"/>${fade(120, 170)}`, FADE)}
  <div class="abs" style="left:0;top:0;width:${W}mm;height:${H}mm;overflow:hidden">${m.html(-24, 152)}</div>
  ${top(v)}
  ${word(v, TF, { x: 16, y: 130 })}
  ${numBox(v.no, { right: 16, y: 128, s: 19 })}
  ${bullet(esc(v.sub), { x: 16, y: 256, size: 14, weight: 700, color: '#fff' })}
  ${T(esc(v.subject), { x: 20.1, y: 264.5, size: 11.5, weight: 300, color: SUB })}
  ${blurb(v, { x: 128, y: 252, w: 66, color: SUB, size: 6.4 })}
  ${footRule('2022 개정 교육과정', `정조준 시리즈 ${esc(v.no)} / ${TOTAL}`, 276)}`;
}

// ───── P4 대각선 ─────
function p4(v) {
  const cx = 118, cy = 118, ang = -11;
  const m = mark({ wMm: 164 });
  const band = (y0, h, col, op) => `<polygon points="-3,${y0} 213,${y0 - 42} 213,${y0 - 42 + h} -3,${y0 + h}" fill="${col}" fill-opacity="${op}"/>`;
  return `${svg(`${bgRect(NAVY)}${rings(cx, cy, { n: 30, step: 9, s0: 9, w: 0.55, mode: 'band', fade: 0.55 })}${crosshair(cx, cy, '#fff', { gap: 7, op: 0.45 })}<polygon points="${cutSq(cx, cy, 6.4)}" fill="${HOT}"/>
    ${band(214, 92, NAVY, 0.9)}${LIT.map((c, i) => band(217 + i * 1.6, 0.9, c, 0.9)).join('')}`)}
  ${top(v)}
  <div class="abs" style="left:0;top:0;width:${W}mm;height:${H}mm;transform:rotate(${ang}deg);transform-origin:105mm 160mm">
    ${word(v, TF, { x: 22, y: 118 })}
    ${m.html(20, 133)}
  </div>
  ${T(esc(v.no), { right: 16, y: 236, size: 54, weight: 700, color: HOT, font: 'KoPub Dotum', lh: 1, ls: -0.04 })}
  ${T(`정조준 시리즈 / ${TOTAL}`, { right: 16, y: 258, size: 8, color: SUB })}
  ${bullet(esc(v.sub), { x: 16, y: 246, size: 14, weight: 700, color: '#fff' })}
  ${T(esc(v.subject), { x: 20.1, y: 254.5, size: 11.5, weight: 300, color: SUB })}
  ${footRule('2022 개정 교육과정', esc(BRAND.name), 276)}`;
}

// ───── P5 가운데 세로 ─────
function p5(v) {
  const m = stacked({ wMm: 64, gap: 10 });
  const x = (W - 64) / 2, y = 60;
  // '정'의 과녁 ㅇ 위치(글자 높이 100 기준 cx 49, cy 83 → mm)
  const k = 64 / 108; // viewBox 108 → 64mm
  const ox = x + (4 + (100 - 99) / 2 + 49) * k, oy = y + (4 + 83) * k;
  return `${svg(`${bgRect(NAVY)}${rings(ox, oy, { n: 44, step: 9, s0: 12, w: 0.55, mode: 'band', fade: 0.5 })}${crosshair(ox, oy, '#fff', { gap: 0, op: 0.5, ticks: 0 })}
    <rect x="${x - 9}" y="${y - 24}" width="${64 + 18}" height="${m.hMm + 34}" fill="${NAVY}" fill-opacity=".88"/>`)}
  ${m.html(x, y)}
  ${vtext(esc(BRAND.name), { x: 14, y: 14, size: 10, weight: 700 })}
  ${vtext('2028 수능 대비', { x: 21.5, y: 14, size: 9, weight: 500, color: SUB })}
  ${vtext(`정조준 시리즈 / ${TOTAL}`, { x: W - 24, y: 16, size: 8, color: SUB, from: 'bottom' })}
  <div class="abs" style="left:0;width:${W}mm;top:${mm(y - 19)};text-align:center">${word(v, TF, { x: 0, y: 0, extra: 'position:relative;display:inline-flex' })}</div>
  ${numBox(v.no, { right: 16, y: 14, s: 19 })}
  ${T(esc(v.sub), { x: 0, w: W, align: 'center', y: 258, size: 13.5, weight: 700, color: '#fff' })}
  ${T(esc(v.subject), { x: 0, w: W, align: 'center', y: 266, size: 11, weight: 300, color: SUB })}
  ${footRule('2022 개정 교육과정', esc(BRAND.name), 276)}`;
}

export const V7 = { P1: '세로 기둥', P2: '과녁 안', P3: '넘침', P4: '대각선', P5: '가운데 세로' };
const FN = { P1: p1, P2: p2, P3: p3, P4: p4, P5: p5 };
export function face7(k, v) {
  return `<section class="sheet" style="background:${NAVY}"><div class="t" style="overflow:visible">${FN[k](v)}</div></section>`;
}
