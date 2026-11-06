// MAXIMIN 실전 모의고사 10회 — 앞·뒷표지 시안 4개 (강사 요청 2026-11-07)
// "최저점(MIN)을 만점(MAX)으로". 포인트 이미지만 다르고, 틀·색·네온 로고는 같다(비교하기 쉽게).
//   G1 점수 상승 그래프 — 1회~10회 점 10개가 MIN에서 만점(50점)까지 오르는 네온 꺾은선(MINIMAX 미로 길과 같은 짜임: 시작 점 → 끝 네모)
//   G2 계기판         — 10칸 눈금이 모두 켜지고 바늘이 MAX를 가리키는 속도계
//   G3 OMR 답안지      — 빨간 OMR 답안지(수험 번호 2028 50, 25문항 마킹) + 금색 '50 만점' 채점 동그라미
//   G4 충전 막대       — 10칸(1회~10회)이 아래 빨강(MIN)에서 위 금색(MAX)까지 꽉 찬 배터리
// 뒷표지는 MINIMAX·MINIMAP과 같은 짜임: 문구 없이 작은 포인트 이미지 + 작은 네온 MAXIMIN을 쪽 가운데.
// 실행: node cover/build-cover.mjs maxi [G1 …] → out/cover/MAXI-<후보>-<이름>-앞표지·뒷표지
import { esc } from './sheet.js';
import { BLEED } from './tokens.js';
import { layout, drawNeon, neonFilter, neonExtent } from './mm-letters.js';
import { MAXI } from './mm-data.js';

const W = 210, H = 297, B = BLEED, M = 16;
const mm = (v) => `${+(+v).toFixed(2)}mm`;
const f = (v) => +(+v).toFixed(2);
const P = (pts) => pts.map((p) => p.map(f).join(',')).join(' ');
const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const hex = (a) => '#' + a.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
const mix = (a, b, t) => hex(rgb(a).map((v, i) => v + (rgb(b)[i] - v) * t));
const cutPoly = (x, y, w, h, k = 0.18) => { const c = Math.min(w, h) * k; return P([[x, y], [x + w - c, y], [x + w, y + c], [x + w, y + h], [x, y + h]]); };
const T = (s, o) => `<div class="abs" style="${o.right != null ? `right:${mm(o.right)};` : `left:${mm(o.x ?? M)};`}top:${mm(o.y)};${o.w ? `width:${mm(o.w)};` : ''}text-align:${o.align || 'left'};font-family:'KoPub Dotum';font-size:${o.size}pt;font-weight:${o.weight || 400};color:${o.color};letter-spacing:${o.ls || 0}em;line-height:${o.lh || 1.25};white-space:nowrap;${o.extra || ''}">${s}</div>`;
const full = (inner, defs = '') => `<svg class="abs" style="left:-${B}mm;top:-${B}mm;width:${W + 2 * B}mm;height:${H + 2 * B}mm" viewBox="${-B} ${-B} ${W + 2 * B} ${H + 2 * B}" xmlns="http://www.w3.org/2000/svg"><defs>${defs}</defs>${inner}</svg>`;
const sheet = (bg, inner) => `<section class="sheet" style="background:${bg}"><div class="t" style="overflow:visible">${inner}</div></section>`;
// 그림 안 글자(SVG, 단위 mm)
const tx = (x, y, s, o = {}) => `<text x="${f(x)}" y="${f(y)}" font-family="KoPub Dotum" font-weight="${o.w || 700}" font-size="${o.size || 4}" fill="${o.fill || '#fff'}" text-anchor="${o.anchor || 'start'}"${o.ls ? ` letter-spacing="${o.ls}"` : ''}${o.extra || ''}>${esc(s)}</text>`;

// 색: 진한 와인빛 검정 바탕, 빨강(MIN) → 금색(MAX)
export const K = { bg: '#12060B', panel: '#1E0A12', line: '#4A1A28', faint: '#33121C', red: '#FF3355', gold: '#FFC23D', fg: '#FFFFFF', sub: '#C9A2AE' };
const ramp = (t) => mix(K.red, K.gold, Math.max(0, Math.min(1, t)));
// 그림 안 빛 번짐(그림 좌표 기준, 넉넉한 범위)
const glow = (id, sd, w, h) => `<filter id="${id}" filterUnits="userSpaceOnUse" x="-30" y="-30" width="${w + 60}" height="${h + 60}"><feGaussianBlur stdDeviation="${sd}"/></filter>`;

// ── 포인트 이미지: 그림 좌표(0,0)~(w,h) mm로 그린다. 앞표지는 그대로, 뒷표지는 줄여서 쓴다 ──
const IW = 178, IH = 158;

// G1 점수 상승 그래프
function g1(id) {
  const x0 = 22, x1 = 168, yT = 16, yB = 138; // 50점 · 0점
  const SC = [8, 15, 13, 21, 26, 30, 35, 41, 45, 50];
  const X = (i) => x0 + (i * (x1 - x0)) / 9, Y = (s) => yB - ((yB - yT) * s) / 50;
  const pts = SC.map((s, i) => [X(i), Y(s)]);
  let grid = '';
  for (let s = 0; s <= 50; s += 10) grid += `<line x1="${x0}" y1="${f(Y(s))}" x2="${x1 + 4}" y2="${f(Y(s))}" stroke="${s === 50 ? K.gold : K.line}" stroke-width="${s === 50 ? 0.5 : 0.3}"${s === 50 ? ' stroke-dasharray="1.6 1.2"' : ''}/>`;
  const xl = SC.map((_, i) => tx(X(i), yB + 8, `${i + 1}회`, { size: 3.6, w: 500, fill: K.sub, anchor: 'middle' })).join('');
  const area = `<polygon points="${P([[pts[0][0], yB], ...pts, [pts[9][0], yB]])}" fill="url(#${id}ar)"/>`;
  const line = (sw, stroke, extra = '') => `<polyline points="${P(pts)}" fill="none" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round" stroke-linecap="round" ${extra}/>`;
  const dots = pts.slice(1, 9).map(([x, y], i) => `<circle cx="${f(x)}" cy="${f(y)}" r="1.7" fill="${K.bg}" stroke="${ramp((i + 1) / 9)}" stroke-width=".8"/>`).join('');
  const [sx, sy] = pts[0], [ex, ey] = pts[9];
  const defs = `${glow(`${id}g`, 1.5, IW, IH)}
    <linearGradient id="${id}ln" gradientUnits="userSpaceOnUse" x1="${x0}" y1="0" x2="${x1}" y2="0"><stop offset="0" stop-color="${K.red}"/><stop offset="1" stop-color="${K.gold}"/></linearGradient>
    <linearGradient id="${id}ar" gradientUnits="userSpaceOnUse" x1="0" y1="${yT}" x2="0" y2="${yB}"><stop offset="0" stop-color="${K.gold}" stop-opacity=".28"/><stop offset="1" stop-color="${K.red}" stop-opacity="0"/></linearGradient>`;
  const svg = `${grid}${area}
    ${line(3.6, `url(#${id}ln)`, `opacity=".55" filter="url(#${id}g)"`)}${line(1.3, `url(#${id}ln)`)}${line(0.45, '#fff')}
    ${dots}
    <circle cx="${f(sx)}" cy="${f(sy)}" r="2.6" fill="${K.red}"/>
    <polygon points="${cutPoly(ex - 3.4, ey - 3.4, 6.8, 6.8, 0.24)}" fill="${K.gold}" filter="url(#${id}g)"/><polygon points="${cutPoly(ex - 3.4, ey - 3.4, 6.8, 6.8, 0.24)}" fill="${K.gold}"/>
    ${tx(x0 - 4, Y(50) + 1.6, 'MAX', { size: 4.6, fill: K.gold, anchor: 'end', ls: 0.4 })}
    ${tx(x0 - 4, Y(0) + 1.6, 'MIN', { size: 4.6, fill: K.red, anchor: 'end', ls: 0.4 })}
    ${tx(ex, ey - 6.5, '50', { size: 7, fill: K.gold, anchor: 'middle' })}
    ${xl}`;
  return { svg, defs };
}

// G2 계기판
function g2(id) {
  const cx = 89, cy = 112, R = 78;
  const at = (deg, r) => [cx + r * Math.cos((deg * Math.PI) / 180), cy + r * Math.sin((deg * Math.PI) / 180)];
  const arc = (a0, a1, r) => { const [x0, y0] = at(a0, r), [x1, y1] = at(a1, r); return `M ${f(x0)} ${f(y0)} A ${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${f(x1)} ${f(y1)}`; };
  let segs = '';
  for (let i = 0; i < 10; i++) {
    const a0 = 180 + i * 18 + 1, a1 = 180 + (i + 1) * 18 - 1, col = ramp(i / 9);
    segs += `<path d="${arc(a0, a1, R)}" fill="none" stroke="${col}" stroke-width="9" opacity=".5" filter="url(#${id}g)"/><path d="${arc(a0, a1, R)}" fill="none" stroke="${col}" stroke-width="7"/>`;
  }
  let ticks = '';
  for (let s = 0; s <= 50; s++) {
    const a = 180 + (s * 180) / 50, major = s % 10 === 0;
    const [xa, ya] = at(a, R - 8), [xb, yb] = at(a, R - (major ? 14 : 10.5));
    ticks += `<line x1="${f(xa)}" y1="${f(ya)}" x2="${f(xb)}" y2="${f(yb)}" stroke="${major ? K.fg : K.sub}" stroke-width="${major ? 0.6 : 0.25}" opacity="${major ? 1 : 0.7}"/>`;
    if (major) { const [lx, ly] = at(a, R - 21); ticks += tx(lx, ly + 1.4, String(s), { size: 4, w: 500, fill: s === 50 ? K.gold : K.sub, anchor: 'middle' }); }
  }
  const na = 352, [nx, ny] = at(na, R - 4), [bx1, by1] = at(na + 90, 2.6), [bx2, by2] = at(na - 90, 2.6), [tx0, ty0] = at(na + 180, 12);
  const needle = `<polygon points="${P([[nx, ny], [bx1, by1], [tx0, ty0], [bx2, by2]])}" fill="#fff" opacity=".55" filter="url(#${id}g)"/><polygon points="${P([[nx, ny], [bx1, by1], [tx0, ty0], [bx2, by2]])}" fill="#fff"/>
    <circle cx="${cx}" cy="${cy}" r="5.4" fill="${K.bg}" stroke="${K.gold}" stroke-width="1.3"/><circle cx="${cx}" cy="${cy}" r="1.6" fill="${K.gold}"/>`;
  const defs = glow(`${id}g`, 1.6, IW, IH);
  const svg = `<path d="${arc(180, 360, R)}" fill="none" stroke="${K.faint}" stroke-width="11"/>${segs}${ticks}${needle}
    ${tx(cx - R, cy + 11, 'MIN', { size: 6, fill: K.red, anchor: 'middle', ls: 0.5 })}
    ${tx(cx + R, cy + 11, 'MAX', { size: 6, fill: K.gold, anchor: 'middle', ls: 0.5 })}
    ${tx(cx, cy + 30, '50', { size: 16, fill: K.gold, anchor: 'middle', extra: ` filter="url(#${id}g)" opacity=".6"` })}${tx(cx, cy + 30, '50', { size: 16, fill: K.gold, anchor: 'middle' })}
    ${tx(cx, cy + 38, 'SCORE / 50', { size: 3.6, w: 500, fill: K.sub, anchor: 'middle', ls: 0.6 })}`;
  return { svg, defs };
}

// G3 OMR 답안지
function g3(id) {
  const red = K.red, ink = mix(K.red, K.bg, 0.35);
  const bub = (x, y, n, filled, rw = 2.1, rh = 3.1) => filled
    ? `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${rw}" ry="${rh}" fill="${K.gold}" opacity=".55" filter="url(#${id}g)"/><ellipse cx="${f(x)}" cy="${f(y)}" rx="${rw}" ry="${rh}" fill="${K.gold}"/>`
    : `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${rw}" ry="${rh}" fill="none" stroke="${red}" stroke-width=".35"/>${tx(x, y + 1.1, String(n), { size: 2.7, w: 500, fill: red, anchor: 'middle' })}`;
  let o = `<rect x="0" y="0" width="${IW}" height="${IH}" rx="2.4" fill="${K.panel}" stroke="${red}" stroke-width=".6"/>
    <path d="M 2.4 0 H ${IW - 2.4} A 2.4 2.4 0 0 1 ${IW} 2.4 V 14 H 0 V 2.4 A 2.4 2.4 0 0 1 2.4 0 Z" fill="${red}"/>
    ${tx(7, 9.4, '통합사회 실전 모의고사 답안지', { size: 4.6, fill: '#fff' })}
    ${tx(IW - 7, 9.4, '제 10 회', { size: 4.6, fill: '#fff', anchor: 'end' })}`;
  // 수험 번호 (2 0 2 8 5 0)
  const NO = [2, 0, 2, 8, 5, 0], nx0 = 9, ny0 = 32, dx = 7.2, dy = 9.6;
  o += tx(6, 22, '수험 번호', { size: 3.6, fill: red });
  o += `<rect x="5" y="25" width="${NO.length * dx + 2.4}" height="${10 * dy + 2}" fill="none" stroke="${ink}" stroke-width=".35"/>`;
  NO.forEach((d, c) => { for (let r = 0; r < 10; r++) o += bub(nx0 + c * dx, ny0 + r * dy, r, r === d, 1.9, 2.8); });
  o += tx(6, 137, '성명', { size: 3.6, fill: red }) + `<line x1="18" y1="138" x2="${5 + NO.length * dx + 2.4}" y2="138" stroke="${ink}" stroke-width=".35"/>`;
  // 답안 25문항: 세 칸(1~9, 10~17, 18~25), 칠한 칸은 한 줄에 하나
  const ANS = [3, 1, 4, 5, 2, 2, 5, 1, 3, 4, 2, 5, 1, 3, 4, 2, 5, 3, 1, 4, 2, 3, 5, 1, 4];
  const cols = [[1, 9], [10, 17], [18, 25]], cx0 = 62, cw = 38, ry0 = 30, rdy = 12.4, bdx = 5.6;
  cols.forEach(([a, b], ci) => {
    const x = cx0 + ci * cw;
    o += tx(x + 1, 22, '문항', { size: 3.2, fill: red }) + tx(x + 9 + 2 * bdx, 22, '답 란', { size: 3.2, fill: red, anchor: 'middle' });
    for (let q = a; q <= b; q++) {
      const y = ry0 + (q - a) * rdy;
      o += tx(x + 3, y + 1.3, String(q), { size: 3.6, fill: '#fff', anchor: 'middle' });
      for (let k = 1; k <= 5; k++) o += bub(x + 9 + (k - 1) * bdx, y, k, ANS[q - 1] === k);
      if (q < b) o += `<line x1="${x}" y1="${f(y + rdy / 2)}" x2="${x + cw - 4}" y2="${f(y + rdy / 2)}" stroke="${ink}" stroke-width=".2"/>`;
    }
  });
  // 타이밍 마크(아래 가장자리)
  for (let x = 6; x < IW - 6; x += 4.2) o += `<rect x="${f(x)}" y="${IH - 7}" width="2.4" height="3.6" fill="${ink}"/>`;
  // 채점 동그라미: 50 만점
  const sx = 150, sy = 42;
  o += `<g transform="rotate(-12 ${sx} ${sy})"><circle cx="${sx}" cy="${sy}" r="19" fill="none" stroke="${K.gold}" stroke-width="3" opacity=".5" filter="url(#${id}g)"/>
    <circle cx="${sx}" cy="${sy}" r="19" fill="${K.bg}" fill-opacity=".72" stroke="${K.gold}" stroke-width="1.6"/>
    ${tx(sx, sy + 4.4, '50', { size: 14, fill: K.gold, anchor: 'middle' })}${tx(sx, sy + 11.6, '만점', { size: 4.4, fill: K.gold, anchor: 'middle', ls: 0.6 })}</g>`;
  return { svg: o, defs: glow(`${id}g`, 1.2, IW, IH) };
}

// G4 충전 막대
function g4(id) {
  const bx = 59, by = 12, bw = 60, bh = 144, pad = 5, gap = 2.4, n = 10;
  const sh = (bh - 2 * pad - (n - 1) * gap) / n;
  let segs = '', labels = '';
  for (let i = 0; i < n; i++) {
    const y = by + bh - pad - (i + 1) * sh - i * gap, col = ramp(i / (n - 1));
    segs += `<rect x="${bx + pad}" y="${f(y)}" width="${bw - 2 * pad}" height="${f(sh)}" rx="1.2" fill="${col}" opacity=".55" filter="url(#${id}g)"/><rect x="${bx + pad}" y="${f(y)}" width="${bw - 2 * pad}" height="${f(sh)}" rx="1.2" fill="${col}"/>`;
    labels += tx(bx + bw + 7, y + sh / 2 + 1.3, `${i + 1}회`, { size: 3.8, w: 500, fill: i === n - 1 ? K.gold : K.sub });
  }
  const body = `<rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="7" fill="none" stroke="#fff" stroke-width="1.6" opacity=".5" filter="url(#${id}g)"/>
    <rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="7" fill="${K.panel}" stroke="#fff" stroke-width="1.3"/>
    <rect x="${bx + bw / 2 - 12}" y="${by - 8}" width="24" height="8" rx="2.4" fill="#fff"/>`;
  const svg = `${body}${segs}${labels}
    ${tx(bx - 7, by + pad + sh / 2 + 2.1, 'MAX', { size: 6, fill: K.gold, anchor: 'end', ls: 0.5 })}
    ${tx(bx - 7, by + bh - pad - sh / 2 + 2.1, 'MIN', { size: 6, fill: K.red, anchor: 'end', ls: 0.5 })}`;
  return { svg, defs: glow(`${id}g`, 1.6, IW, IH) };
}

export const MAXIS = { G1: ['점수 상승 그래프', g1], G2: ['계기판', g2], G3: ['OMR 답안지', g3], G4: ['충전 막대', g4] };

// 네온 MAXIMIN(MINIMAX와 같은 관 굵기). 보이는 관 기준 가운데, 폭 w, 위 top
function logo(w, top, id) {
  const lay = layout('MAXIMIN', { s: 8, d: 9, wf: 1 }, 18);
  const [lo, hi] = neonExtent(lay, 9);
  const s = w / (hi - lo);
  return { g: `<g transform="translate(${f(W / 2 - w / 2 - lo * s)} ${f(top + 4.5 * s)}) scale(${+s.toFixed(5)})">${drawNeon(lay, { w: 9, glow: K.red, blurId: id })}</g>`, defs: neonFilter(id, 4), bottom: top + 109 * s, h: 109 * s };
}
const bg = `<rect x="${-B}" y="${-B}" width="${W + 2 * B}" height="${H + 2 * B}" fill="${K.bg}"/>`;

export function maxiFront(k) {
  const img = MAXIS[k][1]('f');
  const L = logo(160, 200, 'nb');
  return sheet(K.bg, `${full(`${bg}<g transform="translate(${(W - IW) / 2} 28)">${img.svg}</g>${L.g}`, img.defs + L.defs)}
    ${T(esc(MAXI.brand), { y: 13, size: 10, weight: 700, color: K.fg, ls: 0.02 })}
    ${T(esc(MAXI.kind), { x: 0, w: W, align: 'center', y: L.bottom + 6, size: 22, weight: 700, color: K.fg, ls: -0.01 })}
    ${T(esc(MAXI.subject), { x: 0, w: W, align: 'center', y: L.bottom + 18.5, size: 15, weight: 300, color: K.sub })}
    ${T(esc(MAXI.exam), { right: M, y: 279, size: 8.6, color: K.sub })}`);
}
// 뒷표지: 작은 그림(폭 iw) + 작은 네온 로고(폭 64)를 한 덩어리로 쪽 가운데
export function maxiBack(k, { iw = 78, logoW = 64, gap = 14 } = {}) {
  const img = MAXIS[k][1]('b');
  const s = iw / IW, ih = IH * s;
  const lh = logo(logoW, 0, 'nb').h;
  const top = H / 2 - (ih + gap + lh) / 2;
  const L = logo(logoW, top + ih + gap, 'nb');
  return sheet(K.bg, full(`${bg}<g transform="translate(${f((W - iw) / 2)} ${f(top)}) scale(${+s.toFixed(5)})">${img.svg}</g>${L.g}`, img.defs + L.defs));
}
