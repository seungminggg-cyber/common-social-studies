// MINIMAP 표지용 지도 도구 (2026-11-07)
// 개념서(textbook/)의 지도 자료를 그대로 쓴다: Natural Earth '한국 관점' 나라 경계(data/geo/countries-kor-*.json).
// d3-geo·topojson-client·d3-contour는 textbook/node_modules에서 불러온다.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const TB = new URL('../../textbook/', import.meta.url).pathname;
const req = createRequire(TB + 'package.json');
const load = (name) => import(pathToFileURL(req.resolve(name)).href);
export const d3 = await load('d3-geo');
const topo = await load('topojson-client');
const { contours } = await load('d3-contour');
const { feature, mesh, merge } = topo.default || topo;

const r2 = (v) => +(+v).toFixed(2);

// 감김 방향이 뒤집힌 다각형 바로잡기(maps.js와 같음)
function rewind(fc) {
  const fix = (polys) => polys.map((poly) => (d3.geoArea({ type: 'Polygon', coordinates: poly }) > 2 * Math.PI ? poly.map((r) => r.slice().reverse()) : poly));
  for (const f of fc.features || [fc]) {
    const g = f.geometry; if (!g) continue;
    if (g.type === 'Polygon') g.coordinates = fix([g.coordinates])[0];
    if (g.type === 'MultiPolygon') g.coordinates = fix(g.coordinates);
  }
  return fc;
}
const cache = {};
export function world(detail = '50m') {
  return (cache[detail] ||= (() => {
    const t = JSON.parse(readFileSync(`${TB}data/geo/countries-kor-${detail}.json`, 'utf8'));
    const countries = rewind(feature(t, t.objects.countries));
    return {
      countries,
      land: rewind({ type: 'Feature', properties: {}, geometry: merge(t, t.objects.countries.geometries) }),
      borders: mesh(t, t.objects.countries, (a, b) => a !== b),
      kor: countries.features.filter((f) => f.properties.iso === 'KOR'),
    };
  })());
}

// 경로 문자열(좌표를 소수 둘째 자리로 줄여 파일을 가볍게)
export function pathOf(proj, obj) {
  const d = d3.geoPath(proj)(obj) || '';
  return d.replace(/-?\d+\.\d+/g, (m) => String(r2(m)));
}

// 땅인지(경도, 위도) — 격자 점 지도(픽셀·망점)에 쓴다.
// d3.geoContains는 너무 느려서(점 2천 개에 16초) 경위도를 평면으로 보고 다각형 안쪽을 잰다(네모 범위로 먼저 거름).
let LAND = null;
function landPolys() {
  if (LAND) return LAND;
  const g = world('50m').land.geometry;
  const polys = g.type === 'Polygon' ? [g.coordinates] : g.coordinates;
  LAND = polys.map(([outer, ...holes]) => {
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (const [x, y] of outer) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    return { box: [x0, y0, x1, y1], outer, holes };
  });
  return LAND;
}
function inRing(x, y, ring) {
  let ins = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) ins = !ins;
  }
  return ins;
}
export function isLand(lon, lat) {
  const x = ((((lon + 180) % 360) + 360) % 360) - 180;
  for (const p of landPolys()) {
    const [x0, y0, x1, y1] = p.box;
    if (x < x0 || x > x1 || lat < y0 || lat > y1) continue;
    if (inRing(x, lat, p.outer) && !p.holes.some((h) => inRing(x, lat, h))) return true;
  }
  return false;
}

// 등고선: 높이 함수 h(x, y)(0~1)를 nx×ny 격자에서 재서 levels 단계의 다각형 경로 목록으로
export function contourPaths(h, { nx, ny, levels, sx = 1, sy = 1, ox = 0, oy = 0 }) {
  const vals = new Float64Array(nx * ny);
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) vals[j * nx + i] = h(i / (nx - 1), j / (ny - 1));
  const gen = contours().size([nx, ny]).thresholds(levels);
  return gen(vals).map((c) => ({
    value: c.value,
    d: c.coordinates.map((poly) => poly.map((ring) => `M${ring.map(([x, y]) => `${r2(ox + x * sx)},${r2(oy + y * sy)}`).join('L')}Z`).join('')).join(''),
  }));
}
