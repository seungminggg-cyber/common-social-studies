// 겨울특강 OT 촬영용 PPT — 그림 만들기 (네온 지구본·로고·숫자·아이콘·핑)
// 미니맵 표지(기출변형/cover)의 그림 함수를 그대로 써서, 바탕이 투명한 PNG로 뽑는다.
// 실행: node art.mjs  →  out/art/*.png
// 아이콘: Tabler Icons(MIT, textbook/node_modules/@tabler/icons)
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { neonGlobe } from '../기출변형/cover/mmap.js';
import { layout, drawNeon, neonExtent, neonFilter, layoutHangul } from '../기출변형/cover/mm-letters.js';
import { COLORS, ICONS } from './palette.mjs';

const require = createRequire(import.meta.url);
const { chromium } = (() => { try { return require('playwright'); } catch { return require('/opt/node22/lib/node_modules/playwright'); } })();
const ROOT = dirname(fileURLToPath(import.meta.url));
const OUT = join(ROOT, 'out/art');
mkdirSync(OUT, { recursive: true });
const ICON_DIR = join(ROOT, '../textbook/node_modules/@tabler/icons/icons/outline');

const jobs = []; // { name, svg, w, h }  (svg 안 viewBox 기준, w·h는 PNG 픽셀)
const add = (name, svg, w, h) => jobs.push({ name, svg, w, h });

// ── 네온 지구본: 미니맵 표지와 같은 그림, 바다 바탕만 검정에 가깝게(칠판 위에 쏘면 바다가 칠판색이 된다) ──
const GLOBE = {
  t1: { bg: '#000000', sea: '#0A2234', neon: '#2BE4FF', hot: '#7CFFB2' },
  t2: { bg: '#000000', sea: '#240F3A', neon: '#FF4FD8', hot: '#FFB443' },
};
for (const [k, c] of Object.entries(GLOBE)) {
  const R = 80, cx = 0, cy = 0;
  const G = neonGlobe(c, { cx, cy, R, id: k });
  const A = Math.ceil(G.A) + 2;
  add(`globe-${k}`, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-A} ${-A} ${2 * A} ${2 * A}"><defs>${G.defs}</defs>${G.svg}</svg>`, 1300, 1300);
}

// ── 네온 MINIMAP 로고 ──
{
  const lay = layout('MINIMAP', { s: 8, d: 9, wf: 1 }, 18);
  const [lo, hi] = neonExtent(lay, 9);
  for (const [k, glow] of [['cyan', COLORS.neon], ['pink', COLORS.pink]]) {
    const pad = 28;
    const vw = hi - lo + 2 * pad, vh = 100 + 2 * pad;
    add(`logo-${k}`, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${lo - pad} ${-pad} ${vw} ${vh}"><defs>${neonFilter('nb', 4)}</defs>${drawNeon(lay, { w: 9, glow: '#' + glow, blurId: 'nb' })}</svg>`, Math.round(vw * 4), Math.round(vh * 4));
  }
}

// ── 네온 숫자(단원 구분 화면 01~05) ──
for (const n of ['01', '02', '03', '04', '05']) {
  const lay = layoutHangul(n, 16);
  const pad = 26, vw = lay.width + 2 * pad, vh = 100 + 2 * pad;
  add(`num-${n}`, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-pad} ${-pad} ${vw} ${vh}"><defs>${neonFilter('nb', 4)}</defs>${drawNeon(lay, { w: 7, glow: '#' + COLORS.neon, blurId: 'nb' })}</svg>`, Math.round(vw * 5), Math.round(vh * 5));
}

// ── 핑(서울 표시처럼 퍼지는 동그라미): 목록 앞 표시·지도 점 ──
for (const [k, col] of Object.entries({ cyan: COLORS.neon, mint: COLORS.mint, yellow: COLORS.yellow, pink: COLORS.pink })) {
  const c = '#' + col;
  add(`ping-${k}`, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-12 -12 24 24"><defs><filter id="g" x="-1" y="-1" width="3" height="3"><feGaussianBlur stdDeviation=".9"/></filter></defs>
    <circle r="10.2" fill="none" stroke="${c}" stroke-width=".5" opacity=".3"/>
    <circle r="6.6" fill="none" stroke="${c}" stroke-width=".6" opacity=".6"/>
    <circle r="3.4" fill="${c}" opacity=".7" filter="url(#g)"/><circle r="2.2" fill="#fff"/></svg>`, 240, 240);
}

// ── 네온 아이콘: 선 + 빛 번짐 ──
const inner = (name) => readFileSync(join(ICON_DIR, `${name}.svg`), 'utf8')
  .replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '')
  .replace(/<path stroke="none" d="M0 0h24v24H0z" fill="none"\s*\/>/, '');
for (const [name, cols] of Object.entries(ICONS)) {
  const body = inner(name);
  for (const k of cols) {
    const c = '#' + COLORS[k === 'cyan' ? 'neon' : k];
    add(`ic-${name}-${k}`, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-4 -4 32 32"><defs><filter id="g" x="-.5" y="-.5" width="2" height="2"><feGaussianBlur stdDeviation=".7"/></filter></defs>
      <g fill="none" stroke="${c}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" opacity=".45" filter="url(#g)">${body}</g>
      <g fill="none" stroke="${c}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${body}</g></svg>`, 320, 320);
  }
}

// ── 한 장에 모아 그린 뒤 하나씩 잘라 저장 ──
const html = `<!doctype html><html><head><meta charset="utf-8"><style>body{margin:0;background:transparent}.a{display:block;margin:0 0 4px 0}</style></head><body>
${jobs.map((j, i) => `<div class="a" id="a${i}" style="width:${j.w}px;height:${j.h}px">${j.svg.replace('<svg ', `<svg width="${j.w}" height="${j.h}" `)}</div>`).join('\n')}
</body></html>`;
const tmp = join(OUT, '_art.html');
writeFileSync(tmp, html);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 2000, height: 1200 } });
await page.goto(pathToFileURL(tmp).href);
for (let i = 0; i < jobs.length; i++) {
  await page.locator(`#a${i}`).screenshot({ path: join(OUT, `${jobs[i].name}.png`), omitBackground: true });
}
await browser.close();
console.log(`그림 ${jobs.length}개 → ${OUT}`);
