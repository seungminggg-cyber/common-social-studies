// 계산 문제 자료 만들기 (인천 계양 고1 통합사회2 기말 대비, 2026-11-12 시작)
//
//   node 계산문제/build.mjs sample [png]     공통 견본 → 계산문제/out/견본-문제.pdf · 견본-정답과해설.pdf
//   node 계산문제/build.mjs gyeyang [png]    계양고용 1권(공통 18 + 학교 추가 6) → 계산문제/out/계양고-문제.pdf · -정답과해설.pdf
//
// 구성: 표지 → 난이도 하 · 중 · 상(공통, 08·10 각 3문항) → 학교 추가 문제. 정답과 해설은 별책(따로 PDF, 강사 결정 2026-11-12).
// 디자인은 주간지 MINT 시안 1(styles/s1.css)을 그대로 쓴다. 주간지·문제집 공통 파일은 고치지 않는다.
// 주의: 학교 학습지 사진·원문과 결과 PDF는 저장소에 올리지 않는다(공개 저장소). 문항은 숫자·상황·문장을 새로 쓴다.
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
const target = args[0] || 'sample';
const wantPng = args.includes('png');
const OUT = join(ROOT, 'out');
mkdirSync(OUT, { recursive: true });

const SCHOOLS = {
  gyeyang: { name: '계양고', range: '통합사회2 Ⅲ-2 · Ⅲ-4' },
  jakjeon: { name: '작전고', range: '통합사회2 Ⅲ-2 · Ⅲ-4' },
  inguk: { name: '인천국제고', range: '통합사회2 Ⅲ-2 · Ⅲ-4' },
  seoun: { name: '서운고', range: '통합사회2 Ⅲ-2 · Ⅲ-4 (학교 범위 Ⅲ-3·4)' },
  gyesan: { name: '계산여고', range: '통합사회2 Ⅲ-2 · Ⅲ-4 (학교 범위 Ⅲ-3·4)' },
};
const sample = target === 'sample';
const SC = sample ? { name: '공통 견본', range: '통합사회2 Ⅲ-2 · Ⅲ-4' } : SCHOOLS[target];
if (!SC) throw new Error(`학교 키를 모름: ${target} (sample, ${Object.keys(SCHOOLS).join(', ')})`);

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const two = (n) => String(n).padStart(2, '0');
const CIRCLED = ['①', '②', '③', '④', '⑤'];

// ── 문항 모으기 ──
const load = async (f) => (existsSync(f) ? (await import(pathToFileURL(f).href)).default.questions : []);
const common = await load(join(ROOT, 'content', 'common.js'));
const extra = sample ? [] : await load(join(ROOT, 'content', `${target}.js`));
const LV = [['하', '기본 계산', '공식에 숫자를 넣어 한 번에 푼다'], ['중', '실전 계산', '두세 단계로 계산하고 함정을 피한다'], ['상', '고난도 계산', '거꾸로 추론하고 여러 값을 함께 따진다']];
const parts = LV.map(([lv, title, sub], i) => ({
  no: i + 1, key: lv, label: lv, title: `난이도 ${lv} · ${title}`, sub,
  qs: common.filter((q) => q.level === lv).sort((a, b) => a.unit.localeCompare(b.unit)).map((q) => structuredClone(q)),
}));
if (extra.length) parts.push({ no: 4, key: 'school', label: '+', title: `${SC.name} 추가 문제`, sub: `${SC.name} 학습지 유형`, qs: extra.map((q) => structuredClone(q)) });
const live = parts.filter((p) => p.qs.length);
let qn = 0;
for (const p of live) for (const q of p.qs) q._n = ++qn;
const all = live.flatMap((p) => p.qs);
cleanLabels(all);
bigMapText(all);
numberFigures(all);
await ensureTerrain(all);

// ── HTML ──
const TAB = 'Ⅲ';
const headLeft = `<b>MINT</b> | 계산 문제 · ${esc(SC.name)}`;
const unitName = (k) => `${UNITS[k].no} ${UNITS[k].title}`;

function coverPage() {
  const list = live.map((p) => {
    const n08 = p.qs.filter((q) => q.unit === 't2-08').length;
    const n10 = p.qs.filter((q) => q.unit === 't2-10').length;
    return `<li><b>${p.key === 'school' ? 'PLUS' : `LEVEL ${esc(p.label)}`}</b><span>${esc(p.title)} — 08 ${n08}문항 · 10 ${n10}문항</span></li>`;
  }).join('');
  return `<section class="flow" data-kind="cover" data-tab="${TAB}"><div class="top"><div class="cv cv1"><div class="cv-mark" aria-hidden="true">${TAB}</div>
    <div class="cv-top"><span>통합사회 내신 · 계산 문제 특강</span><span>2학기 기말고사 대비</span></div>
    <div class="cv-wm"><h1 class="wm wm-one"><span class="wm-a">MIN</span><span class="wm-b">T</span></h1><p>승민T 학교별 내신 · 계산 문제</p></div>
    <div class="cv-week"><span>SPECIAL</span><b style="font-size: 120pt; letter-spacing: -.02em">계산</b></div>
    <div class="cv-school"><b>${esc(SC.name)}</b><span>1학년 · 통합사회2</span></div>
    <div class="cv-range">${esc(SC.range)}</div>
    <div class="cv-inside"><div class="cv-lab">INSIDE</div><ol class="wk-list">${list}</ol></div>
    <div class="cv-foot"><span>08 기회비용 · 10 무역 · 객관식 ${qn}문항 · 정답과 해설 별책</span><span class="cv-name">이름 <i></i></span></div>
  </div></div></section>`;
}

function partPage(p) {
  const top = `<div class="top" id="part-${p.no}"><div class="wk-day">
      <div class="wk-day-no"><span>${p.key === 'school' ? 'PLUS' : 'LEVEL'}</span><b>${p.no}</b><em>${esc(p.label)}</em></div>
      <div class="wk-day-t"><span>${esc(p.sub)}</span><h2>${esc(p.title)}</h2></div>
      <div class="wk-day-log"><span>푼 날 <i></i>월 <i></i>일</span><span>걸린 시간 <i></i>분</span><span>맞은 개수 <i></i>/ ${p.qs.length}</span></div>
    </div><div class="wk-sep"><b>객관식</b><i>${p.qs.length}문항 · 계산 과정은 문제 옆에 쓴다</i></div></div>`;
  const qrows = p.qs.map((q) => questionHtml(q, q._n, { unit: UNITS[q.unit] }).replace(/<span class="q-cc">.*?<\/span>/, `<span class="q-cc">${esc(UNITS[q.unit].no)} ${q.unit === 't2-08' ? '기회비용' : '무역'}</span>`)).join('\n');
  return `<section class="flow" data-kind="day" data-tab="${TAB}" data-head-left="${headLeft}" data-head-right="${esc(p.title)}">${top}${qrows}</section>`;
}

function answersSection() {
  const rows = [];
  rows.push(`<div class="row row-ac"><div class="main"><div class="ans-check wb-quick"><div class="ans-list">${all.map((q) => `<span><b>${two(q._n)}</b> ${CIRCLED[q.answer - 1]}</span>`).join('')}</div></div></div></div>`);
  for (const p of live) {
    rows.push(`<div class="row row-ah" data-keep="next"><div class="main"><div class="ans-unit"><b>${p.key === 'school' ? 'PLUS' : `LEVEL ${esc(p.label)}`}</b> ${esc(p.title)}</div></div></div>`);
    for (const q of p.qs) {
      rows.push(`<div class="row row-ae"><div class="main"><div class="ans-q"><div class="aq-h"><span class="aq-no">${two(q._n)}</span><span class="aq-a">${CIRCLED[q.answer - 1]}</span><span class="aq-lv lv-${esc(q.level)}">${esc(q.level)}</span><span class="aq-meta">${esc(UNITS[q.unit].no)} · ${esc(q.type || '')}</span></div><p>${inl(q.explain)}</p>${q.note ? `<div class="aq-note"><b>보충 설명</b> ${inl(q.note)}</div>` : ''}</div></div></div>`);
    }
  }
  return `<section class="flow" data-kind="answers" data-tab="답" data-head-left="${headLeft}" data-head-right="정답과 해설"><div class="top"><div class="band band-answers"><span class="band-title">정답과 해설</span><span class="band-sub">계산 문제 · ${esc(SC.name)}</span></div></div>${rows.join('\n')}</section>`;
}

const name = sample ? '견본' : SC.name;
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
</head>
<body class="theme-b theme-d theme-h wb wbc wk wk-s1 mode-student">
<div id="book"></div>
<div id="source">${sections.join('\n')}</div>
<script>window.LAYOUT = ${JSON.stringify({ cover: 1, day: 2, answers: 2, soft: [], memoMin: 0.12, spreadMax: 6, topAdvance: 1, memoTitle: '풀이 메모', prompts: { day: ['계산 과정을 단계별로 적어 둔다.'] } })};</script>
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
  // 옆 색인: 난이도(하·중·상·+)마다 칸이 아래로
  await pg.evaluate(() => {
    document.querySelectorAll('.page.page-day').forEach((p) => {
      const tab = p.querySelector('.edge-tab');
      const r = p.querySelector('.ph-right')?.textContent || '';
      const m = /난이도 (하|중|상)/.exec(r);
      const lab = m ? m[1] : /추가/.test(r) ? '+' : null;
      if (!lab || !tab) return;
      const k = { 하: 0, 중: 1, 상: 2, '+': 3 }[lab];
      tab.classList.add('wk-dtab');
      tab.style.top = `${40 + k * 34}mm`;
      tab.innerHTML = `<span><small>${lab === '+' ? 'PLUS' : 'LEVEL'}</small><b>${lab}</b></span>`;
    });
  });
  await pg.pdf({ path: join(OUT, `${file}.pdf`), preferCSSPageSize: true, printBackground: true });
  if (wantPng) {
    const dir = join(OUT, 'png', file);
    rmSync(dir, { recursive: true, force: true });
    mkdirSync(dir, { recursive: true });
    const els = await pg.$$('.page');
    for (let i = 0; i < els.length; i++) await els[i].screenshot({ path: join(dir, `${two(i + 1)}.png`) });
  }
  console.log(`${file}: ${pages}쪽 → 계산문제/out/${file}.pdf`);
  await pg.close();
}
await render(`${name}-문제`, doc(`${name} 계산 문제`, [coverPage(), ...live.map(partPage)]));
await render(`${name}-정답과해설`, doc(`${name} 정답과 해설`, [answersSection()]));
await browser.close();
// 정답 번호 고르게: ①~⑤ 몇 번씩
const dist = [1, 2, 3, 4, 5].map((n) => `${CIRCLED[n - 1]}${all.filter((q) => q.answer === n).length}`).join(' ');
console.log(`객관식 ${qn}문항 · 정답 분포 ${dist}`);
if (failed) process.exit(1);
