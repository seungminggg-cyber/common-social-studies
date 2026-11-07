// 2028 수능 예시문항 분석서 — 앞표지 후보 10개 (강사 요청 2026-11-07)
// 제목 두 안: EXAMINE(예시 문항 '분석'서) · NOMINEE(수능에 나올 '후보' 문제). 각 5개, 모두 다른 느낌.
// 두 이름 모두 가운데에 MIN이 들어 있다(EXA-MIN-E, NO-MIN-EE) → 시리즈(MINIMAX·MINIMAP·MAXIMIN)와 이어지게 MIN만 다른 색.
//   EXAMINE  E1 스캔(남색 네온, 문제지를 레이저가 훑으면 분석이 드러남) · E2 해부도(청사진, 문항을 발문·자료·보기·선지로 분해)
//            E3 데이터(밝은 바탕, 예시문항 25문항의 실제 단원 분포 도넛) · E4 형광펜 노트(종이, 밑줄·동그라미·손글씨 메모)
//            E5 입체 큐브(보라→주황, 개념·자료·선지 세 면으로 보는 분석)
//   NOMINEE  N1 월계관(검정·금색, 영화제 노미네이트 배지) · N2 스포트라이트(무대 위 후보 ①~⑤, 하나만 환하게)
//            N3 투표 용지(종이 투표지 + 빨간 기표 도장) · N4 카드 패(후보 카드 다섯 장, 가운데 한 장 PICK)
//            N5 명단 포스터(NOMINEE를 다섯 줄 겹쳐 쓰고 한 줄만 빨강)
// 실행: node cover/build-cover.mjs exn [E1 …] → out/cover/EXN-<후보>-<이름>.pdf
import { esc } from './sheet.js';
import { BLEED, CH } from './tokens.js';
import { layout, drawFill, drawExtrude, drawNeon, neonFilter, neonExtent, polyEl } from './mm-letters.js';

const TB = new URL('../../textbook/', import.meta.url).pathname;
const W = 210, H = 297, B = BLEED, M = 16;
const mm = (v) => `${+(+v).toFixed(2)}mm`;
const f = (v) => +(+v).toFixed(2);
const P = (pts) => pts.map((p) => p.map(f).join(',')).join(' ');
const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const hex = (a) => '#' + a.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
const mix = (a, b, t) => hex(rgb(a).map((v, i) => v + (rgb(b)[i] - v) * t));
const cutPoly = (x, y, w, h, k = 0.18) => { const c = Math.min(w, h) * k; return P([[x, y], [x + w - c, y], [x + w, y + c], [x + w, y + h], [x, y + h]]); };
const T = (s, o) => `<div class="abs" style="${o.right != null ? `right:${mm(o.right)};` : `left:${mm(o.x ?? M)};`}top:${mm(o.y)};${o.w ? `width:${mm(o.w)};` : ''}text-align:${o.align || 'left'};font-family:'${o.font || 'KoPub Dotum'}';font-size:${o.size}pt;font-weight:${o.weight || 400};color:${o.color};letter-spacing:${o.ls || 0}em;line-height:${o.lh || 1.25};white-space:nowrap;${o.extra || ''}">${s}</div>`;
const full = (inner, defs = '') => `<svg class="abs" style="left:-${B}mm;top:-${B}mm;width:${W + 2 * B}mm;height:${H + 2 * B}mm" viewBox="${-B} ${-B} ${W + 2 * B} ${H + 2 * B}" xmlns="http://www.w3.org/2000/svg"><defs>${defs}</defs>${inner}</svg>`;
const rect = (fill) => `<rect x="${-B}" y="${-B}" width="${W + 2 * B}" height="${H + 2 * B}" fill="${fill}"/>`;
const sheet = (bg, inner) => `<section class="sheet" style="background:${bg}"><div class="t" style="overflow:visible">${inner}</div></section>`;
const blur = (id, sd) => `<filter id="${id}" filterUnits="userSpaceOnUse" x="-20" y="-20" width="250" height="340"><feGaussianBlur stdDeviation="${sd}"/></filter>`;
const tx = (x, y, s, o = {}) => `<text x="${f(x)}" y="${f(y)}" font-family="${o.font || 'KoPub Dotum'}" font-weight="${o.w || 700}" font-size="${o.size || 4}" fill="${o.fill || '#fff'}" text-anchor="${o.anchor || 'start'}"${o.ls ? ` letter-spacing="${o.ls}"` : ''}${o.extra || ''}>${esc(s)}</text>`;

export const EXN = { brand: '승민T 통합사회', kind: '2028 수능 예시문항 분석서', subject: '통합사회1 + 통합사회2', exam: '2028 수능 대비 · 2022 개정 교육과정' };
// 2028 수능 예시문항 25문항의 단원(textbook/참고/기출분류.json, 분류: 승민T 통합사회)
const DIST = [['1', 'Ⅱ', 1], ['1', 'Ⅲ', 3], ['1', 'Ⅳ', 3], ['1', 'Ⅴ', 2], ['2', 'Ⅰ', 4], ['2', 'Ⅱ', 3], ['2', 'Ⅲ', 3], ['2', 'Ⅳ', 4], ['2', 'Ⅴ', 2]];
const MINS = { EXAMINE: [3, 4, 5], NOMINEE: [2, 3, 4] }; // MIN 글자 자리

// 글자 묶음을 가운데에: 보이는 왼쪽·오른쪽 끝(lo·hi, 글자 단위)을 폭 w(mm)에, 보이는 위 끝(yTop)을 top(mm)에
function place(inner, { lo, hi, w, top, yTop = 0, cx = W / 2 }) {
  const s = w / (hi - lo);
  return { g: `<g transform="translate(${f(cx - w / 2 - lo * s)} ${f(top - yTop * s)}) scale(${+s.toFixed(5)})">${inner}</g>`, s, bottom: top + (100 - yTop) * s };
}
// 네온 글자: MIN만 다른 색
function neonWord(word, { glow, hot, w, top, id }) {
  const lay = layout(word, { s: 8, d: 9, wf: 1 }, 18);
  const [lo, hi] = neonExtent(lay, 9);
  const mins = MINS[word];
  const inner = lay.glyphs.map((g, i) => drawNeon({ glyphs: [g] }, { w: 9, glow: mins.includes(i) ? hot : glow, blurId: id })).join('');
  return { ...place(inner, { lo, hi, w, top, yTop: -4.5 }), defs: neonFilter(id, 4) };
}
// 채운 글자: MIN만 다른 색(colors 배열)
function fillWord(word, { color, hot, w, top, params = { s: 24, d: 26, wf: 1.1 }, track = 10, extrude = null }) {
  const lay = layout(word, params, track);
  const colors = lay.glyphs.map((_, i) => (MINS[word].includes(i) ? hot : color));
  let inner = '';
  if (extrude) for (let k = extrude.steps; k >= 1; k--) inner += `<g transform="translate(${k * extrude.dx} ${k * extrude.dy})">${drawFill(lay, { color: extrude.side })}</g>`;
  inner += drawFill(lay, { colors });
  const ex = extrude ? extrude.steps * extrude.dx : 0;
  return { ...place(inner, { lo: 0, hi: lay.width + ex, w, top }), lay };
}
const textBlock = (c, y, o = {}) => `${T(esc(EXN.kind), { x: 0, w: W, align: 'center', y, size: o.size || 22, weight: 700, color: c.fg, ls: -0.01 })}
  ${T(esc(EXN.subject), { x: 0, w: W, align: 'center', y: y + (o.gap || 12.5), size: 14, weight: 300, color: c.sub })}`;
const corners = (c, o = {}) => `${T(esc(EXN.brand), { y: 13, size: 10, weight: 700, color: o.brand || c.fg, ls: 0.02 })}${T(esc(EXN.exam), { right: M, y: 279, size: 8.6, color: c.sub })}`;

// ───────── E1 스캔 ─────────
function e1() {
  const c = { bg: '#070B1E', paper: '#121A3E', line: '#2A3570', beam: '#2BE4FF', hot: '#FF4FD8', gold: '#FFD23F', fg: '#fff', sub: '#8E9AD0' };
  const px = 36, py = 26, pw = 138, ph = 160, by = py + ph * 0.52;
  // 문제지 모양(글자 대신 막대): [x, y, 길이, 종류] 종류 k=키워드 d=자료 n=번호
  const items = [];
  const col = (x0, y0, qno) => {
    items.push(['n', x0, y0, qno]);
    let y = y0 + 1;
    [56, 52, 30].forEach((w, i) => items.push(['t', x0 + 8, y + i * 4.6, w, i === 0 ? [10, 16] : null]));
    y += 16;
    items.push(['box', x0 + 2, y, 60, 22]);
    [50, 44, 54, 38].forEach((w, i) => items.push(['t', x0 + 6, y + 5 + i * 4.4, w, i === 2 ? [6, 22] : null, 'd']));
    y += 28;
    for (let k = 0; k < 5; k++) items.push(['o', x0 + 4, y + k * 4.6, [34, 26, 40, 30, 22][k], k]);
  };
  col(px + 6, py + 14, 3); col(px + 72, py + 14, 4);
  col(px + 6, py + 92, 5); col(px + 72, py + 92, 6);
  const draw = (lit) => items.map((it) => {
    const [k] = it;
    if (k === 'n') return `<rect x="${f(it[1])}" y="${f(it[2] - 3)}" width="5" height="5" fill="${lit ? c.beam : c.line}"/>${tx(it[1] + 2.5, it[2] + 0.9, String(it[3]), { size: 3.4, fill: lit ? c.bg : c.paper, anchor: 'middle' })}`;
    if (k === 't') {
      let o = `<rect x="${f(it[1])}" y="${f(it[2] - 0.9)}" width="${it[3]}" height="1.8" rx=".9" fill="${lit ? '#6D7BC4' : c.line}"/>`;
      if (lit && it[4]) o += `<rect x="${f(it[1] + it[4][0])}" y="${f(it[2] - 1.5)}" width="${it[4][1]}" height="3" rx="1" fill="${it[5] === 'd' ? c.gold : c.hot}" opacity=".9"/>`;
      return o;
    }
    if (k === 'box') return `<rect x="${f(it[1])}" y="${f(it[2])}" width="${it[3]}" height="${it[4]}" fill="none" stroke="${lit ? c.beam : c.line}" stroke-width="${lit ? 0.5 : 0.35}"/>`;
    if (k === 'o') return `<circle cx="${f(it[1])}" cy="${f(it[2])}" r="1.5" fill="none" stroke="${lit && it[4] === 2 ? c.hot : lit ? '#6D7BC4' : c.line}" stroke-width=".4"/><rect x="${f(it[1] + 3)}" y="${f(it[2] - 0.8)}" width="${it[3]}" height="1.6" rx=".8" fill="${lit && it[4] === 2 ? c.hot : lit ? '#6D7BC4' : c.line}"/>`;
    return '';
  }).join('');
  // 분석 이름표(빔 아래쪽만)
  const tag = (x, y, x2, label, colr) => `<line x1="${x}" y1="${y}" x2="${x2}" y2="${y}" stroke="${colr}" stroke-width=".3"/><circle cx="${x}" cy="${y}" r=".8" fill="${colr}"/>${tx(x2 + (x2 > x ? 1.5 : -1.5), y + 1.2, label, { size: 3.4, fill: colr, anchor: x2 > x ? 'start' : 'end' })}`;
  const tags = tag(px + 22, py + 93, px - 6, '핵심 개념', c.hot) + tag(px + 70, py + 118, px + pw + 6, '자료 근거', c.gold) + tag(px + 12, py + 140, px - 6, '함정 선지', c.hot) + tag(px + 84, py + 107, px + pw + 6, '발문 요구', c.beam);
  const defs = `${blur('g1', 1.2)}${blur('g3', 3)}<clipPath id="up"><rect x="0" y="0" width="${W}" height="${by}"/></clipPath><clipPath id="dn"><rect x="0" y="${by}" width="${W}" height="${H}"/></clipPath>
    <linearGradient id="sweep" x1="0" y1="${by}" x2="0" y2="${by + 40}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${c.beam}" stop-opacity=".22"/><stop offset="1" stop-color="${c.beam}" stop-opacity="0"/></linearGradient>`;
  const paper = `<rect x="${px}" y="${py}" width="${pw}" height="${ph}" fill="${c.paper}" stroke="${c.line}" stroke-width=".5"/>
    <g clip-path="url(#up)">${draw(false)}</g><g clip-path="url(#dn)">${draw(true)}${tags}</g>
    <rect x="${px - 14}" y="${by}" width="${pw + 28}" height="40" fill="url(#sweep)"/>
    <line x1="${px - 16}" y1="${by}" x2="${px + pw + 16}" y2="${by}" stroke="${c.beam}" stroke-width="3" opacity=".6" filter="url(#g3)"/>
    <line x1="${px - 16}" y1="${by}" x2="${px + pw + 16}" y2="${by}" stroke="${c.beam}" stroke-width=".9"/><line x1="${px - 16}" y1="${by}" x2="${px + pw + 16}" y2="${by}" stroke="#fff" stroke-width=".3"/>`;
  const L = neonWord('EXAMINE', { glow: c.beam, hot: c.hot, w: 160, top: 202, id: 'nb' });
  return sheet(c.bg, `${full(rect(c.bg) + paper + L.g, defs + L.defs)}${corners(c)}${textBlock(c, L.bottom + 7)}`);
}

// ───────── E2 해부도(청사진) ─────────
function e2() {
  const c = { bg: '#0D3B8E', line: '#FFFFFF', fg: '#fff', sub: '#B8CCF2', hot: '#FFD23F' };
  let grid = '';
  for (let x = 0; x <= W; x += 5) grid += `<line x1="${x}" y1="0" x2="${x}" y2="${H}" stroke="#fff" stroke-width="${x % 25 ? 0.08 : 0.16}" opacity="${x % 25 ? 0.35 : 0.5}"/>`;
  for (let y = 0; y <= H; y += 5) grid += `<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="#fff" stroke-width="${y % 25 ? 0.08 : 0.16}" opacity="${y % 25 ? 0.35 : 0.5}"/>`;
  const frame = `<rect x="8" y="8" width="${W - 16}" height="${H - 16}" fill="none" stroke="#fff" stroke-width=".5" opacity=".8"/><rect x="10" y="10" width="${W - 20}" height="${H - 20}" fill="none" stroke="#fff" stroke-width=".2" opacity=".6"/>`;
  // 등각 투영: 평면 (u, v) → 쪽 좌표
  const X0 = 82, iso = (u, v, z) => [X0 + (u - v) * 0.866, z + (u + v) * 0.5];
  const LU = 64, LV = 46;
  const layer = (z, label, inner) => {
    const pts = [iso(0, 0, z), iso(LU, 0, z), iso(LU, LV, z), iso(0, LV, z)];
    return `<polygon points="${P(pts)}" fill="#fff" fill-opacity=".07" stroke="#fff" stroke-width=".6"/>${inner(z)}`;
  };
  const isoLine = (z, u0, v, len, sw = 1.2, colr = '#fff', op = 0.8) => { const [a, b] = [iso(u0, v, z), iso(u0 + len, v, z)]; return `<line x1="${f(a[0])}" y1="${f(a[1])}" x2="${f(b[0])}" y2="${f(b[1])}" stroke="${colr}" stroke-width="${sw}" stroke-linecap="round" opacity="${op}"/>`; };
  const Z = [40, 72, 104, 136]; // 발문 · 자료 · 보기 · 선지 (위 → 아래)
  const L1 = layer(Z[0], '발문', (z) => [10, 18, 26].map((v, i) => isoLine(z, 8, v, [44, 50, 30][i], 1.4, i === 0 ? c.hot : '#fff', i === 0 ? 1 : 0.7)).join(''));
  const L2 = layer(Z[1], '자료', (z) => [0, 1, 2, 3, 4].map((i) => { const h = [10, 16, 22, 14, 26][i]; const a = iso(10 + i * 10, 34, z), b = iso(10 + i * 10, 34, z - h); return `<line x1="${f(a[0])}" y1="${f(a[1])}" x2="${f(b[0])}" y2="${f(b[1])}" stroke="${i === 4 ? c.hot : '#fff'}" stroke-width="2.4" opacity=".85"/>`; }).join(''));
  const L3 = layer(Z[2], '보기', (z) => ['ㄱ', 'ㄴ', 'ㄷ', 'ㄹ'].map((t, i) => { const [x, y] = iso(12 + i * 12, 22, z); return tx(x, y + 1.4, t, { size: 4.2, fill: i === 1 ? c.hot : '#fff', anchor: 'middle' }); }).join(''));
  const L4 = layer(Z[3], '선지', (z) => ['①', '②', '③', '④', '⑤'].map((t, i) => { const [x, y] = iso(8 + i * 11, 24, z); return `<circle cx="${f(x)}" cy="${f(y)}" r="2.8" fill="${i === 3 ? c.hot : 'none'}" stroke="#fff" stroke-width=".5"/>${tx(x, y + 1.3, String(i + 1), { size: 3.4, fill: i === 3 ? c.bg : '#fff', anchor: 'middle' })}`; }).join(''));
  // 조립선(층 모서리를 잇는 점선)
  let guides = '';
  for (const [u, v] of [[0, 0], [LU, 0], [LU, LV], [0, LV]]) { const a = iso(u, v, Z[0]), b = iso(u, v, Z[3]); guides += `<line x1="${f(a[0])}" y1="${f(a[1])}" x2="${f(b[0])}" y2="${f(b[1])}" stroke="#fff" stroke-width=".3" stroke-dasharray="1.4 1.2" opacity=".7"/>`; }
  // 이름표
  const labels = [['01', '발문', '무엇을 묻는가'], ['02', '자료', '어디서 근거를 찾나'], ['03', '보기', 'ㄱ~ㄹ을 하나씩'], ['04', '선지', '함정은 어디에']].map(([n, t, d], i) => {
    const [ax, ay] = iso(LU, LV * 0.15, Z[i]); const lx = 150;
    return `<polyline points="${P([[ax, ay], [lx - 6, ay], [lx - 3, ay]])}" fill="none" stroke="#fff" stroke-width=".3"/><circle cx="${f(ax)}" cy="${f(ay)}" r=".9" fill="#fff"/>
      <circle cx="${lx + 2}" cy="${f(ay)}" r="3.2" fill="none" stroke="${c.hot}" stroke-width=".5"/>${tx(lx + 2, ay + 1.2, n, { size: 3, fill: c.hot, anchor: 'middle' })}
      ${tx(lx + 7.5, ay + 1.4, t, { size: 4.6 })}${tx(lx + 7.5, ay + 6.4, d, { size: 3.2, w: 400, fill: c.sub })}`;
  }).join('');
  // 테두리 글자(MIN만 채움)
  const lay = layout('EXAMINE', { s: 16, d: 18, wf: 1.05 }, 12);
  const inner = lay.glyphs.map((g, i) => `<g transform="translate(${f(g.x)} 0)">${g.polys.map((p) => polyEl(p, MINS.EXAMINE.includes(i) ? `fill="${c.hot}" stroke="${c.hot}" stroke-width="1.6" stroke-linejoin="round"` : 'fill="none" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"')).join('')}</g>`).join('');
  const L = place(inner, { lo: -1, hi: lay.width + 1, w: 172, top: 204 });
  const stamp = `<rect x="128" y="266" width="66" height="18" fill="none" stroke="#fff" stroke-width=".4"/><line x1="128" y1="275" x2="194" y2="275" stroke="#fff" stroke-width=".3"/>${tx(130, 272.4, 'DWG. 2028-EX', { size: 3, w: 500, fill: c.sub, ls: 0.3 })}${tx(130, 281.6, '문항 분해도 · SCALE 1:1', { size: 3, w: 500, fill: c.sub })}`;
  return sheet(c.bg, `${full(rect(c.bg) + grid + frame + guides + L4 + L3 + L2 + L1 + labels + L.g + stamp)}${T(esc(EXN.brand), { y: 15, x: 16, size: 10, weight: 700, color: '#fff', ls: 0.02 })}
    ${textBlock(c, L.bottom + 7, { size: 20 })}${T(esc(EXN.exam), { x: 16, y: 279, size: 8.6, color: c.sub })}`);
}

// ───────── E3 데이터(밝은 바탕) ─────────
function e3() {
  const c = { bg: '#F2EFE8', ink: '#141414', hot: '#E8432E', fg: '#141414', sub: '#6B655F' };
  const L = fillWord('EXAMINE', { color: c.ink, hot: c.hot, w: 180, top: 24 });
  const cx = 105, cy = 170, R = 62, r = 37, total = 25;
  let a = -90, segs = '', labs = '';
  const pt = (deg, rr) => [cx + rr * Math.cos((deg * Math.PI) / 180), cy + rr * Math.sin((deg * Math.PI) / 180)];
  for (const [b, no, n] of DIST) {
    const da = (360 * n) / total, a0 = a + 0.6, a1 = a + da - 0.6, big = da > 180 ? 1 : 0;
    const col = b === '1' ? mix(CH[no], '#ffffff', 0.38) : CH[no];
    const [x0, y0] = pt(a0, R), [x1, y1] = pt(a1, R), [x2, y2] = pt(a1, r), [x3, y3] = pt(a0, r);
    segs += `<path d="M ${f(x0)} ${f(y0)} A ${R} ${R} 0 ${big} 1 ${f(x1)} ${f(y1)} L ${f(x2)} ${f(y2)} A ${r} ${r} 0 ${big} 0 ${f(x3)} ${f(y3)} Z" fill="${col}"/>`;
    const am = a + da / 2, [lx, ly] = pt(am, R + 7), [ex, ey] = pt(am, R + 1.5), right = Math.cos((am * Math.PI) / 180) >= 0;
    labs += `<line x1="${f(ex)}" y1="${f(ey)}" x2="${f(lx)}" y2="${f(ly)}" stroke="${c.ink}" stroke-width=".25"/>${tx(lx + (right ? 1.2 : -1.2), ly + 1.3, `${b === '1' ? '통합사회1' : '통합사회2'} ${no}  ${n}`, { size: 3.4, w: 500, fill: c.ink, anchor: right ? 'start' : 'end' })}`;
    a += da;
  }
  const center = `${tx(cx, cy + 4, '25', { size: 16, fill: c.ink, anchor: 'middle' })}${tx(cx, cy + 10.5, '문항', { size: 4, w: 500, fill: c.sub, anchor: 'middle' })}`;
  const bars = [['통합사회1', 9, mix(c.ink, '#ffffff', 0.45)], ['통합사회2', 16, c.ink]].map(([t, n, col], i) => `${tx(40, 252 + i * 8, t, { size: 3.6, w: 500, fill: c.ink })}<rect x="62" y="${249 + i * 8}" width="${f(n * 5.6)}" height="4" fill="${col}"/>${tx(64 + n * 5.6, 252 + i * 8, `${n}문항`, { size: 3.6, fill: c.ink })}`).join('');
  return sheet(c.bg, `${full(rect(c.bg) + L.g + segs + labs + center + bars + `<line x1="16" y1="${f(L.bottom + 23)}" x2="194" y2="${f(L.bottom + 23)}" stroke="${c.ink}" stroke-width=".6"/>` + tx(16, L.bottom + 31, '2028 수능 예시문항 25문항의 단원 분포', { size: 3.8, fill: c.ink }) + tx(194, L.bottom + 31, '단원 분류: 승민T 통합사회', { size: 3.2, w: 400, fill: c.sub, anchor: 'end' }))}
    ${corners(c, { brand: c.ink })}${T(esc(EXN.kind), { x: 0, w: W, align: 'center', y: L.bottom + 6, size: 20, weight: 700, color: c.ink, ls: -0.01 })}`);
}

// ───────── E4 형광펜 노트 ─────────
function e4() {
  const c = { bg: '#FBF7EC', ink: '#1D1D1F', red: '#E23B3B', hl: '#FFE44D', pink: '#FF8FC7', fg: '#1D1D1F', sub: '#7A746C', rule: '#BFD3EA' };
  let rules = '';
  for (let y = 22; y < H; y += 8) rules += `<line x1="${-B}" y1="${y}" x2="${W + B}" y2="${y}" stroke="${c.rule}" stroke-width=".25"/>`;
  rules += `<line x1="24" y1="${-B}" x2="24" y2="${H + B}" stroke="#F2A3A3" stroke-width=".4"/>`;
  const hand = (x, y, s, o = {}) => tx(x, y, s, { font: 'Nanum Pen Script', w: 400, size: o.size || 7, fill: o.fill || c.red, anchor: o.anchor || 'start', extra: o.rot ? ` transform="rotate(${o.rot} ${f(x)} ${f(y)})"` : '' });
  const bar = (x, y, w, colr = '#B9B3AA') => `<rect x="${x}" y="${y}" width="${w}" height="2.2" rx="1.1" fill="${colr}"/>`;
  // 문항 카드(살짝 기울임)
  const card = `<g transform="rotate(-2.5 105 112)">
    <rect x="36" y="42" width="138" height="138" fill="#000" opacity=".08" transform="translate(1.6 2)"/>
    <rect x="36" y="42" width="138" height="138" fill="#fff" stroke="#E2DED6" stroke-width=".3"/>
    <rect x="44" y="50" width="7" height="7" fill="${c.ink}"/>${tx(47.5, 55.3, '7', { size: 5, anchor: 'middle' })}
    <rect x="90.2" y="51.6" width="8.8" height="4.6" fill="${c.hl}" opacity=".85"/>
    ${tx(56, 55.5, '다음 자료에 나타난 관점으로 옳은 것은?', { size: 4.2, w: 500, fill: c.ink })}
    <rect x="46" y="64" width="118" height="44" fill="none" stroke="${c.ink}" stroke-width=".35"/>
    ${bar(51, 70, 100)}${bar(51, 76, 92)}<rect x="50" y="81" width="64" height="4.2" fill="${c.pink}" opacity=".7"/>${bar(51, 82, 96)}${bar(51, 88, 84)}${bar(51, 94, 98)}${bar(51, 100, 60)}
    ${['①', '②', '③', '④', '⑤'].map((t, i) => `${tx(48, 120 + i * 11, t, { size: 4.4, w: 500, fill: c.ink })}${bar(56, 117.6 + i * 11, [70, 58, 82, 64, 76][i])}`).join('')}
    <ellipse cx="49.5" cy="140" rx="6.4" ry="5" fill="none" stroke="${c.red}" stroke-width=".7" transform="rotate(-8 49.5 140)"/>
    <line x1="56" y1="129" x2="${56 + 58}" y2="129" stroke="${c.red}" stroke-width=".6"/>
  </g>`;
  const notes = `${hand(132, 38, '핵심 개념 → 관점 구분!', { rot: -4 })}<path d="M 130 36 Q 112 40 98 49" fill="none" stroke="${c.red}" stroke-width=".5"/>
    ${hand(150, 110, '자료에서 근거 찾기', { size: 6.4, rot: -6 })}<path d="M 150 108 Q 140 98 128 86" fill="none" stroke="${c.red}" stroke-width=".5"/>
    ${hand(28, 196, '② 함정 — 주어 바꿔치기 ✗', { size: 6.4, rot: -3 })}${hand(118, 178, '③ 정답 근거 = 자료 2줄', { size: 6.4, rot: -3 })}`;
  // 굵은 검정 글자 + MIN 뒤 형광펜
  const L = fillWord('EXAMINE', { color: c.ink, hot: c.ink, w: 176, top: 206, params: { s: 22, d: 25, wf: 1.08 } });
  const g = L.lay.glyphs, x0 = g[3].x, x1 = g[5].x + g[5].w, s = L.s, ox = W / 2 - 88;
  const swipe = `<polygon points="${P([[ox + x0 * s - 3, 206 + 30 * s], [ox + x1 * s + 4, 206 + 22 * s], [ox + x1 * s + 2, 206 + 104 * s], [ox + x0 * s - 4, 206 + 110 * s]])}" fill="${c.hl}" opacity=".9"/>`;
  const font = `<link rel="stylesheet" href="file://${TB}node_modules/@fontsource/nanum-pen-script/400.css">`;
  return sheet(c.bg, `${font}${full(rect(c.bg) + rules + card + notes + swipe + L.g)}${corners(c, { brand: c.ink })}${T(esc(EXN.kind), { x: 0, w: W, align: 'center', y: L.bottom + 7, size: 21, weight: 700, color: c.ink })}${T(esc(EXN.subject), { x: 0, w: W, align: 'center', y: L.bottom + 19, size: 13, weight: 300, color: c.sub })}`);
}

// ───────── E5 입체 큐브 ─────────
function e5() {
  const c = { a: '#4C1D95', b: '#DB2777', d: '#F97316', fg: '#fff', sub: '#FFE4D6' };
  const cx = 105, cy = 112, s = 46;
  const top = [[cx, cy - s], [cx + s * 0.866, cy - s / 2], [cx, cy], [cx - s * 0.866, cy - s / 2]];
  const left = [[cx - s * 0.866, cy - s / 2], [cx, cy], [cx, cy + s], [cx - s * 0.866, cy + s / 2]];
  const right = [[cx, cy], [cx + s * 0.866, cy - s / 2], [cx + s * 0.866, cy + s / 2], [cx, cy + s]];
  // 면 위 글자: 면의 기울기대로(아핀 변환)
  const faceText = (m, t, size) => `<g transform="matrix(${m.join(' ')})">${tx(0, size * 0.36, t, { size, anchor: 'middle', fill: '#fff' })}</g>`;
  const k = 0.866;
  const cube = `<polygon points="${P(top)}" fill="#fff" fill-opacity=".34" stroke="#fff" stroke-width=".7"/>
    <polygon points="${P(left)}" fill="#fff" fill-opacity=".16" stroke="#fff" stroke-width=".7"/>
    <polygon points="${P(right)}" fill="#fff" fill-opacity=".06" stroke="#fff" stroke-width=".7"/>
    ${faceText([k, 0.5, -k, 0.5, cx, cy - s / 2], '개념', 13)}
    ${faceText([k, 0.5, 0, 1, cx - s * k / 2, cy + s / 4], '자료', 13)}
    ${faceText([k, -0.5, 0, 1, cx + s * k / 2, cy + s / 4], '선지', 13)}`;
  // 둘레의 작은 큐브와 궤도
  const mini = (x, y, z, o) => { const t2 = [[x, y - z], [x + z * k, y - z / 2], [x, y], [x - z * k, y - z / 2]], l2 = [[x - z * k, y - z / 2], [x, y], [x, y + z], [x - z * k, y + z / 2]], r2 = [[x, y], [x + z * k, y - z / 2], [x + z * k, y + z / 2], [x, y + z]]; return `<g opacity="${o}"><polygon points="${P(t2)}" fill="#fff" fill-opacity=".5"/><polygon points="${P(l2)}" fill="#fff" fill-opacity=".25"/><polygon points="${P(r2)}" fill="#fff" fill-opacity=".1"/></g>`; };
  const orbit = `<ellipse cx="${cx}" cy="${cy + 6}" rx="88" ry="30" fill="none" stroke="#fff" stroke-width=".35" stroke-dasharray="1.4 1.6" opacity=".7" transform="rotate(-14 ${cx} ${cy + 6})"/>`;
  const minis = mini(30, 70, 9, 0.8) + mini(178, 150, 11, 0.8) + mini(170, 46, 6, 0.6) + mini(44, 168, 7, 0.6);
  const defs = `<linearGradient id="bgg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c.a}"/><stop offset=".55" stop-color="${c.b}"/><stop offset="1" stop-color="${c.d}"/></linearGradient>`;
  const L = fillWord('EXAMINE', { color: '#fff', hot: '#FFE14D', w: 176, top: 198, params: { s: 22, d: 25, wf: 1.08 }, extrude: { steps: 9, dx: 0.8, dy: 0.8, side: '#5B1A6E' } });
  return sheet(c.a, `${full(`<rect x="${-B}" y="${-B}" width="${W + 2 * B}" height="${H + 2 * B}" fill="url(#bgg)"/>` + orbit + minis + cube + L.g, defs)}${corners({ fg: '#fff', sub: c.sub })}${textBlock({ fg: '#fff', sub: c.sub }, L.bottom + 7)}`);
}

// ───────── N1 월계관 ─────────
function n1() {
  const c = { bg: '#0B0A08', g1: '#F7E7A6', g2: '#C9A13B', g3: '#8A6A1E', fg: '#F7E7A6', sub: '#B9A57A' };
  const cx = 105, cy = 108, R = 66;
  // 월계관: 원을 따라 아래에서 위로 오르는 가지 두 개, 잎은 가지 방향에서 안팎으로 35°씩 벌어짐
  let leaves = '';
  const rad = (d) => (d * Math.PI) / 180;
  for (const side of [-1, 1]) {
    const N = 12, pts = [];
    for (let i = 0; i <= N; i++) {
      const t = i / N, th = side < 0 ? 100 + t * 118 : 80 - t * 118; // 왼쪽: 100°→218°, 오른쪽: 80°→-38°
      const x = cx + R * Math.cos(rad(th)), y = cy + R * Math.sin(rad(th));
      // 진행 방향(위로 오르는 쪽)
      const dx = side < 0 ? -Math.sin(rad(th)) : Math.sin(rad(th)), dy = side < 0 ? Math.cos(rad(th)) : -Math.cos(rad(th));
      pts.push([x, y, Math.atan2(dy, dx) * 180 / Math.PI, t]);
    }
    leaves += `<path d="M ${pts.map(([x, y]) => `${f(x)} ${f(y)}`).join(' L ')}" fill="none" stroke="url(#gold)" stroke-width="1"/>`;
    pts.forEach(([x, y, a, t], i) => {
      const sz = 7.4 - t * 3; // 위로 갈수록 작은 잎
      const leaf = (ang) => { const ex = x + Math.cos(rad(ang)) * sz * 0.92, ey = y + Math.sin(rad(ang)) * sz * 0.92; return `<ellipse cx="${f(ex)}" cy="${f(ey)}" rx="${f(sz)}" ry="${f(sz * 0.34)}" fill="url(#gold)" transform="rotate(${f(ang)} ${f(ex)} ${f(ey)})"/>`; };
      if (i === N) leaves += leaf(a);
      else if (i > 0) leaves += leaf(a + 38) + leaf(a - 38);
    });
  }
  const ribbon = `<path d="M ${cx - 9} ${cy + R + 2} Q ${cx} ${cy + R - 4} ${cx + 9} ${cy + R + 2} L ${cx + 5} ${cy + R + 12} L ${cx} ${cy + R + 7} L ${cx - 5} ${cy + R + 12} Z" fill="url(#gold)"/>`;
  const inside = `${tx(cx, cy - 26, 'OFFICIAL', { font: 'KoPub Batang', size: 5.4, fill: c.g1, anchor: 'middle', ls: 2.2 })}${tx(cx, cy - 18, 'NOMINEE', { font: 'KoPub Batang', size: 5.4, fill: c.g1, anchor: 'middle', ls: 2.2 })}
    <line x1="${cx - 22}" y1="${cy - 12}" x2="${cx + 22}" y2="${cy - 12}" stroke="${c.g2}" stroke-width=".4"/>
    ${tx(cx, cy + 14, '2028', { font: 'KoPub Batang', size: 26, fill: 'url(#gold)', anchor: 'middle' })}
    <line x1="${cx - 22}" y1="${cy + 21}" x2="${cx + 22}" y2="${cy + 21}" stroke="${c.g2}" stroke-width=".4"/>
    ${tx(cx, cy + 30, '수능 예시문항', { font: 'KoPub Batang', size: 6, fill: c.g1, anchor: 'middle', ls: 0.8 })}`;
  const defs = `<linearGradient id="gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.g1}"/><stop offset=".55" stop-color="${c.g2}"/><stop offset="1" stop-color="${c.g3}"/></linearGradient>
    <linearGradient id="goldw" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="100"><stop offset="0" stop-color="${c.g1}"/><stop offset=".6" stop-color="${c.g2}"/><stop offset="1" stop-color="${c.g3}"/></linearGradient>`;
  const lay = layout('NOMINEE', { s: 15, d: 17, wf: 1.05 }, 12);
  const inner = lay.glyphs.map((g, i) => `<g transform="translate(${f(g.x)} 0)" fill="${MINS.NOMINEE.includes(i) ? '#FFF6D8' : 'url(#goldw)'}">${g.polys.map((p) => polyEl(p)).join('')}</g>`).join('');
  const L = place(inner, { lo: 0, hi: lay.width, w: 166, top: 204 });
  return sheet(c.bg, `${full(rect(c.bg) + leaves + ribbon + inside + L.g, defs)}${corners(c)}${T(esc(EXN.kind), { x: 0, w: W, align: 'center', y: L.bottom + 8, size: 20, weight: 700, color: c.fg, ls: 0.02 })}${T(esc(EXN.subject), { x: 0, w: W, align: 'center', y: L.bottom + 20, size: 13, weight: 300, color: c.sub })}`);
}

// ───────── N2 스포트라이트 ─────────
function n2() {
  const c = { bg: '#0A0712', card: '#1C1530', line: '#3A2E5C', gold: '#FFC94A', glow: '#B57BFF', fg: '#fff', sub: '#A99BCB' };
  const xs = [29, 67, 105, 143, 181], cy0 = 118, cw = 30, chh = 42;
  let cones = '', cards = '';
  xs.forEach((x, i) => {
    const on = i === 2;
    cones += `<polygon points="${P([[x - 3, -3], [x + 3, -3], [x + cw / 2 + 8, cy0 + chh + 6], [x - cw / 2 - 8, cy0 + chh + 6]])}" fill="url(#${on ? 'coneOn' : 'cone'})"/>`;
    cards += `<ellipse cx="${x}" cy="${cy0 + chh + 7}" rx="${cw / 2 + 9}" ry="3.4" fill="${on ? c.gold : c.glow}" opacity="${on ? 0.45 : 0.16}" filter="url(#gb)"/>
      <rect x="${x - cw / 2}" y="${cy0}" width="${cw}" height="${chh}" rx="2" fill="${on ? '#2A1F12' : c.card}" stroke="${on ? c.gold : c.line}" stroke-width="${on ? 0.9 : 0.5}"/>
      ${tx(x, cy0 + 26, String(i + 1), { size: 18, fill: on ? c.gold : '#5D5180', anchor: 'middle', extra: on ? ' filter="url(#gs)"' : '' })}${on ? tx(x, cy0 + 26, '3', { size: 18, fill: c.gold, anchor: 'middle' }) : ''}
      ${tx(x, cy0 + chh - 5, on ? 'PICK' : '후보', { size: 3.4, fill: on ? c.gold : '#6F6396', anchor: 'middle', ls: on ? 0.8 : 0 })}`;
  });
  const floor = `<rect x="${-B}" y="${cy0 + chh + 4}" width="${W + 2 * B}" height="40" fill="url(#floor)"/>`;
  const defs = `${blur('gb', 2.4)}${blur('gs', 1.6)}
    <linearGradient id="cone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".14"/><stop offset="1" stop-color="#fff" stop-opacity=".02"/></linearGradient>
    <linearGradient id="coneOn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.gold}" stop-opacity=".55"/><stop offset="1" stop-color="${c.gold}" stop-opacity=".1"/></linearGradient>
    <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.glow}" stop-opacity=".18"/><stop offset="1" stop-color="${c.glow}" stop-opacity="0"/></linearGradient>`;
  const L = neonWord('NOMINEE', { glow: c.glow, hot: c.gold, w: 160, top: 200, id: 'nb' });
  return sheet(c.bg, `${full(rect(c.bg) + cones + floor + cards + L.g, defs + L.defs)}${corners(c)}${textBlock(c, L.bottom + 7)}`);
}

// ───────── N3 투표 용지 ─────────
function n3() {
  const c = { bg: '#EFE8D8', paper: '#FFFDF7', ink: '#1E1E1E', red: '#D7263D', fg: '#1E1E1E', sub: '#6E675C' };
  const L = fillWord('NOMINEE', { color: c.ink, hot: c.red, w: 178, top: 24, params: { s: 24, d: 26, wf: 1.1 } });
  const bx = 44, byy = 88, bw = 122, rowH = 24;
  const names = ['개념 이해형', '자료 해석형', '사례 적용형', '입장 비교형', '그래프 해석형'];
  const party = ['#1D6C74', '#7D3566', '#3C7A37', '#B5651D', '#234E8A'];
  let rows = '';
  names.forEach((nm, i) => {
    const y = byy + 16 + i * rowH;
    rows += `<rect x="${bx + 4}" y="${y}" width="${bw - 8}" height="${rowH - 3}" fill="none" stroke="${c.ink}" stroke-width=".45"/>
      <rect x="${bx + 4}" y="${y}" width="14" height="${rowH - 3}" fill="${party[i]}"/>${tx(bx + 11, y + 14.4, String(i + 1), { size: 9, fill: '#fff', anchor: 'middle' })}
      ${tx(bx + 24, y + 13.4, nm, { size: 6, fill: c.ink })}<line x1="${bx + bw - 30}" y1="${y}" x2="${bx + bw - 30}" y2="${y + rowH - 3}" stroke="${c.ink}" stroke-width=".35"/>`;
  });
  // 기표 도장(빨간 동그라미 안에 卜)
  const sx = bx + bw - 17, sy = byy + 16 + 2 * rowH + 10.5;
  const stamp = `<g transform="rotate(-12 ${sx} ${sy})" opacity=".92"><circle cx="${sx}" cy="${sy}" r="8" fill="none" stroke="${c.red}" stroke-width="1.6"/><line x1="${sx - 1.5}" y1="${sy - 5.4}" x2="${sx - 1.5}" y2="${sy + 5.4}" stroke="${c.red}" stroke-width="1.6"/><line x1="${sx - 1.5}" y1="${sy - 0.6}" x2="${sx + 3.6}" y2="${sy + 2.4}" stroke="${c.red}" stroke-width="1.6"/></g>`;
  const ballot = `<g transform="rotate(1.6 105 160)"><rect x="${bx + 1.6}" y="${byy + 2}" width="${bw}" height="${16 + 5 * rowH + 6}" fill="#000" opacity=".08"/>
    <rect x="${bx}" y="${byy}" width="${bw}" height="${16 + 5 * rowH + 6}" fill="${c.paper}" stroke="#D8D0BE" stroke-width=".3"/>
    ${tx(bx + bw / 2, byy + 10.4, '2 0 2 8   수 능   후 보   문 항', { size: 5, fill: c.ink, anchor: 'middle' })}${rows}${stamp}</g>`;
  return sheet(c.bg, `${full(rect(c.bg) + L.g + ballot)}${corners(c, { brand: c.ink })}${T(esc(EXN.kind), { x: 0, w: W, align: 'center', y: L.bottom + 6, size: 20, weight: 700, color: c.ink })}${T(esc(EXN.subject), { x: 0, w: W, align: 'center', y: 246, size: 13, weight: 500, color: c.sub })}`);
}

// ───────── N4 카드 패 ─────────
function n4() {
  const c = { a: '#0F9F7A', b: '#064E3B', fg: '#fff', sub: '#C7F5E4', gold: '#FFD23F' };
  const px = 105, py = 252, cw = 52, chh = 78;
  const types = ['개념', '자료', '사례', '비교', '그래프'];
  const unitCol = ['#1D6C74', '#7D3566', '#3C7A37', '#B5651D', '#234E8A'];
  const cards = [-26, -13, 13, 26, 0].map((rot) => {
    const i = [-26, -13, 0, 13, 26].indexOf(rot), pick = rot === 0;
    const lift = pick ? -14 : 0;
    return `<g transform="rotate(${rot} ${px} ${py}) translate(0 ${lift})">
      <rect x="${px - cw / 2 + 1.2}" y="${py - 150 + 2}" width="${cw}" height="${chh}" rx="3.4" fill="#000" opacity=".18"/>
      <rect x="${px - cw / 2}" y="${py - 150}" width="${cw}" height="${chh}" rx="3.4" fill="#fff" stroke="${pick ? c.gold : '#DCEFE8'}" stroke-width="${pick ? 1.4 : 0.4}"/>
      <rect x="${px - cw / 2 + 3}" y="${py - 147}" width="${cw - 6}" height="16" rx="1.8" fill="${unitCol[i]}"/>
      ${tx(px - cw / 2 + 6, py - 136, `후보 0${i + 1}`, { size: 4.2, fill: '#fff' })}
      ${tx(px, py - 102, String(i + 1), { size: 24, fill: unitCol[i], anchor: 'middle' })}
      ${tx(px, py - 88, `${types[i]}형`, { size: 4.6, fill: '#1E1E1E', anchor: 'middle' })}
      ${pick ? `<rect x="${px - 10}" y="${py - 84}" width="20" height="6" rx="3" fill="${c.gold}"/>${tx(px, py - 79.6, 'PICK', { size: 3.4, fill: '#1E1E1E', anchor: 'middle', ls: 0.6 })}` : ''}
    </g>`;
  }).join('');
  const defs = `<linearGradient id="bgn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.a}"/><stop offset="1" stop-color="${c.b}"/></linearGradient>`;
  const L = fillWord('NOMINEE', { color: '#fff', hot: c.gold, w: 178, top: 26, params: { s: 22, d: 25, wf: 1.08 }, extrude: { steps: 9, dx: 0.8, dy: 0.8, side: '#04382A' } });
  return sheet(c.b, `${full(`<rect x="${-B}" y="${-B}" width="${W + 2 * B}" height="${H + 2 * B}" fill="url(#bgn)"/>` + L.g + cards, defs)}${corners({ fg: '#fff', sub: c.sub })}${textBlock({ fg: '#fff', sub: c.sub }, L.bottom + 6, { size: 20 })}`);
}

// ───────── N5 명단 포스터 ─────────
function n5() {
  const c = { bg: '#FAFAF7', ink: '#141414', red: '#E5262E', fg: '#141414', sub: '#6E6A64' };
  const lay = layout('NOMINEE', { s: 18, d: 20, wf: 1.06 }, 10);
  const w = 160, s = w / lay.width, rowH = 100 * s + 6.4, y0 = 30, x0 = 30;
  let rows = '';
  for (let r = 0; r < 5; r++) {
    const y = y0 + r * rowH, on = r === 2;
    const inner = lay.glyphs.map((g, i) => `<g transform="translate(${f(g.x)} 0)">${g.polys.map((p) => polyEl(p, on ? `fill="${MINS.NOMINEE.includes(i) ? c.ink : c.red}"` : `fill="none" stroke="${c.ink}" stroke-width="${f(0.32 / s)}" stroke-linejoin="round"`)).join('')}</g>`).join('');
    rows += `<g transform="translate(${x0} ${f(y)}) scale(${+s.toFixed(5)})">${inner}</g>`;
    rows += tx(16, y + 4, `0${r + 1}`, { size: 4.2, fill: on ? c.red : c.ink });
    rows += `<rect x="${x0 + w + 4}" y="${f(y + 100 * s / 2 - 3)}" width="6" height="6" fill="${on ? c.red : 'none'}" stroke="${on ? c.red : c.ink}" stroke-width=".5"/>${on ? `<polyline points="${P([[x0 + w + 5.2, y + 100 * s / 2], [x0 + w + 6.8, y + 100 * s / 2 + 1.6], [x0 + w + 9, y + 100 * s / 2 - 1.8]])}" fill="none" stroke="#fff" stroke-width=".8"/>` : ''}`;
  }
  const bottom = y0 + 5 * rowH;
  return sheet(c.bg, `${full(rect(c.bg) + rows + `<line x1="16" y1="${f(bottom + 2)}" x2="194" y2="${f(bottom + 2)}" stroke="${c.ink}" stroke-width="1.2"/>`)}${corners(c, { brand: c.ink })}
    ${T(esc(EXN.kind), { x: 16, y: bottom + 8, size: 22, weight: 700, color: c.ink })}${T(`${esc(EXN.subject)} · 수능에 나올 후보 문항`, { x: 16, y: bottom + 21, size: 12, weight: 400, color: c.sub })}`);
}

export const EXNS = {
  E1: ['EXAMINE', '스캔', e1], E2: ['EXAMINE', '해부도', e2], E3: ['EXAMINE', '데이터', e3], E4: ['EXAMINE', '형광펜 노트', e4], E5: ['EXAMINE', '입체 큐브', e5],
  N1: ['NOMINEE', '월계관', n1], N2: ['NOMINEE', '스포트라이트', n2], N3: ['NOMINEE', '투표 용지', n3], N4: ['NOMINEE', '카드 패', n4], N5: ['NOMINEE', '명단 포스터', n5],
};
