// 그림 하나만 빠르게 미리 보기(쪽 빌드 없이): 내용 파일에서 제목에 <글자>가 들어간 그림 블록을 찾아 PNG로 저장
//   node tools/figprev.mjs content/_t1-3/u05.js "수에즈" out.png [폭px]
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { block } from '../lib/render.js';
import { ensureTerrain } from '../lib/terrain.js';
const require = createRequire(import.meta.url);
const { chromium } = (() => { try { return require('playwright'); } catch { return require('/opt/node-tools/node_modules/playwright'); } })();
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const [file, key, out, width = '760'] = process.argv.slice(2);
const mod = (await import(pathToFileURL(resolve(file)).href)).default;
let found = null;
const walk = (x) => { if (found || !x || typeof x !== 'object') return; if (Array.isArray(x)) return x.forEach(walk);
  if (x.t && typeof x.title === 'string' && x.title.includes(key)) { found = x; return; } Object.values(x).forEach(walk); };
walk(mod);
if (!found) { console.error('못 찾음:', key); process.exit(1); }
ensureTerrain([found]);
const html = `<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="${ROOT}/node_modules/font-kopubworld/css.local/all.css">
<link rel="stylesheet" href="${ROOT}/themes/base.css"><link rel="stylesheet" href="${ROOT}/themes/h.css">
<style>body{margin:0;padding:10px;width:${width}px;background:#fff}</style></head>
<body class="theme-b theme-d theme-h"><div id="x">${block(found)}</div></body></html>`;
const tmp = join(ROOT, 'out', '_figprev.html'); writeFileSync(tmp, html);
const b = await chromium.launch(); const p = await (await b.newContext({ deviceScaleFactor: 2 })).newPage();
await p.goto(pathToFileURL(tmp).href); await p.waitForTimeout(400);
await (await p.$('#x')).screenshot({ path: out }); await b.close(); console.log('저장', out);
