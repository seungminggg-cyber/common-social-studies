// MINIMAX 레터링 — 글꼴이 아니라 도형으로 직접 그린 로고 글자 (강사 요청 2026-11-07)
// 글자 높이 100. M·I·N·A·X 다섯 글자만 있으면 된다.
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

// SVG 조각(좌표 = 글자 높이 100 단위). 바깥 <svg>나 <g transform>은 부르는 쪽에서 씌운다.
export function drawFill(lay, { color = '#fff', colors = null } = {}) {
  return lay.glyphs.map((g, i) => `<g transform="translate(${+g.x.toFixed(2)} 0)" fill="${colors ? colors[i % colors.length] : color}">${g.polys.map((p) => `<polygon points="${P(p)}"/>`).join('')}</g>`).join('');
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
export const neonFilter = (id = 'nb', sd = 4) => `<filter id="${id}" filterUnits="userSpaceOnUse" x="-60" y="-60" width="2000" height="240"><feGaussianBlur stdDeviation="${sd}"/></filter>`;
