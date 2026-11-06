// '정조준' 레터링 — 글꼴이 아니라 도형으로 직접 그린 제목 글자 (강사 요청 2026-11-06)
//
// 뼈대(획 목록) 하나를 여러 방식으로 그린다. 좌표 단위: 글자 높이 100, 세 글자 너비 합 313.
//  · 가로획 끝의 오른쪽 위 모서리는 45°로 자른다(문제집 상징 '모서리 자른 네모'와 같은 방향).
//  · '정'의 받침 ㅇ = 과녁(모서리 깎은 팔각 고리 + 한가운데 주황 네모). 네모 고리는 ㅁ으로 읽혀서('점조준') 쓰지 않는다.
//  · 6차(강사: '정'이 가장 작아 보인다): '정'을 조·준과 같은 너비(99)로, ㅈ·ㅇ을 키움.
//
// style
//   block   블록 — 굵기가 고른 기하 글자
//   slit    조준선 — block + 글자 허리를 가로지르는 틈과 가는 선
//   italic  기울임 — block을 앞으로 11°
//   stencil 스텐실 — 획이 만나는 곳을 끊고, ㅇ을 네 조각(조준경 눈금처럼)
//   multi   다중선 — 획마다 가는 선 세 줄(표지의 과녁 선과 같은 결)
//   hicon   고대비 — 굵은 세로획 + 아주 가는 가로획, 타원 ㅇ
//   stack   입체 — 대단원 다섯 색 층을 뒤로 쌓은 흰 글자
import { CH as UNITC, lift } from './tokens.js';

const SV = 19; // 세로획 굵기
const SH = 16; // 가로획 굵기(눈으로 볼 때 세로획과 같아 보이게 조금 가늘게)
const CUTL = 10; // 모서리 자름 길이
const LIT = ['Ⅰ', 'Ⅱ', 'Ⅲ', 'Ⅳ', 'Ⅴ'].map((k) => lift(UNITC[k], 0.3));

const P = (pts) => pts.map((p) => p.map((v) => +v.toFixed(2)).join(',')).join(' ');
const rectPts = (x, y, w, h, cut = 0) => (cut ? [[x, y], [x + w - cut, y], [x + w, y + cut], [x + w, y + h], [x, y + h]] : [[x, y], [x + w, y], [x + w, y + h], [x, y + h]]);
const oct = (cx, cy, w, h, k = 0.32) => { const a = w / 2, b = h / 2, c = Math.min(w, h) * k; return [[cx - a + c, cy - b], [cx + a - c, cy - b], [cx + a, cy - b + c], [cx + a, cy + b - c], [cx + a - c, cy + b], [cx - a + c, cy + b], [cx - a, cy + b - c], [cx - a, cy - b + c]]; };
const cutSq = (cx, cy, s) => { const h = s / 2, c = s * 0.18; return [[cx - h, cy - h], [cx + h - c, cy - h], [cx + h, cy - h + c], [cx + h, cy + h], [cx - h, cy + h]]; };

// ── 뼈대 ──
// h: 가로획 {x,y,w,h,cut}, v: 세로획, leg: ㅈ 다리 {ax(꼭짓점), ay, fx0, fx1(발), fy}, o: 받침 ㅇ {cx,cy,w,h,ring}
function jieut(x0, w, h) {
  const ax = x0 + w / 2;
  return [
    { t: 'h', x: x0, y: 0, w, h: SH, cut: 1 },
    { t: 'leg', side: 'L', ax, ay: SH - 0.5, fx0: x0, fx1: x0 + 21, fy: h },
    { t: 'leg', side: 'R', ax, ay: SH - 0.5, fx0: x0 + w - 21, fx1: x0 + w, fy: h },
  ];
}
export function skeleton() {
  const s = [];
  // 정 (x 0~99)
  s.push(...jieut(0, 64, 58));
  s.push({ t: 'v', x: 80, y: 0, w: SV, h: 70, cut: 1 }); // ㅓ 세로
  s.push({ t: 'h', x: 66, y: 25, w: 15, h: SH }); // ㅓ 가로(왼쪽으로)
  s.push({ t: 'o', cx: 49, cy: 83, w: 46, h: 34, ring: 8.5 }); // 받침 ㅇ(과녁)
  // 조 (x 106~206)
  const b = 106;
  s.push(...jieut(b + 13, 74, 56));
  s.push({ t: 'v', x: b + 40.5, y: 60, w: SV, h: 25 });
  s.push({ t: 'h', x: b, y: 84, w: 100, h: SH, cut: 1 });
  // 준 (x 213~313)
  const c = 213;
  s.push(...jieut(c + 14, 72, 40));
  s.push({ t: 'h', x: c, y: 45, w: 100, h: SH, cut: 1 });
  s.push({ t: 'v', x: c + 50, y: 60, w: SV, h: 13 });
  s.push({ t: 'v', x: c + 12, y: 70, w: SV, h: 30 });
  s.push({ t: 'h', x: c + 12, y: 84, w: 84, h: SH, cut: 1 });
  return { s, width: 313, height: 100 };
}

// ── 그리는 방식 ──
const legPts = (g, k = 7) => [[g.ax - k, g.ay], [g.ax + k, g.ay], [g.fx1, g.fy], [g.fx0, g.fy]];
function solid(sk, { color, bg, hot }) {
  let fill = '', holes = '';
  for (const g of sk.s) {
    if (g.t === 'h' || g.t === 'v') fill += `<polygon points="${P(rectPts(g.x, g.y, g.w, g.h, g.cut ? CUTL : 0))}"/>`;
    else if (g.t === 'leg') fill += `<polygon points="${P(legPts(g))}"/>`;
    else if (g.t === 'o') {
      fill += `<polygon points="${P(oct(g.cx, g.cy, g.w, g.h))}"/>`;
      holes += `<polygon points="${P(oct(g.cx, g.cy, g.w - 2 * g.ring, g.h - 2 * g.ring))}" fill="${bg}"/>`;
    }
  }
  const o = oOf(sk);
  const dot = `<polygon points="${P(cutSq(o.cx, o.cy, o.h * 0.3))}" fill="${hot}"/>`;
  return { fill: `<g fill="${color}">${fill}</g>`, holes, dot };
}
const oOf = (sk) => sk.s.find((g) => g.t === 'o');

function drawBlock(sk, o) { const { fill, holes, dot } = solid(sk, o); return fill + holes + dot; }

function drawStencil(sk, o) {
  const { fill, holes, dot } = solid(sk, o);
  const gap = 2.6, B = o.bg;
  let cuts = '';
  for (const g of sk.s) if (g.t === 'h' && g.y === 0) cuts += `<rect x="${g.x - 1}" y="${SH - 0.6}" width="${g.w + 2}" height="${gap}" fill="${B}"/>`; // ㅈ 가로획과 다리 사이
  cuts += `<rect x="77.6" y="24" width="${gap}" height="${SH + 2}" fill="${B}"/>`; // 정 ㅓ 가로-세로
  cuts += `<rect x="${106 + 39.5}" y="81.6" width="${SV + 2}" height="${gap}" fill="${B}"/>`; // 조 ㅗ
  cuts += `<rect x="${213 + 49}" y="60.2" width="${SV + 2}" height="${gap}" fill="${B}"/>`; // 준 ㅜ
  cuts += `<rect x="${213 + 11}" y="81.6" width="${SV + 2}" height="${gap}" fill="${B}"/>`; // 준 ㄴ
  for (const x of [30.7, 154.7, 261.7]) cuts += `<rect x="${x}" y="-2" width="${gap}" height="${SH + 1}" fill="${B}"/>`; // ㅈ 가로획 가운데 끊김
  const g = oOf(sk);
  cuts += `<rect x="${g.cx - gap / 2}" y="${g.cy - g.h / 2 - 2}" width="${gap}" height="${g.h + 4}" fill="${B}"/><rect x="${g.cx - g.w / 2 - 2}" y="${g.cy - gap / 2}" width="${g.w + 4}" height="${gap}" fill="${B}"/>`;
  return fill + holes + cuts + dot;
}

function drawMulti(sk, o) {
  // 획의 가운데 선을 겹겹이(흰·바탕·흰·바탕·흰) 그어 획마다 가는 선 세 줄
  const W = 19, half = W / 2;
  const lines = [];
  for (const g of sk.s) {
    if (g.t === 'h') lines.push(`M ${g.x + half} ${g.y + g.h / 2} H ${g.x + g.w - half}`);
    else if (g.t === 'v') lines.push(`M ${g.x + g.w / 2} ${g.y + half} V ${g.y + g.h - half}`);
    else if (g.t === 'leg') lines.push(`M ${g.ax} ${g.ay - 2} L ${(g.fx0 + g.fx1) / 2} ${g.fy - half}`);
  }
  const g = oOf(sk);
  const ring = oct(g.cx, g.cy, g.w - g.ring, g.h - g.ring, 0.26);
  const d = lines.join(' ') + ` M ${ring.map((p) => p.join(' ')).join(' L ')} Z`;
  const layer = (w, c) => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="square" stroke-linejoin="miter"/>`;
  return layer(W, o.color) + layer(14.6, o.bg) + layer(10.2, o.color) + layer(5.8, o.bg) + layer(1.9, o.color) + `<polygon points="${P(cutSq(g.cx, g.cy, 7))}" fill="${o.hot}"/>`;
}

function drawHicon(sk, o) {
  const TV = 22, TH = 5.5;
  let f = '';
  for (const g of sk.s) {
    if (g.t === 'v') f += `<polygon points="${P(rectPts(g.x - (TV - g.w) / 2, g.y, TV, g.h))}"/>`;
    else if (g.t === 'h') {
      const y = g.y === 0 ? 0 : g.y + g.h >= 100 ? 100 - TH : g.y + (g.h - TH) / 2;
      f += `<polygon points="${P(rectPts(g.x, y, g.w, TH))}"/>`;
    } else if (g.t === 'leg') {
      // 왼쪽 다리는 고르게 굵게, 오른쪽 다리는 가늘게(고대비 명조의 ㅅ처럼)
      f += g.side === 'L'
        ? `<polygon points="${P([[g.ax - 12, TH - 0.3], [g.ax + 2, TH - 0.3], [g.fx0 + 22, g.fy], [g.fx0, g.fy]])}"/>`
        : `<polygon points="${P([[g.ax - 1, TH - 0.3], [g.ax + 2.5, TH - 0.3], [g.fx1, g.fy], [g.fx1 - 5.5, g.fy]])}"/>`;
    }
  }
  const g = oOf(sk);
  const ell = `<ellipse cx="${g.cx}" cy="${g.cy}" rx="${g.w / 2}" ry="${g.h / 2}" fill="${o.color}"/><ellipse cx="${g.cx}" cy="${g.cy}" rx="${g.w / 2 - 11}" ry="${g.h / 2 - 3.2}" fill="${o.bg}"/>`;
  return `<g fill="${o.color}">${f}</g>${ell}<polygon points="${P(cutSq(g.cx, g.cy, 7))}" fill="${o.hot}"/>`;
}

function drawStack(sk, o) {
  const { fill, holes, dot } = solid(sk, o);
  const step = 2.9;
  let layers = '';
  // 뒤에서부터 Ⅰ → Ⅴ (가장 뒤가 Ⅰ)
  for (let k = 5; k >= 1; k--) layers += `<g transform="translate(${k * step} ${k * step})">${fill.replace(`fill="${o.color}"`, `fill="${LIT[5 - k]}"`)}</g>`;
  return layers + fill + holes + dot;
}

const DRAW = { block: drawBlock, slit: drawBlock, italic: drawBlock, stencil: drawStencil, multi: drawMulti, hicon: drawHicon, stack: drawStack };
export const LETTER_STYLES = { block: '블록', stencil: '스텐실', multi: '다중선', hicon: '고대비', stack: '입체', slit: '조준선', italic: '기울임' };

// SVG 문자열. 폭 wMm(mm)로 그린다. color: 글자, bg: 바탕(과녁 속·틈), hot: 과녁 한가운데
export function wordmark({ style = 'block', color = '#fff', bg = '#17193B', hot = '#E8833A', wMm = 150 }) {
  const sk = skeleton();
  const { width, height } = sk;
  const pad = style === 'italic' ? 12 : 4;
  const extraR = style === 'stack' ? 15 : 0;
  const vbW = width + pad * 2 + extraR, vbH = height + 8 + extraR;
  const o = { color, bg, hot };
  let body = DRAW[style](sk, o);
  if (style === 'slit') body += `<rect x="-3000" y="48.7" width="${width + 6000}" height="2.6" fill="${bg}"/><line x1="-3000" y1="50" x2="${width + 3000}" y2="50" stroke="${color}" stroke-width=".5" stroke-opacity=".55"/>`;
  const content = style === 'italic' ? `<g transform="translate(${pad + 10} 4) skewX(-11)">${body}</g>` : `<g transform="translate(${pad} 4)">${body}</g>`;
  const hMm = (wMm * vbH) / vbW;
  return { svg: `<svg viewBox="0 0 ${vbW} ${vbH}" width="${wMm}mm" height="${hMm.toFixed(2)}mm" overflow="visible" xmlns="http://www.w3.org/2000/svg">${content}</svg>`, hMm, padMm: (wMm * pad) / vbW };
}
