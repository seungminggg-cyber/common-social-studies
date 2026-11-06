// 2028 예시문항 특강 교재 만들기: 분석(content/analysis.js) + 연습 문항(content/p-*.js) + 쌍둥이 세트(content/set.js)
//   → HTML → (자동 쪽 나눔) → PDF / PNG / 한글 파일용 JSON
//
//   node 특강/build.mjs            학생용 + 교사용 + 정답과 해설(별책)
//   node 특강/build.mjs png        쪽 그림(PNG)까지
//   node 특강/build.mjs student    학생용만 (teacher, answers도 같은 방식)
//
// 결과: 기출변형/out/sp/*.pdf, out/sp/png/<이름>/, out/sp/<이름>.json(한글 파일용), out/sp/fig/<이름>/*.png
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { FIGURE_TYPES } from '../../textbook/lib/figures.js';
import { ensureTerrain } from '../../textbook/lib/terrain.js';
import { renderAnswers } from '../lib/wb-render.js';
import { renderLecture, TITLE } from './render.js';
import { TYPES, ITEMS, OVERVIEW } from './content/analysis.js';

const require = createRequire(import.meta.url);
const { chromium } = (() => { try { return require('playwright'); } catch { return require('/opt/node-tools/node_modules/playwright'); } })();
const ROOT = dirname(fileURLToPath(import.meta.url));
const OUT = join(ROOT, '..', 'out', 'sp');
mkdirSync(OUT, { recursive: true });
const args = process.argv.slice(2);
const wantPng = args.includes('png');
const want = ['student', 'teacher', 'answers'].filter((k) => args.includes(k));
const parts = want.length ? want : ['student', 'teacher', 'answers'];
// intro·type: 1단(분석), exam·mock·answers: 2단(문항). 유형의 연습 문항은 분석이 끝난 쪽에 자리가 남으면 이어 싣는다.
const LAYOUT = { cover: 1, toc: 1, intro: 1, type: 1, exam: 2, mock: 2, answers: 2, soft: ['exam', 'answers'], memoMin: 0.4, spreadMax: 9 };
const paginateJs = readFileSync(join(ROOT, '../../textbook/lib/paginate.js'), 'utf8');

// 내용 모으기 (연습 문항 파일이 아직 없으면 빈 묶음)
const load = async (f) => (existsSync(join(ROOT, 'content', f)) ? (await import(pathToFileURL(join(ROOT, 'content', f)).href)).default : null);
for (const t of TYPES) t.qs = (await load(`p-${t.key}.js`)) || [];
const set = (await load('set.js')) || { no: 1, range: '전 범위', questions: [] };

// 문제집과 같은 그림 손질: 지도 범례·화살표 글씨 키우기, 기후 그래프 두 개씩
function bigMapText(root) {
  const walk = (x) => {
    if (Array.isArray(x)) return x.forEach(walk);
    if (!x || typeof x !== 'object') return;
    if (x.t === 'figrow' && x.items.every((i) => i.kind === 'climate' || i.kind === 'climdev')) {
      if (x.items.length >= 3 && !x.cols) x.cols = 2;
      for (const i of x.items) if (!i.w) i.w = 240;
    }
    if (x.t === 'map') {
      // 특강: 한 단 폭으로 줄어든 지도의 경위도 숫자는 3pt 안팎이라 읽히지 않고 겹치므로 뺀다(문항에 deg를 적으면 그 값)
      if (x.deg === undefined) x.deg = false;
      if (x.north === undefined) x.north = false;
      const s = Math.max(11, Math.round((x.w || 600) * 0.036 * 10) / 10);
      if (x.legend && !x.legendSize) x.legendSize = s;
      for (const a of x.arrows || []) if (a.label && !a.size) a.size = s;
    }
    Object.values(x).forEach(walk);
  };
  walk(root);
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
}
const allQs = [...TYPES.flatMap((t) => t.qs), ...set.questions];
bigMapText(allQs);
numberFigures([TYPES.map((t) => t.qs), set.questions]);
ensureTerrain(allQs);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 900, height: 1200 }, deviceScaleFactor: 2 });
let failed = false;

async function emit(name, html, data) {
  const htmlPath = join(OUT, `${name}.html`);
  writeFileSync(htmlPath, html.replace('__LAYOUT__', JSON.stringify(LAYOUT)).replace('__PAGINATE__', () => paginateJs));
  if (data) writeFileSync(join(OUT, `${name}.json`), JSON.stringify(data));
  const page = await ctx.newPage();
  page.on('pageerror', (e) => { console.error(`[${name}] 페이지 오류:`, e.message); process.exit(1); });
  await page.goto(pathToFileURL(htmlPath).href);
  await page.waitForFunction(() => window.PAGINATED === true, null, { timeout: 600000 });
  const { pages, warn } = await page.evaluate(() => ({ pages: window.PAGES, warn: window.WARN }));
  const over = await page.evaluate(() => {
    const out = [];
    document.querySelectorAll('.page').forEach((pg, i) => {
      const no = i + 1;
      pg.querySelectorAll('.slot').forEach((s) => { if (s.scrollHeight > s.clientHeight + 2) out.push(`${no}쪽: 단 아래로 넘침`); });
      pg.querySelectorAll('.slot').forEach((s) => {
        const sr = s.getBoundingClientRect();
        s.querySelectorAll('svg, table, img, .figrow').forEach((el) => {
          const r = el.getBoundingClientRect();
          if (r.width > 0 && (r.right > sr.right + 3 || r.left < sr.left - 3)) out.push(`${no}쪽: 단보다 넓음 (${el.tagName.toLowerCase()} ${Math.round(r.width)}px > ${Math.round(sr.width)}px)`);
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
  console.log(`${name}: ${pages}쪽 → out/sp/${name}.pdf`);
  await page.close();
}

const content = { TYPES, ITEMS, OVERVIEW, set };
const data = { TYPES, ITEMS, OVERVIEW, set, title: TITLE };
if (parts.includes('student')) await emit('예시문항특강-학생용', renderLecture(content, { mode: 'student' }), data);
if (parts.includes('teacher')) await emit('예시문항특강-교사용', renderLecture(content, { mode: 'teacher' }));
if (parts.includes('answers')) {
  // 정답과 해설 별책: 수업 뒤 학생에게 나눠 준다(유형별 연습 + 쌍둥이 세트)
  const groups = [
    ...TYPES.filter((t) => t.qs.length).map((t) => ({ no: `유형 ${t.no}`, tab: t.no, title: `${t.title.split(' — ')[0]} 연습 문항`, qs: t.qs })),
    { no: '쌍둥이 세트', tab: '세트', title: set.range, qs: set.questions, mock: true },
  ];
  const coverHtml = () => `<div class="cover wb-cover sp-cover"><div class="cv-deco"><i></i><i></i><i></i></div><div class="cv-brand">승민T 통합사회 · 예비 고3 겨울 특강</div>
    <div class="cv-title">${TITLE}<br>정답과 해설</div><div class="cv-sub">유형별 연습 문항 · 쌍둥이 세트 — 오답 선지까지 풀이</div><div class="cv-theme">별책</div><div class="cv-unit"></div></div>`;
  LAYOUT.soft = ['answers'];
  const html = renderAnswers(groups, { title: TITLE, mx: { cover: coverHtml, headLeft: `승민T 통합사회 <b>${TITLE}</b> 정답과 해설` } })
    .replace('</head>', '<link rel="stylesheet" href="../../특강/sp.css"></head>').replace('class="theme-b', 'class="sp theme-b');
  await emit('예시문항특강-정답과해설', html);
}
await browser.close();
if (failed) process.exit(1);
