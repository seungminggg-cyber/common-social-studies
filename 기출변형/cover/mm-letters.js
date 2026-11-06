// MINIMAX 레터링 — 글꼴이 아니라 도형으로 직접 그린 로고 글자 (강사 요청 2026-11-07)
// 글자 높이 100. M·I·N·A·X(MINIMAX)·P(MINIMAP)·V(로마 숫자).
//   s: 세로획 굵기, d: 사선획 가로 두께, wf: 글자 너비 배율, cut: 세로획 오른쪽 위 모서리 자름(상징)
// 그리는 방식
//   fill  — 면으로 채운 글자(굵기·너비·기울기로 성격을 바꿈)
//   neon  — 가운데 선을 겹겹이 그어 네온관처럼(바깥 빛 + 흰 심)
const P = (pts) => pts.map((p) => p.map((v) => +v.toFixed(2)).join(',')).join(' ');

// 글자 하나의 도형(채움용 다각형 목록)과 가운데 선(네온용), 너비
function glyph(ch, { s = 18, d = 21, wf = 1, cut = 0 }) {
  const H = 100;
  const vrect = (x, w = s) => (cut ? [[x, 0], [x + w - cut, 0], [x + w, cut], [x + w, H], [x, H]] : [[x, 0], [x + w, 0], [x + w, H], [x, H]]);
  if (ch === 'I') return { w: s, polys: [vrect(0)], lines: [[[s / 2, 0], [s / 2, H]]] };
  if (ch === 'N') {
    const w = 74 * wf;
    return { w, polys: [vrect(0), vrect(w - s), [[0, 0], [d, 0], [w, H], [w - d, H]]], lines: [[[s / 2, H], [s / 2, 0], [w - s / 2, H], [w - s / 2, 0]]] };
  }
  if (ch === 'M') {
    const w = 92 * wf, cx = w / 2, vy = 74;
    return {
      w,
      polys: [vrect(0), vrect(w - s), [[0, 0], [d, 0], [cx + d / 2, vy], [cx - d / 2, vy]], [[w, 0], [w - d, 0], [cx - d / 2, vy], [cx + d / 2, vy]]],
      lines: [[[s / 2, H], [s / 2, 0], [cx, vy], [w - s / 2, 0], [w - s / 2, H]]],
    };
  }
  if (ch === 'A') {
    const w = 86 * wf, cx = w / 2, by = 64, bh = Math.max(4, s * 0.78);
    // 가로대: 두 사선의 안쪽 가장자리 사이
    const inner = (y) => { const t = (H - y) / H; return [d + (cx - d / 2 - d) * t + 0 * t, w - d - (w - d - (cx + d / 2)) * t]; };
    const [l0, r0] = inner(by), [l1, r1] = inner(by + bh);
    return {
      w,
      polys: [[[0, H], [d, H], [cx + d / 2, 0], [cx - d / 2, 0]], [[w, H], [w - d, H], [cx - d / 2, 0], [cx + d / 2, 0]], [[l0 - 1, by], [r0 + 1, by], [r1 + 1, by + bh], [l1 - 1, by + bh]]],
      lines: [[[d / 2, H], [cx, 0], [w - d / 2, H]], [[w * 0.27, by + bh / 2], [w * 0.73, by + bh / 2]]],
    };
  }
  if (ch === 'V') {
    const w = 84 * wf;
    return { w, polys: [[[0, 0], [d, 0], [w / 2 + d / 2, H], [w / 2 - d / 2, H]], [[w, 0], [w - d, 0], [w / 2 - d / 2, H], [w / 2 + d / 2, H]]], lines: [[[d / 2, 0], [w / 2, H], [w - d / 2, 0]]] };
  }
  if (ch === 'P') {
    // MINIMAP의 P(2026-11-07): 세로획 + 네모난 고리(오른쪽 두 모서리 자름). 고리는 구멍 있는 도형 { outer, inner }
    const w = 70 * wf, by = 58, h = Math.max(4, s * 0.86), k = by * 0.24;
    const outer = [[0, 0], [w - k, 0], [w, k], [w, by - k], [w - k, by], [0, by]];
    const ik = Math.max(0, k - h * 0.6);
    const inner = [[s, h], [w - s - ik, h], [w - s, h + ik], [w - s, by - h - ik], [w - s - ik, by - h], [s, by - h]];
    const c = s / 2, kk = k * 0.75;
    return {
      w,
      polys: [vrect(0), { outer, inner }],
      lines: [[[c, H], [c, 0], [w - c - kk, 0], [w - c, kk], [w - c, by - kk], [w - c - kk, by], [c, by]]],
    };
  }
  if (ch === 'X') {
    const w = 84 * wf;
    return { w, polys: [[[0, 0], [d, 0], [w, H], [w - d, H]], [[w - d, 0], [w, 0], [d, H], [0, H]]], lines: [[[d / 2, 0], [w - d / 2, H]], [[w - d / 2, 0], [d / 2, H]]] };
  }
  throw new Error('글자 없음: ' + ch);
}

// 낱말을 늘어놓기. params: 글자 하나에 공통 값 또는 글자별 함수(i) => 값
export function layout(word, params, track = 10) {
  let x = 0;
  const out = [];
  [...word].forEach((ch, i) => {
    const p = typeof params === 'function' ? params(i, ch) : params;
    const g = glyph(ch, p);
    out.push({ ch, x, ...g, p });
    x += g.w + track;
  });
  return { glyphs: out, width: x - track, height: 100 };
}

// 도형 하나 → SVG. 구멍 있는 도형 { outer, inner }은 evenodd 경로로
const ring = (pts) => `M ${pts.map((p) => p.map((v) => +v.toFixed(2)).join(' ')).join(' L ')} Z`;
export const polyEl = (p, extra = '') => (p.outer ? `<path fill-rule="evenodd" d="${ring(p.outer)} ${ring(p.inner)}" ${extra}/>` : `<polygon points="${P(p)}" ${extra}/>`);
// SVG 조각(좌표 = 글자 높이 100 단위). 바깥 <svg>나 <g transform>은 부르는 쪽에서 씌운다.
export function drawFill(lay, { color = '#fff', colors = null } = {}) {
  return lay.glyphs.map((g, i) => `<g transform="translate(${+g.x.toFixed(2)} 0)" fill="${colors ? colors[i % colors.length] : color}">${g.polys.map(polyEl).join('')}</g>`).join('');
}
// 단단한 입체(그림자가 아니라 같은 글자를 비스듬히 여러 번 겹쳐 두께를 냄)
export function drawExtrude(lay, { color, side, steps = 8, dx = 1, dy = 1 }) {
  let o = '';
  for (let k = steps; k >= 1; k--) o += `<g transform="translate(${k * dx} ${k * dy})">${drawFill(lay, { color: side })}</g>`;
  return o + drawFill(lay, { color });
}
export function drawNeon(lay, { glow = '#29E3FF', core = '#ffffff', w = 7, blurId = 'nb' }) {
  const d = lay.glyphs.map((g) => g.lines.map((ln) => `M ${ln.map(([x, y]) => `${+(x + g.x).toFixed(2)} ${y}`).join(' L ')}`).join(' ')).join(' ');
  const path = (sw, c, extra = '') => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${sw}" stroke-linejoin="miter" stroke-linecap="square" ${extra}/>`;
  return path(w * 2.4, glow, `opacity=".55" filter="url(#${blurId})"`) + path(w, glow) + path(w * 0.38, core);
}
// ── 한글 네온 글자(뒷표지 대표 문장) ──
// MINIMAX 네온 로고와 같은 짜임: 곧은 가운데 선(ㅇ만 원)을 같은 굵기의 관으로 그린다. 한 글자 칸 100×100.
const circ = (cx, cy, r, n = 40) => Array.from({ length: n + 1 }, (_, i) => [cx + r * Math.cos((2 * Math.PI * i) / n - Math.PI / 2), cy + r * Math.sin((2 * Math.PI * i) / n - Math.PI / 2)]);
const CH_O = (cx, cy, r) => [circ(cx, cy, r)];
const ㅅ = (ax, ay, x0, x1, y1) => [[[x0, y1], [ax, ay], [x1, y1]]];
const HANGUL = {
  최: [[[36, 2], [36, 14]], [[8, 16], [64, 16]], ...ㅅ(36, 16, 6, 66, 56), [[36, 68], [36, 86]], [[2, 86], [72, 86]], [[88, 0], [88, 100]]],
  소: [...ㅅ(50, 4, 12, 88, 58), [[50, 66], [50, 86]], [[2, 86], [98, 86]]],
  의: [...CH_O(38, 34, 25), [[2, 82], [74, 82]], [[88, 0], [88, 100]]],
  시: [...ㅅ(36, 8, 4, 70, 94), [[88, 0], [88, 100]]],
  간: [[[6, 6], [60, 6], [60, 50]], [[80, 0], [80, 62]], [[80, 30], [97, 30]], [[12, 68], [12, 96], [94, 96]]],
  으: [...CH_O(50, 36, 27), [[2, 86], [98, 86]]],
  로: [[[12, 4], [88, 4], [88, 29], [12, 29], [12, 54], [88, 54]], [[50, 62], [50, 86]], [[2, 86], [98, 86]]],
  대: [[[56, 10], [6, 10], [6, 90], [58, 90]], [[70, 0], [70, 100]], [[70, 48], [90, 48]], [[90, 0], [90, 100]]],
  점: [[[4, 6], [58, 6]], ...ㅅ(31, 6, 4, 58, 46), [[86, 0], [86, 58]], [[68, 26], [86, 26]], [[14, 66], [86, 66], [86, 96], [14, 96], [14, 66]]],
  수: [...ㅅ(50, 4, 14, 86, 46), [[2, 58], [98, 58]], [[50, 58], [50, 96]]],
  를: [[[14, 2], [86, 2], [86, 19], [14, 19], [14, 36], [86, 36]], [[2, 50], [98, 50]], [[14, 64], [86, 64], [86, 80], [14, 80], [14, 96], [86, 96]]],
  // 간지(통합사회1·2)용
  통: [[[88, 2], [12, 2], [12, 34], [88, 34]], [[12, 18], [80, 18]], [[50, 40], [50, 52]], [[2, 52], [98, 52]], ...CH_O(50, 78, 19)],
  합: [[[34, 0], [34, 7]], [[12, 10], [56, 10]], ...CH_O(34, 32, 14), [[78, 0], [78, 58]], [[78, 28], [95, 28]], [[14, 64], [14, 96], [86, 96], [86, 64]], [[14, 80], [86, 80]]],
  사: [...ㅅ(36, 6, 4, 66, 94), [[82, 0], [82, 100]], [[82, 46], [98, 46]]],
  회: [[[36, 0], [36, 9]], [[10, 12], [62, 12]], ...CH_O(36, 37, 16), [[36, 59], [36, 82]], [[2, 82], [70, 82]], [[88, 0], [88, 100]]],
  1: [[[14, 20], [32, 2], [32, 100]]],
  2: [[[6, 18], [16, 4], [48, 4], [58, 16], [58, 38], [6, 100], [62, 100]]],
  ',': [[[14, 84], [14, 92], [7, 102]]],
  '.': [[[10, 94], [10, 97]]],
};
const HW = { ',': 26, '.': 22, ' ': 34, 1: 46, 2: 66 };
// 글자 늘어놓기 → drawNeon이 그대로 받는 모양 { glyphs: [{x, lines}], width }
export function layoutHangul(text, track = 14) {
  let x = 0;
  const glyphs = [];
  for (const ch of text) {
    if (ch === ' ') { x += HW[' ']; continue; }
    const lines = HANGUL[ch];
    if (!lines) throw new Error('네온 한글 없음: ' + ch);
    glyphs.push({ ch, x, lines, w: HW[ch] || 100 });
    x += (HW[ch] || 100) + track;
  }
  return { glyphs, width: x - track, height: 100 };
}

// 네온 로고에서 실제로 보이는 관(빛 번짐 제외)의 왼쪽·오른쪽 끝(글자 단위). 글자 끝선 맞추기에 쓴다.
export function neonExtent(lay, w = 7) {
  let lo = Infinity, hi = -Infinity;
  for (const g of lay.glyphs) for (const ln of g.lines) for (const [x] of ln) { lo = Math.min(lo, x + g.x); hi = Math.max(hi, x + g.x); }
  return [lo - w / 2, hi + w / 2];
}
export const neonFilter = (id = 'nb', sd = 4) => `<filter id="${id}" filterUnits="userSpaceOnUse" x="-60" y="-60" width="2000" height="240"><feGaussianBlur stdDeviation="${sd}"/></filter>`;

// 로마 숫자(Ⅰ~Ⅴ) → I·V 네온 글자 배치(간지 큰 번호)
const ROMAN = { 'Ⅰ': 'I', 'Ⅱ': 'II', 'Ⅲ': 'III', 'Ⅳ': 'IV', 'Ⅴ': 'V' };
export const layoutRoman = (no, params = { s: 8, d: 9, wf: 1 }, track = 18) => layout(ROMAN[no] || no, params, track);
