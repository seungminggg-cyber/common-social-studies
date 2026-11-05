// 그래프 · 지도 · 벤 다이어그램 그리기 (SVG)
//
// 개념서 안의 그림 자료를 숫자 데이터로부터 직접 그립니다. 외부 그림 파일이 필요 없고,
// 색은 테마 CSS(--fig-1 … --fig-5)가 정하므로 시안을 바꾸면 그림 색도 함께 바뀝니다.
// 한글 파일(.hwpx)에는 build.mjs가 이 그림을 PNG로 찍어서 넣습니다.
//
// 블록 모양 (content/*.js 에서)
//   { t: 'chart', kind: 'bar' | 'hbar' | 'stack100' | 'line' | 'scatter' | 'pie' | 'climate', ... }
//   { t: 'venn', left: {label, items}, right: {label, items}, both: {items}, letters: true }
//   { t: 'map', view: 'world' | [서경, 남위, 동경, 북위], highlight: [...], markers: [...], arrows: [...] }
// 공통: title(제목), source(출처), note(아래 설명), width(폭 %, 기본 100), h(그림 높이)

import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { geoEqualEarth, geoMercator, geoPath, geoGraticule10, geoCentroid } from 'd3-geo';
import { feature, mesh } from 'topojson-client';

const require = createRequire(import.meta.url);
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const r1 = (n) => Math.round(n * 10) / 10;

// 글자 폭 어림 (한글 1em, 영문·숫자 약 0.55em)
const tw = (s, size) =>
  [...String(s)].reduce((w, ch) => w + (/[ᄀ-ᇿ㄰-㆏가-힯一-鿿]/.test(ch) ? 1 : /[A-Z%]/.test(ch) ? 0.66 : 0.55), 0) * size;

function text(x, y, s, { size = 12, anchor = 'start', cls = '', weight, baseline } = {}) {
  const lines = String(s).split('\n');
  const dy0 = baseline === 'middle' ? -((lines.length - 1) * size * 1.2) / 2 : 0;
  return lines
    .map((ln, i) => `<text x="${r1(x)}" y="${r1(y + dy0 + i * size * 1.2)}" font-size="${size}" text-anchor="${anchor}"${
      baseline === 'middle' ? ' dominant-baseline="middle"' : ''}${weight ? ` font-weight="${weight}"` : ''} class="${cls}">${esc(ln)}</text>`)
    .join('');
}

function ticks(min, max, step) {
  const out = [];
  for (let v = min; v <= max + 1e-9; v += step) out.push(Math.round(v * 1e6) / 1e6);
  return out;
}
const fmt = (v) => (Number.isInteger(v) ? v.toLocaleString('en-US') : String(v));

function legend(items, x, y, { size = 11, kind = 'box' } = {}) {
  let cx = x;
  return items
    .map((it, i) => {
      const cls = it.cls || `s${i + 1}`;
      const sw = kind === 'line'
        ? `<line x1="${cx}" y1="${y - 4}" x2="${cx + 18}" y2="${y - 4}" class="ln ${cls}${it.dash ? ' dash' : ''}"/>`
        : `<rect x="${cx}" y="${y - 10}" width="12" height="12" rx="2" class="fl ${cls}"/>`;
      const w = (kind === 'line' ? 22 : 16) + tw(it.name, size) + 14;
      const out = sw + text(cx + (kind === 'line' ? 22 : 16), y, it.name, { size, cls: 'lg' });
      cx += w;
      return out;
    })
    .join('');
}
const legendWidth = (items, size = 11, kind = 'box') => items.reduce((w, it) => w + (kind === 'line' ? 22 : 16) + tw(it.name, size) + 14, 0);

// ── 막대그래프 (세로, 여러 계열) ──
function bar(b) {
  const W = b.w || 600, H = b.h || 300;
  const cats = b.categories, series = b.series;
  const y = b.y || {};
  const max = y.max ?? Math.max(...series.flatMap((s) => s.values)), min = y.min ?? 0, step = y.step ?? (max - min) / 5;
  const hasLegend = series.length > 1;
  const L = 54, R = 14, T = hasLegend ? 40 : 26, B = 44;
  const pw = W - L - R, ph = H - T - B;
  const sy = (v) => T + ph - ((v - min) / (max - min)) * ph;
  const band = pw / cats.length, gw = band * 0.62, bw = gw / series.length;
  let s = '';
  for (const v of ticks(min, max, step)) {
    s += `<line x1="${L}" y1="${r1(sy(v))}" x2="${W - R}" y2="${r1(sy(v))}" class="grid"/>`;
    s += text(L - 6, sy(v) + 4, fmt(v), { size: 11, anchor: 'end', cls: 'tick' });
  }
  if (y.label) s += text(L - 6, T - 10, y.label, { size: 11, anchor: 'end', cls: 'axl' });
  series.forEach((ser, j) => {
    ser.values.forEach((v, i) => {
      const x = L + band * i + (band - gw) / 2 + bw * j;
      const hl = (b.highlight || []).includes(i) ? ' hl' : '';
      s += `<rect x="${r1(x + 1)}" y="${r1(sy(v))}" width="${r1(bw - 2)}" height="${r1(sy(min) - sy(v))}" class="fl s${j + 1}${hl}"/>`;
      if (b.valueLabels !== false) s += text(x + bw / 2, sy(v) - 5, fmt(v) + (b.valueSuffix || ''), { size: 10.5, anchor: 'middle', cls: 'val' });
    });
  });
  s += `<line x1="${L}" y1="${sy(min)}" x2="${W - R}" y2="${sy(min)}" class="axis"/>`;
  cats.forEach((c, i) => (s += text(L + band * i + band / 2, H - B + 18, c, { size: 11.5, anchor: 'middle', cls: 'cat' })));
  if (b.x?.label) s += text(W - R, H - 6, b.x.label, { size: 11, anchor: 'end', cls: 'axl' });
  if (hasLegend) s += legend(series, W - R - legendWidth(series), 18);
  return { W, H, s };
}

// ── 가로 막대그래프 (순위 비교 등) ──
function hbar(b) {
  const cats = b.categories, ser = b.series[0];
  const rowH = b.rowH || 26;
  const labW = Math.max(...cats.map((c) => tw(c, 12))) + 16;
  const W = b.w || 600, T = 18, B = b.x?.label || b.axis ? 30 : 10, H = T + rowH * cats.length + B;
  const L = labW, R = 56, pw = W - L - R;
  const x = b.x || {};
  const max = x.max ?? Math.max(...ser.values), min = x.min ?? 0;
  const sx = (v) => L + ((v - min) / (max - min)) * pw;
  let s = '';
  if (b.axis) for (const v of ticks(min, max, x.step ?? (max - min) / 5)) {
    s += `<line x1="${r1(sx(v))}" y1="${T - 4}" x2="${r1(sx(v))}" y2="${H - B + 2}" class="grid"/>`;
    s += text(sx(v), H - B + 16, fmt(v), { size: 10.5, anchor: 'middle', cls: 'tick' });
  }
  cats.forEach((c, i) => {
    const yy = T + rowH * i;
    const hl = (b.highlight || []).includes(i) ? ' hl' : '';
    s += text(L - 10, yy + rowH / 2 + 4, c, { size: 12, anchor: 'end', cls: `cat${hl}` });
    s += `<rect x="${L}" y="${r1(yy + rowH * 0.18)}" width="${r1(sx(ser.values[i]) - L)}" height="${r1(rowH * 0.64)}" rx="2" class="fl s1${hl}"/>`;
    s += text(sx(ser.values[i]) + 6, yy + rowH / 2 + 4, fmt(ser.values[i]) + (b.valueSuffix || ''), { size: 11, cls: `val${hl}` });
  });
  s += `<line x1="${L}" y1="${T - 4}" x2="${L}" y2="${H - B + 2}" class="axis"/>`;
  if (x.label) s += text(W - R + 50, H - 4, x.label, { size: 11, anchor: 'end', cls: 'axl' });
  return { W, H, s };
}

// ── 100% 가로 누적 막대 (응답 비율 등) ──
function stack100(b) {
  const cats = b.categories, series = b.series;
  const rowH = b.rowH || 30;
  const labW = Math.max(...cats.map((c) => tw(c, 12))) + 16;
  const W = b.w || 600, T = 34, H = T + rowH * cats.length + 22;
  const L = labW, R = 12, pw = W - L - R;
  let s = legend(series, W - R - legendWidth(series), 16);
  cats.forEach((c, i) => {
    const yy = T + rowH * i;
    s += text(L - 10, yy + rowH / 2 + 4, c, { size: 12, anchor: 'end', cls: 'cat' });
    let acc = 0;
    const total = series.reduce((t, ser) => t + ser.values[i], 0);
    series.forEach((ser, j) => {
      const v = ser.values[i], w = (v / total) * pw;
      const x0 = L + (acc / total) * pw;
      s += `<rect x="${r1(x0)}" y="${r1(yy + 3)}" width="${r1(w)}" height="${rowH - 6}" class="fl s${j + 1}"/>`;
      if (w > 26) s += text(x0 + w / 2, yy + rowH / 2 + 4, `${fmt(v)}`, { size: 11, anchor: 'middle', cls: `in s${j + 1}` });
      acc += v;
    });
  });
  s += text(W - R, H - 4, b.unit || '(단위: %)', { size: 10.5, anchor: 'end', cls: 'axl' });
  return { W, H, s };
}

// 부드러운 곡선 (카트멀-롬 → 베지어)
function smoothPath(pts) {
  if (pts.length < 3) return 'M' + pts.map((p) => `${r1(p[0])},${r1(p[1])}`).join('L');
  let d = `M${r1(pts[0][0])},${r1(pts[0][1])}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${r1(c1[0])},${r1(c1[1])} ${r1(c2[0])},${r1(c2[1])} ${r1(p2[0])},${r1(p2[1])}`;
  }
  return d;
}

// ── 꺾은선 / 개념 곡선 ──
// x: { min, max, ticks:[값 또는 {v, label}], label }  (min/max가 없으면 categories 순서대로)
// series: [{ name, values:[...] 또는 points:[[x,y]...], dash, smooth, marker, end: '끝 이름표' }]
// schematic: true → 숫자 없이 축 화살표만 (개념 그래프)
function line(b) {
  const W = b.w || 600, H = b.h || 300;
  const y = b.y || {}, xx = b.x || {};
  const schem = !!b.schematic;
  const hasLegend = b.legend !== false && b.series.length > 1 && !b.series.every((s) => s.end);
  const L = schem ? 30 : 54, R = b.series.some((s) => s.end) ? 92 : 18, T = hasLegend ? 40 : 28, B = 40;
  const pw = W - L - R, ph = H - T - B;
  const cats = b.categories;
  const xmin = xx.min ?? 0, xmax = xx.max ?? (cats ? cats.length - 1 : 1);
  const sx = (v) => L + ((v - xmin) / (xmax - xmin || 1)) * pw;
  const ymin = y.min ?? 0, ymax = y.max ?? 10;
  const sy = (v) => T + ph - ((v - ymin) / (ymax - ymin)) * ph;
  let s = '';
  if (!schem) {
    for (const v of ticks(ymin, ymax, y.step ?? (ymax - ymin) / 5)) {
      s += `<line x1="${L}" y1="${r1(sy(v))}" x2="${L + pw}" y2="${r1(sy(v))}" class="grid"/>`;
      s += text(L - 6, sy(v) + 4, fmt(v), { size: 11, anchor: 'end', cls: 'tick' });
    }
  }
  // 세로 기준선
  for (const vl of b.vlines || []) {
    s += `<line x1="${r1(sx(vl.x))}" y1="${T}" x2="${r1(sx(vl.x))}" y2="${T + ph}" class="ref"/>`;
    if (vl.label) s += text(sx(vl.x), T - 6, vl.label, { size: 10.5, anchor: 'middle', cls: 'refl' });
  }
  // 그래프 안 글씨 (구간 이름 등): notes: [{ x, y, text }]
  for (const n of b.notes || []) s += text(sx(n.x), sy(n.y), n.text, { size: n.size || 12, anchor: 'middle', cls: 'refl', weight: 700 });
  // 축
  s += `<line x1="${L}" y1="${T + ph}" x2="${L + pw + (schem ? 10 : 0)}" y2="${T + ph}" class="axis"${schem ? ' marker-end="url(#ah)"' : ''}/>`;
  s += `<line x1="${L}" y1="${T + ph}" x2="${L}" y2="${T - (schem ? 10 : 0)}" class="axis"${schem ? ' marker-end="url(#ah)"' : ''}/>`;
  if (y.label) s += schem ? text(L + 6, T - 2, y.label, { size: 11.5, cls: 'axl' }) : text(L - 6, T - 12, y.label, { size: 11, anchor: 'end', cls: 'axl' });
  if (xx.label) s += text(L + pw + (schem ? 8 : 0), T + ph + 30, xx.label, { size: 11.5, anchor: 'end', cls: 'axl' });
  // x 눈금
  if (cats) cats.forEach((c, i) => (s += text(sx(i), T + ph + 17, c, { size: 11, anchor: 'middle', cls: 'tick' })));
  for (const t of xx.ticks || []) {
    const v = typeof t === 'object' ? t.v : t, lab = typeof t === 'object' ? t.label : fmt(t);
    s += text(sx(v), T + ph + 17, lab, { size: 11, anchor: 'middle', cls: 'tick' });
  }
  if (schem) s += text(L - 6, T + ph + 14, '0', { size: 11, anchor: 'end', cls: 'tick' });
  // 선
  b.series.forEach((ser, j) => {
    const pts = (ser.points || ser.values.map((v, i) => [i, v])).map(([a, v]) => [sx(a), sy(v)]);
    const cls = `ln s${ser.color || j + 1}${ser.dash ? ' dash' : ''}`;
    const d = ser.smooth || b.smooth ? smoothPath(pts) : 'M' + pts.map((p) => `${r1(p[0])},${r1(p[1])}`).join('L');
    s += `<path d="${d}" class="${cls}"/>`;
    if (ser.marker) pts.forEach((p) => (s += `<circle cx="${r1(p[0])}" cy="${r1(p[1])}" r="3.4" class="dot s${ser.color || j + 1}"/>`));
    if (ser.end) {
      const p = pts[pts.length - 1];
      s += text(p[0] + 6, p[1] + 4, ser.end, { size: 11, cls: `endl s${ser.color || j + 1}` });
    }
  });
  for (const a of b.notes || []) s += text(sx(a.x), sy(a.y), a.text, { size: 10.5, anchor: a.anchor || 'middle', cls: 'note' });
  if (hasLegend) s += legend(b.series.map((x, j) => ({ ...x, cls: `s${x.color || j + 1}` })), W - R - legendWidth(b.series, 11, 'line'), 16, { kind: 'line' });
  return { W, H, s };
}

// ── 산점도 ──
function scatter(b) {
  const W = b.w || 600, H = b.h || 320;
  const L = b.schematic ? 34 : 54, R = 16, T = 40, B = 42, pw = W - L - R, ph = H - T - B;
  const x = b.x, y = b.y;
  const sx = (v) => L + ((v - x.min) / (x.max - x.min)) * pw, sy = (v) => T + ph - ((v - y.min) / (y.max - y.min)) * ph;
  let s = '';
  if (!b.schematic) {
    for (const v of ticks(y.min, y.max, y.step)) {
      s += `<line x1="${L}" y1="${r1(sy(v))}" x2="${L + pw}" y2="${r1(sy(v))}" class="grid"/>` + text(L - 6, sy(v) + 4, fmt(v), { size: 11, anchor: 'end', cls: 'tick' });
    }
    for (const v of ticks(x.min, x.max, x.step)) s += text(sx(v), T + ph + 16, fmt(v), { size: 11, anchor: 'middle', cls: 'tick' });
  }
  s += `<line x1="${L}" y1="${T + ph}" x2="${L + pw}" y2="${T + ph}" class="axis"/><line x1="${L}" y1="${T}" x2="${L}" y2="${T + ph}" class="axis"/>`;
  if (b.zero) {
    if (x.min < 0 && x.max > 0) s += `<line x1="${r1(sx(0))}" y1="${T}" x2="${r1(sx(0))}" y2="${T + ph}" class="zero"/>`;
    if (y.min < 0 && y.max > 0) s += `<line x1="${L}" y1="${r1(sy(0))}" x2="${L + pw}" y2="${r1(sy(0))}" class="zero"/>`;
  }
  for (const l of b.labels || []) {
    const [dx, dy, an] = l.pos === 'left' ? [-8, 4, 'end'] : l.pos === 'top' ? [0, -9, 'middle'] : l.pos === 'bottom' ? [0, 17, 'middle'] : [8, 4, 'start'];
    s += text(sx(l.x) + dx, sy(l.y) + dy, l.text, { size: l.size || 12.5, anchor: an, cls: 'cat', weight: 700 });
  }
  const all = [];
  b.groups.forEach((g, j) => g.points.forEach(([a, v]) => {
    all.push([a, v]);
    s += `<circle cx="${r1(sx(a))}" cy="${r1(sy(v))}" r="4.2" class="dot s${j + 1}"/>`;
  }));
  if (b.trend) {
    const n = all.length, mx = all.reduce((t, p) => t + p[0], 0) / n, my = all.reduce((t, p) => t + p[1], 0) / n;
    const k = all.reduce((t, p) => t + (p[0] - mx) * (p[1] - my), 0) / all.reduce((t, p) => t + (p[0] - mx) ** 2, 0);
    const f = (v) => my + k * (v - mx);
    s += `<line x1="${r1(sx(x.min))}" y1="${r1(sy(f(x.min)))}" x2="${r1(sx(x.max))}" y2="${r1(sy(f(x.max)))}" class="ln trend dash"/>`;
  }
  if (y.label) s += text(L + 6, T - 8, y.label, { size: 11, cls: 'axl' });
  if (x.label) s += text(L + pw, T + ph + 34, x.label, { size: 11, anchor: 'end', cls: 'axl' });
  if (b.groups.length > 1) s += legend(b.groups, W - R - legendWidth(b.groups), 16);
  return { W, H, s };
}

// ── 원그래프 ──
function pie(b) {
  const W = 600, H = b.h || 260, cx = 170, cy = H / 2, r = Math.min(110, H / 2 - 16), ri = b.donut ? r * 0.55 : 0;
  const total = b.slices.reduce((t, x) => t + x.value, 0);
  let a0 = -Math.PI / 2, s = '';
  b.slices.forEach((sl, i) => {
    const a1 = a0 + (sl.value / total) * Math.PI * 2, large = a1 - a0 > Math.PI ? 1 : 0;
    const p = (a, rr) => [cx + rr * Math.cos(a), cy + rr * Math.sin(a)];
    const [x0, y0] = p(a0, r), [x1, y1] = p(a1, r), [x2, y2] = p(a1, ri), [x3, y3] = p(a0, ri);
    s += `<path d="M${r1(x0)},${r1(y0)}A${r},${r} 0 ${large} 1 ${r1(x1)},${r1(y1)}L${r1(x2)},${r1(y2)}${ri ? `A${ri},${ri} 0 ${large} 0 ${r1(x3)},${r1(y3)}` : ''}Z" class="fl s${i + 1} pie"/>`;
    const [lx, ly] = p((a0 + a1) / 2, (r + ri) / 2 + (ri ? 0 : r * 0.12));
    s += text(lx, ly + 4, `${fmt(sl.value)}${b.unit ?? '%'}`, { size: 12, anchor: 'middle', cls: `in s${i + 1}`, weight: 700 });
    a0 = a1;
  });
  if (b.center) s += text(cx, cy, b.center, { size: 12, anchor: 'middle', cls: 'cat', weight: 700, baseline: 'middle' });
  let ly = cy - (b.slices.length * 26) / 2 + 12;
  b.slices.forEach((sl, i) => {
    s += `<rect x="330" y="${r1(ly - 11)}" width="14" height="14" rx="2" class="fl s${i + 1}"/>` + text(352, ly, sl.label, { size: 12.5, cls: 'lg' });
    ly += 26;
  });
  return { W, H, s };
}

// ── 기후 그래프 (월평균 기온 꺾은선 + 월 강수량 막대) ──
function climate(b) {
  const W = b.w || (b.compact ? 300 : 600), H = b.h || 260;
  const L = 40, R = 44, T = 30, B = 28, pw = W - L - R, ph = H - T - B;
  const tmin = b.tMin ?? -20, tmax = b.tMax ?? 30, pmax = b.pMax ?? 500;
  const st = (v) => T + ph - ((v - tmin) / (tmax - tmin)) * ph, sp = (v) => T + ph - (v / pmax) * ph;
  const band = pw / 12;
  let s = '';
  for (const v of ticks(tmin, tmax, b.tStep ?? 10)) {
    s += `<line x1="${L}" y1="${r1(st(v))}" x2="${L + pw}" y2="${r1(st(v))}" class="grid"/>` + text(L - 5, st(v) + 4, fmt(v), { size: 10.5, anchor: 'end', cls: 'tick' });
  }
  const nT = ticks(tmin, tmax, b.tStep ?? 10).length - 1;
  for (let i = 0; i <= nT; i++) s += text(L + pw + 5, T + ph - (ph * i) / nT + 4, fmt(Math.round((pmax * i) / nT)), { size: 10.5, cls: 'tick' });
  if (tmin < 0 && tmax > 0) s += `<line x1="${L}" y1="${r1(st(0))}" x2="${L + pw}" y2="${r1(st(0))}" class="zero"/>`;
  b.precip.forEach((v, i) => (s += `<rect x="${r1(L + band * i + band * 0.18)}" y="${r1(sp(Math.min(v, pmax)))}" width="${r1(band * 0.64)}" height="${r1(T + ph - sp(Math.min(v, pmax)))}" class="fl s2 prec"/>`));
  const pts = b.temp.map((v, i) => [L + band * i + band / 2, st(v)]);
  s += `<path d="M${pts.map((p) => `${r1(p[0])},${r1(p[1])}`).join('L')}" class="ln s3"/>`;
  pts.forEach((p) => (s += `<circle cx="${r1(p[0])}" cy="${r1(p[1])}" r="2.8" class="dot s3"/>`));
  s += `<line x1="${L}" y1="${T + ph}" x2="${L + pw}" y2="${T + ph}" class="axis"/>`;
  for (const m of [1, 4, 7, 10, 12]) s += text(L + band * (m - 1) + band / 2, T + ph + 16, `${m}`, { size: 10.5, anchor: 'middle', cls: 'tick' });
  s += text(L - 5, T - 10, '(℃)', { size: 10.5, anchor: 'end', cls: 'axl' }) + text(L + pw + 5, T - 10, '(mm)', { size: 10.5, cls: 'axl' });
  s += text(L + pw, T + ph + 26, '(월)', { size: 10, anchor: 'end', cls: 'axl' });
  if (b.label) s += text(L + 4, T - 10, b.label, { size: 12.5, cls: 'cat', weight: 700 });
  return { W, H, s };
}

// ── 기온·강수 편차 그래프 (수능 예시문항형) ──
//   월 기온 편차 = 월평균 기온 - 연평균 기온 (꺾은선, 왼쪽 축)
//   월 강수 편차 = 월 강수량 - 연 강수량/12 (막대, 오른쪽 축, 0 아래로도 그림)
function climdev(b) {
  const W = b.w || 300, H = b.h || 210;
  const L = 40, R = 46, T = 30, B = 28, pw = W - L - R, ph = H - T - B;
  const tAvg = b.temp.reduce((a, v) => a + v, 0) / 12, pAvg = b.precip.reduce((a, v) => a + v, 0) / 12;
  const dt = b.temp.map((v) => v - tAvg), dp = b.precip.map((v) => v - pAvg);
  const tr = b.tRange ?? 20, pr = b.pRange ?? 200;
  const st = (v) => T + ph / 2 - (v / tr) * (ph / 2), sp = (v) => T + ph / 2 - (v / pr) * (ph / 2);
  const band = pw / 12;
  let s = '';
  for (let i = -2; i <= 2; i++) {
    const y = T + ph / 2 - (i / 2) * (ph / 2);
    s += `<line x1="${L}" y1="${r1(y)}" x2="${L + pw}" y2="${r1(y)}" class="${i === 0 ? 'zero' : 'grid'}"/>`;
    s += text(L - 5, y + 4, fmt((tr * i) / 2), { size: 10.5, anchor: 'end', cls: 'tick' });
    s += text(L + pw + 5, y + 4, fmt((pr * i) / 2), { size: 10.5, cls: 'tick' });
  }
  dp.forEach((v, i) => {
    const c = Math.max(-pr, Math.min(pr, v)), y0 = st(0), y1 = sp(c);
    s += `<rect x="${r1(L + band * i + band * 0.18)}" y="${r1(Math.min(y0, y1))}" width="${r1(band * 0.64)}" height="${r1(Math.abs(y1 - y0))}" class="fl s2 prec"/>`;
  });
  const pts = dt.map((v, i) => [L + band * i + band / 2, st(Math.max(-tr, Math.min(tr, v)))]);
  s += `<path d="M${pts.map((p) => `${r1(p[0])},${r1(p[1])}`).join('L')}" class="ln s3"/>`;
  pts.forEach((p) => (s += `<circle cx="${r1(p[0])}" cy="${r1(p[1])}" r="2.8" class="dot s3"/>`));
  for (const m of [1, 4, 7, 10, 12]) s += text(L + band * (m - 1) + band / 2, T + ph + 16, `${m}`, { size: 10.5, anchor: 'middle', cls: 'tick' });
  s += text(L - 5, T - 10, '(℃)', { size: 10.5, anchor: 'end', cls: 'axl' }) + text(L + pw + 5, T - 10, '(mm)', { size: 10.5, cls: 'axl' });
  s += text(L + pw, T + ph + 26, '(월)', { size: 10, anchor: 'end', cls: 'axl' });
  if (b.label) s += text(L + 4, T - 10, b.label, { size: 12.5, cls: 'cat', weight: 700 });
  return { W, H, s };
}

// ── 벤 다이어그램 ──
function venn(b) {
  const W = b.w || 600, H = b.h || 250, r = Math.min(b.r || 120, (H - 44) / 2), cy = H / 2 + 14, gap = r * 0.95;
  const cxL = W / 2 - gap / 2, cxR = W / 2 + gap / 2;
  let s = `<circle cx="${cxL}" cy="${cy}" r="${r}" class="venn v1"/><circle cx="${cxR}" cy="${cy}" r="${r}" class="venn v2"/>`;
  s += text(cxL - r * 0.35, cy - r - 6, b.left.label, { size: 13, anchor: 'middle', cls: 'cat', weight: 700 });
  s += text(cxR + r * 0.35, cy - r - 6, b.right.label, { size: 13, anchor: 'middle', cls: 'cat', weight: 700 });
  const spots = [[cxL - r * 0.48, 'A', b.left.items], [W / 2, 'B', b.both?.items], [cxR + r * 0.48, 'C', b.right.items]];
  for (const [x, letter, items] of spots) {
    if (b.letters !== false) s += text(x, items?.length ? cy - r * 0.55 : cy + 6, letter, { size: 16, anchor: 'middle', cls: 'vl', weight: 800 });
    (items || []).forEach((it, i) => (s += text(x, cy - r * 0.25 + i * 17, it, { size: 11.5, anchor: 'middle', cls: 'vi' })));
  }
  return { W, H, s };
}

// ── 지도 ──
let WORLD = {};
function worldData(detail) {
  if (!WORLD[detail]) {
    const topo = JSON.parse(readFileSync(require.resolve(`world-atlas/countries-${detail}.json`), 'utf8'));
    WORLD[detail] = { countries: feature(topo, topo.objects.countries), borders: mesh(topo, topo.objects.countries, (a, b) => a !== b) };
  }
  return WORLD[detail];
}
function map(b) {
  const W = b.w || 600, H = b.h || (b.view === 'world' || !b.view ? 300 : 340);
  const isWorld = b.view === 'world' || !b.view;
  const detail = b.detail || (isWorld ? '110m' : '50m');
  const { countries, borders } = worldData(detail);
  let proj;
  if (isWorld) {
    proj = geoEqualEarth().fitExtent([[6, 6], [W - 6, H - 6]], { type: 'Sphere' });
  } else {
    const [w, sLat, e, n] = b.view;
    const box = { type: 'Feature', geometry: { type: 'Polygon', coordinates: [[[w, sLat], [w, n], [e, n], [e, sLat], [w, sLat]]] } };
    proj = geoMercator().fitExtent([[2, 2], [W - 2, H - 2]], box);
  }
  const path = geoPath(proj);
  const byName = new Map(countries.features.map((f) => [f.properties.name, f]));
  const byId = new Map(countries.features.map((f) => [String(f.id), f]));
  const find = (k) => byName.get(k) || byId.get(String(k));
  let s = `<rect x="0" y="0" width="${W}" height="${H}" class="sea"/>`;
  if (isWorld) s += `<path d="${path({ type: 'Sphere' })}" class="sphere"/>`;
  if (b.graticule !== false && isWorld) s += `<path d="${path(geoGraticule10())}" class="grat"/>`;
  s += `<path d="${path(countries)}" class="land"/>`;
  for (const h of b.highlight || []) {
    const f = find(h.country);
    if (!f) throw new Error(`지도에 없는 나라: ${h.country}`);
    s += `<path d="${path(f)}" class="hl ${h.cls || 'h1'}"/>`;
  }
  s += `<path d="${path(borders)}" class="border"/>`;
  // 위도선 (예: 남북회귀선 parallels: [{ lat: -23.4, label: '남회귀선' }])
  for (const pl of b.parallels || []) {
    const lons = isWorld ? [-180, -90, 0, 90, 180] : [b.view[0], (b.view[0] + b.view[2]) / 2, b.view[2]];
    const d = path({ type: 'LineString', coordinates: lons.map((lo) => [lo, pl.lat]) });
    if (d) s += `<path d="${d}" class="eq"/>`;
    if (pl.label) { const [lx, ly] = proj([isWorld ? -170 : b.view[0] + 0.5, pl.lat]); s += text(lx + 2, ly - 4, pl.label, { size: 10.5, cls: 'mapl soft' }); }
  }
  if (b.equator) {
    const eq = path({ type: 'LineString', coordinates: [[-180, 0], [-90, 0], [0, 0], [90, 0], [180, 0]] });
    if (eq) s += `<path d="${eq}" class="eq"/>`;
  }
  for (const h of b.highlight || []) {
    if (!h.label) continue;
    const at = h.at || geoCentroid(find(h.country));
    const [x, y] = proj(at);
    s += text(x, y + 4, h.label, { size: 12, anchor: 'middle', cls: 'mapl', weight: 700 });
  }
  for (const l of b.labels || []) {
    const [x, y] = proj(l.at);
    s += text(x, y, l.text, { size: l.size || 11.5, anchor: 'middle', cls: `mapl ${l.cls || 'soft'}` });
  }
  for (const a of b.arrows || []) {
    const [x1, y1] = proj(a.from), [x2, y2] = proj(a.to);
    const mx = (x1 + x2) / 2 - (y2 - y1) * (a.bend ?? 0.2), my = (y1 + y2) / 2 + (x2 - x1) * (a.bend ?? 0.2);
    s += `<path d="M${r1(x1)},${r1(y1)}Q${r1(mx)},${r1(my)} ${r1(x2)},${r1(y2)}" class="arrow ${a.cls || ''}" marker-end="url(#${a.cls ? `ah-${a.cls}` : 'ah2'})"/>`;
    if (a.label) s += text(mx, my - 4, a.label, { size: 11, anchor: 'middle', cls: 'mapl' });
  }
  for (const m of b.markers || []) {
    const [x, y] = proj([m.lon, m.lat]);
    if (m.ring) s += `<circle cx="${r1(x)}" cy="${r1(y)}" r="${m.ring}" class="ring"/>`;
    else s += `<circle cx="${r1(x)}" cy="${r1(y)}" r="4.5" class="pin ${m.cls || ''}"/>`;
    if (m.label) {
      const pos = m.pos || 'right', d = (m.ring || 6) + 4;
      const [tx, ty, an] = pos === 'left' ? [x - d, y + 4, 'end'] : pos === 'top' ? [x, y - d, 'middle'] : pos === 'bottom' ? [x, y + d + 10, 'middle'] : [x + d, y + 4, 'start'];
      s += text(tx, ty, m.label, { size: m.size || 12.5, anchor: an, cls: 'mapl pinl', weight: 700 });
    }
  }
  if (b.legend) s += legend(b.legend.map((l) => ({ name: l.label, cls: l.cls })), 12, H - 10);
  return { W, H, s };
}

const KINDS = { bar, hbar, stack100, line, scatter, pie, climate, climdev };

// 그림 블록 → HTML (<figure>)
export function figure(b) {
  const out = b.t === 'venn' ? venn(b) : b.t === 'map' ? map(b) : (KINDS[b.kind] || (() => { throw new Error(`모르는 그래프: ${b.kind}`); }))(b);
  const defs = `<defs><marker id="ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0L10,5L0,10z" class="ahd"/></marker>`
    + `<marker id="ah2" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0L10,5L0,10z" class="ahd2"/></marker>`
    + ['warm', 'cold', 'wind'].map((k) => `<marker id="ah-${k}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0L10,5L0,10z" class="ahd-${k}"/></marker>`).join('') + '</defs>';
  const svg = `<svg viewBox="0 0 ${out.W} ${out.H}" xmlns="http://www.w3.org/2000/svg" class="fig-svg">${defs}${out.s}</svg>`;
  const width = b.width ? ` style="width:${b.width}%"` : '';
  return `<figure class="fig fig-${b.t === 'chart' ? b.kind : b.t}"${width}${b._fig ? ` data-fig="${b._fig}"` : ''}>${
    b.title ? `<figcaption class="fig-title">${esc(b.title)}</figcaption>` : ''}<div class="fig-body">${svg}</div>${
    b.source || b.note ? `<div class="fig-foot">${b.note ? `<span class="fig-note">${esc(b.note)}</span>` : ''}${b.source ? `<span class="fig-src">${esc(b.source)}</span>` : ''}</div>` : ''}</figure>`;
}

export const FIGURE_TYPES = new Set(['chart', 'venn', 'map']);
