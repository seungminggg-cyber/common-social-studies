// '정조준' 레터링 — 글꼴이 아니라 도형으로 직접 그린 제목 글자 (강사 요청 2026-11-06)
//
// 규칙
//  · 획 굵기 S를 고르게, 가로획 끝의 오른쪽 위 모서리는 45°로 자른다(문제집 상징 '모서리 자른 네모'와 같은 방향).
//  · '정'의 받침 ㅇ은 과녁(모서리 깎은 팔각 고리 + 한가운데 주황 네모).
//  · 좌표 단위: 글자 높이 100. 세 글자 너비 합 ≈ 308.
// style: 'block'(기본) · 'slit'(조준선이 글자 허리를 가로지름) · 'italic'(앞으로 기울임)
const SV = 19; // 세로획 굵기
const SH = 16; // 가로획 굵기(눈으로 볼 때 세로획과 같아 보이게 조금 가늘게)
const CH = 10; // 모서리 자름 길이

const P = (pts) => pts.map((p) => p.map((v) => +v.toFixed(2)).join(',')).join(' ');
// 네모 (cut: 오른쪽 위 모서리 자름)
const rect = (x, y, w, h, cut = 0) => (cut ? [[x, y], [x + w - cut, y], [x + w, y + cut], [x + w, y + h], [x, y + h]] : [[x, y], [x + w, y], [x + w, y + h], [x, y + h]]);
// ㅈ: 위 가로획 + 꼭짓점에서 갈라지는 두 다리(ㅅ)
function jieut(x0, w, h) {
  const cx = x0 + w / 2, k = 7, leg = 21;
  return [
    rect(x0, 0, w, SH, CH),
    [[cx - k, SH - 0.5], [cx + k, SH - 0.5], [x0 + leg, h], [x0, h]],
    [[cx - k, SH - 0.5], [cx + k, SH - 0.5], [x0 + w, h], [x0 + w - leg, h]],
  ];
}
// 받침 ㅇ = 과녁. 네모 고리는 ㅁ처럼 읽혀서('점조준') 네 모서리를 깎은 팔각 고리로 그린다(기하 한글의 ㅇ).
// 한가운데는 모서리 자른 네모(과녁 점).
function targetO(cx, cy, s, ring = 8.5) {
  const oct = (size) => { const h = size / 2, c = size * 0.3; return [[cx - h + c, cy - h], [cx + h - c, cy - h], [cx + h, cy - h + c], [cx + h, cy + h - c], [cx + h - c, cy + h], [cx - h + c, cy + h], [cx - h, cy + h - c], [cx - h, cy - h + c]]; };
  const sq = (size) => { const h = size / 2, c = size * 0.18; return [[cx - h, cy - h], [cx + h - c, cy - h], [cx + h, cy - h + c], [cx + h, cy + h], [cx - h, cy + h]]; };
  return { outer: oct(s), inner: oct(s - 2 * ring), dot: sq(s * 0.28), cx, cy };
}

// 세 글자 도형(채움 색 하나로 겹쳐 그리면 하나로 합쳐 보인다)
export function glyphs() {
  const shapes = [];
  // 정 (x 0~93)
  shapes.push(...jieut(0, 58, 56));
  shapes.push(rect(74, 0, SV, 66, CH)); // ㅓ 세로획
  shapes.push(rect(61, 23, 14, SH)); // ㅓ 가로획(왼쪽으로)
  const o = targetO(46.5, 82, 37, 8.5);
  // 조 (x 100~200)
  const x2 = 100;
  shapes.push(...jieut(x2 + 13, 74, 55));
  shapes.push(rect(x2 + 40.5, 58, SV, 27)); // ㅗ 세로
  shapes.push(rect(x2, 84, 100, SH, CH)); // ㅗ 가로
  // 준 (x 207~307)
  const x3 = 207;
  shapes.push(...jieut(x3 + 14, 72, 40));
  shapes.push(rect(x3, 45, 100, SH, CH)); // ㅜ 가로
  shapes.push(rect(x3 + 50, 60, SV, 12)); // ㅜ 세로
  shapes.push(rect(x3 + 12, 70, SV, 30)); // ㄴ 세로
  shapes.push(rect(x3 + 12, 84, 84, SH, CH)); // ㄴ 가로
  return { shapes, o, width: 307, height: 100 };
}

// SVG 문자열. 폭 wMm(mm)로 그린다. color: 글자, bg: 바탕(과녁 속·틈), hot: 과녁 한가운데
export function wordmark({ style = 'block', color = '#fff', bg = '#17193B', hot = '#E8833A', wMm = 150 }) {
  const { shapes, o, width, height } = glyphs();
  const pad = style === 'italic' ? 12 : 4;
  const vbW = width + pad * 2, vbH = height + 8;
  let body = shapes.map((p) => `<polygon points="${P(p)}"/>`).join('');
  body += `<polygon points="${P(o.outer)}"/>`;
  const inner = `<polygon points="${P(o.inner)}" fill="${bg}"/><polygon points="${P(o.dot)}" fill="${hot}"/>`;
  let extra = '';
  if (style === 'slit') {
    // 조준선: 글자를 가로지르는 바탕색 틈 + 글자 밖으로 이어지는 가는 선
    // 글자 허리를 지나가는 조준선
    extra = `<rect x="-3000" y="48.7" width="${width + 6000}" height="2.6" fill="${bg}"/><line x1="-3000" y1="50" x2="${width + 3000}" y2="50" stroke="${color}" stroke-width=".5" stroke-opacity=".55"/>`;
  }
  const g = `<g fill="${color}">${body}</g>${inner}${extra}`;
  const content = style === 'italic' ? `<g transform="translate(${pad + 10} 4) skewX(-11)">${g}</g>` : `<g transform="translate(${pad} 4)">${g}</g>`;
  const hMm = (wMm * vbH) / vbW;
  return { svg: `<svg viewBox="0 0 ${vbW} ${vbH}" width="${wMm}mm" height="${hMm.toFixed(2)}mm" overflow="visible" xmlns="http://www.w3.org/2000/svg">${content}</svg>`, hMm, padMm: (wMm * pad) / vbW };
}
