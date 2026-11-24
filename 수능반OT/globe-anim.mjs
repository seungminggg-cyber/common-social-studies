// 움직이는 미니맵 지구본 (OT 표지·단원 구분·마무리)
//   node globe-anim.mjs  →  out/art/globe-frames/*.png(반짝이는 바탕 한 바퀴) + out/art/globe-arc-raw/*.png(화살표 하나씩)
//   그다음 python3 globe_post.py  →  out/art/globe-loop.gif, globe-arc-NN.png, globe-arcs-all.png, globe-arcs.json
// 바탕(지구·서울 핑·도시 점·반짝임·둘레 빛)은 계속 도는 GIF로, 서울에서 뻗는 화살표 12개는 따로 그려
// PowerPoint '닦아내기'로 하나씩 뻗어 나가게 한다. 그림은 미니맵 표지(기출변형/cover/mmap.js의 neonGlobe)와 같다.
import { createRequire } from 'node:module';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { d3, world, pathOf } from '../기출변형/cover/mmap-geo.js';

const require = createRequire(import.meta.url);
const { chromium } = (() => { try { return require('playwright'); } catch { return require('/opt/node22/lib/node_modules/playwright'); } })();
const ROOT = dirname(fileURLToPath(import.meta.url));
const ART = join(ROOT, 'out/art');
// OT_NAVY=1: 남색 판(화면 녹화·배포용)의 바탕 장면만 남색 바탕으로 다시 그린다(화살표는 바탕이 투명해서 같이 쓴다)
const NAVY = process.env.OT_NAVY === '1';
const BG = NAVY ? '#061A2C' : '#000';
const FR = join(ART, NAVY ? 'globe-frames-navy' : 'globe-frames'), RAW = join(ART, 'globe-arc-raw');
for (const d of NAVY ? [FR] : [FR, RAW]) { rmSync(d, { recursive: true, force: true }); mkdirSync(d, { recursive: true }); }

export const SIZE = 900; // 그림 한 변(px)
const NF = 24; // 한 바퀴 장면 수(10장/초 → 2.4초)
const c = { sea: '#0A2234', neon: '#2BE4FF', hot: '#7CFFB2' };
const R = 80, ctr = [127.5, 20], SEOUL = [126.98, 37.57];
const A = 98; // 그림 범위: -A ~ A (대기 빛까지)
const f = (v) => +(+v).toFixed(2);
const proj = d3.geoOrthographic().rotate([-ctr[0], -ctr[1]]).translate([0, 0]).scale(R).clipAngle(90).precision(0.1);
const w = world('50m');
const landD = pathOf(proj, w.land), korD = pathOf(proj, { type: 'FeatureCollection', features: w.kor });
const bordD = pathOf(proj, w.borders), gratD = pathOf(proj, d3.geoGraticule().step([15, 15])());
const CITIES = [[151.21, -33.87], [77.21, 28.61], [37.62, 55.75], [103.82, 1.35], [-149.9, 61.22], [-157.86, 21.31], [55.27, 25.2], [174.78, -41.29], [100.5, 13.76], [144.96, -37.81], [121.47, 31.23], [139.69, 35.69]]
  .filter(([lon, lat]) => d3.geoDistance([lon, lat], ctr) <= Math.PI / 2 - 0.08);
const [sx, sy] = proj(SEOUL);
// 반짝이는 별(땅 위 몇 곳)
const GLINTS = [[100, 45], [80, 20], [135, 60], [120, -25], [145, -28], [105, 30]].map(([lon, lat], i) => ({ p: proj([lon, lat]), ph: (i * 0.17 + 0.05) % 1 }));

const svgWrap = (inner, defs) => `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="${-A} ${-A} ${2 * A} ${2 * A}"><defs>${defs}</defs>${inner}</svg>`;
const blur = (id, sd) => `<filter id="${id}" filterUnits="userSpaceOnUse" x="${-A}" y="${-A}" width="${2 * A}" height="${2 * A}"><feGaussianBlur stdDeviation="${sd}"/></filter>`;
const wave = (t, ph = 0) => 0.5 + 0.5 * Math.sin(2 * Math.PI * (t + ph)); // 0~1 부드러운 물결

// 바탕 한 장면(t: 0~1, 한 바퀴)
function baseFrame(t) {
  const br = wave(t); // 전체 숨쉬기
  const atmA = R + 16;
  const defs = `${blur('gl', 1.1)}${blur('gl2', 2.6)}
    <radialGradient id="atm" cx="0" cy="0" r="${atmA}" gradientUnits="userSpaceOnUse"><stop offset="${f(R / atmA)}" stop-color="${c.neon}" stop-opacity="${f(0.24 + 0.2 * br)}"/><stop offset="1" stop-color="${c.neon}" stop-opacity="0"/></radialGradient>
    <radialGradient id="body" cx="${f(-R * 0.35)}" cy="${f(-R * 0.45)}" r="${f(R * 1.6)}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${c.sea}"/><stop offset="1" stop-color="#000"/></radialGradient>`;
  let s = `<rect x="${-A}" y="${-A}" width="${2 * A}" height="${2 * A}" fill="${BG}"/>
    <circle r="${atmA}" fill="url(#atm)"/><circle r="${R}" fill="url(#body)"/>
    <path d="${gratD}" fill="none" stroke="${c.neon}" stroke-width=".2" opacity=".22"/>
    <path d="${landD}" fill="${c.neon}" opacity=".09"/>
    <path d="${landD}" fill="none" stroke="${c.neon}" stroke-width="1.5" opacity=".5" filter="url(#gl)"/>
    <path d="${landD}" fill="none" stroke="${c.neon}" stroke-width=".42" stroke-linejoin="round"/>
    <path d="${bordD}" fill="none" stroke="${c.neon}" stroke-width=".16" opacity=".45"/>
    <path d="${korD}" fill="${c.hot}" opacity="${f(0.45 + 0.35 * br)}" filter="url(#gl)"/><path d="${korD}" fill="${c.hot}"/>`;
  // 도시 점: 저마다 다른 때에 반짝
  CITIES.forEach(([lon, lat], i) => {
    const [x, y] = proj([lon, lat]), tw = Math.pow(wave(t, i / CITIES.length), 3);
    s += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(2.2 + 1.6 * tw)}" fill="${c.neon}" opacity="${f(0.3 + 0.5 * tw)}" filter="url(#gl)"/><circle cx="${f(x)}" cy="${f(y)}" r="${f(0.75 + 0.3 * tw)}" fill="#fff"/>`;
  });
  // 서울 핑: 동그라미가 퍼져 나감
  for (let j = 0; j < 3; j++) {
    const p = (t + j / 3) % 1;
    s += `<circle cx="${f(sx)}" cy="${f(sy)}" r="${f(1.6 + 9 * p)}" fill="none" stroke="${c.hot}" stroke-width=".5" opacity="${f(0.95 * (1 - p))}"/>`;
  }
  s += `<circle cx="${f(sx)}" cy="${f(sy)}" r="2.6" fill="${c.hot}" opacity=".6" filter="url(#gl)"/><circle cx="${f(sx)}" cy="${f(sy)}" r="1.1" fill="#fff"/>`;
  // 반짝이는 별
  for (const g of GLINTS) {
    const d = Math.abs(((t - g.ph + 1.5) % 1) - 0.5); // 0 = 가장 밝을 때
    const k = Math.max(0, 1 - d / 0.11);
    if (k <= 0) continue;
    const [x, y] = g.p, L = 6.5 * k, Wd = 0.8 * k;
    const star = `M${f(x)} ${f(y - L)} L${f(x + Wd)} ${f(y)} L${f(x)} ${f(y + L)} L${f(x - Wd)} ${f(y)} Z M${f(x - L)} ${f(y)} L${f(x)} ${f(y + Wd)} L${f(x + L)} ${f(y)} L${f(x)} ${f(y - Wd)} Z`;
    s += `<path d="${star}" fill="${c.neon}" opacity="${f(0.8 * k)}" filter="url(#gl)"/><path d="${star}" fill="#fff" opacity="${f(k)}"/>`;
  }
  // 둘레 빛
  s += `<circle r="${R}" fill="none" stroke="${c.neon}" stroke-width="2.4" opacity="${f(0.15 + 0.3 * br)}" filter="url(#gl2)"/><circle r="${R}" fill="none" stroke="${c.neon}" stroke-width=".5" opacity="${f(0.55 + 0.35 * br)}"/>`;
  return svgWrap(s, defs);
}

// 화살표(서울 → 도시) 하나, 바탕 투명
function arcSvg(i) {
  const [lon, lat] = CITIES[i], b = proj([lon, lat]);
  const d = pathOf(proj, { type: 'LineString', coordinates: [SEOUL, [lon, lat]] });
  const defs = `${blur('gl', 1.1)}<linearGradient id="g" gradientUnits="userSpaceOnUse" x1="${f(sx)}" y1="${f(sy)}" x2="${f(b[0])}" y2="${f(b[1])}"><stop offset="0" stop-color="${c.hot}"/><stop offset="1" stop-color="${c.neon}"/></linearGradient>`;
  return svgWrap(`<path d="${d}" fill="none" stroke="url(#g)" stroke-width="1.8" opacity=".5" filter="url(#gl)"/><path d="${d}" fill="none" stroke="url(#g)" stroke-width=".6"/>`, defs);
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: SIZE, height: SIZE } });
await page.setContent('<html><body style="margin:0;background:transparent"><div id="a"></div></body></html>');
const shot = async (svg, path, transparent) => {
  await page.evaluate((h) => { document.getElementById('a').innerHTML = h; }, svg);
  await page.screenshot({ path, clip: { x: 0, y: 0, width: SIZE, height: SIZE }, omitBackground: transparent });
};
for (let k = 0; k < NF; k++) await shot(baseFrame(k / NF), join(FR, `f${String(k).padStart(3, '0')}.png`), false);
if (NAVY) { await browser.close(); console.log(`남색 지구본 장면 ${NF}장 → ${FR}`); process.exit(0); }
const meta = { size: SIZE, view: 2 * A, seoul: [f((sx + A) / (2 * A)), f((sy + A) / (2 * A))], arcs: [] };
for (let i = 0; i < CITIES.length; i++) {
  await shot(arcSvg(i), join(RAW, `arc-${String(i).padStart(2, '0')}.png`), true);
  const b = proj(CITIES[i]);
  meta.arcs.push({ i, end: [f((b[0] + A) / (2 * A)), f((b[1] + A) / (2 * A))], angle: f((Math.atan2(b[1] - sy, b[0] - sx) * 180) / Math.PI) });
}
await browser.close();
writeFileSync(join(RAW, 'meta.json'), JSON.stringify(meta, null, 1));
console.log(`지구본 장면 ${NF}장, 화살표 ${CITIES.length}개 → ${ART}`);
