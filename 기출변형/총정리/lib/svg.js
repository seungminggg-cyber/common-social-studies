// 총정리 전용 그림(SVG) — 개념서 figures에 없는 경제 그래프를 새로 그린다.
// { t: 'svg', kind: 'tradeSurplus' | 'ppf', ... , caption }
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// 수요·공급 한 판: 수요 P = 10 − Q, 공급 P = Q, 균형 (5, 5). world = 국제 가격
function marketPanel(ox, oy, world, title, areas) {
  const S = 15; // 1단위 = 15px
  const X = (q) => ox + 24 + q * S;
  const Y = (p) => oy + 170 - p * S;
  const pt = (q, p) => `${X(q).toFixed(1)},${Y(p).toFixed(1)}`;
  const poly = (pts, cls) => `<polygon class="${cls}" points="${pts.map(([q, p]) => pt(q, p)).join(' ')}"/>`;
  const qd = 10 - world;
  const qs = world;
  let s = `<text class="sv-t" x="${ox + 24}" y="${oy + 12}">${esc(title)}</text>`;
  // 칠한 넓이
  for (const a of areas) s += poly(a.pts, a.cls) + `<text class="sv-a" x="${X(a.lab[0])}" y="${Y(a.lab[1]) + 3}">${a.name}</text>`;
  // 축
  s += `<line class="sv-ax" x1="${X(0)}" y1="${Y(11)}" x2="${X(0)}" y2="${Y(0)}"/><line class="sv-ax" x1="${X(0)}" y1="${Y(0)}" x2="${X(11)}" y2="${Y(0)}"/>`;
  s += `<text class="sv-l" x="${X(0) - 4}" y="${Y(11) - 3}">가격</text><text class="sv-l" x="${X(11)}" y="${Y(0) + 11}" text-anchor="end">수량</text>`;
  // 수요·공급
  s += `<line class="sv-d" x1="${X(0)}" y1="${Y(10)}" x2="${X(10)}" y2="${Y(0)}"/><line class="sv-s" x1="${X(0)}" y1="${Y(0)}" x2="${X(10)}" y2="${Y(10)}"/>`;
  s += `<text class="sv-l" x="${X(9.6)}" y="${Y(10.2)}" text-anchor="end">국내 공급</text><text class="sv-l" x="${X(9.8)}" y="${Y(1.2)}" text-anchor="end">국내 수요</text>`;
  // 가격 선
  s += `<line class="sv-g" x1="${X(0)}" y1="${Y(5)}" x2="${X(5)}" y2="${Y(5)}"/><line class="sv-w" x1="${X(0)}" y1="${Y(world)}" x2="${X(10.4)}" y2="${Y(world)}"/>`;
  s += `<text class="sv-l" x="${X(0) - 3}" y="${Y(5) + 3}" text-anchor="end">P₀</text><text class="sv-l sv-b" x="${X(0) - 3}" y="${Y(world) + 3}" text-anchor="end">${world > 5 ? 'P₁' : 'P₂'}</text>`;
  s += `<text class="sv-l" x="${X(10.4)}" y="${Y(world) - 3}" text-anchor="end">국제 가격</text>`;
  // 수량 점선
  for (const q of [qd, qs]) s += `<line class="sv-g" x1="${X(q)}" y1="${Y(world)}" x2="${X(q)}" y2="${Y(0)}"/>`;
  const [lo, hi] = [Math.min(qd, qs), Math.max(qd, qs)];
  s += `<text class="sv-l" x="${(X(lo) + X(hi)) / 2}" y="${Y(0) + 11}" text-anchor="middle">${world > 5 ? '← 수출량 →' : '← 수입량 →'}</text>`;
  return s;
}

function tradeSurplus() {
  const ex = marketPanel(0, 0, 7, '국제 가격 P₁ > P₀ (수출)', [
    { name: 'A', cls: 'sv-ar1', pts: [[0, 5], [5, 5], [3, 7], [0, 7]], lab: [1.8, 6] },
    { name: 'B', cls: 'sv-ar2', pts: [[3, 7], [7, 7], [5, 5]], lab: [5, 6.3] },
  ]);
  const im = marketPanel(210, 0, 3, '국제 가격 P₂ < P₀ (수입)', [
    { name: 'C', cls: 'sv-ar1', pts: [[0, 3], [3, 3], [5, 5], [0, 5]], lab: [1.8, 4] },
    { name: 'D', cls: 'sv-ar2', pts: [[3, 3], [7, 3], [5, 5]], lab: [5, 3.6] },
  ]);
  return `<svg class="sv" viewBox="-6 -2 430 196" width="100%">${ex}${im}</svg>`;
}

export function svgBlock(b, inl) {
  const body = { tradeSurplus }[b.kind];
  if (!body) throw new Error(`모르는 svg 그림: ${b.kind}`);
  return `<figure class="sv-fig">${body(b)}${b.caption ? `<figcaption>${inl(b.caption)}</figcaption>` : ''}</figure>`;
}
