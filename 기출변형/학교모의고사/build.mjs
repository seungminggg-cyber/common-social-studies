// 학교별 실전 모의고사 만들기 (인천 계양 고1 통합사회2 기말 대비, 2026-11-21 시작)
//
//   node 학교모의고사/build.mjs inguk 1 [png]   인천국제고 1회 → 학교모의고사/out/인천국제고-모의고사1-문제.pdf · -정답과해설.pdf
//   학교 키: gyeyang 계양고 · jakjeon 작전고 · inguk 인천국제고 · seoun 서운고 · gyesan 계산여고
//
// 구성(강사 결정 2026-11-21): 객관식 25문항(5지), 상 12 · 특상 13, 문항마다 4점(100점), 50분.
// 설계표 순서 그대로(난이도별 묶음 아님), 표지 없음, 첫 쪽 위에 학교·회차·이름 한 줄. 정답과 해설은 별책.
// 문항: content/<학교>-<회>.js (없으면 -a.js, -b.js를 이어 붙임). 특상은 level '상' + hard: true.
// 상중하/build.mjs를 복사해 고친 것. 디자인은 주간지 MINT 시안 1(styles/s1.css). 공통 파일은 고치지 않는다.
// 주의: 학교 학습지 사진·원문과 결과 PDF는 저장소에 올리지 않는다(공개 저장소).
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { inl } from '../../textbook/lib/render.js';
import { ensureTerrain } from '../../textbook/lib/terrain.js';
import { UNITS } from '../lib/units.js';
import { questionHtml } from '../lib/wb-render.js';
import { bigMapText, cleanLabels, numberFigures } from '../lib/prep.js';

const require = createRequire(import.meta.url);
const { chromium } = (() => { try { return require('playwright'); } catch { return require('/opt/node-tools/node_modules/playwright'); } })();
const ROOT = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const target = args[0] || '';
const round = /^\d+$/.test(args[1] || '') ? args[1] : '1';
const wantPng = args.includes('png');
const OUT = join(ROOT, 'out');
mkdirSync(OUT, { recursive: true });

// 시험 범위(개념서 중단원) — 주간지/README.md 표와 같다
const SCHOOLS = {
  jakjeon: { name: '작전고', range: '통합사회2 Ⅲ·Ⅳ·Ⅴ', units: ['07', '08', '09', '10', '11', '12', '13', '14', '15', '16'] },
  gyeyang: { name: '계양고', range: '통합사회2 Ⅲ·Ⅳ, Ⅴ-2·3', units: ['07', '08', '09', '10', '11', '12', '13', '15', '16'] },
  gyesan: { name: '계산여고', range: '통합사회2 Ⅰ-3, Ⅱ-3, Ⅲ-3·4, Ⅳ-2·3, Ⅴ-2·3', units: ['03', '06', '09', '10', '12', '13', '15', '16'] },
  seoun: { name: '서운고', range: '통합사회2 Ⅱ-3, Ⅲ-3·4, Ⅳ-2·3, Ⅴ', units: ['06', '09', '10', '12', '13', '14', '15', '16'],
    // 표의 widths(칸 너비)를 그대로 지키게 함 — 학생 V·O/X 칸이 많은 표에서 진술 칸이 좁아지는 것을 막음(서운고만 적용)
    css: '.q-data .tbl:has(colgroup) { table-layout: fixed; width: 100%; } .q-data .tbl:has(colgroup) th, .q-data .tbl:has(colgroup) td { padding-left: .7mm !important; padding-right: .7mm !important; word-break: keep-all; }' }, // Ⅱ-3(06)은 2026-11-27 범위 추가
  inguk: { name: '인천국제고', range: '통합사회2 Ⅲ, Ⅳ-2·3, Ⅴ-2·3', units: ['07', '08', '09', '10', '12', '13', '15', '16'] },
};
const SC = SCHOOLS[target];
if (!SC) throw new Error(`학교 키를 모름: '${target}' (${Object.keys(SCHOOLS).join(', ')})`);

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const two = (n) => String(n).padStart(2, '0');
const CIRCLED = ['①', '②', '③', '④', '⑤'];

// ── 문항 모으기 ──
const load = async (f) => (existsSync(f) ? (await import(pathToFileURL(f).href)).default.questions : []);
let qsAll = await load(join(ROOT, 'content', `${target}-${round}.js`));
if (!qsAll.length) qsAll = [...(await load(join(ROOT, 'content', `${target}-${round}-a.js`))), ...(await load(join(ROOT, 'content', `${target}-${round}-b.js`)))];
if (!qsAll.length) throw new Error(`문항 파일이 없음: content/${target}-${round}.js`);
{
  const msg = [];
  if (qsAll.length !== 25) msg.push(`문항 ${qsAll.length}개(계획 25)`);
  const hard = qsAll.filter((q) => q.hard).length;
  if (hard !== 13) msg.push(`특상 ${hard}개(계획 13)`);
  const out = qsAll.filter((q) => !SC.units.includes(q.unit.slice(3))).map((q) => q.id);
  if (out.length) msg.push(`범위 밖 단원: ${out.join(', ')}`);
  for (let i = 2; i < qsAll.length; i++) if (qsAll[i].answer === qsAll[i - 1].answer && qsAll[i].answer === qsAll[i - 2].answer) msg.push(`정답 3번 연속: ${i - 1}~${i + 1}번`);
  if (msg.length) console.warn(`계획과 다름: ${msg.join(' / ')}`);
}
const lvName = (q) => (q.hard ? '특상' : q.level);
const parts = [{ no: 1, title: `실전 모의고사 ${round}회`, qs: qsAll.map((q) => structuredClone(q)) }];
const live = parts;
let qn = 0;
for (const p of live) for (const q of p.qs) q._n = ++qn;
const all = live.flatMap((p) => p.qs);
cleanLabels(all);
bigMapText(all);
numberFigures(all);
await ensureTerrain(all);

// ── HTML ──
const TAB = '종합'; // 여러 대단원이 섞이므로 색은 먹색(아래 doc의 style)
const headLeft = `<b>MINT</b> | 실전 모의고사 · ${esc(SC.name)}`;
// 문제 머리: 개념서 번호 없이 '중단원 번호 + 개념 이름'(주간지와 같은 방식, 긴 이름은 줄임)
function ccName(q) {
  const unit = UNITS[q.unit];
  const first = (Array.isArray(q.concept) ? q.concept : q.concept ? [q.concept] : [])[0];
  const c = unit && first ? unit.concepts.find((x) => x.no === two(+first)) : null;
  let t = c ? c.title.split(' — ')[0] : '';
  if (t.length > 13) t = t.split(/[와과] (?=\S)/).pop();
  return `<span class="q-cc">${esc(unit.no)}${t ? ` <em>${esc(t)}</em>` : ''}</span>`;
}

function partPage(p) {
  const total = p.qs.length * 4;
  const idLine = `<div style="display:flex;justify-content:space-between;align-items:flex-end;font:600 9.5pt var(--disp);border-bottom:.8pt solid var(--ink);padding-bottom:1.6mm;margin-bottom:3mm"><span><b style="font-weight:800">${esc(SC.name)}</b> · 통합사회2 실전 모의고사 ${esc(round)}회 · ${p.qs.length}문항 · 50분</span><span>이름 <i style="display:inline-block;width:40mm;border-bottom:.6pt solid var(--ink)"></i></span></div>`;
  const top = `<div class="top" id="part-1">${idLine}<div class="wk-day">
      <div class="wk-day-no"><span>MOCK</span><em>${esc(round)}회</em></div>
      <div class="wk-day-t"><span>${esc(SC.range)} · 문항마다 4점(${total}점)</span><h2>${esc(p.title)}</h2></div>
      <div class="wk-day-log"><span>시작 <i></i>시 <i></i>분</span><span>끝 <i></i>시 <i></i>분</span><span>점수 <i></i>/ ${total}</span></div>
    </div><div class="wk-sep"><b>객관식</b><i>${p.qs.length}문항 · 5지 선다</i></div></div>`;
  const qrows = p.qs.map((q) => questionHtml({ ...q, points: 4 }, q._n, { unit: UNITS[q.unit], mock: true })).join('\n');
  return `<section class="flow" data-kind="day" data-tab="${TAB}" data-head-left="${headLeft}" data-head-right="${esc(p.title)}">${top}${qrows}</section>`;
}

function answersSection() {
  const rows = [];
  rows.push(`<div class="row row-ac"><div class="main"><div class="ans-check wb-quick"><div class="ans-list">${all.map((q) => `<span><b>${two(q._n)}</b> ${CIRCLED[q.answer - 1]}</span>`).join('')}</div></div></div></div>`);
  for (const p of live) {
    for (const q of p.qs) {
      rows.push(`<div class="row row-ae"><div class="main"><div class="ans-q"><div class="aq-h"><span class="aq-no">${two(q._n)}</span><span class="aq-a">${CIRCLED[q.answer - 1]}</span><span class="aq-lv lv-상">${esc(lvName(q))}</span><span class="aq-meta">4점 · ${esc(UNITS[q.unit].no)} ${esc(UNITS[q.unit].title)}</span></div><p>${inl(q.explain)}</p>${q.note ? `<div class="aq-note"><b>보충 설명</b> ${inl(q.note)}</div>` : ''}</div></div></div>`);
    }
  }
  return `<section class="flow" data-kind="answers" data-tab="답" data-head-left="${headLeft}" data-head-right="정답과 해설"><div class="top"><div class="band band-answers"><span class="band-title">정답과 해설</span><span class="band-sub">${esc(SC.name)} · 실전 모의고사 ${esc(round)}회</span></div></div>${rows.join('\n')}</section>`;
}

const name = `${SC.name}-모의고사${round}`;
const doc = (title, sections) => `<!doctype html>
<html lang="ko"><head>
<meta charset="utf-8">
<title>${esc(title)}</title>
<link rel="stylesheet" href="../../../../textbook/node_modules/@fontsource/noto-serif-kr/400.css">
<link rel="stylesheet" href="../../../../textbook/node_modules/@fontsource/noto-serif-kr/600.css">
<link rel="stylesheet" href="../../../../textbook/node_modules/font-kopubworld/css.local/all.css">
<style>
@font-face { font-family: 'Pretendard Variable'; font-weight: 45 920; font-style: normal; font-display: block;
  src: url('../../../../textbook/node_modules/pretendard/dist/web/variable/woff2/PretendardVariable.woff2') format('woff2-variations'); }
</style>
<link rel="stylesheet" href="../../../../textbook/themes/base.css">
<link rel="stylesheet" href="../../../../textbook/themes/h.css">
<link rel="stylesheet" href="../../../wb.css">
<link rel="stylesheet" href="../../../주간지/weekly.css">
<link rel="stylesheet" href="../../../주간지/styles/s1.css">
<style>.page[data-ch="종합"] { --c1: #1f1d1b; --c1-dark: #1f1d1b; --c1-soft: #eeeae5; --c1-line: #cfcac4; --c1-pale: #f7f5f2; }</style>
${SC.css ? `<style>${SC.css}</style>` : ''}
</head>
<body class="theme-b theme-d theme-h wb wbc wk wk-s1 mode-student">
<div id="book"></div>
<div id="source">${sections.join('\n')}</div>
<script>window.LAYOUT = ${JSON.stringify({ day: 2, answers: 2, soft: [], memoMin: 0.12, spreadMax: 6, topAdvance: 1, memoTitle: '풀이 메모', prompts: { day: [''] } })};</script>
<script>${readFileSync(join(ROOT, '../../textbook/lib/paginate.js'), 'utf8')}</script>
</body></html>`;

// out/html 아래에 두어야 글꼴·테마 상대 경로(../../../textbook)가 맞는다
const htmlDir = join(OUT, 'html');
mkdirSync(htmlDir, { recursive: true });
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 900, height: 1200 }, deviceScaleFactor: 2 });
let failed = false;
async function render(file, html) {
  const htmlPath = join(htmlDir, `${file}.html`);
  writeFileSync(htmlPath, html);
  const pg = await ctx.newPage();
  pg.on('pageerror', (e) => { console.error('페이지 오류:', e.message); failed = true; });
  await pg.goto(pathToFileURL(htmlPath).href);
  await pg.waitForFunction(() => window.PAGINATED === true, null, { timeout: 300000 });
  const { pages, warn } = await pg.evaluate(() => ({ pages: window.PAGES, warn: window.WARN }));
  const over = await pg.evaluate(() => {
    const out = [];
    document.querySelectorAll('.page').forEach((p, i) => {
      p.querySelectorAll('.slot').forEach((s) => { if (s.scrollHeight > s.clientHeight + 2) out.push(`${i + 1}쪽: 단 아래로 넘침`); });
      p.querySelectorAll('.q-head').forEach((h) => { if (h.getBoundingClientRect().height > 40) out.push(`${i + 1}쪽: 문제 머리 두 줄`); });
    });
    return out;
  });
  if (over.length) console.warn(`${file} 넘침 검사:\n  ` + [...new Set(over)].join('\n  '));
  if (warn?.length) console.warn(`${file} 경고:\n  ` + warn.join('\n  '));
  // 옆 색인: 문제 쪽은 'MOCK n회' 한 칸
  await pg.evaluate((r) => {
    document.querySelectorAll('.page.page-day').forEach((p) => {
      const tab = p.querySelector('.edge-tab');
      if (!tab) return;
      tab.classList.add('wk-dtab');
      tab.style.top = '40mm';
      tab.innerHTML = `<span><small>MOCK</small><b>${r}</b></span>`;
    });
  }, round);
  await pg.pdf({ path: join(OUT, `${file}.pdf`), preferCSSPageSize: true, printBackground: true });
  if (wantPng) {
    const dir = join(OUT, 'png', file);
    rmSync(dir, { recursive: true, force: true });
    mkdirSync(dir, { recursive: true });
    const els = await pg.$$('.page');
    for (let i = 0; i < els.length; i++) await els[i].screenshot({ path: join(dir, `${two(i + 1)}.png`) });
  }
  console.log(`${file}: ${pages}쪽 → 학교모의고사/out/${file}.pdf`);
  await pg.close();
}
await render(`${name}-문제`, doc(`${SC.name} 실전 모의고사 ${round}회`, live.map(partPage)));
await render(`${name}-정답과해설`, doc(`${name} 정답과 해설`, [answersSection()]));
await browser.close();
// 정답 번호 고르게: ①~⑤ 몇 번씩
const dist = [1, 2, 3, 4, 5].map((n) => `${CIRCLED[n - 1]}${all.filter((q) => q.answer === n).length}`).join(' ');
console.log(`객관식 ${qn}문항 (상 ${all.filter((q) => !q.hard).length} · 특상 ${all.filter((q) => q.hard).length}) · 정답 분포 ${dist}`);
if (failed) process.exit(1);
