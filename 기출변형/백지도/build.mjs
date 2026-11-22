// 백지도 테스트지 만들기 (통합사회2 Ⅳ·Ⅴ 나라 위치)
//   node 기출변형/백지도/build.mjs  → 기출변형/백지도/out/*.pdf (학생용·정답, 공통·서운고·인천국제고)
//
// 범위(강사 확정 2026-11-22): 후보목록.md 50개국 + 쿠웨이트·카스피해 3국(아제르바이잔·투르크메니스탄·카자흐스탄)·이집트 = 공통 55개국
//   서운고: + 메콩강 3국(라오스·태국·캄보디아)   인천국제고: + 기니만·나일강(앙골라·적도 기니·콩고 민주 공화국·가봉·수단·탄자니아·우간다)
// 대륙별 5장: ① 동·동남·남아시아 ② 서남·중앙아시아 ③ 유럽 ④ 아프리카 ⑤ 아메리카·오세아니아
// 지도 자료: textbook/data/geo/countries-kor-50m.json (Natural Earth, 우리나라 정부 시각 국경)
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const TB = join(HERE, '..', '..', 'textbook');
const require = createRequire(join(TB, 'package.json'));
const { geoAzimuthalEqualArea, geoPath, geoCentroid, geoArea, geoGraticule } = require('d3-geo');
const { feature, mesh } = require('topojson-client');
const { chromium } = (() => { try { return require('playwright'); } catch { return require('/opt/node-tools/node_modules/playwright'); } })();

// ── 지도 자료 ──
const topo = JSON.parse(readFileSync(join(TB, 'data/geo/countries-kor-50m.json'), 'utf8'));
const obj = Object.values(topo.objects)[0];
const fc = feature(topo, obj);
// 감김 방향이 뒤집힌 다각형 바로잡기(maps.js와 같은 방법)
for (const f of fc.features) {
  const fix = (polys) => polys.map((p) => (geoArea({ type: 'Polygon', coordinates: p }) > 2 * Math.PI ? p.map((r) => r.slice().reverse()) : p));
  const g = f.geometry; if (!g) continue;
  if (g.type === 'Polygon') g.coordinates = fix([g.coordinates])[0];
  if (g.type === 'MultiPolygon') g.coordinates = fix(g.coordinates);
}
const borders = mesh(topo, obj, (a, b) => a !== b);
const byIso = new Map();
for (const f of fc.features) if (!byIso.has(f.properties.iso)) byIso.set(f.properties.iso, f);
// 가장 큰 덩어리의 중심(본토) — 해외 영토·섬 때문에 번호가 엉뚱한 데 찍히지 않게
function mainCentroid(f) {
  const g = f.geometry;
  if (g.type === 'Polygon') return geoCentroid(f);
  let best = null, ba = -1;
  for (const p of g.coordinates) { const a = geoArea({ type: 'Polygon', coordinates: p }); if (a > ba) { ba = a; best = p; } }
  return geoCentroid({ type: 'Polygon', coordinates: best });
}

// ── 나라: [ISO3, 이름, 번호 자리(경도·위도, 없으면 본토 중심), 번호 칸을 옮길 자리(작은 나라: 바다 쪽으로 빼고 선으로 잇기)] ──
const SHEETS = [
  {
    key: 'asia', no: '①', title: '동아시아·동남아시아·남아시아', box: [60, -11, 150, 50], center: [105, 20], w: 680,
    list: [
      ['KOR', '한국', [127.9, 36.4]], ['PRK', '북한', [126.9, 40.1]], ['CHN', '중국', [103, 34]], ['JPN', '일본', [138.6, 36.4]],
      ['TWN', '대만', [121, 23.7], [125, 21.6]], ['VNM', '베트남', [108.2, 14.2], [112.3, 15.2]], ['MMR', '미얀마', [96.9, 20.6]],
      ['PHL', '필리핀', [122.3, 12.3]], ['MYS', '말레이시아', [102.2, 4.2]], ['IDN', '인도네시아', [113.6, -0.8]],
      ['SGP', '싱가포르', [103.82, 1.35], [106.8, 2.6]], ['BRN', '브루나이', [114.7, 4.6], [112.6, 7.6]],
      ['IND', '인도', [78.6, 22.5]], ['BGD', '방글라데시', [90.2, 23.9], [91.2, 19.4]], ['LKA', '스리랑카', [80.7, 7.7], [84.6, 5.6]], ['PAK', '파키스탄', [69.3, 29.6]],
      // 서운고 메콩강 3국
      ['LAO', '라오스', [102.6, 19.7], null, '서운고'], ['THA', '태국', [100.9, 15.6], null, '서운고'], ['KHM', '캄보디아', [104.9, 12.7], null, '서운고'],
    ],
  },
  {
    key: 'swasia', no: '②', title: '서남아시아·중앙아시아', box: [25, 11, 90, 55], center: [55, 33], w: 680,
    list: [
      ['TUR', '튀르키예', [34.5, 39.1]], ['SYR', '시리아', [38.6, 35.1]], ['ISR', '이스라엘', [34.85, 30.9], [31.0, 31.9]],
      ['PSE', '팔레스타인', [35.25, 31.95], [31.4, 34.6]], ['JOR', '요르단', [36.6, 30.9]], ['SAU', '사우디아라비아', [44.6, 23.8]],
      ['YEM', '예멘', [47.6, 15.7]], ['KWT', '쿠웨이트', [47.6, 29.3], [44.6, 31.9]], ['QAT', '카타르', [51.2, 25.3], [51.1, 27.9]],
      ['ARE', '아랍에미리트', [54.2, 23.7]], ['IRN', '이란', [54.5, 32.5]], ['AZE', '아제르바이잔', [47.6, 40.3]],
      ['TKM', '투르크메니스탄', [59.0, 39.3]], ['KAZ', '카자흐스탄', [67.5, 48.3]],
    ],
  },
  {
    key: 'europe', no: '③', title: '유럽', box: [-12, 35, 58, 71], center: [18, 53], w: 680,
    list: [
      ['GBR', '영국', [-1.6, 52.7]], ['NLD', '네덜란드', [5.7, 52.3], [3.0, 54.6]], ['DNK', '덴마크', [9.2, 56.1], [6.4, 57.4]],
      ['NOR', '노르웨이', [9.0, 61.5]], ['DEU', '독일', [10.3, 51.1]], ['FRA', '프랑스', [2.5, 46.6]], ['ESP', '스페인', [-3.6, 40.0]],
      ['ITA', '이탈리아', [13.0, 42.6]], ['UKR', '우크라이나', [31.4, 49.0]], ['RUS', '러시아', [45, 58]],
    ],
  },
  {
    key: 'africa', no: '④', title: '아프리카', box: [-19, -36, 53, 38], center: [17, 2], w: 640,
    list: [
      ['EGY', '이집트', [29.8, 26.6]], ['NER', '니제르', [9.4, 17.0]], ['NGA', '나이지리아', [8.1, 9.6]], ['SSD', '남수단', [30.3, 7.2]],
      ['ETH', '에티오피아', [39.6, 8.7]], ['KEN', '케냐', [37.9, 0.3]],
      // 인천국제고 기니만·나일강
      ['SDN', '수단', [30.0, 15.6], null, '인천국제고'], ['UGA', '우간다', [32.4, 1.3], null, '인천국제고'],
      ['TZA', '탄자니아', [34.9, -6.3], null, '인천국제고'], ['GNQ', '적도 기니', [10.4, 1.6], [4.2, 0.6], '인천국제고'],
      ['GAB', '가봉', [11.7, -0.7], null, '인천국제고'], ['COD', '콩고 민주 공화국', [23.6, -3.0], null, '인천국제고'],
      ['AGO', '앙골라', [17.6, -12.4], null, '인천국제고'],
    ],
  },
  {
    key: 'america', no: '⑤', title: '아메리카·오세아니아', box: [-150, -56, -32, 72], center: [-88, 12], w: 680,
    list: [
      ['CAN', '캐나다', [-104, 57]], ['USA', '미국', [-98.5, 39.2]], ['MEX', '멕시코', [-102.5, 24]], ['COL', '콜롬비아', [-73.6, 3.9]],
      ['BRA', '브라질', [-51.5, -9.5]], ['CHL', '칠레', [-71.0, -31.0], [-80.5, -32.5]], ['ARG', '아르헨티나', [-65.0, -35.5]],
    ],
    extra: { // 오른쪽 작은 지도
      title: '오세아니아', box: [110, -48, 180, -8], center: [145, -28], w: 250,
      list: [['AUS', '오스트레일리아(호주)', [134.2, -25.2]], ['NZL', '뉴질랜드', [172.2, -42.0]]],
    },
  },
];
const VERSIONS = [
  { key: '공통', label: '공통(작전고·계양고·계산여고)', extra: null },
  { key: '서운고', label: '서운고', extra: '서운고' },
  { key: '인천국제고', label: '인천국제고', extra: '인천국제고' },
];

// ── 지도 한 장 그리기 ──
const r1 = (n) => Math.round(n * 10) / 10;
function drawMap(m, items, answer, inset) {
  const [w, s, e, n] = m.box;
  const pts = [];
  for (let k = 0; k <= 40; k++) { const lo = w + ((e - w) * k) / 40, la = s + ((n - s) * k) / 40; pts.push([lo, s], [lo, n], [w, la], [e, la]); }
  const box = { type: 'MultiPoint', coordinates: pts };
  const W = m.w;
  const proj = geoAzimuthalEqualArea().rotate([-m.center[0], -m.center[1]]).fitWidth(W, box);
  const [[, y0], [, y1]] = geoPath(proj).bounds(box);
  const H = Math.round(y1 - y0);
  proj.translate([proj.translate()[0], proj.translate()[1] - y0]);
  const path = geoPath(proj).digits(1);
  const id = `c${m.key || m.title}`.replace(/[^a-z0-9]/gi, '');
  const targets = new Set(items.map((it) => it.iso));
  let svg = `<svg viewBox="0 0 ${W} ${H}" width="100%" xmlns="http://www.w3.org/2000/svg"><defs><clipPath id="${id}"><rect width="${W}" height="${H}"/></clipPath></defs><g clip-path="url(#${id})">`;
  svg += `<rect width="${W}" height="${H}" fill="#e4f0f8"/>`;
  svg += `<path d="${path(geoGraticule().step([10, 10])())}" fill="none" stroke="#c9dcea" stroke-width=".5"/>`;
  for (const f of fc.features) {
    const d = path(f); if (!d) continue;
    svg += `<path d="${d}" fill="${targets.has(f.properties.iso) ? '#fff1bd' : '#fbfaf7'}"/>`;
  }
  svg += `<path d="${path(borders)}" fill="none" stroke="#9a9286" stroke-width=".6" stroke-linejoin="round"/>`;
  svg += `<path d="${path({ type: 'FeatureCollection', features: fc.features })}" fill="none" stroke="#6f97b8" stroke-width=".55" stroke-linejoin="round"/>`;
  // 번호
  const R = 9.5;
  for (const it of items) {
    const [ax, ay] = proj(it.at), [lx, ly] = it.call ? proj(it.call) : [ax, ay];
    if (it.call) svg += `<line x1="${r1(ax)}" y1="${r1(ay)}" x2="${r1(lx)}" y2="${r1(ly)}" stroke="#333" stroke-width=".8"/><circle cx="${r1(ax)}" cy="${r1(ay)}" r="1.8" fill="#333"/>`;
    svg += `<circle cx="${r1(lx)}" cy="${r1(ly)}" r="${R}" fill="#fff" stroke="#222" stroke-width="1.1"/>`;
    svg += `<text x="${r1(lx)}" y="${r1(ly + 4)}" text-anchor="middle" font-size="11.5" font-weight="700" fill="#111">${it.n}</text>`;
    if (answer) {
      const tx = lx + R + 3, ty = ly + 4;
      svg += `<text x="${r1(tx)}" y="${r1(ty)}" font-size="10.5" font-weight="700" fill="#c92a2a" stroke="#fff" stroke-width="3" paint-order="stroke">${it.name}</text>`;
    }
  }
  if (inset) { // 왼쪽 아래(태평양)에 작은 지도
    const iy = H - inset.H - 1;
    svg += `<rect x="1" y="${iy - 16}" width="${inset.W + 1}" height="${inset.H + 16}" fill="#fff" stroke="#6b7785" stroke-width="1"/>`;
    svg += `<text x="6" y="${iy - 4}" font-size="11" font-weight="700" fill="#1d3557">${inset.title}</text>`;
    svg += `<svg x="1" y="${iy}" width="${inset.W}" height="${inset.H}" viewBox="0 0 ${inset.W} ${inset.H}">${inset.svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '')}</svg>`;
  }
  svg += `</g><rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" fill="none" stroke="#6b7785" stroke-width="1"/></svg>`;
  return { svg, proj, W, H };
}

// 번호 매기기: 지도 위쪽 띠부터 왼쪽 → 오른쪽 (번호를 찾기 쉽게)
function numberItems(m, list, start) {
  const { proj } = drawMap(m, [], false);
  const items = list.map(([iso, name, at, call]) => {
    const f = byIso.get(iso); if (!f) throw new Error('지도에 없는 나라: ' + iso);
    const a = at || mainCentroid(f);
    const [x, y] = proj(call || a);
    return { iso, name, at: a, call, x, y };
  });
  const band = 80;
  items.sort((p, q) => Math.floor(p.y / band) - Math.floor(q.y / band) || p.x - q.x);
  items.forEach((it, i) => { it.n = start + i; });
  return items;
}

const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
function page(sh, ver, answer) {
  const pick = (l) => l.filter((r) => !r[4] || r[4] === ver.extra);
  const items = numberItems(sh, pick(sh.list), 1);
  let ex = null;
  if (sh.extra) ex = { m: { ...sh.extra, key: sh.key + 'x' }, items: numberItems({ ...sh.extra, key: sh.key + 'x' }, pick(sh.extra.list), items.length + 1) };
  const all = [...items, ...(ex ? ex.items : [])];
  let inset = null;
  if (ex) { const d = drawMap(ex.m, ex.items, answer); inset = { svg: d.svg, W: d.W, H: d.H, title: ex.m.title }; }
  const mm = drawMap(sh, items, answer, inset);
  const main = mm.svg;
  const mapMm = (186 * mm.H) / mm.W;
  const avail = 274 - 30 - mapMm - 8;
  let cols = 2, rowH = Math.min(12.5, avail / Math.ceil(all.length / 2));
  if (rowH < 9.5) { cols = 3; rowH = Math.min(12.5, avail / Math.ceil(all.length / 3)); }
  const rows = Math.ceil(all.length / cols);
  const ordered = [...all].sort((a, b) => a.n - b.n);
  const grid = Array.from({ length: cols }, (_, c) => ordered.slice(c * rows, (c + 1) * rows));
  const ans = `<div class="ans" style="grid-template-columns:repeat(${cols},1fr);--rh:${rowH.toFixed(1)}mm">${grid.map((col) => `<div>${col.map((it) => `<div class="row"><b>${it.n}</b><span class="blank">${answer ? esc(it.name) : ''}</span></div>`).join('')}</div>`).join('')}</div>`;
  const mapHtml = `<div class="m">${main}</div>`;
  return `<section class="page">
  <header><div class="t"><span class="no">${sh.no}</span> ${esc(sh.title)}${answer ? ' <span class="key">정답</span>' : ''}</div>
    <div class="ver">통합사회2 백지도 테스트 · ${esc(ver.label)}</div></header>
  <div class="line2"><p class="q">지도에 번호가 붙은 나라(노란색)의 이름을 쓰시오.</p>
    <div class="who">학교<i></i>이름<i></i>점수<i class="sc"></i>/ ${all.length}</div></div>
  ${mapHtml}
  ${ans}
  <footer>지도: Natural Earth(우리나라 정부 시각 국경) · 승민T 통합사회</footer>
</section>`;
}

const FONT = join(TB, 'node_modules/pretendard/dist/public/static');
const CSS = `
@font-face{font-family:P;src:url("file://${FONT}/Pretendard-Regular.otf")}
@font-face{font-family:P;font-weight:700;src:url("file://${FONT}/Pretendard-Bold.otf")}
@page{size:A4;margin:11mm 12mm}
*{box-sizing:border-box}
body{margin:0;font-family:P,sans-serif;color:#1d232a}
.page{page-break-after:always;height:274mm;display:flex;flex-direction:column;gap:3.2mm}
.page:last-child{page-break-after:auto}
header{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:2px solid #1d3557;padding-bottom:2mm}
.t{font-size:17pt;font-weight:700;color:#1d3557;white-space:nowrap}.no{color:#c92a2a}.ver{font-size:8.5pt;color:#777;white-space:nowrap}
.key{font-size:11pt;color:#fff;background:#c92a2a;padding:.5mm 2.5mm;border-radius:1mm;vertical-align:middle}
.line2{display:flex;justify-content:space-between;align-items:flex-end}
.who{display:flex;align-items:flex-end;gap:1.5mm;font-size:9.5pt;color:#444;white-space:nowrap}
.who i{display:inline-block;width:20mm;border-bottom:1px solid #555;height:5mm}.who i.sc{width:10mm}
.q{margin:0;font-size:10.5pt}.q small{color:#777;margin-left:2mm;font-size:8.5pt}
.m svg,.m1 svg,.m2 svg{display:block}
.two{display:flex;gap:4mm;align-items:flex-start}.m1{flex:0 0 61%}.m2{flex:1}.sub{font-size:9.5pt;font-weight:700;margin-bottom:1mm;color:#1d3557}
.ans{display:grid;gap:0 6mm;font-size:11.5pt;margin-top:1mm}
.row{display:flex;align-items:flex-end;gap:2mm;height:var(--rh)}
.row b{flex:0 0 7mm;height:7mm;border:1.1px solid #222;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10pt}
.blank{flex:1;border-bottom:1px solid #777;height:7mm;color:#c92a2a;font-weight:700;padding-left:1.5mm;line-height:7mm}
footer{font-size:7.5pt;color:#999;text-align:right;margin-top:auto}
`;

const OUT = join(HERE, 'out'); mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
const summary = [];
for (const ver of VERSIONS) {
  for (const answer of [false, true]) {
    const html = `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}</style></head><body>${SHEETS.map((sh) => page(sh, ver, answer)).join('')}</body></html>`;
    const name = `백지도_${ver.key}_${answer ? '정답' : '학생용'}`;
    writeFileSync(join(OUT, name + '.html'), html);
    const pg = await browser.newPage();
    await pg.goto('file://' + join(OUT, name + '.html'));
    await pg.pdf({ path: join(OUT, name + '.pdf'), format: 'A4', preferCSSPageSize: true, printBackground: true });
    if (!answer) {
      const n = SHEETS.map((sh) => sh.list.filter((r) => !r[4] || r[4] === ver.extra).length + (sh.extra ? sh.extra.list.length : 0));
      summary.push(`${ver.key}: ${n.join('+')} = ${n.reduce((a, b) => a + b)}개국`);
    }
    await pg.close();
  }
}
await browser.close();
console.log(summary.join('\n'));
