// 지도 그리기 (2026-11 새 방식)
//
// 바탕 자료
//   나라·육지: world-atlas (Natural Earth), 강·호수·국경: data/geo/ne-*.json (Natural Earth, 공개 자료)
//   우리나라: data/geo/kr-provinces.json (통계청 시·도 경계), kr-rivers.json (고도 자료로 계산한 하천)
//   지형 바탕(음영 기복): assets/terrain/<번호>.jpg — lib/terrain.js 가 고도 자료(AWS Terrain Tiles)로 만든다
//
// 지도 블록 { t: 'map', ... }
//   view: 'world' | [서경, 남위, 동경, 북위]     center: 세계 지도 가운데 경도(기본 0, 태평양 중심은 150)
//   style: 'terrain'(지형도) | 'political'(나라별 색) | 'thematic'(옅은 땅 + 주제 색, 기본)
//   highlight: [{ country, cls, label, at, fill }]   나라 색칠 (cls: h1~h4, k1~k8, 또는 fill: '#색')
//   choro: { data: { ISO3: 값 }, breaks: [...], colors: [...], title, labels }   단계 구분도
//   markers: [{ lon, lat, label, pos, cls, ring, city }]   arrows: [{ from, to, bend, cls, label }]
//   labels: [{ at:[경도,위도], text, size, cls: 'sea'|'country'|'river'|'terr'|'region'|'soft'|'strong', rot }]
//   seas: true(세계 지도 대양 이름 자동) | [[이름, 경도, 위도, 크기, 기울기]]
//   rivers: false | 등급(1~9)   riverEmph: ['Mekong'](강조할 강, Natural Earth 영어 이름)   lakes: false | 등급   krRivers: 최소 유역(km²)   provinces: true(시·도 경계)
//   borders: false(국경선 끄기)  deg: false(경위도 숫자 끄기)  north: false(방위표 끄기)  scale: false | km  frame: false
//   legend: [{ cls, label } | { line: 'border'|'river'|'prov'|'mdl'|'warm'|'cold'|'wind', label } | { pin: 'k1', label }]
import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { geoEqualEarth, geoMercator, geoPath, geoGraticule, geoBounds, geoCentroid, geoArea } from 'd3-geo';
import { feature, mesh } from 'topojson-client';

const require = createRequire(import.meta.url);
const ROOT = new URL('../', import.meta.url).pathname;
const r1 = (n) => Math.round(n * 10) / 10;

// ── 자료 불러오기 (한 번만) ──
const cache = {};
function atlas(detail) {
  return (cache['a' + detail] ||= (() => {
    const topo = JSON.parse(readFileSync(require.resolve(`world-atlas/countries-${detail}.json`), 'utf8'));
    const land = JSON.parse(readFileSync(require.resolve(`world-atlas/land-${detail}.json`), 'utf8'));
    return {
      countries: rewind(feature(topo, topo.objects.countries)),
      borders: mesh(topo, topo.objects.countries, (a, b) => a !== b),
      land: rewind(feature(land, land.objects.land)),
    };
  })());
}
// 감김 방향이 뒤집힌 다각형(지구의 반 이상을 덮는 것으로 읽힘)을 바로잡기 — 10m 자료의 일부 섬 때문에 지도 전체가 칠해지는 것 방지
function rewind(fc) {
  const fix = (polys) => polys.map((poly) => (geoArea({ type: 'Polygon', coordinates: poly }) > 2 * Math.PI ? poly.map((r) => r.slice().reverse()) : poly));
  for (const f of fc.features || [fc]) {
    const g = f.geometry; if (!g) continue;
    if (g.type === 'Polygon') g.coordinates = fix([g.coordinates])[0];
    if (g.type === 'MultiPolygon') g.coordinates = fix(g.coordinates);
  }
  return fc;
}
const geo = (n) => (cache[n] ||= JSON.parse(readFileSync(ROOT + 'data/geo/' + n, 'utf8')));
const META = () => geo('countries-meta.json');
function metaOf(f) {
  const m = META();
  return m[String(f.id).padStart(3, '0')] || m[`n:${f.properties.name}`] || Object.values(m).find((x) => x.name === f.properties.name) || {};
}

// ── 투영 ──
export function makeProjection(b) {
  const world = b.view === 'world' || !b.view;
  const W = b.w || 600, H = b.h || (world ? 300 : 340);
  let proj, vb;
  if (world) {
    proj = geoEqualEarth().rotate([-(b.center || 0), 0]).fitExtent([[6, 6], [W - 6, H - 6]], { type: 'Sphere' });
    vb = [-180, -90, 180, 90];
  } else {
    const [w, s, e, n] = b.view;
    // 경위도 네모를 그대로 맞추기 (가장자리를 점으로 촘촘히: 대권 곡선으로 부풀지 않게)
    const pts = [];
    for (let k = 0; k <= 40; k++) { const lo = w + ((e - w) * k) / 40, la = s + ((n - s) * k) / 40; pts.push([lo, s], [lo, n], [w, la], [e, la]); }
    const box = { type: 'Feature', geometry: { type: 'MultiPoint', coordinates: pts } };
    proj = geoMercator().fitExtent([[2, 2], [W - 2, H - 2]], box);
    proj.clipExtent([[-12, -12], [W + 12, H + 12]]);
    const a = proj.invert([0, 0]), c = proj.invert([W, H]);
    vb = [a[0], c[1], c[0], a[1]];
  }
  return { proj, W, H, world, vb };
}

// 지형 바탕 그림 이름 (설정이 같으면 같은 그림)
export const TERRAIN_VERSION = 4;
export function terrainKey(b) {
  const { W, H, world } = makeProjection(b);
  const k = JSON.stringify({ v: TERRAIN_VERSION, view: world ? 'world' : b.view, W, H, c: b.center || 0, s: b.terrainScale || 3, p: b.palette || 'atlas', zf: b.zf || 0 });
  return createHash('md5').update(k).digest('hex').slice(0, 12);
}
export const terrainFile = (b) => `${ROOT}assets/terrain/${terrainKey(b)}.jpg`;

// 가까운 점 빼기 (지도 위 tol px 안) → SVG 용량 줄이기
function thin(proj, tol) {
  return {
    stream(out) {
      let px, py, last, n = 0;
      return proj.stream({
        point(x, y) {
          if (n === 0 || Math.abs(x - px) + Math.abs(y - py) >= tol) { out.point(x, y); px = x; py = y; last = null; n++; } else last = [x, y];
        },
        lineStart() { n = 0; last = null; out.lineStart(); },
        lineEnd() { if (last) out.point(last[0], last[1]); out.lineEnd(); },
        polygonStart() { out.polygonStart(); }, polygonEnd() { out.polygonEnd(); },
        sphere() { out.sphere(); },
      });
    },
  };
}

// 굵기가 변하는 강 (점마다 굵기 → 왼쪽·오른쪽 가장자리를 이어 다각형)
function taper(pts) {
  const L = [], R = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)], c = pts[Math.min(pts.length - 1, i + 1)];
    let dx = c[0] - a[0], dy = c[1] - a[1]; const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
    const w = pts[i][2] / 2;
    L.push(`${r1(pts[i][0] - dy * w)},${r1(pts[i][1] + dx * w)}`); R.push(`${r1(pts[i][0] + dy * w)},${r1(pts[i][1] - dx * w)}`);
  }
  return 'M' + L.join('L') + 'L' + R.reverse().join('L') + 'Z';
}
function chaikin(p, it = 3) {
  for (let k = 0; k < it; k++) {
    const q = [p[0]];
    for (let i = 0; i < p.length - 1; i++) {
      const a = p[i], c = p[i + 1];
      q.push(a.map((v, j) => 0.75 * v + 0.25 * c[j]), a.map((v, j) => 0.25 * v + 0.75 * c[j]));
    }
    q.push(p[p.length - 1]); p = q;
  }
  return p;
}

// 나라별 색 (이웃 나라는 다른 색: Natural Earth MAPCOLOR7)
const POL = { 1: '#f5e6b1', 2: '#d5e9c3', 3: '#f4cfc1', 4: '#f9e09c', 5: '#dcd4ee', 6: '#cde6da', 7: '#f3d3df' };
// 세계 지도 대양 이름 (가운데 경도에 따라 고름)
const OCEANS = [['태 평 양', -140, 2, 14], ['태 평 양', 168, 2, 14], ['대 서 양', -30, 2, 13], ['인 도 양', 76, -22, 13]];
const KOREA = [123.5, 32.5, 131.5, 43.5];
const inKorea = (f) => { const [[w, s], [e, n]] = geoBounds(f); return w >= KOREA[0] && e <= KOREA[2] && s >= KOREA[1] && n <= KOREA[3]; };

export function drawMap(b, h) {
  const { text, esc, legend, legendWidth, tw } = h;
  const { proj, W, H, world, vb } = makeProjection(b);
  const style = b.style || 'thematic';
  const span = world ? 360 : vb[2] - vb[0];
  const detail = b.detail || (world ? '50m' : span > 70 ? '50m' : '10m');
  const tol = b.tol ?? (world ? 0.6 : 0.4);
  const path0 = geoPath(thin(proj, tol)).digits(1);
  const path = (f) => path0(f) || '';
  const gpath = geoPath(proj).digits(1);
  const pad = 3;
  const inView = (f) => {
    if (world) return true;
    if (!f.geometry) return false;
    const [[w, s], [e, n]] = geoBounds(f);
    if (e < w) return !(n < vb[1] - pad || s > vb[3] + pad); // 날짜 변경선을 넘는 것(러시아 등)
    return !(e < vb[0] - pad || w > vb[2] + pad || n < vb[1] - pad || s > vb[3] + pad);
  };
  const A = atlas(detail);
  const countries = A.countries.features.filter(inView);
  const byName = new Map(A.countries.features.map((f) => [f.properties.name, f]));
  const byId = new Map(A.countries.features.map((f) => [String(f.id), f]));
  const find = (k) => byName.get(k) || byId.get(String(k));
  const uid = (b._fig || 'm') + terrainKey(b).slice(0, 4);
  const terrain = style === 'terrain';
  let s = '';

  // ── 1. 바탕 (바다·지형) ──
  if (world) s += `<clipPath id="sp-${uid}"><path d="${gpath({ type: 'Sphere' })}"/></clipPath>`;
  const clip = world ? ` clip-path="url(#sp-${uid})"` : '';
  if (terrain && existsSync(terrainFile(b))) {
    const b64 = readFileSync(terrainFile(b)).toString('base64');
    s += `<image x="0" y="0" width="${W}" height="${H}" preserveAspectRatio="none" href="data:image/jpeg;base64,${b64}"${clip}/>`;
  } else {
    if (terrain) console.warn(`  ! 지형 바탕이 없어 기본 모양으로 그림: ${b.title || b._fig}`);
    s += world ? `<path d="${gpath({ type: 'Sphere' })}" fill="#d7eaf7"/>` : `<rect x="0" y="0" width="${W}" height="${H}" fill="#d3e8f6"/>`;
  }
  // ── 2. 경위선 ──
  const step = b.grat || (world ? 30 : span > 60 ? 20 : span > 25 ? 10 : span > 8 ? 5 : span > 3 ? 2 : 1);
  const g = geoGraticule().step([step, step]);
  if (!world) g.extent([[Math.floor(vb[0] / step) * step, Math.floor(vb[1] / step) * step], [Math.ceil(vb[2] / step) * step + 0.001, Math.ceil(vb[3] / step) * step + 0.001]]);
  else g.extent([[-180, -80], [180, 80.001]]);
  const gratD = b.graticule === false ? '' : gpath(g());
  if (gratD && !terrain) s += `<path d="${gratD}" fill="none" stroke="#bad6ec" stroke-width=".55"/>`;

  // ── 3. 땅 색 ──
  if (style === 'political') {
    for (const f of countries) s += `<path d="${path(f)}" fill="${POL[metaOf(f).c7] || '#efe9dc'}"/>`;
  } else if (style === 'thematic' || b.choro) {
    s += `<path d="${path(A.land)}" fill="#f4f0e6"/>`;
  }
  if (b.choro) {
    const { data, breaks, colors, nodata = '#e2e2e2' } = b.choro;
    for (const f of countries) {
      const v = data[metaOf(f).iso3];
      let fill = nodata;
      if (v != null) { let i = 0; while (i < breaks.length && v >= breaks[i]) i++; fill = colors[i]; }
      s += `<path d="${path(f)}" fill="${fill}"/>`;
    }
  }
  for (const hl of b.highlight || []) {
    const f = find(hl.country);
    if (!f) throw new Error(`지도에 없는 나라: ${hl.country}`);
    if (hl.fill) s += `<path d="${path(f)}" fill="${hl.fill}" fill-opacity="${hl.opacity ?? (terrain ? 0.45 : 0.9)}"/>`;
    else s += `<path d="${path(f)}" class="hl ${hl.cls || 'h1'}${terrain ? ' tl' : ' solid'}"/>`;
  }
  if (b.provinces) for (const f of geo('kr-provinces.json').features) s += `<path d="${path(f)}" fill="none" stroke="${terrain ? 'rgba(88,64,110,.55)' : '#a395b3'}" stroke-width=".6" stroke-dasharray="3 1.6"/>`;

  // ── 4. 호수·강 ──
  const riverRank = b.rivers ?? (world ? (terrain ? 3 : false) : span > 90 ? 4 : span > 40 ? 5 : span > 15 ? 7 : 9);
  const lakeRank = b.lakes ?? (world ? (style === 'thematic' && !terrain ? 2 : 3) : riverRank === false ? 4 : Math.min(9, riverRank));
  const water = '#2f7fcf';
  const korea = !world && !(vb[2] < KOREA[0] || vb[0] > KOREA[2] || vb[3] < KOREA[1] || vb[1] > KOREA[3]);
  if (lakeRank !== false && !b.choro) {
    let ls = '';
    for (const f of geo('ne-lakes.json').features) if (f.properties.r <= lakeRank && inView(f)) ls += path(f);
    if (ls) s += `<path d="${ls}" fill="#b6d8f2" stroke="#4f93d2" stroke-width=".4"/>`;
  }
  if (riverRank !== false && !b.choro) {
    const krOn = korea && b.krRivers !== false;
    const byW = new Map();
    for (const f of geo('ne-rivers.json').features) {
      if (f.properties.r > riverRank || !inView(f) || (krOn && inKorea(f))) continue;
      const w = r1(Math.max(0.45, (terrain ? 1.75 : 1.5) - f.properties.r * 0.16) * (world ? 0.8 : 1));
      byW.set(w, (byW.get(w) || '') + path(f));
    }
    for (const [w, d] of byW) s += `<path d="${d}" fill="none" stroke="${water}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
    // 강조할 강 (예: riverEmph: ['Mekong'])
    if (b.riverEmph) {
      let d = '';
      for (const f of geo('ne-rivers.json').features) if (b.riverEmph.includes(f.properties.n) && inView(f)) d += path(f);
      if (d) s += `<path d="${d}" fill="none" stroke="#fff" stroke-width="4.6" stroke-opacity=".7" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="#1864ab" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>`;
    }
    if (krOn) {
      // 우리나라 하천: 유역이 넓을수록 굵게 (상류 → 하류)
      const kmPerPx = (span * 111 * Math.cos(((vb[1] + vb[3]) / 2) * Math.PI / 180)) / W;
      const min = b.krRivers ?? Math.min(6000, Math.max(150, Math.round((kmPerPx * 240) / 25) * 25));
      const wmax = b.krWidth ?? Math.min(2.4, Math.max(1.1, 2.4 * Math.sqrt(1.5 / kmPerPx)));
      const ref = 30000, wmin = 0.45;
      const wOf = (a) => Math.min(wmax, wmin + ((wmax - wmin) * Math.max(0, Math.log(a / min))) / Math.log(ref / min));
      let rs = '';
      for (const l of geo('kr-rivers.json')) {
        const k0 = l.findIndex((q) => q[2] >= min); if (k0 < 0) continue;
        let p = l.slice(k0).map(([lo, la, a]) => { const xy = proj([lo, la]); return [xy[0], xy[1], wOf(a)]; });
        if (k0 > 0) { const xy = proj([l[k0 - 1][0], l[k0 - 1][1]]); p.unshift([xy[0], xy[1], wmin * 0.8]); }
        p = p.filter((q) => q[0] > -15 && q[0] < W + 15 && q[1] > -15 && q[1] < H + 15);
        if (p.length < 2) continue;
        rs += `<path d="${taper(chaikin(p, 3))}"/>`;
      }
      s += `<g fill="${water}">${rs}</g>`;
    }
  }

  // ── 5. 해안선·국경 ──
  if (b.choro) s += `<path d="${path(A.borders)}" fill="none" stroke="#fff" stroke-width=".45"/>`;
  else if (b.borders === false) { /* 국경선 없음 (역사 지도 등) */ }
  else if (world && style !== 'political') {
    s += `<path d="${path(A.borders)}" fill="none" stroke="${terrain ? 'rgba(120,70,130,.75)' : '#c9c1b2'}" stroke-width="${terrain ? 0.5 : 0.45}"${terrain ? ' stroke-dasharray="2.5 1.2"' : ''}/>`;
  } else {
    const bd = { i: '', d: '', c: '' };
    for (const f of geo('ne-borders.json').features) if (inView(f)) bd[f.properties.k] += path(f);
    const col = '#8a4f8f';
    if (bd.i) s += `<path d="${bd.i}" fill="none" stroke="#fff" stroke-width="2.4" stroke-opacity=".65"/><path d="${bd.i}" fill="none" stroke="${col}" stroke-width="${world ? 0.6 : 1}" stroke-dasharray="${world ? '3 1.2' : '5 2 1.5 2'}"/>`;
    if (bd.d) s += `<path d="${bd.d}" fill="none" stroke="${col}" stroke-width=".9" stroke-dasharray="1.6 1.8"/>`;
    if (bd.c) s += `<path d="${bd.c}" fill="none" stroke="#fff" stroke-width="2.4" stroke-opacity=".65"/><path d="${bd.c}" fill="none" stroke="#a61e4d" stroke-width="1.1" stroke-dasharray="6 2 1.5 2"/>`;
  }
  if (!b.choro) s += `<path d="${path(A.land)}" fill="none" stroke="${terrain ? '#4a7fae' : '#79a5c9'}" stroke-width="${world ? 0.45 : 0.55}"/>`;
  if (terrain && gratD) s += `<path d="${gratD}" fill="none" stroke="rgba(255,255,255,.55)" stroke-width=".55"/>`;
  // 판의 경계 (Bird 2003)
  if (b.plates) {
    let d = ''; for (const f of geo('plates.json').features) d += path(f);
    s += `<path d="${d}" fill="none" stroke="#fff" stroke-width="3" stroke-opacity=".6" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="#c92a2a" stroke-width="1.4" stroke-linejoin="round"/>`;
  }

  // 위도선·적도
  for (const pl of b.parallels || []) {
    const lons = world ? [-180, -90, 0, 90, 180].map((x) => x + (b.center || 0)) : [vb[0], (vb[0] + vb[2]) / 2, vb[2]];
    const d = gpath({ type: 'LineString', coordinates: lons.map((lo) => [lo, pl.lat]) });
    if (d) s += `<path d="${d}" class="eq"/>`;
    if (pl.label) { const [lx, ly] = proj([world ? (b.center || 0) - 170 : vb[0] + span * 0.01, pl.lat]); s += text(lx + 2, ly - 4, pl.label, { size: 10.5, cls: 'mapl soft' }); }
  }
  if (b.equator) {
    const eq = gpath({ type: 'LineString', coordinates: [-180, -90, 0, 90, 180].map((x) => [x + (b.center || 0), 0]) });
    if (eq) s += `<path d="${eq}" class="eq"/>`;
  }

  // ── 6. 글자 ──
  const lab = (x, y, t, { size = 12, cls = 'soft', anchor = 'middle', rot = 0, weight } = {}) => {
    const map = { sea: 'mapl msea', country: 'mapl mcountry', river: 'mapl mriver', terr: 'mapl mterr', region: 'mapl mregion', soft: 'mapl soft', strong: 'mapl', deg: 'mdeg' };
    const out = text(x, y, t, { size, anchor, cls: map[cls] || `mapl ${cls}`, weight });
    return rot ? out.replace(/<text /g, `<text transform="rotate(${rot} ${r1(x)} ${r1(y)})" `) : out;
  };
  const seas = b.seas === true || (b.seas === undefined && world && !b.choro) ? OCEANS : b.seas || [];
  for (const [n, lo, la, sz = 12, rot = 0] of seas) {
    if (world && seas === OCEANS) { // 가운데 경도에서 너무 먼 대양 이름은 빼기
      const dl = ((lo - (b.center || 0) + 540) % 360) - 180; if (Math.abs(dl) > 165) continue;
    }
    const [x, y] = proj([lo, la]); s += lab(x, y + sz * 0.35, n, { size: sz, cls: 'sea', rot });
  }
  for (const hl of b.highlight || []) {
    if (!hl.label) continue;
    const [x, y] = proj(hl.at || geoCentroid(find(hl.country)));
    s += text(x, y + 4, hl.label, { size: 12, anchor: 'middle', cls: 'mapl', weight: 700 });
  }
  for (const l of b.labels || []) {
    const [x, y] = proj(l.at);
    s += lab(x, y, l.text, { size: l.size || 11.5, cls: l.cls || 'soft', rot: l.rot || 0, anchor: l.anchor || 'middle' });
  }
  // ── 7. 화살표·지점 ──
  for (const a of b.arrows || []) {
    const [x1, y1] = proj(a.from), [x2, y2] = proj(a.to);
    const mx = (x1 + x2) / 2 - (y2 - y1) * (a.bend ?? 0.2), my = (y1 + y2) / 2 + (x2 - x1) * (a.bend ?? 0.2);
    s += `<path d="M${r1(x1)},${r1(y1)}Q${r1(mx)},${r1(my)} ${r1(x2)},${r1(y2)}" class="arrow ${a.cls || ''}" marker-end="url(#${a.cls ? `ah-${a.cls}` : 'ah2'})"/>`;
    if (a.label) s += text(mx, my - 4, a.label, { size: a.size || 11, anchor: 'middle', cls: 'mapl' });
  }
  for (const m of b.markers || []) {
    const [x, y] = proj([m.lon, m.lat]);
    if (m.ring) {
      s += `<circle cx="${r1(x)}" cy="${r1(y)}" r="${m.ring}" class="ring ${m.cls || ''}"/>`;
      if (m.ring <= 10 && m.dot !== false) s += `<circle cx="${r1(x)}" cy="${r1(y)}" r="3.6" class="pin ${m.cls || ''}"/>`;
    } else if (m.city) s += `<circle cx="${r1(x)}" cy="${r1(y)}" r="3.3" class="city"/>`;
    else s += `<circle cx="${r1(x)}" cy="${r1(y)}" r="${m.r || 4.5}" class="pin ${m.cls || ''}"/>`;
    if (m.label) {
      const pos = m.pos || 'right', d = (m.ring || (m.city ? 4 : 6)) + 4;
      const [tx, ty, an] = pos === 'left' ? [x - d, y + 4, 'end'] : pos === 'top' ? [x, y - d, 'middle'] : pos === 'bottom' ? [x, y + d + 10, 'middle'] : [x + d, y + 4, 'start'];
      s += text(tx + (m.dx || 0), ty + (m.dy || 0), m.label, { size: m.size || 12.5, anchor: an, cls: `mapl pinl${m.city ? ' cityl' : ''}`, weight: m.city ? 600 : 700 });
    }
  }
  // ── 8. 경위도 숫자·방위표·축척 ──
  if (!world && b.deg !== false && style !== 'thematic-plain') {
    const ew = (v) => (v < 0 ? `${-v}°W` : `${v}°E`), ns = (v) => (v < 0 ? `${-v}°S` : v === 0 ? '0°' : `${v}°N`);
    for (let lo = Math.ceil(vb[0] / step) * step; lo <= vb[2]; lo += step) { const [x] = proj([lo, vb[3]]); if (x > 24 && x < W - 52) s += text(x + 2, 10.5, ew(r1(lo)), { size: 8.5, cls: 'mdeg' }); }
    for (let la = Math.ceil(vb[1] / step) * step; la <= vb[3]; la += step) { const [, y] = proj([vb[0], la]); if (y > 22 && y < H - 34) s += text(3, y - 3, ns(r1(la)), { size: 8.5, cls: 'mdeg' }); }
  }
  if (!world && b.north !== false) {
    const x = W - 19, y = 31;
    s += `<circle cx="${x}" cy="${y - 7}" r="12.5" fill="#fff" fill-opacity=".82"/><path d="M${x},${y - 17} L${x + 5.2},${y + 0.5} L${x},${y - 3.2} L${x - 5.2},${y + 0.5}Z" fill="#2b333b"/>`;
    s += text(x, y - 21.5, 'N', { size: 8.5, anchor: 'middle', cls: 'mnorth', weight: 800 });
  }
  if (!world && b.scale !== false && (b.scale || span < 30)) {
    const lat = (vb[1] + vb[3]) / 2, kmPx = (span * 111.32 * Math.cos((lat * Math.PI) / 180)) / W;
    const target = kmPx * W * 0.2, nice = [5, 10, 20, 25, 50, 100, 200, 250, 500, 1000];
    const km = typeof b.scale === 'number' ? b.scale : nice.reduce((p, c) => (Math.abs(c - target) < Math.abs(p - target) ? c : p), nice[0]);
    const L = km / kmPx, bx = W - L - 17, by = H - 13;
    s += `<rect x="${r1(bx - 9)}" y="${r1(by - 13)}" width="${r1(L + 26)}" height="21" rx="3" fill="#fff" fill-opacity=".86"/>`;
    s += `<rect x="${r1(bx)}" y="${by}" width="${r1(L / 2)}" height="3.6" fill="#2b333b"/><rect x="${r1(bx)}" y="${by}" width="${r1(L)}" height="3.6" fill="none" stroke="#2b333b" stroke-width=".7"/>`;
    s += text(bx, by - 3, '0', { size: 8, anchor: 'middle', cls: 'mscale' }) + text(bx + L, by - 3, `${km}km`, { size: 8, anchor: 'middle', cls: 'mscale' });
  }
  // ── 9. 범례 ──
  if (b.legend) {
    const size = b.legendSize || 10.5;
    const itemW = (it) => (it.line ? 26 : 16) + tw(it.label, size) + 12;
    const rows = [[]]; let w = 0; const maxW = b.legendW || W - 120;
    for (const it of b.legend) {
      const iw = itemW(it);
      if (b.legendV || (w + iw > maxW && rows[rows.length - 1].length)) { if (rows[rows.length - 1].length) { rows.push([]); w = 0; } }
      rows[rows.length - 1].push(it); w += iw;
    }
    const lh = size + 6.5, bw = Math.max(...rows.map((r) => r.reduce((a, it) => a + itemW(it), 0))) + 8, bh = rows.length * lh + 6;
    const [lx, ly] = b.legendAt || [6, H - bh - 6];
    s += `<rect x="${r1(lx)}" y="${r1(ly)}" width="${r1(bw)}" height="${r1(bh)}" rx="3" class="lgbg"/>`;
    rows.forEach((row, i) => {
      let x = lx + 7; const y = ly + 3 + (i + 1) * lh - 3;
      for (const it of row) {
        if (it.line) {
          const st = { border: 'stroke="#8a4f8f" stroke-width="1.2" stroke-dasharray="5 2 1.5 2"', river: `stroke="${water}" stroke-width="1.8"`, prov: 'stroke="#7a6290" stroke-width=".9" stroke-dasharray="3 1.6"', mdl: 'stroke="#a61e4d" stroke-width="1.3" stroke-dasharray="6 2 1.5 2"', plate: 'stroke="#c92a2a" stroke-width="1.6"', warm: 'stroke="#e03131" stroke-width="2"', cold: 'stroke="#1971c2" stroke-width="2"', wind: 'stroke="#868e96" stroke-width="2" stroke-dasharray="5 3"' }[it.line];
          s += `<path d="M${r1(x)},${r1(y - 4)}h20" fill="none" ${st}/>`; x += 26;
        } else if (it.pin) { s += `<circle cx="${r1(x + 5)}" cy="${r1(y - 4)}" r="4.2" class="pin ${it.pin}"/>`; x += 16; }
        else if (it.fill) { s += `<rect x="${r1(x)}" y="${r1(y - 9.5)}" width="11" height="11" rx="2" fill="${it.fill}" stroke="#8a96a3" stroke-width=".4"/>`; x += 16; }
        else { s += `<rect x="${r1(x)}" y="${r1(y - 9.5)}" width="11" height="11" rx="2" class="fl ${it.cls}${it.cls?.startsWith('h') ? ' hlbox' : ''}"/>`; x += 16; }
        s += text(x, y, it.label, { size, cls: 'lg' }); x += tw(it.label, size) + 12;
      }
    });
  }
  if (b.choro?.labels) {
    const { title, labels, colors } = b.choro, sz = 9.5;
    const bw = Math.max(tw(title || '', sz), ...labels.map((l) => tw(l, sz) + 20)) + 14, bh = labels.length * 13.5 + (title ? 20 : 8);
    const [lx, ly] = b.legendAt || [8, H - bh - 8];
    s += `<rect x="${r1(lx)}" y="${r1(ly)}" width="${r1(bw)}" height="${r1(bh)}" rx="3" class="lgbg"/>`;
    if (title) s += text(lx + 7, ly + 14, title, { size: sz, cls: 'lg', weight: 700 });
    labels.forEach((l, i) => {
      const y = ly + (title ? 20 : 7) + i * 13.5;
      s += `<rect x="${r1(lx + 7)}" y="${r1(y)}" width="13" height="10" fill="${colors[i]}" stroke="#a0a0a0" stroke-width=".4"/>` + text(lx + 25, y + 9, l, { size: sz, cls: 'lg' });
    });
  }
  if (!world && b.frame !== false) s += `<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" fill="none" stroke="#8796a5" stroke-width="1"/>`;
  if (world) s += `<path d="${gpath({ type: 'Sphere' })}" fill="none" stroke="#9fb6c8" stroke-width=".8"/>`;
  return { W, H, s };
}
