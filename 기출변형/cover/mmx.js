// MINIMAX 2차 시안 — 화려한 색 · 직접 그린 로고 · 포인트 그림 (강사 요청 2026-11-07)
// "메가스터디 1타강사 교재 표지처럼 화려한 색감, 화려한 글꼴(텍스트 말고 새로 디자인), 포인트 이미지. 기존과 완전히 달라도 됨. 후보 5개, 앞·뒷표지."
// 그림은 모두 MINIMAX의 뜻에서 나왔다(시중 표지의 그림·문구는 따라 하지 않음).
//
//   X1 안장점   — 짙은 보라 + 무지개 선으로 그린 안장 모양 곡면(미니맥스 값이 만나는 점) + 넓은 기하 로고
//   X2 게임 트리 — 레몬색 원색 + 미니맥스 결정 나무(▲MAX ▼MIN, 최적 경로 빨강) + 기울인 굵은 로고(빨간 두께)
//   X3 입체 행렬 — 코발트 + 보수 행렬을 입체 막대로(안장점 막대만 노랑) + 쌓은 굵은 로고(MINI/MAX)
//   X4 M 모노그램 — 산호색 + 큰 M = △(MAX) ▽(MIN) 세모 세 개 + 가늘게→굵게 로고
//   X5 네온 길   — 밤색 남색 + 미로 속 가장 짧은 길(빛나는 선) + 세로로 세운 네온 로고
import { CUT, BLEED } from './tokens.js';
import { MM, mmName, mmSeries } from './mm-data.js';
import { esc } from './sheet.js';
import { layout, drawFill, drawExtrude, drawNeon, neonFilter } from './mm-letters.js';

const W = 210, H = 297, B = BLEED, M = 16, LW = W - 2 * M;
const mm = (v) => `${+(+v).toFixed(2)}mm`;
const f = (v) => +(+v).toFixed(2);
const P = (pts) => pts.map((p) => p.map(f).join(',')).join(' ');
const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const hex = (a) => '#' + a.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
const mix = (a, b, t) => hex(rgb(a).map((v, i) => v + (rgb(b)[i] - v) * t));
const ramp = (cols, t) => { const x = Math.max(0, Math.min(1, t)) * (cols.length - 1); const i = Math.min(cols.length - 2, Math.floor(x)); return mix(cols[i], cols[i + 1], x - i); };
const cutPoly = (x, y, w, h, k = CUT) => { const c = Math.min(w, h) * k; return P([[x, y], [x + w - c, y], [x + w, y + c], [x + w, y + h], [x, y + h]]); };

const svgFull = (inner, defs = '') => `<svg class="abs" style="left:-${B}mm;top:-${B}mm;width:${W + 2 * B}mm;height:${H + 2 * B}mm" viewBox="${-B} ${-B} ${W + 2 * B} ${H + 2 * B}" xmlns="http://www.w3.org/2000/svg"><defs>${defs}</defs>${inner}</svg>`;
const rectBg = (fill) => `<rect x="${-B}" y="${-B}" width="${W + 2 * B}" height="${H + 2 * B}" fill="${fill}"/>`;
const T = (s, o) => `<div class="abs" style="${o.right != null ? `right:${mm(o.right)};` : `left:${mm(o.x ?? M)};`}top:${mm(o.y)};${o.w ? `width:${mm(o.w)};` : ''}text-align:${o.align || 'left'};font-family:'${o.font || 'KoPub Dotum'}';font-size:${o.size}pt;font-weight:${o.weight || 400};color:${o.color};letter-spacing:${o.ls || 0}em;line-height:${o.lh || 1.25};white-space:nowrap;${o.extra || ''}">${s}</div>`;
// 로고 SVG를 폭 w(mm)로 놓기. pad: 입체·빛 번짐이 잘리지 않게 둘레 여유(글자 단위)
function placeLogo(lay, inner, { x, y, w, pad = [0, 0, 0, 0], defs = '', style = '' }) {
  const [pt, pr, pb, pl] = pad;
  const vw = lay.width + pl + pr, vh = 100 + pt + pb;
  const scale = w / vw;
  return { html: `<svg class="abs" style="left:${mm(x - pl * scale)};top:${mm(y - pt * scale)};overflow:visible;${style}" width="${mm(w + 0)}" height="${mm(vh * scale)}" viewBox="${-pl} ${-pt} ${vw} ${vh}" xmlns="http://www.w3.org/2000/svg"><defs>${defs}</defs>${inner}</svg>`, h: 100 * scale, scale };
}
// 권 번호 상자(모서리 자른 네모)
const noBox = (v, { right = M, y = 10, bg, fg, sub }) => `<div class="abs" style="right:${mm(right)};top:${mm(y)};display:flex;align-items:flex-end;gap:1.8mm">
  <div class="cut" style="--cut:${mm(12 * CUT)};width:12mm;height:12mm;background:${bg};color:${fg};display:flex;align-items:center;justify-content:center;font-family:'KoPub Dotum';font-weight:700;font-size:15pt;letter-spacing:-.02em">${esc(v.no)}</div>
  <div style="font-family:'KoPub Dotum';font-size:8.6pt;color:${sub};line-height:1;padding-bottom:.4mm">/ ${MM.total}</div></div>`;
// 로고 아래 글자 묶음(책 종류 · 미니맥스 · 과목)
const infoBlock = (v, { x = M, y, w = LW, fg, sub, align = 'left' }) => `<div class="abs" style="left:${mm(x)};top:${mm(y)};width:${mm(w)};text-align:${align}">
  <div style="font-family:'KoPub Dotum';font-weight:700;font-size:16pt;color:${fg};letter-spacing:-.01em;line-height:1.3">${esc(v.kind)}</div>
  <div style="font-family:'KoPub Dotum';font-weight:300;font-size:12pt;color:${sub};margin-top:1.2mm">${esc(v.subject)}<span style="padding-left:4mm;font-weight:500;font-size:9pt;letter-spacing:.3em">${esc(MM.reading)}</span></div></div>`;
const examLine = (o) => T(esc(MM.exam), { y: 279, size: 8.6, color: o.sub, ...o });

// ── 뒷표지 공통 틀(그림·색만 바뀜) ──
function backCommon(v, { bgSvg, fg, sub, faint, mottoFont = 'KoPub Dotum', mottoColor, top = 108, isbnLine }) {
  const items = mmSeries().map((x) => { const s = `${x.no} ${esc(x.short)}`; return x.no === v.no ? `<b style="font-weight:700;color:${fg}">${s}</b>` : s; });
  const sep = `<span style="color:${faint};padding:0 2.2mm">|</span>`;
  const mt = MM.motto[1];
  return `${bgSvg}
  ${T(esc(mmName(v)), { y: 13, size: 9, weight: 500, color: sub })}
  ${T(esc(MM.brand), { right: M, y: 13, size: 9.5, weight: 700, color: fg, ls: 0.02 })}
  <div class="abs" style="left:${mm(M)};top:${mm(top)};width:${mm(LW)}">
    <div style="font-family:'${mottoFont}';font-weight:700;font-size:36pt;line-height:1.24;letter-spacing:-.03em;color:${mottoColor || fg}">${mt.lines.map(esc).join('<br>')}</div>
    <div style="font-family:'KoPub Dotum';font-weight:300;font-size:10.5pt;line-height:1.7;color:${fg};margin-top:9mm">${MM.desc.map(esc).join('<br>')}</div>
    <div style="font-family:'KoPub Dotum';font-weight:500;font-size:8.4pt;color:${sub};margin-top:4.5mm">${esc(MM.meaning)}</div>
  </div>
  <div class="abs" style="left:${mm(M)};top:218mm;font-family:'KoPub Dotum';font-size:8.6pt;line-height:1.85;color:${sub}">${items.slice(0, 4).join(sep)}<br>${items.slice(4).join(sep)}</div>
  <div class="abs" style="right:${mm(M)};top:240mm;width:44mm;height:24mm;background:#fff;outline:.4pt solid ${isbnLine || fg};display:flex;align-items:center;justify-content:center;font-family:'KoPub Dotum';font-size:8pt;color:#5E6166">${esc(MM.isbn)}</div>
  <div class="abs" style="left:${mm(M)};width:${mm(LW)};top:272mm;border-top:.4pt solid ${faint}"></div>
  ${T(`<b style="font-weight:700;color:${fg}">${esc(MM.brand)}</b><span style="padding-left:3mm">${esc(MM.contact)}</span>`, { y: 275, size: 8.6, color: sub })}
  ${T(esc(MM.price), { right: M, y: 275, size: 8.6, color: sub })}`;
}

// ═════════ X1 안장점 ═════════
const X1 = { bg: '#22104E', glow: '#6A35D6', fg: '#FFFFFF', sub: '#B9A9E8', faint: '#4A3A86', pal: ['#2BD9FE', '#7C6CFF', '#E040FB', '#FF4F8B', '#FF9F1C', '#FFD60A'] };
// z = h(u² − v²)를 비스듬히 본 선 그림. (cx, cy): 안장점이 놓일 자리, R: 크기(mm)
function saddle(cx, cy, R, { n = 17, h = 0.62, yaw = 38, elev = 28, w = 0.42 } = {}) {
  const ry = (yaw * Math.PI) / 180, e = (elev * Math.PI) / 180;
  const proj = (u, v) => {
    const z = h * (u * u - v * v);
    const x1 = u * Math.cos(ry) - v * Math.sin(ry), y1 = u * Math.sin(ry) + v * Math.cos(ry);
    return [cx + x1 * R, cy + (y1 * Math.sin(e) - z * Math.cos(e)) * R];
  };
  let o = '';
  const steps = 40;
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1), a = -1 + 2 * t;
    const l1 = [], l2 = [];
    for (let k = 0; k <= steps; k++) { const b = -1 + (2 * k) / steps; l1.push(proj(b, a)); l2.push(proj(a, b)); }
    o += `<polyline points="${P(l1)}" fill="none" stroke="${ramp(X1.pal, t)}" stroke-width="${w}" stroke-opacity=".95"/>`;
    o += `<polyline points="${P(l2)}" fill="none" stroke="${ramp(X1.pal, 1 - t)}" stroke-width="${w}" stroke-opacity=".7"/>`;
  }
  return o;
}
const glowF = `<filter id="gl" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="3"/></filter><radialGradient id="rg"><stop offset="0" stop-color="${X1.glow}" stop-opacity=".9"/><stop offset="1" stop-color="${X1.glow}" stop-opacity="0"/></radialGradient>`;
function x1Front(v) {
  const cx = 105, cy = 116;
  const lay = layout('MINIMAX', { s: 14, d: 16, wf: 1.35, cut: 6 }, 16);
  const L = placeLogo(lay, drawFill(lay, { color: X1.fg }), { x: M, y: 206, w: LW });
  return `${svgFull(`${rectBg(X1.bg)}<circle cx="${cx}" cy="${cy}" r="120" fill="url(#rg)"/>${saddle(cx, cy, 98)}
    <circle cx="${cx}" cy="${cy}" r="7" fill="#fff" filter="url(#gl)"/><polygon points="${cutPoly(cx - 2.6, cy - 2.6, 5.2, 5.2)}" fill="#FFD60A"/>`, glowF)}
  ${T(esc(MM.brand), { y: 13, size: 10, weight: 700, color: X1.fg, ls: 0.02 })}
  ${noBox(v, { bg: '#FFD60A', fg: X1.bg, sub: X1.sub })}
  ${L.html}
  ${infoBlock(v, { y: 206 + L.h + 8, fg: X1.fg, sub: X1.sub })}
  ${examLine({ sub: X1.sub })}`;
}
function x1Back(v) {
  return backCommon(v, { bgSvg: svgFull(`${rectBg(X1.bg)}<circle cx="150" cy="58" r="60" fill="url(#rg)"/>${saddle(150, 58, 46, { n: 13, w: 0.3 })}<polygon points="${cutPoly(148.6, 56.6, 2.8, 2.8)}" fill="#FFD60A"/>`, glowF), fg: X1.fg, sub: X1.sub, faint: X1.faint, isbnLine: '#fff' });
}

// ═════════ X2 게임 트리 ═════════
const X2 = { bg: '#FFC93C', ink: '#1E2124', red: '#E63946', paper: '#FFFDF5' };
// 고전 예: 잎 [3,12,8] [2,4,6] [14,5,2] → MIN 3·2·2 → MAX 3 (최적 경로: 뿌리 → 첫째 MIN → 잎 3)
const LEAVES = [[3, 12, 8], [2, 4, 6], [14, 5, 2]];
function tree(ox, oy, k = 1) {
  const X = (x) => ox + x * k, Y = (y) => oy + y * k;
  const root = [0, 0], mins = [[-60, 50], [0, 50], [60, 50]];
  const leaf = (i, j) => [mins[i][0] + (j - 1) * 19, 108];
  let lines = '', nodes = '';
  const edge = (a, b, hot) => `<line x1="${f(X(a[0]))}" y1="${f(Y(a[1]))}" x2="${f(X(b[0]))}" y2="${f(Y(b[1]))}" stroke="${hot ? X2.red : X2.ink}" stroke-width="${f((hot ? 2.6 : 0.9) * k)}" stroke-linecap="round"/>`;
  mins.forEach((m, i) => {
    lines += edge(root, m, i === 0);
    LEAVES[i].forEach((_, j) => { lines += edge(m, leaf(i, j), i === 0 && j === 0); });
  });
  const tri = (c, s, up, fill, stroke) => { const [x, y] = [X(c[0]), Y(c[1])], r = s * k; return `<polygon points="${P(up ? [[x, y - r], [x + r * 1.05, y + r * 0.75], [x - r * 1.05, y + r * 0.75]] : [[x, y + r], [x + r * 1.05, y - r * 0.75], [x - r * 1.05, y - r * 0.75]])}" fill="${fill}" stroke="${stroke}" stroke-width="${f(0.9 * k)}"/>`; };
  const val = (c, n, dx, col = X2.ink, size = 7) => `<text x="${f(X(c[0] + dx))}" y="${f(Y(c[1]) + 1.2 * k)}" font-family="KoPub Dotum" font-weight="700" font-size="${f(size * k)}" fill="${col}" dominant-baseline="central">${n}</text>`;
  nodes += tri(root, 10, true, X2.red, X2.ink) + val(root, 3, 14, X2.red, 8);
  mins.forEach((m, i) => { nodes += tri(m, 8, false, i === 0 ? X2.ink : X2.paper, X2.ink) + val(m, Math.min(...LEAVES[i]), 11, i === 0 ? X2.red : X2.ink); });
  LEAVES.forEach((row, i) => row.forEach((n, j) => {
    const c = leaf(i, j), hot = i === 0 && j === 0, s = 12 * k;
    nodes += `<polygon points="${cutPoly(X(c[0]) - s / 2, Y(c[1]) - s / 2, s, s)}" fill="${hot ? X2.red : X2.paper}" stroke="${X2.ink}" stroke-width="${f(0.9 * k)}"/><text x="${f(X(c[0]))}" y="${f(Y(c[1]) + 0.6 * k)}" text-anchor="middle" dominant-baseline="central" font-family="KoPub Dotum" font-weight="700" font-size="${f(6.4 * k)}" fill="${hot ? '#fff' : X2.ink}">${n}</text>`;
  }));
  const lab = (t, y) => `<text x="${f(X(-92))}" y="${f(Y(y))}" font-family="KoPub Dotum" font-weight="700" font-size="${f(4.6 * k)}" fill="${X2.ink}" letter-spacing="${f(0.5 * k)}" dominant-baseline="central">${t}</text>`;
  return lines + nodes + lab('MAX', 0) + lab('MIN', 50);
}
function x2Front(v) {
  const lay = layout('MINIMAX', { s: 27, d: 27, wf: 1.22 }, 7);
  const L = placeLogo(lay, `<g transform="skewX(-12)">${drawExtrude(lay, { color: X2.ink, side: X2.red, steps: 7, dx: 1.3, dy: 1.3 })}</g>`, { x: M + 4, y: 50, w: LW - 24, pad: [0, 14, 14, 0], style: 'transform:rotate(-8deg);transform-origin:20mm 60mm' });
  return `${svgFull(`${rectBg(X2.bg)}${tree(118, 124, 1)}`)}
  ${T(esc(MM.brand), { y: 13, size: 10, weight: 700, color: X2.ink, ls: 0.02 })}
  ${noBox(v, { bg: X2.ink, fg: X2.bg, sub: X2.ink })}
  ${L.html}
  ${T('통합사회 1+2', { x: 24, y: 100, size: 26, weight: 700, font: 'KoPub Batang', color: X2.paper, extra: 'transform:rotate(-8deg);transform-origin:0 0' })}
  ${infoBlock(v, { y: 252, fg: X2.ink, sub: '#5A4A1A' })}
  ${examLine({ sub: '#5A4A1A', right: M, x: undefined })}`;
}
function x2Back(v) {
  return backCommon(v, { bgSvg: svgFull(`${rectBg(X2.bg)}${tree(150, 42, 0.42)}`), fg: X2.ink, sub: '#5A4A1A', faint: '#C9982A' });
}

// ═════════ X3 입체 행렬 ═════════
const X3 = { bg: '#2F5BFF', fg: '#FFFFFF', sub: '#C9D6FF', faint: '#5E7FFF', hot: '#FFD23F' };
const PAYOFF = [[9, 2, 5, 8, 3], [7, 8, 6, 9, 7], [4, 9, 3, 6, 8], [8, 1, 5, 2, 9]];
function bars(ox, oy, k = 1) {
  const iso = (x, y, z) => [ox + (x - y) * 0.866 * k, oy + ((x + y) * 0.5 - z) * k];
  const cell = 22, gap = 5, hz = 6.2;
  let o = '';
  // 바닥판
  const R = PAYOFF.length, Cn = PAYOFF[0].length, Wd = Cn * cell, Dp = R * cell;
  o += `<polygon points="${P([iso(-4, -4, 0), iso(Wd + 4, -4, 0), iso(Wd + 4, Dp + 4, 0), iso(-4, Dp + 4, 0)])}" fill="#2448D6"/>`;
  o += `<polygon points="${P([iso(Wd + 4, -4, 0), iso(Wd + 4, Dp + 4, 0), iso(Wd + 4, Dp + 4, -5), iso(Wd + 4, -4, -5)])}" fill="#1A36A8"/><polygon points="${P([iso(Wd + 4, Dp + 4, 0), iso(-4, Dp + 4, 0), iso(-4, Dp + 4, -5), iso(Wd + 4, Dp + 4, -5)])}" fill="#152C8A"/>`;
  // 뒤에서 앞으로(x+y 작은 것부터)
  const order = [];
  PAYOFF.forEach((row, r) => row.forEach((n, c) => order.push([r, c, n])));
  order.sort((a, b) => (a[0] + a[1]) - (b[0] + b[1]));
  for (const [r, c, n] of order) {
    const hot = r === 1 && c === 2;
    const x0 = c * cell + gap / 2, y0 = r * cell + gap / 2, s = cell - gap, z = n * hz;
    const top = hot ? X3.hot : '#FFFFFF', right = hot ? '#F2B705' : '#D3DEFF', left = hot ? '#D99A00' : '#A9BEFF';
    o += `<polygon points="${P([iso(x0 + s, y0, 0), iso(x0 + s, y0 + s, 0), iso(x0 + s, y0 + s, z), iso(x0 + s, y0, z)])}" fill="${right}"/>`;
    o += `<polygon points="${P([iso(x0 + s, y0 + s, 0), iso(x0, y0 + s, 0), iso(x0, y0 + s, z), iso(x0 + s, y0 + s, z)])}" fill="${left}"/>`;
    o += `<polygon points="${P([iso(x0, y0, z), iso(x0 + s, y0, z), iso(x0 + s, y0 + s, z), iso(x0, y0 + s, z)])}" fill="${top}"/>`;
    if (hot) {
      const [tx, ty] = iso(x0 + s / 2, y0 + s / 2, z);
      o += `<line x1="${f(tx)}" y1="${f(ty)}" x2="${f(tx)}" y2="${f(ty - 26 * k)}" stroke="#fff" stroke-width="${f(0.6 * k)}"/><polygon points="${cutPoly(tx - 6 * k, ty - 38 * k, 12 * k, 12 * k)}" fill="${X3.hot}"/><text x="${f(tx)}" y="${f(ty - 31.6 * k)}" text-anchor="middle" dominant-baseline="central" font-family="KoPub Dotum" font-weight="700" font-size="${f(7 * k)}" fill="${X3.bg}">${n}</text>`;
    }
  }
  return o;
}
function x3Front(v) {
  const l1 = layout('MINI', { s: 27, d: 27, wf: 1.22 }, 7), l2 = layout('MAX', { s: 27, d: 27, wf: 1.22 }, 7);
  const A = placeLogo(l1, drawExtrude(l1, { color: X3.fg, side: '#1A36A8', steps: 6, dx: 1.1, dy: 1.1 }), { x: M, y: 30, w: 118, pad: [0, 10, 10, 0] });
  const Bm = placeLogo(l2, drawExtrude(l2, { color: X3.hot, side: '#1A36A8', steps: 6, dx: 1.1, dy: 1.1 }), { x: M, y: 30 + A.h + 5, w: 118 * (l2.width / l1.width), pad: [0, 10, 10, 0] });
  const y2 = 30 + A.h + 5 + Bm.h;
  return `${svgFull(`${rectBg(X3.bg)}${bars(112, 170, 0.94)}`)}
  ${T(esc(MM.brand), { y: 13, size: 10, weight: 700, color: X3.fg, ls: 0.02 })}
  ${noBox(v, { bg: X3.hot, fg: X3.bg, sub: X3.sub })}
  <div class="abs" style="left:${mm(W - M - 10)};top:34mm;width:10mm;height:64mm;background:${X3.fg};display:flex;justify-content:center;padding-top:3mm"><div style="writing-mode:vertical-rl;font-family:'KoPub Dotum';font-weight:700;font-size:8.6pt;color:${X3.bg};letter-spacing:.06em">2028 수능 대비</div></div>
  ${A.html}${Bm.html}
  ${infoBlock(v, { y: y2 + 9, w: 130, fg: X3.fg, sub: X3.sub })}
  ${T('2022 개정 교육과정', { y: 279, size: 8.6, color: X3.sub })}`;
}
function x3Back(v) {
  return backCommon(v, { bgSvg: svgFull(`${rectBg(X3.bg)}${bars(150, 44, 0.42)}`), fg: X3.fg, sub: X3.sub, faint: X3.faint, isbnLine: '#fff', top: 112 });
}

// ═════════ X4 M 모노그램 ═════════
const X4 = { bg: '#FF5B47', navy: '#1B1F4B', cream: '#FFF3D6', amber: '#FFB000', sub: '#FFE1D6', faint: '#FF9A8A' };
// △(MAX) 두 개와 ▽(MIN) 하나가 겹쳐 큰 M. 겹친 자리는 호박색
function monogram(x0, y0, w, h) {
  const a = x0, b = x0 + w * 0.25, c = x0 + w * 0.5, d = x0 + w * 0.75, e = x0 + w, top = y0, bot = y0 + h;
  const L = [[a, bot], [b, top], [c + w * 0.06, bot]], R = [[c - w * 0.06, bot], [d, top], [e, bot]];
  const V = [[b - w * 0.07, top], [d + w * 0.07, top], [c, bot]];
  const lab = (t, x, y, col, s) => `<text x="${f(x)}" y="${f(y)}" text-anchor="middle" font-family="KoPub Dotum" font-weight="700" font-size="${s}" fill="${col}" letter-spacing="${s * 0.12}">${t}</text>`;
  return `<clipPath id="mv"><polygon points="${P(L)}"/><polygon points="${P(R)}"/></clipPath>
    <polygon points="${P(L)}" fill="${X4.navy}"/><polygon points="${P(R)}" fill="${X4.navy}"/>
    <polygon points="${P(V)}" fill="${X4.cream}"/><polygon points="${P(V)}" fill="${X4.amber}" clip-path="url(#mv)"/>
    ${lab('MAX', b, bot - h * 0.12, X4.cream, w * 0.035)}${lab('MAX', d, bot - h * 0.12, X4.cream, w * 0.035)}${lab('MIN', c, top + h * 0.16, X4.navy, w * 0.035)}`;
}
function x4Front(v) {
  const lay = layout('MINIMAX', (i) => (i < 3 ? { s: 5, d: 6, wf: 1.05 } : i === 3 ? { s: 13, d: 15 } : { s: 27, d: 28, wf: 1.25 }), 9);
  const L = placeLogo(lay, drawFill(lay, { color: X4.cream }), { x: M, y: 196, w: LW });
  return `${svgFull(`${rectBg(X4.bg)}${monogram(4, 34, 202, 140)}`)}
  ${T(esc(MM.brand), { y: 13, size: 10, weight: 700, color: X4.cream, ls: 0.02 })}
  ${noBox(v, { bg: X4.navy, fg: X4.cream, sub: X4.cream })}
  ${L.html}
  ${infoBlock(v, { y: 196 + L.h + 8, fg: X4.cream, sub: X4.sub })}
  ${examLine({ sub: X4.sub })}`;
}
function x4Back(v) {
  return backCommon(v, { bgSvg: svgFull(`${rectBg(X4.bg)}${monogram(124, 30, 70, 50)}`), fg: X4.cream, sub: X4.sub, faint: X4.faint, mottoColor: X4.navy, isbnLine: X4.navy });
}

// ═════════ X5 네온 길 ═════════
const X5 = { bg: '#0B1026', wall: '#26306B', cyan: '#29E3FF', pink: '#FF3EC8', fg: '#FFFFFF', sub: '#8C95C9', faint: '#2A3260' };
// 칸 격자 위의 벽과 가장 짧은 길. (gx, gy): 왼쪽 위, c: 칸 크기(mm)
const PATH = [[0, 8], [0, 6], [2, 6], [2, 4], [1, 4], [1, 2], [3, 2], [3, 1], [5, 1], [5, 3], [6, 3], [6, 0]];
const WALLS = [[[0, 7], [1, 7]], [[1, 5], [1, 7]], [[2, 7], [4, 7]], [[3, 4], [3, 6]], [[0, 3], [2, 3]], [[2, 1], [2, 3]], [[4, 2], [4, 5]], [[4, 5], [6, 5]], [[5, 6], [5, 8]], [[1, 1], [2, 1]], [[6, 1], [6, 2]], [[3, 0], [4, 0]]];
function maze(gx, gy, c, { cols = 7, rows = 9, glowId = 'ng' } = {}) {
  const X = (i) => gx + i * c, Y = (j) => gy + j * c;
  let o = '';
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) o += `<circle cx="${f(X(i))}" cy="${f(Y(j))}" r="${f(c * 0.045)}" fill="${X5.wall}"/>`;
  for (const [[a, b], [p, q]] of WALLS) o += `<line x1="${f(X(a))}" y1="${f(Y(b))}" x2="${f(X(p))}" y2="${f(Y(q))}" stroke="${X5.wall}" stroke-width="${f(c * 0.12)}" stroke-linecap="square"/>`;
  const pts = PATH.map(([i, j]) => [X(i), Y(j)]);
  o += `<linearGradient id="pg" gradientUnits="userSpaceOnUse" x1="${f(pts[0][0])}" y1="${f(pts[0][1])}" x2="${f(pts.at(-1)[0])}" y2="${f(pts.at(-1)[1])}"><stop offset="0" stop-color="${X5.cyan}"/><stop offset="1" stop-color="${X5.pink}"/></linearGradient>`;
  o += `<polyline points="${P(pts)}" fill="none" stroke="url(#pg)" stroke-width="${f(c * 0.34)}" stroke-linejoin="miter" opacity=".6" filter="url(#${glowId})"/>`;
  o += `<polyline points="${P(pts)}" fill="none" stroke="url(#pg)" stroke-width="${f(c * 0.12)}" stroke-linejoin="miter"/><polyline points="${P(pts)}" fill="none" stroke="#fff" stroke-width="${f(c * 0.04)}" stroke-linejoin="miter"/>`;
  const [sx, sy] = pts[0], [ex, ey] = pts.at(-1), s = c * 0.5;
  o += `<circle cx="${f(sx)}" cy="${f(sy)}" r="${f(c * 0.16)}" fill="${X5.cyan}"/><polygon points="${cutPoly(ex - s / 2, ey - s / 2, s, s)}" fill="${X5.pink}" filter="url(#${glowId})"/><polygon points="${cutPoly(ex - s / 2, ey - s / 2, s, s)}" fill="${X5.pink}"/>`;
  return o;
}
const ng = (sd = 2.4) => `<filter id="ng" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="${sd}"/></filter>`;
// 강사가 고른 안(2026-11-07): 로고는 가로로, 뒷표지는 대표 문장 + 회색 한 줄만
function x5Front(v) {
  const c = 19, gx = (W - 6 * c) / 2, gy = 30; // 미로 7×9 점, 가운데 위
  const lay = layout('MINIMAX', { s: 8, d: 9, wf: 1 }, 18);
  const L = placeLogo(lay, drawNeon(lay, { w: 6 }), { x: M, y: 196, w: LW, pad: [10, 10, 10, 10], defs: neonFilter('nb', 4) });
  return `${svgFull(`${rectBg(X5.bg)}${maze(gx, gy, c)}`, ng(2.2))}
  ${T(esc(MM.brand), { y: 13, size: 10, weight: 700, color: X5.fg, ls: 0.02 })}
  ${noBox(v, { bg: X5.pink, fg: X5.bg, sub: X5.sub })}
  ${L.html}
  ${infoBlock(v, { y: 196 + L.h + 10, fg: X5.fg, sub: X5.sub })}
  ${examLine({ sub: X5.sub })}`;
}
function x5Back(v) {
  return `${svgFull(`${rectBg(X5.bg)}${maze(M + 4, 40, 9.5)}`, ng(1.2))}
  <div class="abs" style="left:${mm(M)};top:132mm;width:${mm(LW)}">
    <div style="font-family:'KoPub Dotum';font-weight:700;font-size:36pt;line-height:1.24;letter-spacing:-.03em;color:${X5.cyan}">${MM.motto[1].lines.map(esc).join('<br>')}</div>
    <div style="font-family:'KoPub Dotum';font-weight:500;font-size:11pt;color:${X5.sub};margin-top:7mm;letter-spacing:.01em">${esc(MM.backLine)}</div>
  </div>`;
}

export const MMX = { X1: '안장점', X2: '게임 트리', X3: '입체 행렬', X4: 'M 모노그램', X5: '네온 길' };
const FN = { X1: [x1Front, x1Back, X1.bg], X2: [x2Front, x2Back, X2.bg], X3: [x3Front, x3Back, X3.bg], X4: [x4Front, x4Back, X4.bg], X5: [x5Front, x5Back, X5.bg] };
export function mmxFace(k, side, v) {
  const [fr, bk, bg] = FN[k];
  return `<section class="sheet" style="background:${bg}"><div class="t" style="overflow:visible">${side === 'front' ? fr(v) : bk(v)}</div></section>`;
}
