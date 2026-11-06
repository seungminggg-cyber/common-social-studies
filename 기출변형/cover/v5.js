// 정조준 시리즈 5차 시안 — 4차 'A 본문형'에 직접 그린 제목 레터링(lettering.js)을 넣은 후보 3개 (2026-11-06)
// 강사 요청: "A가 가장 낫지만 글꼴이 마음에 안 든다. 글꼴도 텍스트로 만들지 말고 새롭게 디자인해서 임팩트 있게."
//
//   L1 블록   — 굵은 기하 글자, 가로획 끝 오른쪽 위를 45°로 자름, '정'의 ㅇ = 과녁
//   L2 조준선 — L1 + 글자 허리를 가로지르는 조준선(바탕색 틈 + 가는 선이 표지 끝까지)
//   L3 기울임 — L1을 앞으로 11° 기울여 속도감
import { TITLE_FONTS } from './tokens.js';
import { BRAND } from './series.js';
import { esc } from './sheet.js';
import { svg, bgRect, cutSq, T, blurb, backFoot, crosshair, TOTAL } from './v3.js';
import { NAVY, SUB, HOT, rings, tabs, word, bullet, numBox, footRule, fade, FADE } from './v4.js';
import { wordmark } from './lettering.js';

const STYLES = { L1: 'block', L2: 'slit', L3: 'italic' };
const mark = (style, { x, y, w }) => {
  const m = wordmark({ style, color: '#fff', bg: NAVY, hot: HOT, wMm: w });
  return { html: `<div class="abs" style="left:${x - m.padMm}mm;top:${y}mm">${m.svg}</div>`, h: m.hMm };
};

function front(v, style) {
  const tf = TITLE_FONTS.dotum;
  const cx = 122, cy = 104;
  const m = mark(style, { x: 15, y: 202, w: 142 });
  return `${svg(`${bgRect(NAVY)}${rings(cx, cy, { n: 30, step: 9, s0: 9, w: 0.55, mode: 'band', fade: 0.55 })}${crosshair(cx, cy, '#fff', { gap: 7, op: 0.5 })}<polygon points="${cutSq(cx, cy, 6.4)}" fill="${HOT}"/>${fade(156, 200)}`, FADE)}
  ${tabs()}
  ${T(esc(BRAND.name), { x: 16, y: 12, size: 10, weight: 700, color: '#fff', ls: 0.02 })}
  ${T('2028 수능 대비', { right: 16, y: 12, size: 9.5, weight: 500, color: SUB })}
  ${word(v, tf, { x: 16, y: 186 })}
  ${m.html}
  ${bullet(esc(v.sub), { x: 16, y: 257, size: 14, weight: 700, color: '#fff' })}
  ${T(esc(v.subject), { x: 20.1, y: 265, size: 11.5, weight: 300, color: SUB })}
  ${numBox(v.no, { right: 16, y: 204 })}
  ${blurb(v, { x: 163, y: 229, w: 31, color: SUB, size: 6.2 })}
  ${footRule('2022 개정 교육과정', `정조준 시리즈 ${esc(v.no)} / ${TOTAL}`, 275)}`;
}
function back(v, style) {
  const cx = 34, cy = 50;
  const m = mark(style, { x: 16, y: 120, w: 64 });
  return `${svg(`${bgRect(NAVY)}${rings(cx, cy, { n: 20, step: 9, s0: 9, w: 0.55, mode: 'band', fade: 0.7 })}${crosshair(cx, cy, '#fff', { gap: 7, op: 0.35, ticks: 20 })}<polygon points="${cutSq(cx, cy, 6.4)}" fill="${HOT}"/>${fade(96, 118)}`, FADE)}
  ${m.html}
  <div class="abs" style="left:16mm;top:${120 + m.h + 10}mm;font-family:'KoPub Dotum';font-weight:500;font-size:22pt;line-height:1.45;letter-spacing:-.01em;color:#fff">${BRAND.motto.map(esc).join('<br>')}</div>
  ${backFoot({ fg: '#fff' })}`;
}

export const V5 = { L1: '블록', L2: '조준선', L3: '기울임' };
export function face5(k, side, v) {
  const inner = side === 'front' ? front(v, STYLES[k]) : back(v, STYLES[k]);
  return `<section class="sheet" style="background:${NAVY}"><div class="t" style="overflow:visible">${inner}</div></section>`;
}
