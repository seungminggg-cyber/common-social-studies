// 기출변형 문제집 만들기: 문항(content) → HTML → (자동 쪽 나눔) → PDF / PNG / 한글 파일용 JSON
//
//   node build.mjs 1                 1차: 단원별 문제(학생용) + 모의고사 + 정답과 해설
//   node build.mjs 1 units t2-04     1차 단원별 중 t2-04만 (시험판 확인용)
//   node build.mjs 1 mock png        1차 모의고사만, 쪽 그림(PNG)까지
//   node build.mjs 2 teacher         교사용(정답 표시·해설이 문제 아래)도 함께
//   node build.mjs 1 book t1         단원별을 책(t1 = 통합사회1, t2 = 통합사회2)으로 나눠 만들기
//
// 결과: out/<차수>/*.pdf, out/<차수>/png/, out/<차수>/<이름>.json(한글 파일용), out/<차수>/fig/<이름>/*.png
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync, rmSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { FIGURE_TYPES } from '../textbook/lib/figures.js';
import { ensureTerrain } from '../textbook/lib/terrain.js';
import { UNITS } from './lib/units.js';
import { renderUnits, renderMocks, renderAnswers } from './lib/wb-render.js';

const require = createRequire(import.meta.url);
const { chromium } = (() => { try { return require('playwright'); } catch { return require('/opt/node-tools/node_modules/playwright'); } })();
const ROOT = dirname(fileURLToPath(import.meta.url));

const args = process.argv.slice(2);
const ed = args.find((a) => a === '1' || a === '2') || '1';
const what = args.find((a) => ['units', 'mock', 'answers', 'all'].includes(a)) || 'all';
const only = args.filter((a) => /^t[12]-\d\d$/.test(a));
const sub = args.find((a) => a === 't1' || a === 't2'); // 책 하나만
const wantPng = args.includes('png');
const teacher = args.includes('teacher');
const OUT = join(ROOT, 'out', ed);
mkdirSync(join(OUT, 'png'), { recursive: true });
const EDITION = ed === '1' ? '1차 · 겨울방학 특강판' : '2차 · 심화(중상·상)판';
const LAYOUT = { cover: 1, toc: 1, exam: 2, mock: 2, answers: 2, soft: [], memoMin: 0.4, spreadMax: 9 };
const paginateJs = readFileSync(join(ROOT, '../textbook/lib/paginate.js'), 'utf8');

// 단원별 문항 모으기 (책 순서)
async function loadUnits() {
  const dir = join(ROOT, 'content', ed);
  const keys = Object.keys(UNITS).filter((k) => existsSync(join(dir, `${k}.js`)) && (!only.length || only.includes(k)) && (!sub || k.startsWith(sub)));
  const sets = [];
  for (const k of keys) {
    const mod = (await import(pathToFileURL(join(dir, `${k}.js`)).href)).default;
    sets.push({ unit: UNITS[k], qs: mod.questions || mod });
  }
  return sets;
}
async function loadMocks() {
  const dir = join(ROOT, 'content', ed, 'mock');
  if (!existsSync(dir)) return [];
  const files = readdirSync(dir).filter((f) => /^m\d+\.js$/.test(f)).sort((a, b) => parseInt(a.slice(1)) - parseInt(b.slice(1)));
  const out = [];
  for (const f of files) out.push((await import(pathToFileURL(join(dir, f)).href)).default);
  return out;
}

// 그림 블록마다 번호 → PDF와 한글 파일이 같은 그림을 가리키게
function numberFigures(root) {
  let n = 0;
  const walk = (x) => {
    if (Array.isArray(x)) return x.forEach(walk);
    if (!x || typeof x !== 'object') return;
    if (FIGURE_TYPES.has(x.t)) x._fig = `f${String(++n).padStart(3, '0')}`;
    if (x.t === 'figrow') x._fig = `r${String(++n).padStart(3, '0')}`;
    Object.values(x).forEach(walk);
  };
  walk(root);
  return n;
}

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 900, height: 1200 }, deviceScaleFactor: 2 });
let failed = false;

async function emit(name, html, data) {
  const htmlPath = join(OUT, `${name}.html`);
  writeFileSync(htmlPath, html.replace('__LAYOUT__', JSON.stringify(LAYOUT)).replace('__PAGINATE__', () => paginateJs));
  if (data) writeFileSync(join(OUT, `${name}.json`), JSON.stringify(data));
  const page = await ctx.newPage();
  page.on('pageerror', (e) => { console.error(`[${name}] 페이지 오류:`, e.message); failed = true; });
  await page.goto(pathToFileURL(htmlPath).href);
  await page.waitForFunction(() => window.PAGINATED === true, null, { timeout: 600000 });
  const { pages, warn } = await page.evaluate(() => ({ pages: window.PAGES, warn: window.WARN }));
  // 넘침 검사: 단 밖으로 나간 내용, 단보다 넓은 그림·표
  const over = await page.evaluate(() => {
    const out = [];
    document.querySelectorAll('.page').forEach((pg, i) => {
      const no = i + 1;
      pg.querySelectorAll('.slot').forEach((s) => { if (s.scrollHeight > s.clientHeight + 2) out.push(`${no}쪽: 단 아래로 넘침`); });
      pg.querySelectorAll('.slot').forEach((s) => {
        const sr = s.getBoundingClientRect();
        s.querySelectorAll('svg, table, img, .figrow').forEach((el) => {
          const r = el.getBoundingClientRect();
          if (r.width > 0 && (r.right > sr.right + 3 || r.left < sr.left - 3)) out.push(`${no}쪽: 단보다 넓음 (${el.tagName.toLowerCase()} ${Math.round(r.width)}px > ${Math.round(sr.width)}px) — ${(el.closest('.row')?.querySelector('.q-stem')?.textContent || '').slice(0, 30)}`);
        });
      });
      pg.querySelectorAll('.q-head').forEach((h) => { if (h.getBoundingClientRect().height > 40) out.push(`${no}쪽: 문제 머리 두 줄 — ${h.textContent.trim().slice(0, 30)}`); });
    });
    return out;
  });
  if (over.length) console.warn(`[${name}] 넘침 검사:\n  ` + [...new Set(over)].join('\n  '));
  if (warn.length) console.warn(`[${name}] 경고:\n  ` + warn.join('\n  '));
  await page.pdf({ path: join(OUT, `${name}.pdf`), preferCSSPageSize: true, printBackground: true });
  if (wantPng) {
    const dir = join(OUT, 'png', name);
    rmSync(dir, { recursive: true, force: true });
    mkdirSync(dir, { recursive: true });
    const els = await page.$$('.page');
    for (let i = 0; i < els.length; i++) await els[i].screenshot({ path: join(dir, `${String(i + 1).padStart(3, '0')}.png`) });
  }
  if (data) { // 한글 파일용 그림
    const dir = join(OUT, 'fig', name);
    rmSync(dir, { recursive: true, force: true });
    mkdirSync(dir, { recursive: true });
    for (const el of await page.$$('figure[data-fig]')) {
      const body = await el.$('.fig-body');
      await (body || el).screenshot({ path: join(dir, `${await el.getAttribute('data-fig')}.png`) });
    }
    for (const el of await page.$$('.figrow[data-row]')) await el.screenshot({ path: join(dir, `${await el.getAttribute('data-row')}.png`) });
  }
  console.log(`${name}: ${pages}쪽 → out/${ed}/${name}.pdf`);
  await page.close();
}

const title = `기출변형 문제집 ${ed}차`;
const sets = what === 'mock' ? [] : await loadUnits();
const mocks = what === 'units' || only.length || sub ? [] : await loadMocks();
numberFigures(sets.map((s) => s.qs));
numberFigures(mocks);
ensureTerrain([...sets.flatMap((s) => s.qs), ...mocks.flatMap((m) => m.questions)]);
const tag = only.length ? `-${only.join('_')}` : sub ? `-${sub === 't1' ? '통합사회1' : '통합사회2'}` : '';

if (sets.length && what !== 'answers') {
  await emit(`단원별${tag}-학생용`, renderUnits(sets, { title, edition: EDITION, mode: 'student' }), { kind: 'units', ed, sets });
  if (teacher) await emit(`단원별${tag}-교사용`, renderUnits(sets, { title, edition: EDITION, mode: 'teacher' }));
}
if (mocks.length && what !== 'answers') {
  await emit('모의고사-학생용', renderMocks(mocks, { title: `실전 모의고사 ${ed}차`, edition: EDITION, mode: 'student' }), { kind: 'mock', ed, mocks });
  if (teacher) await emit('모의고사-교사용', renderMocks(mocks, { title: `실전 모의고사 ${ed}차`, edition: EDITION, mode: 'teacher' }));
}
if (what === 'all' || what === 'answers') {
  const groups = [
    ...sets.map((s) => ({ no: s.unit.key.replace('t1-', '통합사회1 ').replace('t2-', '통합사회2 '), title: s.unit.title, qs: s.qs })),
    ...mocks.map((m) => ({ no: `모의고사 ${m.no}회`, title: m.range, qs: m.questions, mock: true })),
  ];
  if (groups.length) await emit(`정답과해설${tag}`, renderAnswers(groups, { title, edition: EDITION }));
}
await browser.close();
if (failed) process.exit(1);
