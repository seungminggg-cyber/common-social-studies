// MINIMAP 개념서 앞표지 후보 5개 (강사 요청 2026-11-07)
// "MINIMAX에 미로가 들어간 것처럼 MINIMAP에는 지도. 작은 지도에서 온 세상을 다 보듯, 이 개념서에서 시작해 만점의 초석을 다진다."
// 통합사회1·2는 디자인이 같고 색만 다르다 → 후보마다 색 묶음 { 1: {...}, 2: {...} }.
//   M1 네온 지구   — MINIMAX와 같은 남색·네온. 우리나라를 가운데 둔 지구본, 서울에서 세계로 뻗는 선
//   M2 게임 미니맵 — 게임 화면 구석의 '미니맵'. 픽셀 세계 지도, YOU ARE HERE, 대단원 Ⅰ~Ⅴ 퀘스트, LV·EXP
//   M3 돋보기      — 팝아트 망점 세계 지도 + 우리나라를 크게 보여 주는 돋보기
//   M4 등고선      — 산의 등고선, 대단원 Ⅰ~Ⅴ 쉼터를 지나 정상(100점)에 오르는 길
//   M5 접힌 지도   — 아코디언처럼 접힌 종이 세계 지도 + 우리나라에 꽂은 핀
// 지도 자료: 개념서와 같은 Natural Earth '한국 관점' 경계(독도 포함). 실행: node cover/build-cover.mjs mmap
import { esc } from './sheet.js';
import { BLEED } from './tokens.js';
import { layout, drawFill, drawExtrude, drawNeon, neonFilter, neonExtent, polyEl } from './mm-letters.js';
import { MMAP } from './mm-data.js';
import { d3, world, pathOf, isLand, contourPaths } from './mmap-geo.js';

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
const bgRect = (fill) => `<rect x="${-B}" y="${-B}" width="${W + 2 * B}" height="${H + 2 * B}" fill="${fill}"/>`;
const blur = (id, sd) => `<filter id="${id}" filterUnits="userSpaceOnUse" x="-20" y="-20" width="250" height="340"><feGaussianBlur stdDeviation="${sd}"/></filter>`;
const sheet = (bg, inner) => `<section class="sheet" style="background:${bg}"><div class="t" style="overflow:visible">${inner}</div></section>`;
// 글자 묶음을 쪽 가운데에: 보이는 왼쪽·오른쪽 끝(lo·hi, 글자 단위)을 폭 w(mm)에 맞추고, 보이는 위 끝(yTop, 글자 단위)을 top(mm)에
function placeWord(inner, { lo, hi, w, top, yTop = 0, cx = W / 2 }) {
  const s = w / (hi - lo);
  return { g: `<g transform="translate(${f(cx - w / 2 - lo * s)} ${f(top - yTop * s)}) scale(${+s.toFixed(5)})">${inner}</g>`, s, bottom: top + (100 - yTop) * s };
}
const brand = (color) => T(esc(MMAP.brand), { y: 13, size: 10, weight: 700, color, ls: 0.02 });
const exam = (color) => T(esc(MMAP.exam), { right: M, y: 279, size: 8.6, color });
const kindLine = (v, color, y, o = {}) => T(esc(v.kind), { x: 0, w: W, align: 'center', y, size: 22, weight: 700, color, ls: -0.01, ...o });
const SEOUL = [126.98, 37.57];
const KOR = () => ({ type: 'FeatureCollection', features: world('50m').kor });
const KOR10 = () => ({ type: 'FeatureCollection', features: world('10m').kor });

// ───────────── M1 네온 지구 ─────────────
const C1 = {
  1: { bg: '#061A2C', sea: '#0C2A47', neon: '#2BE4FF', hot: '#7CFFB2', fg: '#FFFFFF', sub: '#8FB3CF' },
  2: { bg: '#170A2B', sea: '#2A1247', neon: '#FF4FD8', hot: '#FFB443', fg: '#FFFFFF', sub: '#C2A6DC' },
};
// 네온 지구본(앞·뒷표지 같은 그림, 크기만 다름). R: 반지름(mm). 선 굵기·빛 번짐은 크기에 맞춰 줄이되 너무 가늘어지지 않게
function neonGlobe(c, { cx, cy, R }) {
  const ctr = [127.5, 20];
  const k = Math.max(R / 80, 0.55), q = (x) => f(x * k);
  const proj = d3.geoOrthographic().rotate([-ctr[0], -ctr[1]]).translate([cx, cy]).scale(R).clipAngle(90).precision(0.1);
  const w = world('50m');
  const landD = pathOf(proj, w.land), korD = pathOf(proj, KOR());
  const cities = [[151.21, -33.87], [77.21, 28.61], [37.62, 55.75], [103.82, 1.35], [-149.9, 61.22], [-157.86, 21.31], [55.27, 25.2], [174.78, -41.29], [100.5, 13.76], [144.96, -37.81], [121.47, 31.23], [139.69, 35.69]];
  let grads = '', arcs = '', dots = '';
  cities.forEach(([lon, lat], i) => {
    if (d3.geoDistance([lon, lat], ctr) > Math.PI / 2 - 0.08) return;
    const a = proj(SEOUL), b = proj([lon, lat]);
    grads += `<linearGradient id="a${i}" gradientUnits="userSpaceOnUse" x1="${f(a[0])}" y1="${f(a[1])}" x2="${f(b[0])}" y2="${f(b[1])}"><stop offset="0" stop-color="${c.hot}"/><stop offset="1" stop-color="${c.neon}"/></linearGradient>`;
    const d = pathOf(proj, { type: 'LineString', coordinates: [SEOUL, [lon, lat]] });
    arcs += `<path d="${d}" fill="none" stroke="url(#a${i})" stroke-width="${q(1.8)}" opacity=".45" filter="url(#gl)"/><path d="${d}" fill="none" stroke="url(#a${i})" stroke-width="${q(0.55)}"/>`;
    dots += `<circle cx="${f(b[0])}" cy="${f(b[1])}" r="${q(2.2)}" fill="${c.neon}" opacity=".45" filter="url(#gl)"/><circle cx="${f(b[0])}" cy="${f(b[1])}" r="${q(0.8)}" fill="#fff"/>`;
  });
  const [sx, sy] = proj(SEOUL);
  const ping = [[2.6, 0.95], [5.4, 0.6], [8.6, 0.3]].map(([r, o]) => `<circle cx="${f(sx)}" cy="${f(sy)}" r="${q(r)}" fill="none" stroke="${c.hot}" stroke-width="${q(0.45)}" opacity="${o}"/>`).join('') + `<circle cx="${f(sx)}" cy="${f(sy)}" r="${q(1.1)}" fill="#fff"/>`;
  const A = R + 16 * k; // 대기 빛
  const defs = `${blur('gl', f(1.1 * k))}
    <radialGradient id="atm" cx="${cx}" cy="${cy}" r="${f(A)}" gradientUnits="userSpaceOnUse"><stop offset="${f(R / A)}" stop-color="${c.neon}" stop-opacity=".32"/><stop offset="1" stop-color="${c.neon}" stop-opacity="0"/></radialGradient>
    <radialGradient id="body" cx="${f(cx - R * 0.35)}" cy="${f(cy - R * 0.45)}" r="${f(R * 1.6)}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${c.sea}"/><stop offset="1" stop-color="${c.bg}"/></radialGradient>${grads}`;
  const svg = `<circle cx="${cx}" cy="${cy}" r="${f(A)}" fill="url(#atm)"/><circle cx="${cx}" cy="${cy}" r="${R}" fill="url(#body)"/>
    <path d="${pathOf(proj, d3.geoGraticule().step(R < 50 ? [30, 30] : [15, 15])())}" fill="none" stroke="${c.neon}" stroke-width="${q(0.2)}" opacity=".22"/>
    <path d="${landD}" fill="${c.neon}" opacity=".09"/>
    <path d="${landD}" fill="none" stroke="${c.neon}" stroke-width="${q(1.5)}" opacity=".5" filter="url(#gl)"/>
    <path d="${landD}" fill="none" stroke="${c.neon}" stroke-width="${q(0.42)}" stroke-linejoin="round"/>
    <path d="${pathOf(proj, w.borders)}" fill="none" stroke="${c.neon}" stroke-width="${q(0.16)}" opacity=".45"/>
    <path d="${korD}" fill="${c.hot}" opacity=".6" filter="url(#gl)"/><path d="${korD}" fill="${c.hot}"/>
    ${arcs}${dots}${ping}
    <circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="${c.neon}" stroke-width="${q(0.5)}" opacity=".7"/>`;
  return { defs, svg, A };
}
const neonWord = () => { const lay = layout('MINIMAP', { s: 8, d: 9, wf: 1 }, 18); const [lo, hi] = neonExtent(lay, 9); return { lay, lo, hi }; };
function m1(v) {
  const c = C1[v.n];
  const G = neonGlobe(c, { cx: 105, cy: 104, R: 80 });
  const { lay, lo, hi } = neonWord();
  const L = placeWord(drawNeon(lay, { w: 9, glow: c.neon }), { lo, hi, w: 160, top: 200, yTop: -4.5 });
  return sheet(c.bg, `${full(bgRect(c.bg) + G.svg + L.g, G.defs + neonFilter('nb', 4))}
    ${brand(c.fg)}
    ${kindLine(v, c.fg, L.bottom + 8)}
    ${exam(c.sub)}`);
}
// 뒷표지(강사 2026-11-07 1번 '네온 지구' 고름): MINIMAX 뒷표지와 같은 짜임 — 문구 없이 작은 지구본 + 작은 네온 MINIMAP을 한 덩어리로 쪽 가운데
export function m1Back(v, { R = 31, logoW = 64, gap = 16, cy = H / 2 } = {}) {
  const c = C1[v.n];
  const { lay, lo, hi } = neonWord();
  const s = logoW / (hi - lo), logoH = (100 + 9) * s;
  const top = cy - (2 * R + gap + logoH) / 2;
  const G = neonGlobe(c, { cx: W / 2, cy: top + R, R });
  const L = placeWord(drawNeon(lay, { w: 9, glow: c.neon }), { lo, hi, w: logoW, top: top + 2 * R + gap, yTop: -4.5 });
  return sheet(c.bg, full(bgRect(c.bg) + G.svg + L.g, G.defs + neonFilter('nb', 4)));
}

// ───────────── M2 게임 미니맵 ─────────────
const C2 = {
  1: { bg: '#5B2EFF', panel: '#130B3B', frame: '#9C8BFF', land: '#B9FF3F', grid: '#2A1F6E', accent: '#FFE03A', fg: '#FFFFFF', shadow: '#1B0F5C', sub: '#D4CCFF' },
  2: { bg: '#FF5A2E', panel: '#2A0C10', frame: '#FFB8A3', land: '#3FF2FF', grid: '#5C1D1D', accent: '#FFE03A', fg: '#FFFFFF', shadow: '#82200C', sub: '#FFE3DA' },
};
// 굵은 픽셀 글자(가로 칸, 세로 7칸)
const PX = {
  M: ['XX....XX', 'XXX..XXX', 'XXXXXXXX', 'XX.XX.XX', 'XX....XX', 'XX....XX', 'XX....XX'],
  I: ['XX', 'XX', 'XX', 'XX', 'XX', 'XX', 'XX'],
  N: ['XX...XX', 'XXX..XX', 'XXXX.XX', 'XX.XXXX', 'XX..XXX', 'XX...XX', 'XX...XX'],
  A: ['..XXX..', '.XX.XX.', 'XX...XX', 'XX...XX', 'XXXXXXX', 'XX...XX', 'XX...XX'],
  P: ['XXXXXX.', 'XX...XX', 'XX...XX', 'XXXXXX.', 'XX.....', 'XX.....', 'XX.....'],
};
function pixelWord(word, { x, y, cell, color, shadow, off = 0.45 }) {
  let cx = 0, rects = '', sh = '';
  for (const ch of word) {
    const rows = PX[ch];
    // 한 줄에서 이어진 칸은 한 네모로(칸 사이 이음매가 보이지 않게)
    rows.forEach((r, j) => r.replace(/X+/g, (run, i) => {
      const X = x + (cx + i) * cell, Y = y + j * cell, w = run.length * cell;
      const box = (a, b) => `M${f(a)} ${f(b)}h${f(w)}v${f(cell + 0.05)}h${f(-w)}Z`;
      sh += box(X + off * cell, Y + off * cell);
      rects += box(X, Y);
      return run;
    }));
    cx += rows[0].length + 1;
  }
  return `<path fill="${shadow}" d="${sh}"/><path fill="${color}" d="${rects}"/>`;
}
const pixelWidth = (word) => [...word].reduce((a, ch) => a + PX[ch][0].length + 1, -1);
function m2(v) {
  const c = C2[v.n];
  // 픽셀 로고
  const LW = 178, cols = pixelWidth('MINIMAP'), cell = LW / cols;
  const LY = 38;
  const logo = pixelWord('MINIMAP', { x: (W - LW) / 2, y: LY, cell, color: c.fg, shadow: c.shadow });
  const logoB = LY + 7 * cell;
  // 미니맵 판
  // 온 세계: 경도 20°W에서 시작해 한 바퀴(5°씩 72칸), 위도 82°N ~ 53°S
  const NC = 72, NR = 28, px0 = 14, py0 = 106, pw = 182, cs = (pw - 12) / NC, mx0 = px0 + 6, my0 = py0 + 14;
  const ph = 14 + NR * cs + 26;
  const lonOf = (i) => -17.5 + 5 * i, latOf = (j) => 82 - 5 * j;
  let cells = '', gridL = '';
  for (let j = 0; j < NR; j++) for (let i = 0; i < NC; i++) {
    const lon = lonOf(i), lat = latOf(j);
    if (!isLand(lon, lat)) continue;
    const dl = Math.abs(lon - 127.5) % 360, dist = Math.hypot(Math.min(dl, 360 - dl), lat - 37);
    const op = 1 - 0.62 * Math.min(1, Math.max(0, (dist - 25) / 110)); // 멀수록 흐림(안 가 본 곳)
    cells += `<rect x="${f(mx0 + i * cs + cs * 0.07)}" y="${f(my0 + j * cs + cs * 0.07)}" width="${f(cs * 0.86)}" height="${f(cs * 0.86)}" opacity="${f(op)}"/>`;
  }
  for (let i = 0; i <= NC; i += 6) gridL += `<line x1="${f(mx0 + i * cs)}" y1="${my0}" x2="${f(mx0 + i * cs)}" y2="${f(my0 + NR * cs)}"/>`;
  for (let j = 0; j <= NR; j += 6) gridL += `<line x1="${mx0}" y1="${f(my0 + j * cs)}" x2="${f(mx0 + NC * cs)}" y2="${f(my0 + j * cs)}"/>`;
  const at = (lon, lat) => { const L = lon < -20 ? lon + 360 : lon; return [mx0 + ((L + 17.5) / 5 + 0.5) * cs, my0 + ((82 - lat) / 5 + 0.5) * cs]; };
  // 대단원 퀘스트 Ⅰ~Ⅴ
  const quests = [['Ⅰ', 95, 62], ['Ⅱ', 22, 8], ['Ⅲ', -102, 47], ['Ⅳ', -60, -12], ['Ⅴ', 134, -24]].map(([t, lon, lat]) => {
    const [x, y] = at(lon, lat), s = 5.4;
    return `<polygon points="${cutPoly(x - s / 2, y - s / 2, s, s, 0.22)}" fill="${c.accent}" stroke="${c.panel}" stroke-width=".5"/><text x="${f(x)}" y="${f(y + 1.25)}" text-anchor="middle" font-family="KoPub Dotum" font-weight="700" font-size="3.6" fill="${c.panel}">${t}</text>`;
  }).join('');
  // 플레이어(우리나라)
  const [kx, ky] = at(127.5, 37);
  const player = [[3.2, 0.9], [5.8, 0.5], [8.6, 0.25]].map(([r, o]) => `<circle cx="${f(kx)}" cy="${f(ky)}" r="${r}" fill="none" stroke="${c.accent}" stroke-width=".5" opacity="${o}"/>`).join('')
    + `<polygon points="${P([[kx, ky - 3.4], [kx + 2.6, ky + 2.4], [kx, ky + 1.1], [kx - 2.6, ky + 2.4]])}" fill="${c.accent}" stroke="#fff" stroke-width=".5" stroke-linejoin="round"/>`
    + `<polyline points="${P([[kx + 3, ky - 3], [kx + 9, ky - 9], [kx + 12, ky - 9]])}" fill="none" stroke="${c.fg}" stroke-width=".35"/>`;
  const tagX = kx + 12, tagY = ky - 12.2;
  // EXP 막대
  const segN = 14, segW = 6.6, bx = 46, by = py0 + ph - 13;
  let segs = '';
  for (let k = 0; k < segN; k++) segs += `<rect x="${f(bx + k * (segW + 1))}" y="${f(by)}" width="${segW}" height="5" fill="${k < 2 ? c.accent : 'none'}" stroke="${k < 2 ? c.accent : c.frame}" stroke-width=".35" opacity="${k < 2 ? 1 : 0.6}"/>`;
  const brk = (x, y, dx, dy) => `<polyline points="${P([[x, y + dy * 7], [x, y], [x + dx * 7, y]])}" fill="none" stroke="${c.accent}" stroke-width="1.3"/>`;
  const panel = `<rect x="${px0}" y="${py0}" width="${pw}" height="${ph}" fill="${c.panel}"/>
    <rect x="${px0 + 1.2}" y="${py0 + 1.2}" width="${pw - 2.4}" height="${ph - 2.4}" fill="none" stroke="${c.frame}" stroke-width=".35" opacity=".6"/>
    ${brk(px0 - 2.5, py0 - 2.5, 1, 1)}${brk(px0 + pw + 2.5, py0 - 2.5, -1, 1)}${brk(px0 - 2.5, py0 + ph + 2.5, 1, -1)}${brk(px0 + pw + 2.5, py0 + ph + 2.5, -1, -1)}
    <g stroke="${c.grid}" stroke-width=".3">${gridL}</g>
    <g fill="${c.land}">${cells}</g>
    ${quests}${player}
    ${segs}`;
  const html = `
    ${T('WORLD MAP', { x: px0 + 6, y: py0 + 4.4, size: 8, weight: 700, color: c.land, ls: 0.22 })}
    ${T('N 37°33′ · E 126°58′', { right: W - (px0 + pw) + 6, y: py0 + 4.4, size: 8, weight: 500, color: c.sub, ls: 0.06 })}
    ${T('YOU ARE HERE', { x: tagX, y: tagY, size: 6.4, weight: 700, color: c.panel, ls: 0.12, extra: `background:${c.fg};padding:0.5mm 1.4mm;` })}
    ${T(`LV.${v.n}`, { x: px0 + 6, y: by - 1.6, size: 12, weight: 700, color: c.accent, ls: 0.04 })}
    ${T('EXP', { right: W - (px0 + pw) + 6, y: by - 0.2, size: 8, weight: 700, color: c.sub, ls: 0.18 })}`;
  return sheet(c.bg, `${full(bgRect(c.bg) + logo + panel)}
    ${brand(c.fg)}
    ${kindLine(v, c.fg, logoB + 7)}
    ${html}
    ${T('▶ PRESS START', { x: 0, w: W, align: 'center', y: py0 + ph + 22, size: 13, weight: 700, color: c.accent, ls: 0.3, extra: 'padding-left:0.3em;' })}
    ${exam(c.sub)}`);
}

// ───────────── M3 돋보기 ─────────────
const C3 = {
  1: { bg: '#FFD60A', ocean: '#EDB800', dot: '#16132B', hot: '#FF2E7E', paper: '#FFF8DA', ink: '#16132B', sub: '#4A3F10' },
  2: { bg: '#3CC8FF', ocean: '#22AEEA', dot: '#101436', hot: '#FF5A1F', paper: '#ECFAFF', ink: '#101436', sub: '#0E3550' },
};
function m3(v) {
  const c = C3[v.n];
  // 지도를 쪽보다 넓게(300mm) 그려 양옆을 잘라 크게 보이게, 가운데 경도 110°E
  const Y0 = 110, Hm = 300 / 2.05;
  const proj = d3.geoEqualEarth().rotate([-110, 0]).fitExtent([[-45, Y0], [255, Y0 + Hm]], { type: 'Sphere' });
  const korF = KOR();
  const inKor = (ll) => ll[0] > 124 && ll[0] < 132.2 && ll[1] > 33 && ll[1] < 38.8 && korF.features.some((k) => d3.geoContains(k, ll));
  // 망점: 육각 격자. 바다·바탕은 작은 점, 땅은 큰 점
  const sp = 2.05, rh = sp * 0.866, RL = 0.82, RS = 0.28;
  let small = '', big = '', hot = '';
  for (let r = 0, y = -3 + rh / 2; y < H + B; r++, y += rh) {
    for (let x = -3 + (r % 2 ? sp / 2 : 0); x < W + B; x += sp) {
      let land = false, kor = false;
      if (y > Y0 - 2 && y < Y0 + Hm + 2) {
        const ll = proj.invert([x, y]);
        if (ll) {
          const back = proj(ll);
          if (ll[1] > -57 && Math.hypot(back[0] - x, back[1] - y) < 0.05 && isLand(ll[0], ll[1])) { land = true; kor = inKor(ll); }
        }
      }
      if (kor) hot += `<circle cx="${f(x)}" cy="${f(y)}" r="${RL + 0.04}"/>`;
      else if (land) big += `<circle cx="${f(x)}" cy="${f(y)}" r="${RL}"/>`;
      else small += `<circle cx="${f(x)}" cy="${f(y)}" r="${RS}"/>`;
    }
  }
  // 돋보기: 우리나라 위에
  const [lx, ly] = proj([127.8, 36.4]);
  const LR = 40;
  const zp = d3.geoMercator().center([127.9, 36.2]).scale(215).translate([lx, ly]);
  let zdots = '';
  for (let r = 0, y = ly - LR + 0.6; y < ly + LR; r++, y += rh) {
    for (let x = lx - LR + (r % 2 ? sp / 2 : 0); x < lx + LR; x += sp) {
      if (Math.hypot(x - lx, y - ly) > LR) continue;
      const ll = zp.invert([x, y]);
      if (isLand(ll[0], ll[1]) && !inKor(ll)) zdots += `<circle cx="${f(x)}" cy="${f(y)}" r="${RL}"/>`;
    }
  }
  const korZ = pathOf(zp, KOR10());
  const [skx, sky] = zp(SEOUL);
  const ang = (135 * Math.PI) / 180, hx = lx + Math.cos(ang) * (LR + 1.5), hy = ly + Math.sin(ang) * (LR + 1.5);
  const lens = `<circle cx="${f(lx + 2.6)}" cy="${f(ly + 2.6)}" r="${LR + 2.2}" fill="${c.ink}" opacity=".9"/>
    <g transform="translate(${f(hx)} ${f(hy)}) rotate(135)">
      <rect x="-1" y="-5" width="9" height="10" fill="${c.hot}" stroke="${c.ink}" stroke-width=".8"/>
      <rect x="7" y="-4.3" width="32" height="8.6" rx="4.3" fill="${c.ink}"/>
      <rect x="11" y="-2.6" width="22" height="1.3" rx=".6" fill="#fff" opacity=".35"/>
    </g>
    <clipPath id="lensc"><circle cx="${f(lx)}" cy="${f(ly)}" r="${LR}"/></clipPath>
    <g clip-path="url(#lensc)">
      <rect x="${f(lx - LR)}" y="${f(ly - LR)}" width="${2 * LR}" height="${2 * LR}" fill="${c.paper}"/>
      <g fill="${c.dot}">${zdots}</g>
      <path d="${korZ}" fill="${c.hot}" stroke="${c.ink}" stroke-width=".7" stroke-linejoin="round"/>
      <circle cx="${f(skx)}" cy="${f(sky)}" r="1.7" fill="${c.ink}"/><circle cx="${f(skx)}" cy="${f(sky)}" r=".7" fill="#fff"/>
      <path d="M ${f(lx - LR + 7)} ${f(ly - 6)} A ${LR - 7} ${LR - 7} 0 0 1 ${f(lx - 6)} ${f(ly - LR + 7)}" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".85"/>
    </g>
    <circle cx="${f(lx)}" cy="${f(ly)}" r="${LR + 1.6}" fill="none" stroke="${c.ink}" stroke-width="3.6"/>
    <circle cx="${f(lx)}" cy="${f(ly)}" r="${LR - 0.6}" fill="none" stroke="#fff" stroke-width=".7" opacity=".9"/>`;
  const lay = layout('MINIMAP', { s: 24, d: 26, wf: 1.12 }, 10);
  const L = placeWord(drawExtrude(lay, { color: c.ink, side: c.hot, steps: 10, dx: 0.7, dy: 0.7 }), { lo: 0, hi: lay.width + 7, w: 182, top: 26 });
  const sticker = `<div class="abs" style="left:0;width:${W}mm;top:${mm(L.bottom + 8)};text-align:center"><span style="display:inline-block;background:${c.ink};color:${c.bg};font-family:'KoPub Dotum';font-weight:700;font-size:19pt;letter-spacing:0.02em;line-height:1;padding:2.6mm 6mm;clip-path:polygon(0 0,calc(100% - 3mm) 0,100% 3mm,100% 100%,0 100%)">${esc(v.kind)}</span></div>`;
  return sheet(c.bg, `${full(`${bgRect(c.bg)}<g fill="${c.ocean}">${small}</g><g fill="${c.dot}">${big}</g><g fill="${c.hot}">${hot}</g>${lens}${L.g}`)}
    ${brand(c.ink)}
    ${sticker}
    ${exam(c.sub)}`);
}

// ───────────── M4 등고선 ─────────────
const C4 = {
  1: { bg: '#05221F', lo: '#14705F', hi: '#C8FF3D', accent: '#FFE14D', fg: '#FFFFFF', sub: '#8DB8AE' },
  2: { bg: '#24081E', lo: '#86204F', hi: '#FFB347', accent: '#7FF3FF', fg: '#FFFFFF', sub: '#C79AB6' },
};
const gauss = (u, v, cu, cv, su, sv, a) => a * Math.exp(-(((u - cu) / su) ** 2 + ((v - cv) / sv) ** 2));
const height = (u, v) => gauss(u, v, 0.6, 0.3, 0.2, 0.17, 1) + gauss(u, v, 0.27, 0.53, 0.16, 0.14, 0.55) + gauss(u, v, 0.87, 0.6, 0.12, 0.13, 0.4) + gauss(u, v, 0.47, 0.8, 0.3, 0.12, 0.26)
  + 0.045 * Math.sin(11 * u + 4 * v) + 0.035 * Math.sin(17 * v - 7 * u + 1.1) + 0.02 * Math.sin(29 * u + 23 * v);
// 글자 둘레에 등고선 고리: 바깥부터 [굵기, 색] 차례로 채우고 마지막에 글자
function ringWord(lay, rings, fill) {
  const layer = (sw, col) => `<g fill="${col}" stroke="${col}" stroke-width="${sw}" stroke-linejoin="round">${lay.glyphs.map((g) => `<g transform="translate(${f(g.x)} 0)">${g.polys.map((p) => polyEl(p)).join('')}</g>`).join('')}</g>`;
  return rings.map(([sw, col]) => layer(sw, col)).join('') + drawFill(lay, { color: fill });
}
function m4(v) {
  const c = C4[v.n];
  const nx = 170, ny = 160, X0 = -3, Y0 = -3, WW = 216, HH = 205;
  let best = [0, 0, -1];
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const z = height(i / (nx - 1), j / (ny - 1)); if (z > best[2]) best = [i / (nx - 1), j / (ny - 1), z]; }
  const levels = [];
  for (let z = 0.06; z < best[2]; z += 0.042) levels.push(+z.toFixed(3));
  const cps = contourPaths(height, { nx, ny, levels, sx: WW / (nx - 1), sy: HH / (ny - 1), ox: X0, oy: Y0 });
  const lines = cps.map((cp, k) => {
    const t = (cp.value - levels[0]) / (best[2] - levels[0]);
    return `<path d="${cp.d}" fill="none" stroke="${mix(c.lo, c.hi, t ** 0.9)}" stroke-width="${k % 5 === 4 ? 0.8 : 0.32}" stroke-linejoin="round"/>`;
  }).join('');
  const toMm = ([u, vv]) => [X0 + u * WW, Y0 + vv * HH];
  const [tx, ty] = toMm(best);
  const way = [[0.1, 0.9], [0.2, 0.79], [0.36, 0.73], [0.29, 0.57], [0.45, 0.48], [0.52, 0.38], [best[0], best[1]]].map(toMm);
  // 부드러운 길(Catmull-Rom → 베지어)
  let d = `M ${f(way[0][0])} ${f(way[0][1])}`;
  for (let i = 0; i < way.length - 1; i++) {
    const p0 = way[Math.max(0, i - 1)], p1 = way[i], p2 = way[i + 1], p3 = way[Math.min(way.length - 1, i + 2)];
    d += ` C ${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)}, ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)}, ${f(p2[0])} ${f(p2[1])}`;
  }
  const camps = ['Ⅰ', 'Ⅱ', 'Ⅲ', 'Ⅳ', 'Ⅴ'].map((t, i) => {
    const [x, y] = way[i + 1], s = 5.6;
    return `<polygon points="${cutPoly(x - s / 2, y - s / 2, s, s, 0.22)}" fill="${c.accent}" stroke="${c.bg}" stroke-width=".6"/><text x="${f(x)}" y="${f(y + 1.3)}" text-anchor="middle" font-family="KoPub Dotum" font-weight="700" font-size="3.7" fill="${c.bg}">${t}</text>`;
  }).join('');
  const [sx0, sy0] = way[0];
  const summit = `<polygon points="${P([[tx, ty - 2.2], [tx + 2.4, ty + 1.8], [tx - 2.4, ty + 1.8]])}" fill="${c.bg}" stroke="${c.accent}" stroke-width=".6"/>
    <line x1="${f(tx)}" y1="${f(ty - 1)}" x2="${f(tx)}" y2="${f(ty - 19)}" stroke="${c.fg}" stroke-width=".7"/>
    <polygon points="${cutPoly(tx, ty - 19, 17, 9.5, 0.3)}" fill="${c.accent}"/>
    <text x="${f(tx + 7.6)}" y="${f(ty - 12.3)}" text-anchor="middle" font-family="KoPub Dotum" font-weight="700" font-size="6" fill="${c.bg}">100</text>`;
  const start = `<circle cx="${f(sx0)}" cy="${f(sy0)}" r="1.6" fill="${c.accent}"/><circle cx="${f(sx0)}" cy="${f(sy0)}" r="3.4" fill="none" stroke="${c.accent}" stroke-width=".45" opacity=".6"/>
    <text x="${f(sx0 + 5)}" y="${f(sy0 + 1.4)}" font-family="KoPub Dotum" font-weight="700" font-size="3.9" letter-spacing=".8" fill="${c.accent}">START</text>`;
  const defs = `<linearGradient id="fadeY" gradientUnits="userSpaceOnUse" x1="0" y1="150" x2="0" y2="200"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#000"/></linearGradient>
    <mask id="mk" maskUnits="userSpaceOnUse" x="-3" y="-3" width="216" height="303"><rect x="-3" y="-3" width="216" height="303" fill="url(#fadeY)"/></mask>`;
  const lay = layout('MINIMAP', { s: 15, d: 18, wf: 1.05 }, 14);
  const ringR = 11;
  const L = placeWord(ringWord(lay, [[22, c.lo], [17, c.bg], [12, c.hi], [7.5, c.bg]], c.fg), { lo: -ringR, hi: lay.width + ringR, w: 180, top: 206, yTop: -ringR });
  return sheet(c.bg, `${full(`${bgRect(c.bg)}<g mask="url(#mk)">${lines}</g>
    <path d="${d}" fill="none" stroke="${c.bg}" stroke-width="2.2" stroke-linecap="round"/>
    <path d="${d}" fill="none" stroke="${c.accent}" stroke-width=".8" stroke-dasharray="1.8 1.3" stroke-linecap="round"/>
    ${start}${camps}${summit}${L.g}`, defs)}
    ${brand(c.fg)}
    ${kindLine(v, c.fg, L.bottom + 6)}
    ${exam(c.sub)}`);
}

// ───────────── M5 접힌 지도 ─────────────
const C5 = {
  1: { bg: '#2140FF', paper: '#FFF6E2', land: '#FF6A3D', ink: '#1A2668', pin: '#FFD23F', fg: '#FFFFFF', side: '#0F2399', sub: '#C9D2FF' },
  2: { bg: '#FF6A3D', paper: '#FFF6E2', land: '#2140FF', ink: '#4A1606', pin: '#FFD23F', fg: '#FFFFFF', side: '#B83A14', sub: '#FFE1D6' },
};
function m5(v) {
  const c = C5[v.n];
  const PW = 184, PH = 100, N = 4, pw0 = PW / N;
  const proj = d3.geoEqualEarth().rotate([-150, 0]).fitExtent([[6, 6], [PW - 6, PH - 6]], { type: 'Sphere' });
  const w = world('50m');
  const korD = pathOf(proj, KOR());
  const map = `<rect x="0" y="0" width="${PW}" height="${PH}" fill="${c.paper}"/>
    <path d="${pathOf(proj, { type: 'Sphere' })}" fill="${mix(c.paper, c.bg, 0.13)}"/>
    <path d="${pathOf(proj, d3.geoGraticule().step([30, 30])())}" fill="none" stroke="${c.bg}" stroke-width=".22" opacity=".35"/>
    <path d="${pathOf(proj, w.land)}" fill="${c.land}"/>
    <path d="${pathOf(proj, w.borders)}" fill="none" stroke="${c.paper}" stroke-width=".18" opacity=".8"/>
    <path d="${korD}" fill="${c.ink}"/>
    <path d="${pathOf(proj, { type: 'Sphere' })}" fill="none" stroke="${c.ink}" stroke-width=".35"/>
    <rect x="2.4" y="2.4" width="${PW - 4.8}" height="${PH - 4.8}" fill="none" stroke="${c.ink}" stroke-width=".45"/>
    <rect x="3.3" y="3.3" width="${PW - 6.6}" height="${PH - 6.6}" fill="none" stroke="${c.ink}" stroke-width=".15"/>
    <g transform="translate(15 85)"><polygon points="0,-7 1.6,0 0,7 -1.6,0" fill="${c.ink}"/><polygon points="-7,0 0,-1.6 7,0 0,1.6" fill="${c.ink}" opacity=".5"/><text x="0" y="-8.6" text-anchor="middle" font-family="KoPub Dotum" font-weight="700" font-size="3.4" fill="${c.ink}">N</text></g>`;
  // 접기: 패널 i를 평행사변형으로(아코디언). 접힌 선의 높낮이 off
  const pw = 44, X0 = (W - pw * N) / 2, Y0 = 122, off = [0, 9, 0, 9, 0];
  const mat = (i) => { const a = pw / pw0, b = (off[i + 1] - off[i]) / pw0; return [a, b, 0, 1, X0 + i * pw - pw0 * i * a, Y0 + off[i] - pw0 * i * b]; };
  const apply = (m, [x, y]) => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
  let panels = '', clips = '';
  for (let i = 0; i < N; i++) {
    const m = mat(i), down = off[i + 1] > off[i];
    clips += `<clipPath id="pc${i}"><rect x="${f(pw0 * i)}" y="0" width="${f(pw0)}" height="${PH}"/></clipPath>`;
    panels += `<g transform="matrix(${m.map((x) => +x.toFixed(5)).join(' ')})"><g clip-path="url(#pc${i})">${map}
      <rect x="${f(pw0 * i)}" y="0" width="${f(pw0)}" height="${PH}" fill="url(#${down ? 'shD' : 'shL'})"/></g></g>`;
  }
  // 그늘 그라데이션(패널 안 왼→오)
  const defs = `${clips}${blur('sh', 2.6)}
    <linearGradient id="shD" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity=".05"/><stop offset="1" stop-color="#000" stop-opacity=".26"/></linearGradient>
    <linearGradient id="shL" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity=".02"/><stop offset="1" stop-color="#fff" stop-opacity=".16"/></linearGradient>`;
  const outline = [];
  for (let i = 0; i <= N; i++) outline.push([X0 + i * pw, Y0 + off[i] + PH]);
  const shadowPts = [[X0, Y0 + PH - 6], ...outline, [X0 + N * pw, Y0 + PH - 6]].map(([x, y]) => [x + 3.5, y + 6]);
  const shadow = `<polygon points="${P(shadowPts)}" fill="#000" opacity=".35" filter="url(#sh)"/>`;
  // 핀: 우리나라
  const kl = proj([127.8, 36.3]), pi = Math.min(N - 1, Math.floor(kl[0] / pw0));
  const [px, py] = apply(mat(pi), kl);
  const pin = `<ellipse cx="${f(px + 1.2)}" cy="${f(py + 0.6)}" rx="4.2" ry="1.3" fill="#000" opacity=".3"/>
    <path d="M ${f(px)} ${f(py)} C ${f(px - 2)} ${f(py - 6)}, ${f(px - 7)} ${f(py - 10)}, ${f(px - 7)} ${f(py - 17)} A 7 7 0 1 1 ${f(px + 7)} ${f(py - 17)} C ${f(px + 7)} ${f(py - 10)}, ${f(px + 2)} ${f(py - 6)}, ${f(px)} ${f(py)} Z" fill="${c.pin}" stroke="${c.ink}" stroke-width=".7" stroke-linejoin="round"/>
    <circle cx="${f(px)}" cy="${f(py - 17)}" r="2.8" fill="${c.ink}"/>`;
  const lay = layout('MINIMAP', { s: 22, d: 25, wf: 1.12 }, 10);
  const L = placeWord(drawExtrude(lay, { color: c.fg, side: c.side, steps: 10, dx: 0.8, dy: 0.8 }), { lo: 0, hi: lay.width + 8, w: 182, top: 28 });
  return sheet(c.bg, `${full(`${bgRect(c.bg)}${shadow}${panels}${pin}${L.g}`, defs)}
    ${brand(c.fg)}
    ${kindLine(v, c.fg, L.bottom + 8)}
    ${exam(c.sub)}`);
}

export const MMAPS = { M1: ['네온 지구', m1], M2: ['게임 미니맵', m2], M3: ['돋보기', m3], M4: ['등고선', m4], M5: ['접힌 지도', m5] };
export const mmapFace = (k, v) => MMAPS[k][1](v);
