// 내신 대비 테스트지 만들기: content/<날짜>.js → A형·B형 시험지(학생용·교사용) + 정답과 해설 (PDF, PNG)
//
//   node 기출변형/내신테스트/build.mjs                 가장 최근 날짜 파일
//   node 기출변형/내신테스트/build.mjs 2026-11-08 png  날짜 지정, 쪽 그림(PNG)까지
//
// 결과: 기출변형/out/nt/<날짜>/*.pdf (out/은 커밋하지 않음)
// 문제집(기출변형)의 문항 그리기(questionHtml)·쪽 나누기(paginate.js)·시안 H 디자인을 그대로 쓴다.
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { inl } from '../../textbook/lib/render.js';
import { questionHtml } from '../lib/wb-render.js';
import { UNITS } from '../lib/units.js';

const require = createRequire(import.meta.url);
const { chromium } = (() => { try { return require('playwright'); } catch { return require('/opt/node-tools/node_modules/playwright'); } })();
const ROOT = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const wantPng = args.includes('png');
const files = readdirSync(join(ROOT, 'content')).filter((f) => /^\d{4}-\d\d-\d\d\.js$/.test(f)).sort();
const date = args.find((a) => /^\d{4}-\d\d-\d\d$/.test(a)) || files[files.length - 1].replace('.js', '');
const T = (await import(pathToFileURL(join(ROOT, 'content', `${date}.js`)).href)).default;
const OUT = join(ROOT, '..', 'out', 'nt', date);
mkdirSync(OUT, { recursive: true });

// 시험지 2단, 정답과 해설 2단. 남는 칸에 '정리 노트' 넣지 않음(memoMin 크게)
const LAYOUT = { mock: 2, answers: 2, soft: ['answers'], memoMin: 2, spreadMax: 9 };
const paginateJs = readFileSync(join(ROOT, '../../textbook/lib/paginate.js'), 'utf8');

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const CIRCLED = ['①', '②', '③', '④', '⑤'];
const [y, m, d] = T.date.split('-').map(Number);
const dateText = `${y}. ${m}. ${d}.`;
const chapterText = `${T.subject} ${T.chapter.no}. ${T.chapter.title}`;
const total = (p) => p.questions.length * T.pointsEach;

// 시험지 첫머리: 제목·범위·학교/이름/점수 칸·답 적는 칸
function testHead(p, teacher) {
  const n = p.questions.length;
  const cells = (f) => p.questions.map((q, i) => `<td>${f(q, i)}</td>`).join('');
  return `<div class="top"><div class="nt-head">
    <div class="nt-l"><span>${esc(dateText)} · ${esc(chapterText)}</span><b>${esc(T.title)} <em>${esc(p.name)}</em>${teacher ? '<i>교사용</i>' : ''}</b></div>
    <div class="nt-r"><span>${esc(p.schools.join(' · '))}</span><span>범위: ${esc(p.range)}</span><span>${n}문항 · ${total(p)}점(각 ${T.pointsEach}점) · ${T.minutes}분</span></div>
  </div>
  <table class="nt-id"><tr><th>학교</th><td></td><th>이름</th><td></td><th>점수</th><td class="sc">/ ${total(p)}</td></tr></table>
  <table class="nt-ans"><tr><th>번호</th>${cells((q, i) => i + 1)}</tr><tr><th>답</th>${cells((q) => (teacher ? CIRCLED[q.answer - 1] : ''))}</tr></table>
  </div>`;
}

function testHtml(p, teacher) {
  const attrs = `data-tab="${esc(p.name)}" data-head-left="승민T 통합사회 <b>${esc(T.title)}</b>" data-head-right="${esc(`${T.subject} ${T.chapter.no} · ${p.name}`)}"`;
  const qs = p.questions.map((q, i) => questionHtml(q, i + 1, teacher ? { unit: UNITS[q.unit], teacher: true } : { mock: true })).join('\n');
  return page([`<section class="flow" data-kind="mock" ${attrs}>${testHead(p, teacher)}${qs}</section>`], `${T.title} ${p.name}${teacher ? ' 교사용' : ''}`, teacher ? 'teacher' : 'student');
}

// 정답과 해설: 빠른 정답(A형·B형) + 공통 문항 안내 + 문항별 해설(공통 문항은 한 번만)
function answersHtml() {
  const [A, B] = T.papers;
  const rows = [];
  const quick = (p) => `<tr><th>${esc(p.name)}</th>${p.questions.map((q, i) => `<td><b>${i + 1}</b> ${CIRCLED[q.answer - 1]}</td>`).join('')}</tr>`;
  const lvCount = (p) => ['상', '중상', '중', '하'].map((l) => [l, p.questions.filter((q) => q.level === l).length]).filter(([, c]) => c).map(([l, c]) => `${l} ${c}`).join(' · ');
  // 빠른 정답은 쪽 전체 폭(top)에 — 2단 안에 넣으면 칸이 좁아 줄이 꺾인다
  const top = `<div class="top"><div class="nt-akey">
    <div class="nt-akey-t"><b>정답과 해설</b><span>${esc(dateText)} · ${esc(chapterText)} · ${esc(T.title)}</span></div>
    <table class="nt-quick">${T.papers.map(quick).join('')}</table>
    <ul class="nt-akey-n">
      ${T.papers.map((p) => `<li><b>${esc(p.name)}</b> ${esc(p.schools.join(' · '))} — ${esc(p.range)} (난이도 ${lvCount(p)})</li>`).join('')}
      <li><b>공통</b> ${T.commonFrom}~${A.questions.length}번은 두 시험지가 같은 문항이다(함께 해설). 아래 해설의 A1~A${T.commonFrom - 1}·B1~B${T.commonFrom - 1}은 각 시험지의 1~${T.commonFrom - 1}번이다.</li>
    </ul>
  </div></div>`;
  const meta = (q) => {
    const u = UNITS[q.unit];
    return `${esc(u ? `${u.no} ${u.title}` : '')} · ${esc(q.type)}`;
  };
  const item = (label, q) => `<div class="row row-ae"><div class="main"><div class="ans-q"><div class="aq-h"><span class="aq-no">${label}</span><span class="aq-a">${CIRCLED[q.answer - 1]}</span><span class="aq-lv lv-${esc(q.level)}">${esc(q.level)}</span><span class="aq-meta">${meta(q)}</span></div><p>${inl(q.explain)}</p>${q.note ? `<div class="aq-note"><b>보충 설명</b> ${inl(q.note)}</div>` : ''}</div></div></div>`;
  const band = (t) => `<div class="row row-ah" data-keep="next"><div class="main"><div class="ans-unit"><b>${esc(t)}</b></div></div></div>`;
  const own = (p) => p.questions.slice(0, T.commonFrom - 1);
  rows.push(band(`${A.name} 1~${T.commonFrom - 1}번 (${A.schools.join('·')})`));
  own(A).forEach((q, i) => rows.push(item(`A${i + 1}`, q)));
  rows.push(band(`${B.name} 1~${T.commonFrom - 1}번 (${B.schools.join('·')})`));
  own(B).forEach((q, i) => rows.push(item(`B${i + 1}`, q)));
  rows.push(band(`공통 ${T.commonFrom}~${A.questions.length}번 (A형·B형)`));
  A.questions.slice(T.commonFrom - 1).forEach((q, i) => rows.push(item(String(T.commonFrom + i), q)));
  const sec = `<section class="flow" data-kind="answers" data-tab="답" data-head-left="승민T 통합사회 <b>${esc(T.title)}</b>" data-head-right="정답과 해설 · ${esc(`${T.subject} ${T.chapter.no}`)}">${top}${rows.join('\n')}</section>`;
  return page([sec], `${T.title} 정답과 해설`, 'teacher');
}

// 시험지 머리 모양 (wb.css 뒤에 덧씀)
const NT_CSS = `
.page[data-ch$="형"] { --c1: #3c7a37; --c1-dark: #295626; --c1-soft: #e7f0e5; --c1-line: #b5d0b1; --c1-pale: #f4f8f3; }
.page[data-ch$="형"] .edge-tab { top: 38mm; }
.page[data-ch="B형"] .edge-tab { top: 68mm; }
.nt-head { display: flex; justify-content: space-between; align-items: flex-end; border-top: 2.4pt solid var(--ink); border-bottom: .6pt solid var(--ink); padding: 2.6mm 0 2.4mm; }
.nt-l span { display: block; font-size: 8.4pt; color: var(--gray); }
.nt-l b { font-family: var(--serif-h); font-size: 20pt; letter-spacing: -.02em; }
.nt-l b em { font-style: normal; color: #fff; background: var(--c1); padding: 0 2.2mm; margin-left: 1.5mm; border-radius: 1mm; }
.nt-l b i { font-style: normal; font-size: 10pt; margin-left: 2mm; color: var(--c1-dark); border: .8pt solid var(--c1); padding: .3mm 1.6mm; vertical-align: middle; }
.nt-r { text-align: right; font-size: 8.2pt; color: var(--ink-2); display: flex; flex-direction: column; gap: .6mm; }
.nt-r span:first-child { font-weight: 700; color: var(--ink); font-size: 9.6pt; }
.nt-id, .nt-ans { width: 100%; border-collapse: collapse; font-size: 9pt; margin-top: 2.2mm; }
.nt-id th, .nt-ans th { background: var(--c1-soft); font-weight: 700; width: 12mm; border: .6pt solid var(--c1-line); padding: 1.2mm 0; }
.nt-id td { border: .6pt solid var(--c1-line); height: 8mm; }
.nt-id td.sc { width: 26mm; text-align: right; padding-right: 2mm; color: var(--gray); }
.nt-ans { margin-bottom: 5mm; table-layout: fixed; }
.nt-ans td { border: .6pt solid var(--c1-line); text-align: center; height: 6mm; font-weight: 700; }
.nt-ans tr:first-child td { color: var(--gray); font-weight: 400; font-size: 8pt; height: 4.6mm; background: var(--c1-pale); }
.nt-akey { border-top: 2.4pt solid var(--ink); padding-top: 2.4mm; margin-bottom: 5mm; }
.nt-akey-t { display: flex; justify-content: space-between; align-items: baseline; border-bottom: .6pt solid var(--ink); padding-bottom: 1.6mm; margin-bottom: 2.4mm; }
.nt-akey-t b { font-family: var(--serif-h); font-size: 14pt; }
.nt-akey-t span { font-size: 8pt; color: var(--gray); }
.nt-quick { width: 100%; border-collapse: collapse; font-size: 9pt; table-layout: fixed; }
.nt-quick th { width: 13mm; background: var(--c1-soft); border: .6pt solid var(--c1-line); }
.nt-quick td { border: .6pt solid var(--c1-line); text-align: center; padding: 1.2mm 0; }
.nt-quick td b { color: var(--gray); font-weight: 400; font-size: 7.6pt; margin-right: .6mm; }
.nt-akey-n { margin: 2.4mm 0 0; padding-left: 4mm; font-size: 8.2pt; color: var(--ink-2); }
.nt-akey-n li { margin: .6mm 0; }
`;

function page(sections, title, mode) {
  return `<!doctype html>
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
<style>${NT_CSS}</style>
</head>
<body class="theme-b theme-d theme-h wb mode-${mode}">
<div id="book"></div>
<div id="source">${sections.join('\n')}</div>
<script>window.LAYOUT = __LAYOUT__;</script>
<script>__PAGINATE__</script>
</body></html>`;
}

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 900, height: 1200 }, deviceScaleFactor: 2 });
let failed = false;
async function emit(name, html) {
  const htmlPath = join(OUT, `${name}.html`);
  writeFileSync(htmlPath, html.replace('__LAYOUT__', JSON.stringify(LAYOUT)).replace('__PAGINATE__', () => paginateJs));
  const pg = await ctx.newPage();
  pg.on('pageerror', (e) => { console.error(`[${name}] 페이지 오류:`, e.message); failed = true; });
  await pg.goto(pathToFileURL(htmlPath).href);
  await pg.waitForFunction(() => window.PAGINATED === true, null, { timeout: 120000 });
  const { pages, warn } = await pg.evaluate(() => ({ pages: window.PAGES, warn: window.WARN }));
  const over = await pg.evaluate(() => {
    const out = [];
    document.querySelectorAll('.page').forEach((p, i) => {
      p.querySelectorAll('.slot').forEach((s) => {
        if (s.scrollHeight > s.clientHeight + 2) out.push(`${i + 1}쪽: 단 아래로 넘침`);
        const sr = s.getBoundingClientRect();
        s.querySelectorAll('svg, table, img').forEach((el) => {
          const r = el.getBoundingClientRect();
          if (r.width > 0 && (r.right > sr.right + 3 || r.left < sr.left - 3)) out.push(`${i + 1}쪽: 단보다 넓음 (${el.tagName.toLowerCase()})`);
        });
      });
    });
    return out;
  });
  if (over.length) { console.warn(`[${name}] 넘침:\n  ` + over.join('\n  ')); }
  if (warn?.length) console.warn(`[${name}] 경고:\n  ` + warn.join('\n  '));
  await pg.pdf({ path: join(OUT, `${name}.pdf`), preferCSSPageSize: true, printBackground: true });
  if (wantPng) {
    const dir = join(OUT, 'png', name);
    rmSync(dir, { recursive: true, force: true });
    mkdirSync(dir, { recursive: true });
    const els = await pg.$$('.page');
    for (let i = 0; i < els.length; i++) await els[i].screenshot({ path: join(dir, `${String(i + 1).padStart(2, '0')}.png`) });
  }
  console.log(`${name}: ${pages}쪽`);
  await pg.close();
}

const tag = `${T.subject}${T.chapter.no}-${date.slice(5).replace('-', '')}`;
for (const p of T.papers) {
  await emit(`${tag}-${p.name}-학생용`, testHtml(p, false));
  await emit(`${tag}-${p.name}-교사용`, testHtml(p, true));
}
await emit(`${tag}-정답과해설`, answersHtml());
await browser.close();
console.log(`→ ${OUT}`);
if (failed) process.exit(1);
