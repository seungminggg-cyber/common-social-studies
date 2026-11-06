// 정조준 시리즈 4차 시안 — 강사가 고른 3차 '1 조준경'을 바탕으로 한 후보 3개 (2026-11-06)
// 강사 요청: 글꼴을 이 디자인에 맞게(차분하지만 임팩트 있게), 문제집 본문 디자인과 어울리게.
//
// 본문(시안 H)과 맞춘 것: 대단원 색(밝은 판이 아니라 본문과 같은 색을 어두운 바탕용으로 조금 밝힘),
//   모서리 자른 네모(문항 번호 상자·쪽 번호와 같은 모양), 가는 괘선, 작은 글자는 KoPub 돋움, 엄지 색인 자리.
//
//   A 본문형  — 제목 KoPub 돋움 Bold(본문 머리 글꼴). 과녁 선을 대단원 색 다섯 묶음으로(바깥 Ⅰ → 안 Ⅴ), 오른쪽 끝 엄지 색인 Ⅰ~Ⅴ
//   B 명조형  — 제목 본명조 Bold. 과녁을 가운데에, 다섯 색이 이어지는 가는 결, 가운데 정렬
//   C 계기형  — 제목 IBM Plex Sans KR Bold. 흰 가는 선 위에 대단원 색 과녁 다섯 줄만 굵게 + Ⅰ~Ⅴ 표시, 눈금 숫자
import { CH, C, CUT, TITLE_FONTS, lift } from './tokens.js';
import { BRAND } from './series.js';
import { esc } from './sheet.js';
import { svg, bgRect, cutSq, T, WORD, blurb, backFoot, crosshair, ramp, f2, mm, TOTAL } from './v3.js';

const W = 210;
const NAVY = '#17193B', SUB = '#9EA3C0', RULE = '#3A3E66';
const UNIT = ['Ⅰ', 'Ⅱ', 'Ⅲ', 'Ⅳ', 'Ⅴ'];
const LIT = UNIT.map((k) => lift(CH[k], 0.3)); // 어두운 바탕에서 보이게 밝힌 대단원 색
const HOT = lift(CH['Ⅳ'], 0.12); // 과녁 한가운데·권 번호

const TITLE = (tf, o) => T('정조준', { ...o, font: tf.family, weight: tf.weight, size: +(o.size * tf.scale).toFixed(1), ls: tf.spacing ?? -0.03, lh: 1 });
const word = (v, tf, o) => WORD(v.word, { ...o, bg: '#fff', fg: NAVY, extra: `font-family:'${tf.box.family}';font-weight:${tf.box.weight};letter-spacing:${tf.box.spacing ?? 0.06}em;${o.extra || ''}` });
// 본문 머리처럼: 작은 네모 + 글자
const bullet = (s, o) => T(`<span style="display:inline-block;width:1.7mm;height:1.7mm;background:${o.mark || HOT};margin-right:2.4mm;vertical-align:.35mm"></span>${s}`, o);
// 모서리 자른 번호 상자(본문 문항 번호와 같은 모양)
const numBox = (no, { x, right, y, s = 19, bg = HOT, size = 21, font = 'KoPub Dotum' }) =>
  `<div class="abs cut" style="--cut:${mm(s * CUT)};${right != null ? `right:${mm(right)};` : `left:${mm(x)};`}top:${mm(y)};width:${mm(s)};height:${mm(s)};background:${bg};display:flex;align-items:center;justify-content:center;font-family:'${font}';font-weight:700;font-size:${size}pt;color:#fff;letter-spacing:-.02em">${esc(no)}</div>`;
// 아래쪽을 바탕색으로 서서히 덮어 제목 둘레를 조용하게(과녁 선·조준선이 제목 뒤에서 사라짐)
const FADE = `<linearGradient id="fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${NAVY}" stop-opacity="0"/><stop offset="1" stop-color="${NAVY}" stop-opacity=".93"/></linearGradient>`;
const fade = (y0 = 160, y1 = 212) => `<rect x="-3" y="${y0}" width="216" height="${y1 - y0}" fill="url(#fade)"/><rect x="-3" y="${y1}" width="216" height="${300 - y1}" fill="${NAVY}" fill-opacity=".93"/>`;
const footRule = (left, right, y = 272) => `<div class="abs" style="left:16mm;width:178mm;top:${mm(y)};border-top:.4pt solid ${RULE}"></div>
  ${T(left, { x: 16, y: y + 3, size: 8.4, color: SUB })}${T(right, { right: 16, y: y + 3, size: 8.4, color: SUB })}`;
// 엄지 색인(본문과 같은 자리: Ⅰ 38 · Ⅱ 68 · Ⅲ 98 · Ⅳ 128 · Ⅴ 158mm, 높이 26mm)
const tabs = () => UNIT.map((k, i) => `<div class="abs cut" style="--cut:1.2mm;left:${mm(W - 6.5)};top:${mm(38 + i * 30)};width:9.5mm;height:26mm;background:${lift(CH[k], 0.12)}"></div>
  <div class="abs edge" style="left:${mm(W - 6.5)};top:${mm(38 + i * 30)};width:6.5mm;height:26mm;display:flex;align-items:center;justify-content:center;font-family:'KoPub Batang';font-weight:700;font-size:10pt;color:#fff">${k}</div>`).join('');

// 과녁 선: mode 'band'(다섯 색 묶음) · 'ramp'(이어지는 색) · 'mono'(흰 가는 선)
function rings(cx, cy, { n, step, s0, w, mode, fade = 0.6 }) {
  let o = '';
  for (let i = n - 1; i >= 0; i--) {
    const t = i / (n - 1);
    const col = mode === 'band' ? LIT[Math.min(4, 4 - Math.floor((i / n) * 5))] : mode === 'ramp' ? ramp([...LIT].reverse(), t) : '#ffffff';
    const op = mode === 'mono' ? 0.24 - 0.16 * t : 1 - fade * t;
    o += `<polygon points="${cutSq(cx, cy, s0 + i * step)}" fill="none" stroke="${col}" stroke-width="${w}" stroke-opacity="${f2(op)}"/>`;
  }
  return o;
}
// C의 굵은 대단원 과녁 다섯 줄 + Ⅰ~Ⅴ 표시
function accents(cx, cy, s, w = 1.2) {
  return LIT.map((col, i) => {
    const size = s * (1 - i * 0.2), h = size / 2;
    return `<polygon points="${cutSq(cx, cy, size)}" fill="none" stroke="${col}" stroke-width="${w}"/>
      <text x="${f2(cx - h + 1.6)}" y="${f2(cy - h - 1.6)}" font-family="KoPub Batang" font-weight="700" font-size="3.4" fill="${col}">${UNIT[i]}</text>`;
  }).join('');
}
const scaleNums = (cx, cy, color) => [-40, -30, -20, -10, 10, 20, 30, 40].map((d) => `<text x="${cx + d}" y="${f2(cy + 5.6)}" text-anchor="middle" font-family="IBM Plex Sans KR" font-weight="700" font-size="2" fill="${color}" fill-opacity=".55">${Math.abs(d)}</text>`).join('');
const motto = (tf, o) => `<div class="abs" style="left:${mm(o.x)};top:${mm(o.y)};${o.w ? `width:${mm(o.w)};text-align:${o.align || 'left'};` : ''}font-family:'${tf.family}';font-weight:${tf.weight};font-size:${(o.size || 38) * tf.scale}pt;line-height:1.28;letter-spacing:${tf.spacing ?? -0.02}em;color:#fff">${BRAND.motto.map(esc).join('<br>')}</div>`;

// ───────── A 본문형 ─────────
function frontA(v, tf) {
  const cx = 122, cy = 106;
  return `${svg(`${bgRect(NAVY)}${rings(cx, cy, { n: 30, step: 9, s0: 9, w: 0.55, mode: 'band', fade: 0.55 })}${crosshair(cx, cy, '#fff', { gap: 7, op: 0.5 })}<polygon points="${cutSq(cx, cy, 6.4)}" fill="${HOT}"/>${fade()}`, FADE)}
  ${tabs()}
  ${T(esc(BRAND.name), { x: 16, y: 12, size: 10, weight: 700, color: '#fff', ls: 0.02 })}
  ${T('2028 수능 대비', { right: 16, y: 12, size: 9.5, weight: 500, color: SUB })}
  ${word(v, tf, { x: 16, y: 190 })}
  ${TITLE(tf, { x: 13.5, y: 205, size: 126, color: '#fff' })}
  ${bullet(esc(v.sub), { x: 16, y: 254, size: 14, weight: 700, color: '#fff' })}
  ${T(esc(v.subject), { x: 20.1, y: 262.5, size: 11.5, weight: 300, color: SUB })}
  ${numBox(v.no, { right: 16, y: 206 })}
  ${blurb(v, { x: 146, y: 232, w: 48, color: SUB, size: 6.4 })}
  ${footRule('2022 개정 교육과정', `정조준 시리즈 ${esc(v.no)} / ${TOTAL}`)}`;
}
function backA(v, tf) {
  const cx = 34, cy = 50;
  return `${svg(`${bgRect(NAVY)}${rings(cx, cy, { n: 20, step: 9, s0: 9, w: 0.55, mode: 'band', fade: 0.7 })}${crosshair(cx, cy, '#fff', { gap: 7, op: 0.35, ticks: 20 })}<polygon points="${cutSq(cx, cy, 6.4)}" fill="${HOT}"/>`)}
  ${motto(tf, { x: 16, y: 132 })}
  ${backFoot({ fg: '#fff' })}`;
}

// ───────── B 명조형 ─────────
function frontB(v, tf) {
  const cx = 105, cy = 102;
  return `${svg(`${bgRect(NAVY)}${rings(cx, cy, { n: 42, step: 7, s0: 8, w: 0.38, mode: 'ramp', fade: 0.62 })}${crosshair(cx, cy, '#fff', { gap: 6, op: 0.45, ticks: 30 })}<polygon points="${cutSq(cx, cy, 5.6)}" fill="${HOT}"/>${fade(158, 206)}`, FADE)}
  ${T(esc(BRAND.name), { x: 16, y: 12, size: 10, weight: 700, color: '#fff', ls: 0.02 })}
  ${T(`<span style="font-family:'KoPub Batang';font-weight:500;font-size:22pt;color:${HOT};vertical-align:-1.6mm">${esc(v.no)}</span><span style="padding-left:1.6mm">/ ${TOTAL}</span>`, { right: 16, y: 13, size: 8.4, color: SUB })}
  <div class="abs" style="left:0;width:${W}mm;top:192mm;display:flex;justify-content:center">${word(v, tf, { x: 0, y: 0, extra: 'position:relative' })}</div>
  ${TITLE(tf, { x: 0, w: W, align: 'center', y: 207, size: 128, color: '#fff' })}
  <div class="abs" style="left:97mm;width:16mm;top:255mm;border-top:.8pt solid ${HOT}"></div>
  ${T(esc(v.sub), { x: 0, w: W, align: 'center', y: 259, size: 13.5, weight: 500, color: '#fff' })}
  ${T(esc(v.subject), { x: 0, w: W, align: 'center', y: 267, size: 11, weight: 300, color: SUB })}
  ${footRule('2028 수능 대비', '2022 개정 교육과정', 276)}`;
}
function backB(v, tf) {
  const cx = 105, cy = 70;
  return `${svg(`${bgRect(NAVY)}${rings(cx, cy, { n: 18, step: 7, s0: 8, w: 0.38, mode: 'ramp', fade: 0.7 })}${crosshair(cx, cy, '#fff', { gap: 6, op: 0.3, ticks: 20 })}<polygon points="${cutSq(cx, cy, 5.6)}" fill="${HOT}"/>`)}
  ${motto(tf, { x: 0, w: W, align: 'center', y: 150, size: 34 })}
  ${backFoot({ fg: '#fff' })}`;
}

// ───────── C 계기형 ─────────
function frontC(v, tf) {
  const cx = 120, cy = 106;
  return `${svg(`${bgRect(NAVY)}${rings(cx, cy, { n: 44, step: 7, s0: 8, w: 0.3, mode: 'mono' })}${crosshair(cx, cy, '#fff', { gap: 0, op: 0.55, ticks: 45 })}${scaleNums(cx, cy, '#fff')}${accents(cx, cy, 150)}<polygon points="${cutSq(cx, cy, 7)}" fill="${HOT}"/>${fade(176, 214)}`, FADE)}
  ${T(esc(BRAND.name), { x: 16, y: 12, size: 10, weight: 700, color: '#fff', ls: 0.02, font: tf.family })}
  ${T('2028 수능 대비', { right: 16, y: 12, size: 9.5, weight: 500, color: SUB })}
  ${word(v, tf, { x: 16, y: 190 })}
  ${TITLE(tf, { x: 13.5, y: 205, size: 124, color: '#fff' })}
  ${T(esc(v.sub), { x: 16, y: 254, size: 14, weight: 700, color: '#fff', font: tf.family })}
  ${T(esc(v.subject), { x: 16, y: 262.5, size: 11.5, weight: 300, color: SUB })}
  ${T(esc(v.no), { right: 15, y: 203, size: 60, weight: 700, color: HOT, font: tf.family, lh: 1, ls: -0.03 })}
  ${T(`정조준 시리즈 / ${TOTAL}`, { right: 16, y: 227, size: 8, color: SUB })}
  ${blurb(v, { x: 146, y: 238, w: 48, color: SUB, size: 6.4 })}
  ${footRule('2022 개정 교육과정', `대단원 ${UNIT.map((k, i) => `<span style="color:${LIT[i]};font-weight:700">${k}</span>`).join(' ')}`)}`;
}
function backC(v, tf) {
  const cx = 46, cy = 58;
  return `${svg(`${bgRect(NAVY)}${rings(cx, cy, { n: 20, step: 7, s0: 8, w: 0.3, mode: 'mono' })}${crosshair(cx, cy, '#fff', { op: 0.4, ticks: 25 })}${accents(cx, cy, 64, 0.8)}<polygon points="${cutSq(cx, cy, 5)}" fill="${HOT}"/>`)}
  ${motto(tf, { x: 16, y: 132 })}
  ${backFoot({ fg: '#fff' })}`;
}

export const V4 = {
  A: { name: '본문형', font: 'dotum', front: frontA, back: backA },
  B: { name: '명조형', font: 'noto7', front: frontB, back: backB },
  C: { name: '계기형', font: 'plex', front: frontC, back: backC },
};
export function face4(k, side, v, font) {
  const d = V4[k];
  return `<section class="sheet" style="background:${NAVY}"><div class="t" style="overflow:visible">${d[side](v, TITLE_FONTS[font || d.font])}</div></section>`;
}

// 5차 시안(v5.js)이 다시 쓰는 조각
export { NAVY, SUB, HOT, LIT, UNIT, rings, tabs, word, bullet, numBox, footRule, fade, FADE };
