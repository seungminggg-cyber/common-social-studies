// 정조준 시리즈 3차 시안 — 강사가 보낸 메가스터디 1타강사 교재 표지(2026-11-06)를 참고해 다시 만든 후보 5개.
// 참고한 것은 '분위기와 구성'뿐(진한 원색 바탕, 포인트 그림 하나, 아주 큰 제목, 빽빽한 작은 글자 무늬).
// 그림·문구는 모두 정조준 주제(과녁·다트·레이저·조준선·準)로 새로 그렸다.
//
//   1 조준경   — 짙은 남색 + 수십 겹 무지개 과녁 선 + 조준선
//   2 다트     — 주황빛 노랑 + 기울인 큰 제목 + 깎은 면 다트가 과녁에 꽂힘
//   3 레이저   — 코발트 + 노란 세로 제목 + 빛줄기가 과녁을 맞힘
//   4 과녁 탑  — 흰 바탕 + 쌓은 제목 + 다섯 색 입체 탑(대단원 Ⅰ~Ⅴ) + 다트
//   5 큰 한자  — 자주→진홍 그러데이션 + 입체 '準'(正照準) + 조준선
// 위치는 재단선 기준 mm. 그림 SVG는 도련까지(-3 ~ 213, -3 ~ 300) 그린다.
import { C, CUT, TITLE_FONTS, BLEED } from './tokens.js';
import { BRAND, SERIES_TOTAL } from './series.js';
import { esc } from './sheet.js';

const W = 210, H = 297, B = BLEED;
const TOTAL = String(SERIES_TOTAL).padStart(2, '0');
const mm = (v) => `${+(+v).toFixed(2)}mm`;
const f2 = (v) => +(+v).toFixed(2);

// 대단원 색의 밝은 판(원색 바탕·어두운 바탕에서 쓰는 색) Ⅰ~Ⅴ
export const VIVID = ['#14A3A8', '#C83D8E', '#45A845', '#F08A24', '#3D7DE0'];

// ── 색 도구 ──
const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const hex = (a) => '#' + a.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
const mix = (a, b, t) => hex(rgb(a).map((v, i) => v + (rgb(b)[i] - v) * t));
const tint = (a, t) => mix(a, '#ffffff', t);
const shade = (a, t) => mix(a, '#000000', t);
// 여러 색 사이를 t(0~1)로 이어 가기
const ramp = (cols, t) => {
  const x = Math.max(0, Math.min(1, t)) * (cols.length - 1);
  const i = Math.min(cols.length - 2, Math.floor(x));
  return mix(cols[i], cols[i + 1], x - i);
};
// 늘 같은 결과가 나오는 난수(깎은 면의 밝기 흔들기)
function rng(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── 그리기 도구 ──
const svg = (inner, defs = '') => `<svg class="abs" style="left:-${B}mm;top:-${B}mm;width:${W + 2 * B}mm;height:${H + 2 * B}mm" viewBox="${-B} ${-B} ${W + 2 * B} ${H + 2 * B}" xmlns="http://www.w3.org/2000/svg"><defs>${defs}</defs>${inner}</svg>`;
const bgRect = (fill) => `<rect x="${-B}" y="${-B}" width="${W + 2 * B}" height="${H + 2 * B}" fill="${fill}"/>`;
// 가운데 (cx, cy), 한 변 s인 모서리 자른 네모(오른쪽 위를 18% 자름)
const cutSq = (cx, cy, s, cut = CUT) => {
  const h = s / 2, c = s * cut;
  return [[cx - h, cy - h], [cx + h - c, cy - h], [cx + h, cy - h + c], [cx + h, cy + h], [cx - h, cy + h]].map((p) => p.map(f2).join(',')).join(' ');
};
const pts = (a) => a.map((p) => p.map(f2).join(',')).join(' ');

// 글자 상자(HTML)
const T = (s, o) => {
  const { x, y, right, w, align = 'left', size, weight = 400, color, font = 'dotum', ls = 0, lh = 1.2, extra = '' } = o;
  const fam = font === 'batang' ? 'KoPub Batang' : font === 'dotum' ? 'KoPub Dotum' : font;
  const pos = right != null ? `right:${mm(right)};` : `left:${mm(x)};`;
  return `<div class="abs" style="${pos}top:${mm(y)};${w != null ? `width:${mm(w)};` : ''}text-align:${align};font-family:'${fam}';font-size:${size}pt;font-weight:${weight};color:${color};letter-spacing:${ls}em;line-height:${lh};white-space:nowrap;${extra}">${s}</div>`;
};
const TITLE = (tf, o) => T('정조준', { ...o, font: tf.family, weight: tf.weight, size: +(o.size * tf.scale).toFixed(1), ls: tf.spacing ?? -0.02, lh: 1 });
// 앞 단어 상자(모서리 자른 네모 안에 반전 글자)
const WORD = (word, { x, y, right, bg, fg, h = 13, size = 21, extra = '' }) =>
  `<div class="abs cut" style="--cut:${mm(h * CUT)};${right != null ? `right:${mm(right)};` : `left:${mm(x)};`}top:${mm(y)};height:${mm(h)};padding:0 ${mm(h * 0.38)};display:flex;align-items:center;background:${bg};color:${fg};font-family:'KoPub Dotum';font-weight:700;font-size:${size}pt;letter-spacing:.06em;line-height:1;${extra}">${esc(word)}</div>`;
// 빽빽한 작은 글자 묶음(책 소개 — 실제 내용)
const BLURB = (v) => `${esc(v.subject.replace(' + ', '·'))} 대단원 10개 · 중단원 30개를 기출 문항이 묻는 방식 그대로 다시 썼습니다. 단원별 500문항, 실전 모의고사 4회, 정답과 해설. 문장과 자료는 모두 새로 썼고, 문항마다 난이도·관련 개념·유형을 표시했습니다.`;
const blurb = (v, o) => `<div class="abs" style="left:${mm(o.x)};top:${mm(o.y)};width:${mm(o.w)};font-family:'KoPub Dotum';font-size:${o.size || 6.6}pt;font-weight:300;line-height:1.55;color:${o.color};word-break:keep-all">${BLURB(v)}</div>`;
// 뒷표지 공통: ISBN 자리 + 맨 아래 줄
const backFoot = (o) => `
  <div class="abs" style="left:${mm(W - 16 - 44)};top:244mm;width:44mm;height:24mm;background:#fff;display:flex;align-items:center;justify-content:center;font-family:'KoPub Dotum';font-size:8pt;color:${C.sub}">[ISBN·바코드]</div>
  ${T(`<b style="font-weight:700">${esc(BRAND.name)}</b><span style="opacity:.7;padding-left:3mm">${esc(BRAND.contact)}</span>`, { x: 16, y: 278, size: 9, color: o.fg })}
  ${T('[정가 또는 비매품]', { right: 16, y: 278, size: 9, color: o.fg })}`;
const motto = (tf, o) => `<div class="abs" style="left:${mm(o.x)};top:${mm(o.y)};font-family:'${tf.family}';font-weight:${tf.weight};font-size:${(o.size || 40) * tf.scale}pt;line-height:1.25;letter-spacing:-.01em;color:${o.color};${o.extra || ''}">${BRAND.motto.map(esc).join('<br>')}</div>`;

// ─────────────────────────── 1 조준경 ───────────────────────────
const D1 = { bg: '#17193B', sub: '#9EA3C0', hot: '#FF6B3D' };
function scope(cx, cy, n, step, s0, { fade = 0.72, w = 0.5 } = {}) {
  const order = [VIVID[3], VIVID[1], VIVID[4], VIVID[0], VIVID[2]]; // 안쪽 주황 → 바깥 초록
  let out = '';
  for (let i = n - 1; i >= 0; i--) {
    const t = i / (n - 1);
    out += `<polygon points="${cutSq(cx, cy, s0 + i * step)}" fill="none" stroke="${ramp(order, t)}" stroke-width="${w}" stroke-opacity="${f2(1 - fade * t)}" stroke-linejoin="miter"/>`;
  }
  return out;
}
function crosshair(cx, cy, color, { op = 0.55, w = 0.22, ticks = 40, gap = 0 } = {}) {
  let o = `<g stroke="${color}" stroke-opacity="${op}" stroke-width="${w}">`;
  if (gap) {
    o += `<line x1="${-B}" y1="${cy}" x2="${cx - gap}" y2="${cy}"/><line x1="${cx + gap}" y1="${cy}" x2="${W + B}" y2="${cy}"/>`;
    o += `<line x1="${cx}" y1="${-B}" x2="${cx}" y2="${cy - gap}"/><line x1="${cx}" y1="${cy + gap}" x2="${cx}" y2="${H + B}"/>`;
  } else o += `<line x1="${-B}" y1="${cy}" x2="${W + B}" y2="${cy}"/><line x1="${cx}" y1="${-B}" x2="${cx}" y2="${H + B}"/>`;
  for (let d = 5; d <= ticks; d += 5) {
    const l = d % 10 === 0 ? 2.2 : 1.2;
    o += `<line x1="${cx + d}" y1="${cy - l}" x2="${cx + d}" y2="${cy + l}"/><line x1="${cx - d}" y1="${cy - l}" x2="${cx - d}" y2="${cy + l}"/>`;
    o += `<line x1="${cx - l}" y1="${cy + d}" x2="${cx + l}" y2="${cy + d}"/><line x1="${cx - l}" y1="${cy - d}" x2="${cx + l}" y2="${cy - d}"/>`;
  }
  return o + '</g>';
}
function front1(v, tf) {
  const cx = 126, cy = 108;
  return `${svg(`${bgRect(D1.bg)}${scope(cx, cy, 34, 8.6, 9)}${crosshair(cx, cy, '#ffffff', { gap: 7 })}<polygon points="${cutSq(cx, cy, 6.4)}" fill="${D1.hot}"/>`)}
  ${T(esc(BRAND.name), { x: 16, y: 12, size: 10, weight: 700, color: '#fff', ls: 0.02 })}
  ${T('2028 수능 대비', { right: 16, y: 12, size: 10, weight: 500, color: D1.sub })}
  ${WORD(v.word, { x: 16, y: 192, bg: '#fff', fg: D1.bg })}
  ${TITLE(tf, { x: 14, y: 208, size: 126, color: '#fff' })}
  ${T(esc(v.sub), { x: 16, y: 256, size: 14.5, weight: 500, color: '#fff' })}
  ${T(esc(v.subject), { x: 16, y: 264.5, size: 11.5, weight: 300, color: D1.sub })}
  ${T(esc(v.no), { right: 15, y: 226, size: 64, weight: 700, color: D1.hot, font: 'batang', lh: 1 })}
  ${T(`정조준 시리즈 / ${TOTAL}`, { right: 16, y: 251, size: 8, color: D1.sub })}
  ${blurb(v, { x: 128, y: 266, w: 66, color: D1.sub })}`;
}
function back1(v, tf) {
  const cx = 30, cy = 52;
  return `${svg(`${bgRect(D1.bg)}${scope(cx, cy, 22, 8.6, 9, { fade: 0.85 })}${crosshair(cx, cy, '#ffffff', { gap: 7, op: 0.4, ticks: 20 })}<polygon points="${cutSq(cx, cy, 6.4)}" fill="${D1.hot}"/>`)}
  ${motto(tf, { x: 16, y: 138, color: '#fff' })}
  ${backFoot({ fg: '#fff' })}`;
}

// ─────────────────────────── 2 다트 ───────────────────────────
const D2 = { bg: '#F2A93B', ink: '#1E2124' };
// 깎은 면 다트: 촉(은색) · 목(먹) · 몸통(Ⅰ→Ⅱ) · 날개(Ⅳ·Ⅴ·Ⅲ). 촉 끝이 (0,0), +x 방향이 꼬리.
function dart(seed = 7) {
  const r = rng(seed);
  const tris = [];
  const jit = (c, a = 0.12) => (r() < 0.5 ? tint(c, r() * a) : shade(c, r() * a));
  const strip = (x0, x1, n, hw0, hw1, cols, mid = 0.8) => {
    for (let j = 0; j < n; j++) {
      const a = x0 + ((x1 - x0) * j) / n, b = x0 + ((x1 - x0) * (j + 1)) / n;
      const wa = hw0 + ((hw1 - hw0) * j) / n, wb = hw0 + ((hw1 - hw0) * (j + 1)) / n;
      const ma = (r() - 0.5) * mid, mb = (r() - 0.5) * mid;
      const col = (k) => jit(typeof cols === 'function' ? cols((j + 0.5) / n, k) : cols[k % cols.length]);
      tris.push([[[a, -wa], [b, -wb], [b, mb]], col(0)], [[[a, -wa], [b, mb], [a, ma]], col(1)]);
      tris.push([[[a, ma], [b, mb], [b, wb]], col(2)], [[[a, ma], [b, wb], [a, wa]], col(3)]);
    }
  };
  strip(0, 30, 5, 0.01, 6.5, ['#F4F6F8', '#D5DAE0', '#B4BCC6', '#8E98A5']); // 촉
  strip(30, 37, 1, 7.5, 7.5, [C.ink, '#2E3338', '#3B4147', '#24282C']); // 목
  strip(37, 118, 9, 4.2, 3.6, (t, k) => (k % 2 ? shade(mix(VIVID[0], VIVID[1], t), 0.18) : mix(VIVID[0], VIVID[1], t))); // 몸통 Ⅰ→Ⅱ
  // 날개 세 장(위·아래·가운데) — 무게중심으로 쪼갠 삼각형
  const fin = (poly, base) => {
    const cx = poly.reduce((a, p) => a + p[0], 0) / poly.length, cy = poly.reduce((a, p) => a + p[1], 0) / poly.length;
    for (let i = 0; i < poly.length; i++) {
      const p = poly[i], q = poly[(i + 1) % poly.length];
      const m = [(p[0] + q[0]) / 2 + (r() - 0.5) * 2, (p[1] + q[1]) / 2 + (r() - 0.5) * 2];
      tris.push([[p, m, [cx, cy]], jit(base, 0.22)], [[m, q, [cx, cy]], jit(base, 0.22)]);
    }
  };
  fin([[96, -3.6], [150, -3.6], [152, -27], [124, -27]], VIVID[3]);
  fin([[96, 3.6], [150, 3.6], [152, 27], [124, 27]], VIVID[4]);
  fin([[104, -2], [150, -2], [150, 2], [104, 2]], VIVID[2]);
  return tris;
}
function dartSvg(tx, ty, ang, scale = 1, seed) {
  return `<g transform="translate(${tx} ${ty}) rotate(${ang}) scale(${scale})">${dart(seed).map(([p, c]) => `<polygon points="${pts(p)}" fill="${c}" stroke="${c}" stroke-width=".15" stroke-linejoin="round"/>`).join('')}</g>`;
}
const smallTarget = (cx, cy, s, ink, hot, w = 0.9) => [1, 0.68, 0.36].map((f) => `<polygon points="${cutSq(cx, cy, s * f)}" fill="none" stroke="${ink}" stroke-width="${w}"/>`).join('') + `<polygon points="${cutSq(cx, cy, s * 0.14)}" fill="${hot}"/>`;
function front2(v, tf) {
  const tx = 168, ty = 146, ang = 145; // 촉 끝 = 과녁 한가운데, 꼬리는 왼쪽 아래
  const hit = [0, 1, 2, 3, 4, 5, 6, 7].map((k) => { const a = (k * Math.PI) / 4 + 0.3; return `<line x1="${f2(tx + Math.cos(a) * 5)}" y1="${f2(ty + Math.sin(a) * 5)}" x2="${f2(tx + Math.cos(a) * 9)}" y2="${f2(ty + Math.sin(a) * 9)}" stroke="${D2.ink}" stroke-width=".7"/>`; }).join('');
  return `${svg(`${bgRect(D2.bg)}${smallTarget(tx, ty, 62, D2.ink, '#D7263D')}${hit}
    <path d="M ${-B} 250 C 14 252, 30 246, 44 236" fill="none" stroke="${D2.ink}" stroke-width=".6" stroke-dasharray="2.2 2"/>
    ${dartSvg(tx, ty, ang, 1, 11)}`)}
  <div class="abs" style="left:0;top:0;width:${W}mm;height:${H}mm;transform:rotate(-9deg);transform-origin:20mm 60mm">
    ${WORD(v.word, { x: 21, y: 26, bg: D2.ink, fg: D2.bg })}
    ${TITLE(tf, { x: 18, y: 41, size: 146, color: D2.ink })}
    ${T('통합사회 1+2', { x: 22, y: 99, size: 26, weight: tf.weight, font: tf.family, color: '#fff', ls: -0.01 })}
  </div>
  ${T(esc(BRAND.name), { x: 16, y: 278, size: 10, weight: 700, color: D2.ink })}
  ${T(`${esc(v.sub)}`, { right: 16, y: 272, size: 11, weight: 500, color: D2.ink })}
  ${T(`2028 수능 대비 · 정조준 시리즈 ${esc(v.no)} / ${TOTAL}`, { right: 16, y: 279, size: 8.4, color: D2.ink, extra: 'opacity:.75' })}
  ${blurb(v, { x: 16, y: 127, w: 60, color: D2.ink })}`;
}
function back2(v, tf) {
  const tx = 82, ty = 50;
  return `${svg(`${bgRect(D2.bg)}${smallTarget(tx, ty, 34, D2.ink, '#D7263D', 0.7)}${dartSvg(tx, ty, 150, 0.36, 11)}`)}
  ${motto(tf, { x: 16, y: 110, color: D2.ink })}
  ${backFoot({ fg: D2.ink })}`;
}

// ─────────────────────────── 3 레이저 ───────────────────────────
const D3 = { bg: '#2357D9', title: '#FFD34E', sub: '#BFD0FA' };
const glow = `<filter id="g1" x="-50%" y="-5%" width="200%" height="110%"><feGaussianBlur stdDeviation="2.4"/></filter><filter id="g2" x="-50%" y="-5%" width="200%" height="110%"><feGaussianBlur stdDeviation=".7"/></filter><filter id="g3" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="2.2"/></filter>`;
function beam(x, y0, y1, k = 1) {
  return `<rect x="${x - 7 * k}" y="${y0}" width="${14 * k}" height="${y1 - y0}" fill="#8FD3FF" opacity=".55" filter="url(#g1)"/>
    <rect x="${x - 2.2 * k}" y="${y0}" width="${4.4 * k}" height="${y1 - y0}" fill="#E8F6FF" filter="url(#g2)"/>
    <rect x="${x - 0.45 * k}" y="${y0}" width="${0.9 * k}" height="${y1 - y0}" fill="#fff"/>
    <circle cx="${x}" cy="${y1}" r="${9 * k}" fill="#BFE8FF" opacity=".8" filter="url(#g3)"/><circle cx="${x}" cy="${y1}" r="${2.4 * k}" fill="#fff"/>`;
}
function front3(v, tf) {
  const bx = 152, by = 206;
  const rings = [74, 52, 30].map((s) => `<polygon points="${cutSq(bx, by, s)}" fill="none" stroke="#fff" stroke-width="1" stroke-opacity=".9"/>`).join('');
  const spark = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((k) => { const a = (k * Math.PI) / 6; const l = k % 2 ? 10 : 15; return `<line x1="${f2(bx + Math.cos(a) * 5)}" y1="${f2(by + Math.sin(a) * 5)}" x2="${f2(bx + Math.cos(a) * l)}" y2="${f2(by + Math.sin(a) * l)}" stroke="#fff" stroke-width=".5"/>`; }).join('');
  return `${svg(`${bgRect(D3.bg)}${crosshair(bx, by, '#fff', { op: 0.35, ticks: 30, gap: 3 })}${rings}<polygon points="${cutSq(bx, by, 11)}" fill="${D3.title}"/>${beam(bx, -B, by)}${spark}`, glow)}
  ${[...'정조준'].map((ch, i) => `<div class="abs" style="left:13mm;top:${mm(17 + i * 63)};width:66mm;text-align:center;font-family:'${tf.family}';font-weight:${tf.weight};font-size:${168 * tf.scale}pt;line-height:1;color:${D3.title}">${ch}</div>`).join('')}
  ${WORD(v.word, { x: 84, y: 18, bg: '#fff', fg: D3.bg, h: 12, size: 17, extra: 'writing-mode:vertical-rl;text-orientation:upright;height:auto;padding:3.4mm 0;width:12mm;justify-content:center' })}
  ${T(esc(v.no), { right: 16, y: 16, size: 44, weight: 700, font: 'batang', color: D3.title, lh: 1 })}
  ${T(`정조준 시리즈 / ${TOTAL}`, { right: 16, y: 33, size: 8, color: D3.sub })}
  ${T(esc(v.sub), { x: 16, y: 236, size: 15, weight: 700, color: '#fff' })}
  ${T(esc(v.subject), { x: 16, y: 244.5, size: 11.5, weight: 300, color: D3.sub })}
  ${blurb(v, { x: 16, y: 253, w: 92, color: D3.sub })}
  ${T(`<b style="font-weight:700;color:#fff">${esc(BRAND.name)}</b>`, { x: 16, y: 279, size: 10, color: '#fff' })}
  ${T('2028 수능 대비', { right: 16, y: 279, size: 9.5, weight: 500, color: D3.sub })}`;
}
function back3(v, tf) {
  const bx = 34, by = 92;
  return `${svg(`${bgRect(D3.bg)}${[34, 20].map((s) => `<polygon points="${cutSq(bx, by, s)}" fill="none" stroke="#fff" stroke-width=".8"/>`).join('')}<polygon points="${cutSq(bx, by, 6)}" fill="${D3.title}"/>${beam(bx, -B, by, 0.6)}`, glow)}
  ${motto(tf, { x: 16, y: 128, color: D3.title })}
  ${backFoot({ fg: '#fff' })}`;
}

// ─────────────────────────── 4 과녁 탑 ───────────────────────────
// 등각(아이소메트릭) 투영: 화면 X = (x−y)·cos30°, Y = (x+y)·sin30° − z
const iso = (cx, cy, k = 1) => (x, y, z) => [cx + (x - y) * 0.866 * k, cy + ((x + y) * 0.5 - z) * k];
function tower(cx, cy, k = 1) {
  const P = iso(cx, cy, k);
  const h = 9;
  let out = `<polygon points="${pts([P(-54, -54, 0), P(58, -54, 0), P(58, 58, 0), P(-54, 58, 0)].map(([x, y]) => [x + 2 * k, y + 3 * k]))}" fill="#E9ECF1"/>`; // 바닥 그림자
  for (let i = 0; i < 5; i++) {
    const s = 100 - 18 * i, a = s / 2, c = s * CUT, z0 = i * h, z1 = z0 + h, col = VIVID[i];
    const top = [[-a + c, -a], [a, -a], [a, a], [-a, a], [-a, -a + c]].map(([x, y]) => P(x, y, z1));
    const right = [P(a, -a, z0), P(a, a, z0), P(a, a, z1), P(a, -a, z1)];
    const left = [P(a, a, z0), P(-a, a, z0), P(-a, a, z1), P(a, a, z1)];
    out += `<polygon points="${pts(right)}" fill="${col}"/><polygon points="${pts(left)}" fill="${shade(col, 0.22)}"/><polygon points="${pts(top)}" fill="${tint(col, 0.22)}"/>`;
    out += `<polyline points="${pts([...top, top[0]])}" fill="none" stroke="#fff" stroke-width="${0.35 * k}" stroke-opacity=".8"/>`;
  }
  // 꼭대기 과녁 한가운데 + 다트
  const zt = 5 * h, s = 12, a = s / 2;
  out += `<polygon points="${pts([[-a + s * CUT, -a], [a, -a], [a, a], [-a, a], [-a, -a + s * CUT]].map(([x, y]) => P(x, y, zt)))}" fill="${C.ink}"/>`;
  const [hx, hy] = P(0, 0, zt);
  out += `<g transform="translate(${f2(hx)} ${f2(hy)})">${`<g transform="rotate(-68) scale(${0.5 * k})">${dart(5).map(([p, cl]) => `<polygon points="${pts(p)}" fill="${cl}" stroke="${cl}" stroke-width=".15"/>`).join('')}</g>`}</g>`;
  return out;
}
function cube(x, y, s, col) {
  const P = iso(x, y, 1);
  const a = s / 2;
  return `<polygon points="${pts([P(a, -a, 0), P(a, a, 0), P(a, a, s), P(a, -a, s)])}" fill="${col}"/><polygon points="${pts([P(a, a, 0), P(-a, a, 0), P(-a, a, s), P(a, a, s)])}" fill="${shade(col, 0.22)}"/><polygon points="${pts([P(-a, -a, s), P(a, -a, s), P(a, a, s), P(-a, a, s)])}" fill="${tint(col, 0.25)}"/>`;
}
function front4(v, tf) {
  const cubes = [[34, 168, 5, VIVID[3]], [178, 150, 4, VIVID[1]], [160, 128, 3, VIVID[0]], [48, 214, 3.4, VIVID[4]], [186, 222, 4.4, VIVID[2]], [24, 138, 2.6, VIVID[1]]].map(([x, y, s, c]) => cube(x, y, s, c)).join('');
  return `${svg(`${bgRect('#fff')}${tower(105, 214)}${cubes}`)}
  ${T(esc(v.word), { x: 15, y: 16, size: 44, weight: 700, font: 'batang', color: VIVID[0], ls: -0.02, lh: 1 })}
  ${TITLE(tf, { x: 13, y: 33, size: 118, color: C.ink })}
  ${T(esc(v.sub), { x: 16, y: 80, size: 14, weight: 700, color: C.ink })}
  ${T(esc(v.subject), { x: 16, y: 88, size: 11.5, weight: 300, color: C.sub })}
  ${blurb(v, { x: 16, y: 97, w: 84, color: C.sub })}
  <div class="abs" style="left:182mm;top:16mm;width:12mm;height:80mm;background:${C.ink}"></div>
  <div class="abs" style="left:182mm;top:16mm;width:12mm;height:80mm;display:flex;flex-direction:column;align-items:center;justify-content:space-between;padding:3mm 0">
    <div style="writing-mode:vertical-rl;font-family:'KoPub Dotum';font-weight:500;font-size:8.4pt;color:#fff;letter-spacing:.04em">2028 수능 대비</div>
    <div style="font-family:'KoPub Batang';font-weight:700;font-size:15pt;color:${VIVID[3]};line-height:1">${esc(v.no)}</div></div>
  ${T(esc(BRAND.name), { x: 16, y: 280, size: 10, weight: 700, color: C.ink })}
  ${T(`정조준 시리즈 ${esc(v.no)} / ${TOTAL}`, { right: 16, y: 280, size: 9, color: C.sub })}`;
}
function back4(v, tf) {
  return `${svg(`${bgRect('#fff')}<g transform="translate(16 18) scale(.42)">${tower(70, 120)}</g>`)}
  <div class="abs" style="left:182mm;top:16mm;width:12mm;height:80mm;background:${C.ink};display:flex;justify-content:center;padding-top:3mm"><div style="writing-mode:vertical-rl;font-family:'KoPub Dotum';font-weight:500;font-size:8.4pt;color:#fff;letter-spacing:.04em">기출분석 정조준 · 기본편</div></div>
  ${motto(tf, { x: 16, y: 122, color: C.ink })}
  <div class="abs" style="left:-3mm;right:-3mm;top:270mm;bottom:-3mm;background:${C.ink}"></div>
  ${backFoot({ fg: '#fff' }).replace('top:244mm;', 'top:238mm;outline:.5pt solid #1E2124;')}`;
}

// ─────────────────────────── 5 큰 한자 ───────────────────────────
const D5 = { a: '#5E1048', b: '#E2434B', deep: '#3E0A30', sub: '#F6C9CF' };
const grad = `<linearGradient id="g5" x1="0" y1="0" x2=".55" y2="1"><stop offset="0" stop-color="${D5.a}"/><stop offset="1" stop-color="${D5.b}"/></linearGradient>`;
function bigChar(cx, base, size, depth = 22, step = 0.42) {
  let o = '';
  for (let i = depth; i >= 1; i--) o += `<text x="${f2(cx + i * step)}" y="${f2(base + i * step)}" text-anchor="middle" font-family="KoPub Batang" font-weight="700" font-size="${size}" fill="${mix(D5.deep, D5.a, i / depth * 0.5)}">準</text>`;
  return o + `<text x="${cx}" y="${base}" text-anchor="middle" font-family="KoPub Batang" font-weight="700" font-size="${size}" fill="#fff">準</text>`;
}
function front5(v, tf) {
  const cx = 105, cy = 104;
  return `${svg(`${bgRect('url(#g5)')}<polygon points="${cutSq(cx, cy, 150)}" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width=".35"/><polygon points="${cutSq(cx, cy, 166)}" fill="none" stroke="#fff" stroke-opacity=".2" stroke-width=".35"/>${bigChar(cx, cy + 40, 118)}${crosshair(cx, cy, '#fff', { op: 0.6, w: 0.25, ticks: 0, gap: 0 })}<polygon points="${cutSq(cx, cy, 5)}" fill="${VIVID[3]}"/>`, grad)}
  ${T(esc(BRAND.name), { x: 16, y: 12, size: 10, weight: 700, color: '#fff', ls: 0.02 })}
  ${T('正照準', { right: 16, y: 11.5, size: 11, weight: 700, font: 'batang', color: '#fff', ls: 0.3 })}
  ${WORD(v.word, { x: 16, y: 196, bg: '#fff', fg: D5.a })}
  ${TITLE(tf, { x: 14, y: 212, size: 118, color: '#fff' })}
  ${T(esc(v.sub), { x: 16, y: 258, size: 14.5, weight: 500, color: '#fff' })}
  ${T(esc(v.subject), { x: 16, y: 266.5, size: 11.5, weight: 300, color: D5.sub })}
  ${T(`2028 수능 대비 · 정조준 시리즈 <b style="font-weight:700;color:#fff">${esc(v.no)}</b> / ${TOTAL}`, { right: 16, y: 279, size: 8.6, color: D5.sub })}
  ${blurb(v, { x: 132, y: 238, w: 62, color: D5.sub })}`;
}
function back5(v, tf) {
  return `${svg(`${bgRect('url(#g5)')}${bigChar(40, 92, 46, 12, 0.3)}`, grad)}
  ${motto(tf, { x: 16, y: 128, color: '#fff' })}
  ${backFoot({ fg: '#fff' })}`;
}

// ── 내보내기 ──
export const V3 = {
  1: { name: '조준경', front: front1, back: back1, bg: D1.bg },
  2: { name: '다트', front: front2, back: back2, bg: D2.bg, font: 'noto' },
  3: { name: '레이저', front: front3, back: back3, bg: D3.bg },
  4: { name: '과녁 탑', front: front4, back: back4, bg: '#fff' },
  5: { name: '큰 한자', front: front5, back: back5, bg: D5.a },
};
export function face3(n, side, v, font) {
  const d = V3[n];
  font = font || d.font || 'kopub';
  return `<section class="sheet" style="background:${d.bg}"><div class="t" style="overflow:visible">${d[side](v, TITLE_FONTS[font])}</div></section>`;
}

// 4차 시안(v4.js)이 다시 쓰는 조각
export { svg, bgRect, cutSq, T, WORD, blurb, backFoot, crosshair, mix, tint, shade, ramp, f2, mm, TOTAL, D1 };
