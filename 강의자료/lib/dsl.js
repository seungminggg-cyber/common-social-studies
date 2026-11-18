// 판서 내용을 짧게 쓰기 위한 도우미 함수
// n = 몇 번째 단계(→ 키를 몇 번 눌렀을 때)에 나타나는지. 0이면 화면이 열릴 때부터 보인다.
// 나타나기 전에도 자리는 차지하므로(보이지만 않음) 판서가 생겨도 글자가 밀리지 않는다.

/** 덩어리(줄·상자)가 나타남 */
export const S = (n, html, cls = '') => `<div class="s ${cls}" data-s="${n}">${html}</div>`;
/** 글자 안에서 일부가 나타남 */
export const I = (n, html, cls = '') => `<span class="s ${cls}" data-s="${n}">${html}</span>`;
/** 빈칸 — 처음에는 밑줄만 있고, n단계에 파란 펜 글씨로 채워짐. 학생용 판서 노트에서는 빈칸으로 남음 */
export const B = (n, text) => `<span class="b" data-s="${n}"><span class="bt">${text}</span></span>`;
/** 형광펜 */
export const HL = (n, text) => `<mark class="hl" data-s="${n}">${text}</mark>`;
/** 밑줄 (red·blue·green) */
export const UL = (n, text, c = 'red') => `<span class="ul ${c}" data-s="${n}">${text}</span>`;
/** 동그라미 */
export const CI = (n, text, c = 'red') => `<span class="ci ${c}" data-s="${n}">${text}</span>`;
/** 정리 한 줄 (왼쪽 강조선이 있는 한 줄). 과장·느낌표 없이 사실만 쓴다 */
export const H = (n, text, cls = '') => `<div class="hand s ${cls}" data-s="${n}">${text}</div>`;
/** 글자 옆 덧붙임 (회색 작은 글자) */
export const A = (n, text) => `<span class="aside s" data-s="${n}">${text}</span>`;
/** 밑줄 + 위에 작은 이름표 (사례 분석용). 글자는 짧게(한 줄 안에 들어가게) */
export const LB = (n, text, label, c = 'blue') =>
  `<span class="lb ${c}" data-s="${n}"><span class="lbt">${text}</span><span class="lbl">${label}</span></span>`;
/** O·X 표시 */
export const O = (n) => `<span class="stamp o" data-s="${n}">O</span>`;
export const X = (n) => `<span class="stamp x" data-s="${n}">X</span>`;

/** 이름표 + 설명 한 줄 */
export const ln = (k, html, cls = '') => `<div class="ln ${cls}"><b class="k">${k}</b><div class="v">${html}</div></div>`;

/** 장점·한계 두 칸 */
export const pm = (n, plus, minus) =>
  S(n, `<div class="pm"><div class="plus"><b>장점</b>${plus}</div><div class="minus"><b>한계</b>${minus}</div></div>`);

/** 흐름도: items = [[제목, 설명, 예시(없어도 됨)], ...], 상자마다 단계 번호 start, start+1, ... */
export function flow(items, start = 1, cls = '') {
  const parts = [];
  items.forEach(([t, d, ex], i) => {
    if (i > 0) parts.push(`<div class="farr s" data-s="${start + i}">→</div>`);
    parts.push(S(start + i, `<div class="fnum">${i + 1}</div><div class="ft">${t}</div><div class="fd">${d}</div>${ex ? `<div class="fe">${ex}</div>` : ''}`, 'fbox'));
  });
  return `<div class="flow n${items.length} ${cls}">${parts.join('')}</div>`;
}

/** O·X 문제 목록: items = [[문장, 'O'|'X', 이유], ...]. 문장은 처음부터 보이고 도장·이유가 start단계부터 하나씩 */
export function oxList(items, start = 1) {
  return `<div class="oxlist">${items
    .map(([q, a, why], i) => {
      const n = start + i;
      return `<div class="oxi"><span class="num">${i + 1}</span><span class="q">${q}</span>${a === 'O' ? O(n) : X(n)}${
        why ? I(n, why, 'why') : ''
      }</div>`;
    })
    .join('')}</div>`;
}

/** 주의할 점: items = [[바른 문장, 덧붙임(없어도 됨)], ...], 하나씩 start단계부터.
 *  틀린 문장을 따옴표로 보여 주지 않고, 바른 내용을 담백하게 쓴다 */
export function cautions(items, start = 1) {
  return `<div class="cautions">${items
    .map(([t, more], i) => S(start + i, `<span class="num">${i + 1}</span><div>${t}${more ? `<small>${more}</small>` : ''}</div>`, 'cau'))
    .join('')}</div>`;
}

/** 모집단·표본 그림 (SVG). 점 위치는 고정된 난수로 매번 같게 */
export function popDiagram() {
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const cx = 230, cy = 230, R = 200;
  const dots = [];
  while (dots.length < 70) {
    const x = cx + (rnd() * 2 - 1) * R, y = cy + (rnd() * 2 - 1) * R;
    if ((x - cx) ** 2 + (y - cy) ** 2 > (R - 18) ** 2) continue;
    if (dots.some((d) => (d.x - x) ** 2 + (d.y - y) ** 2 < 26 ** 2)) continue;
    dots.push({ x, y, c: rnd() < 0.5 ? 'a' : rnd() < 0.5 ? 'b' : 'c' });
  }
  const picked = [3, 9, 14, 22, 30, 37, 45, 51, 58, 66];
  const big = dots.map((d, i) => `<circle cx="${d.x.toFixed(1)}" cy="${d.y.toFixed(1)}" r="9" class="dot ${d.c}${picked.includes(i) ? ' pk' : ''}"/>`).join('');
  const sx = 640, sy = 230, r = 92;
  const small = picked
    .map((p, j) => {
      const ang = (j / picked.length) * Math.PI * 2;
      const rr = j % 2 ? 52 : 26;
      return `<circle cx="${(sx + Math.cos(ang) * rr).toFixed(1)}" cy="${(sy + Math.sin(ang) * rr).toFixed(1)}" r="9" class="dot ${dots[p].c} pk"/>`;
    })
    .join('');
  return `<svg class="pop" viewBox="0 0 760 500" role="img" aria-label="모집단에서 표본을 뽑는 그림">
    <circle cx="${cx}" cy="${cy}" r="${R}" class="ring"/>${big}
    <path d="M 445 230 C 480 200, 515 200, 535 222" class="parr"/><path d="M 524 206 L 538 225 L 516 230" class="parr"/>
    <circle cx="${sx}" cy="${sy}" r="${r}" class="ring sm"/>${small}
    <text x="${cx}" y="482" class="lab">모집단 (전체)</text>
    <text x="${sx}" y="372" class="lab">표본 (일부)</text>
  </svg>`;
}

/** 막대그래프 (가상 자료 등). bars = [[이름, 값]], max = 축 최댓값 */
export function bars({ title, unit, bars: data, max, source, n = 1 }) {
  const H0 = 360;
  const cols = data
    .map(([, v]) => `<div class="bcol"><div class="bval">${v.toFixed(1)}${unit}</div><div class="bbar" style="height:${((v / max) * H0).toFixed(0)}px"></div></div>`)
    .join('');
  const names = data.map(([name]) => `<span>${name}</span>`).join('');
  return S(
    n,
    `<div class="chart"><div class="ctitle">${title}</div><div class="cbody">${cols}</div><div class="cnames">${names}</div>${
      source ? `<div class="csrc">${source}</div>` : ''
    }</div>`
  );
}
