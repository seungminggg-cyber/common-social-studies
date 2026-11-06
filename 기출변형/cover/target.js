// 과녁: 모서리 자른 네모를 같은 중심에 겹친 것. viewBox 0 0 520 520 (시안 4의 꼭짓점과 같음)
import { CUT } from './tokens.js';

// 한 변 길이 비율 f(1 = 바깥)인 모서리 자른 네모의 꼭짓점
export function cutSquare(f, size = 520, inset = 2) {
  const half = (size / 2 - inset) * f;
  const a = size / 2 - half, b = size / 2 + half, c = 2 * half * CUT;
  return [[a, a], [b - c, a], [b, a + c], [b, b], [a, b]].map((p) => p.map((v) => +v.toFixed(2)).join(',')).join(' ');
}

// mode 'line': 색 선 / 'fill': 색 면(바깥부터 칠하고 사이에 바탕색 가는 틈)
// colors: 바깥→안 색, center: 가운데 네모 색, stroke: 선 굵기(viewBox 단위)
export function target({ colors, center, mode = 'line', stroke = 4, gap = 0, bg = '#fff', numeral = '', numeralColor = '#fff', centerF = null }) {
  const n = colors.length;
  const step = 1 / n; // 100/80/60/40/20%
  const shapes = colors.map((col, i) => {
    const pts = cutSquare(1 - i * step);
    return mode === 'fill'
      ? `<polygon points="${pts}" fill="${col}"${gap ? ` stroke="${bg}" stroke-width="${gap}"` : ''}/>`
      : `<polygon points="${pts}" fill="none" stroke="${col}" stroke-width="${stroke}" stroke-linejoin="miter"/>`;
  });
  const centerShape = center ? `<polygon points="${cutSquare(centerF ?? (n === 5 ? 0.0775 : step))}" fill="${center}"/>` : '';
  const num = numeral ? `<text x="258" y="262" text-anchor="middle" dominant-baseline="central" fill="${numeralColor}" font-family="KoPub Batang" font-weight="700" font-size="${n === 5 ? 30 : 92}">${numeral}</text>` : '';
  return `<svg viewBox="0 0 520 520" xmlns="http://www.w3.org/2000/svg">${shapes.join('')}${centerShape}${num}</svg>`;
}
