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

// 왼쪽: 문화 변동의 요인
T('yo', 80, 40, [['문화 변동의 요인', 'y', 82]], { under: 'y' });
G('yoTrunk', 108, 168, 12, 560, `<path d="M6 0 C 5 180, 7 380, 6 556" />`);
T('in', 112, 190, [['1. 내재적 요인', 'w', 64], ['  (사회 안에서)', 'b', 46]], tick());
G('inTrunk', 210, 280, 12, 290, `<path d="M6 0 C 7 100, 5 200, 6 286" />`);
T('inv', 214, 296, [['발명', 'y', 58], [' : 없던 것을 새로 만듦', 'w', 54]], tick());
T('invEx', 290, 368, [['1차 바퀴 → 2차 수레·자동차, 훈민정음', 'b', 46]]);
T('dis', 214, 448, [['발견', 'y', 58], [' : 있었는데 몰랐던 것', 'w', 54]], tick());
T('disEx', 290, 520, [['불의 이용, 엑스선, 페니실린', 'b', 46]]);
T('ex', 112, 630, [['2. 외재적 요인 = ', 'w', 64], ['문화 전파', 'y', 64, 'u'], ['  (밖에서)', 'b', 46]], tick());
G('exTrunk', 210, 720, 12, 450, `<path d="M6 0 C 5 150, 7 300, 6 446" />`);
T('dir', 214, 736, [['직접', 'y', 58], [' : 사람이 직접 만나서', 'w', 54]], tick());
T('dirEx', 290, 808, [['문익점 목화씨, 고추, 선교사', 'b', 46]]);
T('ind', 214, 888, [['간접', 'y', 58], [' : 매체를 통해', 'w', 54]], tick());
T('indEx', 290, 960, [['K-pop · 드라마 (SNS, 동영상)', 'b', 46]]);
T('sti', 214, 1040, [['자극', 'y', 58], [' : 아이디어만 얻어 → 발명', 'w', 54]], tick());
T('stiEx', 290, 1112, [['한자 → 이두,  알파벳 → 체로키 문자', 'b', 46]]);

// 가운데 세로선
G('div', 1000, 50, 12, 1150, `<path d="M6 0 C 8 400, 4 800, 6 1146" style="stroke-width:4;opacity:.55" />`);

// 오른쪽: 문화 동화·병존·융합·접변 (왼쪽 글, 오른쪽 그림)
const RX = 1055;
// 문화 동화
T('asT', RX, 40, [['문화 동화', 'y', 70]]);
T('asF', RX, 118, [['A + B = B', 'w', 62]]);
T('asM', RX, 196, [['기존 정체성 ', 'p', 50], ['상실', 'p', 50, 'u']]);
T('asE', RX, 256, [['원주민 언어 → 에스파냐어', 'b', 46]]);
G('asA', 1585, 112, 124, 124, `<circle cx="62" cy="62" r="52" style="stroke-dasharray:12 10;opacity:.7"/><text x="62" y="78" class="ct" style="opacity:.7">A</text>`);
G('asArr', 1712, 152, 60, 44, `<path d="M4 22 L50 22 M36 10 L52 22 L36 34" />`);
G('asB', 1770, 80, 170, 170, `<circle cx="85" cy="85" r="76"/><text x="85" y="103" class="ct">B</text>`);
G('sep1', RX, 330, 885, 12, `<path d="M0 6 L885 6" style="stroke-dasharray:16 14;stroke-width:3;opacity:.5"/>`);
// 문화 병존
T('coT', RX, 345, [['문화 병존', 'y', 70]]);
T('coF', RX, 423, [['A + B = A, B', 'w', 62]]);
T('coM', RX, 501, [['나란히 함께', 'w', 50]]);
T('coE', RX, 561, [['한의원 + 서양식 병원', 'b', 46]]);
G('coA', 1610, 400, 160, 160, `<circle cx="80" cy="80" r="72"/><text x="80" y="97" class="ct">A</text>`);
G('coB', 1780, 400, 160, 160, `<circle cx="80" cy="80" r="72"/><text x="80" y="97" class="ct">B</text>`);
G('sep2', RX, 635, 885, 12, `<path d="M0 6 L885 6" style="stroke-dasharray:16 14;stroke-width:3;opacity:.5"/>`);
// 문화 융합
T('fuT', RX, 650, [['문화 융합', 'y', 70]]);
T('fuF', RX, 728, [['A + B = ', 'w', 62], ['C', 'y', 54, 'c']]);
T('fuM', RX, 806, [['새로운 제3의 문화', 'w', 50]]);
T('fuE', RX, 866, [['재즈, 반미, 불고기 버거', 'b', 46]]);
G('fuA', 1600, 690, 190, 190, `<circle cx="95" cy="95" r="84"/><text x="58" y="112" class="ct">A</text>`);
G('fuB', 1740, 690, 190, 190, `<circle cx="95" cy="95" r="84"/><text x="132" y="112" class="ct">B</text>`);
// 겹친 부분(빗금): 두 원의 겹친 렌즈 모양
G('fuX', 1735, 700, 60, 170, `<path d="M30 39 A84 84 0 0 1 30 131 A84 84 0 0 1 30 39 Z" style="fill:${COL.y};fill-opacity:.3;stroke:${COL.y};stroke-width:5"/>
  <path d="M24 60 L38 50 M19 82 L42 66 M19 104 L42 88 M23 122 L37 112" style="stroke:${COL.y};stroke-width:3.5"/>`);
T('fuC', 1744, 872, [['C', 'y', 66]]);
G('sep3', RX, 945, 885, 12, `<path d="M0 6 L885 6" style="stroke-dasharray:16 14;stroke-width:3;opacity:.5"/>`);
// 문화 접변
T('acT', RX, 960, [['문화 접변', 'y', 70], ['  (오래 만나서 변함)', 'b', 46]]);
T('acL', RX + 20, 1040, [['자발적 ', 'w', 52], ['나바호족 은세공', 'b', 46], ['   /   ', 'd', 48], ['강제적 ', 'w', 52], ['창씨개명', 'b', 46]]);
T('acX', RX + 20, 1112, [['✗ 동화 = 반드시 강제적', 'p', 52], ['  (스스로도 동화됨)', 'p', 44]]);

// ── 그리기: 분필 느낌(작은 구멍이 난 글씨 + 가루 번짐) ──
const CIRC = 'display:inline-flex;align-items:center;justify-content:center;border:4px solid;border-radius:50%;width:1.1em;height:1.1em;line-height:1;vertical-align:middle;position:relative;top:-.12em;margin-left:.05em;padding-top:.08em;box-sizing:border-box;';
const span = ([t, c, s, u]) => `<span style="color:${COL[c]};font-size:${s}px;-webkit-text-stroke:${(s / 30).toFixed(1)}px ${COL[c]};${u === 'c' ? CIRC : ''}${u === 'u' ? `text-decoration:underline;text-decoration-thickness:4px;text-underline-offset:10px;text-decoration-color:${COL[c]};` : ''}">${t}</span>`;
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
  .el span{text-shadow:0 0 3px rgba(255,255,255,.25)}
  .tk{display:inline-block;height:4px;background:${COL.d};vertical-align:middle;margin-right:10px;border-radius:2px;opacity:.85}
  .un{height:6px;margin-top:4px;border-radius:3px;transform:rotate(-.4deg)}
  svg *{fill:none;stroke:${COL.w};stroke-width:5;stroke-linecap:round;stroke-linejoin:round}
  svg .ct{fill:${COL.w};stroke:${COL.w};stroke-width:1.5;font:58px 'Nanum Pen Script';text-anchor:middle}
</style></head><body>
<svg width="0" height="0" style="position:absolute"><filter id="chalk" x="-4%" y="-8%" width="108%" height="116%">
  <feTurbulence type="fractalNoise" baseFrequency="1.3" numOctaves="2" seed="7" result="n"/>
  <feColorMatrix in="n" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 -1.5 1.62" result="m"/>
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
  ['문화 변동의 요인', seq(['yo', down('yoTrunk', 1000)])],
  ['1. 내재적 요인', seq(['in', down('inTrunk', 600)])],
  ['발명', seq(['inv', 'invEx'])],
  ['발견', seq(['dis', 'disEx'])],
  ['2. 외재적 요인 = 문화 전파', seq(['ex', down('exTrunk', 800)])],
  ['직접', seq(['dir', 'dirEx'])],
  ['간접', seq(['ind', 'indEx'])],
  ['자극', seq(['sti', 'stiEx'])],
  ['문화 동화', seq(['asT', 'asF', fade('asA', 500), W_('asArr', 0, { dur: 350 }), zoom('asB'), 'asM', 'asE'])],
  ['문화 병존', seq([W_('sep1', 0, { dur: 600 }), 'coT', 'coF', zoom('coA'), zoom('coB'), 'coM', 'coE'])],
  ['문화 융합', seq([W_('sep2', 0, { dur: 600 }), 'fuT', 'fuF', zoom('fuA'), zoom('fuB'), fade('fuX', 500), { names: ['fuC'], fx: 'flicker' }, 'fuM', 'fuE'])],
  ['문화 접변', seq([W_('sep3', 0, { dur: 600 }), 'acT', 'acL', 'acX'])],
];
const SPEC = { auto: [{ names: ['div'], fx: 'fade', dur: 600, at: 0 }], clicks: CLICKS.map(([, s]) => s) };
const NOTES = `▶ 클릭 ${CLICKS.length}번 — ${CLICKS.map(([c], i) => `${i + 1}. ${c}`).join('  ')}\n` +
  '(한 번 클릭하면 그 줄과 예시가 분필로 쓰듯 차례로 나타납니다. 가운데 세로선만 슬라이드가 열리면 저절로 나옵니다.)\n' +
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
