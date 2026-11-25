// 시범강의 촬영용 판서 슬라이드 — 통합사회1 Ⅳ-09 문화 변동(요인·양상) 한 장
//   node 시범강의/build.mjs   → 시범강의/out/문화변동-판서-반전용.pptx (+ 정상색 판, 칠판에 보이는 모습 미리보기용)
// 강사가 보낸 판서 그림에서 '문화 변동의 요인(내재적·외재적)'과 '문화 동화·병존·융합·접변'만 남겼다(2026-11-25).
// - 글씨는 나눔손글씨 펜(Nanum Pen Script, OFL)으로 분필 느낌을 내서 그림(PNG)으로 넣는다 → 학원 PC에 글꼴이 없어도 그대로 보인다.
// - 줄마다 따로 그림이라, 클릭하면 분필로 쓰듯 왼쪽부터 닦아내기로 나타난다(애니메이션은 ../수능반OT/anim.mjs).
// - 반전용: 학원 PC·빔이 화면 색을 반전시키므로 그림 색과 바탕을 미리 뒤집어 둔다(PC 화면에서는 흰 바탕이 정상).
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { applyAnimations } from '../수능반OT/anim.mjs';

const require = createRequire(join(dirname(fileURLToPath(import.meta.url)), '../수능반OT/package.json'));
const pptxgen = require('pptxgenjs');
const { chromium } = (() => { try { return require('playwright'); } catch { return require('/opt/node22/lib/node_modules/playwright'); } })();
const ROOT = dirname(fileURLToPath(import.meta.url));
const OUT = join(ROOT, 'out');
const ART = join(OUT, 'art');
rmSync(ART, { recursive: true, force: true });
mkdirSync(ART, { recursive: true });
const FONT_CSS = pathToFileURL(join(ROOT, '../textbook/node_modules/@fontsource/nanum-pen-script/index.css')).href;

// ── 화면: 16:10(학원 빔), 1인치 = 150px로 그린다 ──
const PX = 150, W = 13.333, H = 8.333;
const COL = { y: '#F4DB6A', w: '#F5F5EF', b: '#8FD0EE', p: '#F294B3', d: '#C9CFC9' }; // 분필 노랑·흰색·하늘·분홍·흐린 선

// ── 판서 요소(애니메이션 한 덩어리 = 그림 한 장) ──
// t: 글자 조각 [[글자, 색, 크기px], ...], 또는 svg: 직접 그린 선·원. x·y는 왼쪽 위(px)
const el = [];
const T = (id, x, y, parts, o = {}) => el.push({ id, x, y, parts, ...o });
const G = (id, x, y, w, h, svg) => el.push({ id, x, y, w, h, svg });
const tick = (len = 34) => ({ tick: len }); // 나무 줄기에서 가지로 가는 짧은 가로선

// 2026-11-25 강사 요청: 보낸 글자만 넣는다(예시·그림·선·설명 없이). 나머지 자리는 칠판에 직접 판서.
// 자리는 원래 판서 그림과 같게 두어, 그 사이 빈 곳에 판서할 수 있게 했다.
// 왼쪽
T('yo', 70, 30, [['문화 변동의 요인과 양상', 'y', 112]]);
T('in', 100, 200, [['1. 내재적 요인', 'w', 92]]);
T('ex', 100, 630, [['2. 외재적 요인 =', 'w', 92]]);
// 오른쪽
const RX = 1080;
T('as', RX, 30, [['문화 동화', 'y', 100]]);
T('co', RX, 335, [['문화 병존', 'y', 100]]);
T('fu', RX, 640, [['문화 융합', 'y', 100]]);
T('ac', RX, 950, [['문화 접변', 'y', 100]]);

// ── 그리기: 분필 느낌(작은 구멍이 난 글씨 + 가루 번짐) ──
const CIRC = 'display:inline-flex;align-items:center;justify-content:center;border:4px solid;border-radius:50%;width:1.1em;height:1.1em;line-height:1;vertical-align:middle;position:relative;top:-.12em;margin-left:.05em;padding-top:.08em;box-sizing:border-box;';
const span = ([t, c, s, u]) => `<span style="color:${COL[c]};font-size:${s}px;-webkit-text-stroke:${(s / 20).toFixed(1)}px ${COL[c]};${u === 'c' ? CIRC : ''}${u === 'u' ? `text-decoration:underline;text-decoration-thickness:4px;text-underline-offset:10px;text-decoration-color:${COL[c]};` : ''}">${t}</span>`;
const body = el.map((e) => {
  if (e.svg) return `<div class="el" id="${e.id}" style="left:${e.x}px;top:${e.y}px;width:${e.w}px;height:${e.h}px"><svg width="${e.w}" height="${e.h}" viewBox="0 0 ${e.w} ${e.h}" style="overflow:visible">${e.svg}</svg></div>`;
  const tk = e.tick ? `<span class="tk" style="width:${e.tick}px"></span>` : '';
  const un = e.under ? `<div class="un" style="background:${COL[e.under]}"></div>` : '';
  return `<div class="el" id="${e.id}" style="left:${e.x}px;top:${e.y}px">${tk}${e.parts.map(span).join('')}${un}</div>`;
}).join('\n');
const html = `<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="${FONT_CSS}">
<style>
  body{margin:0;background:transparent}
  #page{position:relative;width:${Math.round(W * PX)}px;height:${Math.round(H * PX)}px}
  .el{position:absolute;padding:10px;white-space:nowrap;font-family:'Nanum Pen Script';line-height:1.05;filter:url(#chalk)}
  .el span{text-shadow:0 0 4px rgba(255,255,255,.3)}
  .tk{display:inline-block;height:4px;background:${COL.d};vertical-align:middle;margin-right:10px;border-radius:2px;opacity:.85}
  .un{height:6px;margin-top:4px;border-radius:3px;transform:rotate(-.4deg)}
  svg *{fill:none;stroke:${COL.w};stroke-width:5;stroke-linecap:round;stroke-linejoin:round}
  svg .ct{fill:${COL.w};stroke:${COL.w};stroke-width:1.5;font:58px 'Nanum Pen Script';text-anchor:middle}
</style></head><body>
<svg width="0" height="0" style="position:absolute"><filter id="chalk" x="-4%" y="-8%" width="108%" height="116%">
  <feTurbulence type="fractalNoise" baseFrequency="1.3" numOctaves="2" seed="7" result="n"/>
  <feColorMatrix in="n" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 -0.9 1.45" result="m"/>
  <feComposite in="SourceGraphic" in2="m" operator="in"/>
</filter></svg>
<div id="page">${body}</div></body></html>`;
const tmp = join(ART, '_board.html');
writeFileSync(tmp, html);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: Math.round(W * PX), height: Math.round(H * PX) }, deviceScaleFactor: 2 });
await page.goto(pathToFileURL(tmp).href);
await page.evaluate(() => document.fonts.ready);
const box = {};
for (const e of el) {
  // 다른 요소는 숨기고 이 요소만 찍는다(겹친 부분이 같이 찍히지 않게)
  await page.evaluate((id) => document.querySelectorAll('.el').forEach((d) => { d.style.visibility = d.id === id ? 'visible' : 'hidden'; }), e.id);
  const loc = page.locator(`#${e.id}`);
  box[e.id] = await loc.boundingBox();
  await loc.screenshot({ path: join(ART, `${e.id}.png`), omitBackground: true });
}
// 미리보기(모두 보이게, 검정 바탕)
await page.evaluate(() => { document.querySelectorAll('.el').forEach((d) => { d.style.visibility = 'visible'; }); document.body.style.background = '#000'; });
await page.screenshot({ path: join(OUT, '판서-미리보기.png') });
await browser.close();

// 반전 그림(파이썬 Pillow: 색만 뒤집고 투명도는 그대로)
const { execFileSync } = await import('node:child_process');
execFileSync('python3', ['-c', `
import sys, glob, os
from PIL import Image, ImageOps
src = sys.argv[1]; dst = os.path.join(src, 'inv'); os.makedirs(dst, exist_ok=True)
for f in glob.glob(os.path.join(src, '*.png')):
    im = Image.open(f).convert('RGBA'); a = im.getchannel('A')
    o = ImageOps.invert(im.convert('RGB')); o.putalpha(a); o.save(os.path.join(dst, os.path.basename(f)))
`, ART]);

// ── 애니메이션 순서(클릭 12번) ──
const len = (id) => Math.round(Math.min(1100, Math.max(350, (box[id].width / PX) * 170))); // 글 길이만큼 천천히(분필로 쓰듯)
const W_ = (id, at, o = {}) => ({ names: [id], fx: 'wipe', dir: 'l', dur: len(id), at, ...o });
const seq = (ids, start = 0, gap = 150) => { let t = start; return ids.map((x) => { const it = typeof x === 'string' ? W_(x, t) : { ...x, at: t }; t += (it.dur || 500) + gap; return it; }); };
const down = (id, dur = 900) => ({ names: [id], fx: 'wipe', dir: 't', dur });
const zoom = (id) => ({ names: [id], fx: 'zoom', from: 0.6, dur: 450 });
const fade = (id, dur = 450) => ({ names: [id], fx: 'fade', dur });
const CLICKS = [
  ['문화 변동의 요인과 양상', ['yo']], ['1. 내재적 요인', ['in']], ['2. 외재적 요인 =', ['ex']],
  ['문화 동화', ['as']], ['문화 병존', ['co']], ['문화 융합', ['fu']], ['문화 접변', ['ac']],
].map(([c, ids]) => [c, seq(ids)]);
const SPEC = { clicks: CLICKS.map(([, s]) => s) };
const NOTES = `▶ 클릭 ${CLICKS.length}번 — ${CLICKS.map(([c], i) => `${i + 1}. ${c}`).join('  ')}\n` +
  '(한 번 클릭할 때마다 글자 한 줄이 분필로 쓰듯 왼쪽부터 나타납니다.)\n' +
  '반전용: PC 화면에서는 흰 바탕에 색이 뒤집혀 보이는 것이 정상입니다. 반드시 슬라이드 쇼(F5)로 띄워 주세요.';

// ── PPT 만들기: 반전용(흰 바탕 + 뒤집은 그림)과 정상(검정 바탕) ──
for (const inv of [true, false]) {
  const pres = new pptxgen();
  pres.defineLayout({ name: 'W1610', width: W, height: H });
  pres.layout = 'W1610';
  pres.author = '이승민';
  pres.title = '시범강의 판서 — 문화 변동';
  const s = pres.addSlide();
  s.background = { color: inv ? 'FFFFFF' : '000000' };
  for (const e of el) {
    const b = box[e.id];
    s.addImage({ path: join(ART, inv ? 'inv' : '', `${e.id}.png`), x: b.x / PX, y: b.y / PX, w: b.width / PX, h: b.height / PX, objectName: e.id, altText: e.id });
  }
  s.addNotes(NOTES);
  const file = join(OUT, `문화변동-판서-${inv ? '반전용' : '정상색'}.pptx`);
  await pres.writeFile({ fileName: file });
  await applyAnimations(file, [SPEC]);
  console.log('완성:', file);
}
