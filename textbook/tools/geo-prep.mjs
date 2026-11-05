// 지도 바탕 자료 정리 (한 번만 실행) → data/geo/*.json
//
// 원자료 (내려받아 한 폴더에 두고 경로를 넘긴다):
//   Natural Earth (공개 자료, https://github.com/nvkelso/natural-earth-vector/tree/master/geojson)
//     ne_10m_rivers_lake_centerlines, ne_10m_lakes, ne_10m_admin_0_boundary_lines_land, ne_10m_admin_0_countries
//   우리나라 시·도 경계: southkorea/southkorea-maps (통계청 2013, kostat/2013/json/skorea_provinces_geo_simple.json → kr_provinces.json)
//   우리나라 하천: tools/terrain/rivers.mjs 로 고도 자료에서 계산한 kr-rivers.json
//   판의 경계: Bird(2003) PB2002, Hugo Ahlenius 정리 (fraxen/tectonicplates, GeoJSON/PB2002_boundaries.json → pb2002.json)
//              ODC 저작자 표시 라이선스 → 그림 출처에 "판의 경계: Bird(2003)" 를 적는다
// 사용: node tools/geo-prep.mjs <원자료 폴더> [kr-rivers.json]
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const [src, krRivers] = process.argv.slice(2);
const OUT = new URL('../data/geo/', import.meta.url).pathname;
const rd = (n) => JSON.parse(readFileSync(join(src, n), 'utf8'));
const q = (v, d) => Math.round(v * 10 ** d) / 10 ** d;
// 점 줄이기 (더글러스-포이커, eps = 도 단위)
function dp(p, eps) {
  if (!eps || p.length < 3) return p;
  const keep = new Uint8Array(p.length); keep[0] = keep[p.length - 1] = 1;
  const st = [[0, p.length - 1]];
  while (st.length) {
    const [a, b] = st.pop(); let md = 0, mi = -1;
    const [ax, ay] = p[a], [bx, by] = p[b], dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy);
    for (let k = a + 1; k < b; k++) { const d = L ? Math.abs((p[k][0] - ax) * dy - (p[k][1] - ay) * dx) / L : Math.hypot(p[k][0] - ax, p[k][1] - ay); if (d > md) { md = d; mi = k; } }
    if (md > eps) { keep[mi] = 1; st.push([a, mi], [mi, b]); }
  }
  return p.filter((_, k) => keep[k]);
}
// 좌표 반올림 + 같은 점 빼기 + 점 줄이기
function roundGeom(g, d, eps = 0) {
  const line = (cs) => { const o = []; for (const [x, y] of dp(cs, eps)) { const p = [q(x, d), q(y, d)]; const l = o[o.length - 1]; if (!l || l[0] !== p[0] || l[1] !== p[1]) o.push(p); } return o; };
  // 점이 너무 적어진 선·고리는 버린다 (선 2점, 고리 4점 미만)
  const ln = (cs) => { const o = line(cs); return o.length >= 2 ? o : null; };
  const rg = (cs) => { const o = line(cs); return o.length >= 4 ? o : null; };
  const poly = (p) => { const o = p.map(rg); return o[0] ? o.filter(Boolean) : null; };
  if (g.type === 'LineString') { const o = ln(g.coordinates); return o && { type: g.type, coordinates: o }; }
  if (g.type === 'MultiLineString') { const o = g.coordinates.map(ln).filter(Boolean); return o.length ? { type: g.type, coordinates: o } : null; }
  if (g.type === 'Polygon') { const o = poly(g.coordinates); return o && { type: g.type, coordinates: o }; }
  if (g.type === 'MultiPolygon') { const o = g.coordinates.map(poly).filter(Boolean); return o.length ? { type: g.type, coordinates: o } : null; }
  return g;
}
const fc = (features) => ({ type: 'FeatureCollection', features: features.filter((f) => f.geometry) });
const save = (n, obj) => { const s = JSON.stringify(obj); writeFileSync(join(OUT, n), s); console.log(n, (s.length / 1024).toFixed(0) + 'KB'); };

// 하천 (중심선): 등급(scalerank) 9 이하
save('ne-rivers.json', fc(rd('ne_10m_rivers_lake_centerlines.geojson').features
  .filter((f) => f.geometry && f.properties.scalerank <= 9)
  .map((f) => ({ type: 'Feature', properties: { r: f.properties.scalerank, n: f.properties.name || '' }, geometry: roundGeom(f.geometry, 3, 0.006) }))));
// 호수: 등급 9 이하
save('ne-lakes.json', fc(rd('ne_10m_lakes.geojson').features
  .filter((f) => f.geometry && f.properties.scalerank <= 9)
  .map((f) => ({ type: 'Feature', properties: { r: f.properties.scalerank, n: f.properties.name || '' }, geometry: roundGeom(f.geometry, 3, 0.005) }))));
// 국경선·나라 정보는 아래 '한국 관점 나라 경계'(countries-kor-*.json, ne-special-lines.json)로 만든다
// 우리나라 시·도 경계
const kr = rd('kr_provinces.json');
save('kr-provinces.json', fc(kr.features.map((f) => ({ type: 'Feature', properties: { name: f.properties.name }, geometry: roundGeom(f.geometry, 4) }))));
// 우리나라 하천 (고도 자료로 계산, 유역 120km² 이상만)
if (krRivers) {
  const lines = JSON.parse(readFileSync(krRivers, 'utf8'));
  const out = [];
  for (const l of lines) { const k = l.findIndex((p) => p[2] >= 120); if (k >= 0 && l.length - k >= 2) out.push(l.slice(Math.max(0, k - 1))); }
  save('kr-rivers.json', out);
}
// 판의 경계
try {
  save('plates.json', fc(rd('pb2002.json').features.map((f) => ({ type: 'Feature', properties: { t: f.properties.Type || '' }, geometry: roundGeom(f.geometry, 2, 0.05) }))));
} catch (e) { console.log('판의 경계 자료 없음 (건너뜀)'); }

// ── 나라 경계: Natural Earth "한국 관점"(ne_10m_admin_0_countries_kor) ──
// 크림반도 = 우크라이나, 골란고원 = 시리아, 서사하라 = 별도 지역 등 우리 정부의 입장에 맞춘 자료
// topojson 으로 묶어 이웃 나라끼리 경계선을 공유 → 국경선(mesh)과 육지(merge)를 같은 자료에서 얻는다
{
  const { topology } = await import('topojson-server');
  const { presimplify, simplify, quantile } = await import('topojson-simplify');
  const { geoArea } = await import('d3-geo');
  let src;
  try { src = rd('ne_10m_admin_0_countries_kor.geojson'); } catch { src = null; }
  if (src) {
    const feats = src.features.filter((f) => f.geometry).map((f) => {
      const p = f.properties, g = f.geometry;
      // 감김 방향이 뒤집힌 다각형 바로잡기
      const fix = (ps) => ps.map((poly) => (geoArea({ type: 'Polygon', coordinates: poly }) > 2 * Math.PI ? poly.map((r) => r.slice().reverse()) : poly));
      const geometry = g.type === 'Polygon' ? { type: 'Polygon', coordinates: fix([g.coordinates])[0] } : { type: 'MultiPolygon', coordinates: fix(g.coordinates) };
      const iso = p.ISO_A3_EH && p.ISO_A3_EH !== '-99' ? p.ISO_A3_EH : p.ISO_A3 !== '-99' ? p.ISO_A3 : p.ADM0_A3;
      return { type: 'Feature', id: p.ADM0_A3, properties: { name: p.NAME, long: p.NAME_LONG, iso, ko: p.NAME_KO, c7: p.MAPCOLOR7 }, geometry };
    });
    const { quantize } = await import('topojson-client');
    // 10m: 점의 절반을 남김(지역 지도용), 50m: 7%만 남김(세계 지도용) — quantile 값은 "남길 비율"처럼 동작한다
    for (const [file, q, qz] of [['countries-kor-10m.json', 0.5, 2e5], ['countries-kor-50m.json', 0.07, 5e4]]) {
      let topo = topology({ countries: { type: 'FeatureCollection', features: structuredClone(feats) } });
      topo = presimplify(topo);
      topo = simplify(topo, quantile(topo, q));
      save(file, quantize(topo, qz));
    }
  }
}
// 특별한 경계선: 군사 분계선, 카슈미르 실질 통제선, 골란고원 휴전선, 키프로스 완충선 (서사하라 모래 장벽은 뺌)
save('ne-special-lines.json', fc(rd('ne_10m_admin_0_boundary_lines_land.geojson').features
  .filter((f) => f.geometry && /Line of control|Indeterminant/.test(f.properties.FEATURECLA) && !/Western Sahara/.test(`${f.properties.ADM0_LEFT}${f.properties.ADM0_RIGHT}`))
  .map((f) => ({ type: 'Feature', properties: { name: f.properties.NAME || '' }, geometry: roundGeom(f.geometry, 3, 0.002) }))));
// 우리나라 시·도 경계: 통계청 2013 시·군·구 경계를 합쳐 만듦. 2023년 7월 군위군이 경상북도 → 대구광역시로 편입된 것을 반영
{
  const { topology } = await import('topojson-server');
  const { merge } = await import('topojson-client');
  let mun = null;
  try { mun = rd('kr_municipalities.json'); } catch {}
  if (mun) {
    const PROV = { 11: '서울특별시', 21: '부산광역시', 22: '대구광역시', 23: '인천광역시', 24: '광주광역시', 25: '대전광역시', 26: '울산광역시', 29: '세종특별자치시', 31: '경기도', 32: '강원특별자치도', 33: '충청북도', 34: '충청남도', 35: '전북특별자치도', 36: '전라남도', 37: '경상북도', 38: '경상남도', 39: '제주특별자치도' };
    const provOf = (code) => (code === '37310' ? '22' : code.slice(0, 2)); // 군위군 → 대구
    const topo = topology({ m: mun }, 1e6);
    const groups = {};
    for (const g of topo.objects.m.geometries) (groups[provOf(g.properties.code)] ||= []).push(g);
    const feats = Object.entries(groups).map(([c, gs]) => ({ type: 'Feature', properties: { name: PROV[c] || c }, geometry: merge(topo, gs) }));
    save('kr-provinces.json', fc(feats.map((f) => ({ ...f, geometry: roundGeom(f.geometry, 4) }))));
  }
}
