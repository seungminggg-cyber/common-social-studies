// 백지테스트 만들기 (인천 계양 고1 정규반, 2026-11-12 시작)
//
//   node 기출변형/백지테스트/build.mjs 07            중단원 07 → out/백지-07-학생용.pdf(답지 + 테스트), -교사용.pdf
//   node 기출변형/백지테스트/build.mjs 07 08 png     여러 중단원, 쪽 그림(PNG)까지
//   node 기출변형/백지테스트/build.mjs set1          1회 묶음 → out/1회/1회-<학교>-답지.pdf·-테스트.pdf, 1회-교사용-모범답안.pdf
//
// 한 중단원 = 답지 1쪽 + 테스트 1쪽(학생용) + 교사용 모범 답안 1쪽.
// 세 판은 같은 HTML이다. 테스트는 답 글자를 투명하게만 해서, 답지와 칸 크기·위치가 똑같다.
// 형식: 개념 지도(flow) · 비교 표(table) · 키워드(keys) · 빈칸 정리(fill) — 강사가 고른 가·나·다·마.
// 주의: 학교 학습지·문제집 원문은 저장소에 올리지 않는다. 내용 파일 문장은 새로 쓴다.
import { createRequire } from 'node:module';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);
const { chromium } = (() => { try { return require('playwright'); } catch { return require('/opt/node-tools/node_modules/playwright'); } })();
const ROOT = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const wantPng = args.includes('png');
const units = args.filter((a) => /^(\d\d|[a-z]+\d)$/.test(a));
const SET = (args.find((a) => /^set\d$/.test(a)) || '').slice(3); // set1 = 1회 묶음(content/sets.js)
if (!units.length && !SET) { console.error('중단원 번호나 회차를 적어 주세요. 예: node build.mjs 07 / node build.mjs set1'); process.exit(1); }
const OUT = join(ROOT, 'out');
const TB = join(ROOT, '../../textbook');

// 대단원 색(개념서 시안 H와 같음)
const COLOR = { 'Ⅰ': ['#1d6c74', '#e6f0f1'], 'Ⅱ': ['#7d3566', '#f3e8ef'], 'Ⅲ': ['#3c7a37', '#eaf2e8'], 'Ⅳ': ['#b5651d', '#f7ede3'], 'Ⅴ': ['#234e8a', '#e7edf6'] };

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const bold = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
let blanks = 0; // 한 쪽의 채점 칸 수
const ans = (s) => { blanks += 1; return `<span class="a">${bold(s)}</span>`; }; // 칸 전체가 답
const fillLine = (s) => esc(s).replace(/\{(.+?)\}/g, (_, x) => { blanks += 1; return `<span class="a f">${x}</span>`; });

function blockHtml(b, i) {
  const head = `<div class="bk-h"><span class="bk-no">${i + 1}</span><span class="bk-kind">${esc(b.kind)}</span>${b.title ? `<h3>${esc(b.title)}</h3>` : ''}</div>`;
  if (b.t === 'flow') {
    const n = b.steps.length;
    const cols = `${b.label || '7.5em'} repeat(${n}, 1fr)`;
    let h = `<div class="flow" style="grid-template-columns:${cols}"><div class="fl-c"></div>`;
    h += b.steps.map((s, k) => `<div class="fl-name${k < n - 1 ? ' arrow' : ''}">${esc(s.name)}</div>`).join('');
    b.rows.forEach((r, ri) => {
      h += `<div class="fl-row">${esc(r)}</div>`;
      h += b.steps.map((s) => `<div class="fl-cell">${ans(s.cells[ri])}</div>`).join('');
    });
    return `<section class="bk">${head}${h}</div></section>`;
  }
  if (b.t === 'table') {
    const th = `<tr>${b.cols.map((c) => `<th>${esc(c)}</th>`).join('')}</tr>`;
    const tr = b.rows.map((r) => `<tr><th class="rh">${esc(r[0])}</th>${r.slice(1).map((c) => `<td>${ans(c)}</td>`).join('')}</tr>`).join('');
    return `<section class="bk${b.wide ? '' : ' half'}">${head}<table class="cmp"><colgroup><col style="width:${b.head || '22mm'}">${b.cols.slice(1).map(() => '<col>').join('')}</colgroup>${th}${tr}</table></section>`;
  }
  if (b.t === 'keys') {
    return `<section class="bk">${head}<dl class="keys">${b.items.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${ans(v)}</dd></div>`).join('')}</dl></section>`;
  }
  if (b.t === 'fill') {
    return `<section class="bk">${head}<ol class="fill">${b.lines.map((l) => `<li>${fillLine(l)}</li>`).join('')}</ol></section>`;
  }
  throw new Error('모르는 블록: ' + b.t);
}

const MODE = {
  // 이름: 강사 2026-11-12 — 외울 판 → 답지, 백지판 → 테스트. 안내 한마디는 넣지 않는다.
  memo: { tag: '답지' },
  blank: { tag: '테스트' },
  teacher: { tag: '교사용 모범 답안' },
};

function page(u, mode) {
  blanks = 0;
  const [c1, c2] = COLOR[u.big];
  // 비교 표 두 개는 나란히(half)
  const body = u.blocks.map(blockHtml);
  const html = [];
  for (let i = 0; i < body.length; i++) {
    if (body[i].includes('bk half') && body[i + 1]?.includes('bk half')) { html.push(`<div class="pair">${body[i]}${body[i + 1]}</div>`); i++; }
    else html.push(body[i]);
  }
  const m = MODE[mode];
  const score = mode === 'blank' ? `<div class="score"><span>이름</span><i></i><span>맞힌 칸</span><i class="s"></i><b>/ ${blanks}</b></div>` : `<div class="score"><span>${blanks}칸</span><span>목표 ${u.min}분</span></div>`;
  return `<div class="page m-${mode}" style="--c1:${c1};--c2:${c2}">
  <header class="hd"><div class="hd-no"><small>${esc(u.sub)}</small><b>${esc(u.no)}</b></div>
    <div class="hd-t"><span>통합사회2 · 백지테스트 · ${esc(m.tag)}</span><h1>${esc(u.title)}</h1></div>${score}</header>
  ${html.join('\n')}
  <footer class="ft"><span>승민T 통합사회</span><span>${esc(u.sub)} ${esc(u.title)} — ${esc(m.tag)}</span></footer>
</div>`;
}

const CSS = `
@font-face { font-family: 'Pretendard Variable'; font-weight: 45 920; src: url('${pathToFileURL(join(TB, 'node_modules/pretendard/dist/web/variable/woff2/PretendardVariable.woff2')).href}') format('woff2-variations'); }
@page { size: A4; margin: 0; }
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'Pretendard Variable', sans-serif; color: #1a1a1a; font-size: 9pt; line-height: 1.42; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.page { width: 210mm; height: 297mm; padding: 12mm 14mm 10mm; display: flex; flex-direction: column; gap: 3.6mm; page-break-after: always; overflow: hidden; position: relative; }
.hd { display: grid; grid-template-columns: auto 1fr auto; align-items: stretch; background: var(--c1); color: #fff; }
.hd-no { background: #1a1a1a; padding: 1.6mm 4mm; display: flex; flex-direction: column; justify-content: center; text-align: center; }
.hd-no small { font-size: 7.4pt; letter-spacing: .12em; opacity: .8; }
.hd-no b { font-size: 22pt; font-weight: 900; line-height: 1; letter-spacing: -.03em; }
.hd-t { padding: 2mm 4.5mm; align-self: center; }
.hd-t span { font-size: 7.8pt; opacity: .85; letter-spacing: .04em; }
.hd-t h1 { font-size: 15pt; font-weight: 800; letter-spacing: -.02em; line-height: 1.25; }
.score { display: flex; align-items: center; gap: 2mm; padding: 0 4mm; font-size: 8pt; font-weight: 600; }
.score i { display: inline-block; width: 22mm; height: 6.5mm; background: #fff; }
.score i.s { width: 10mm; }
.score b { font-size: 10pt; }
.how { font-size: 8pt; color: #555; margin-top: -1.6mm; }
.bk-h { display: flex; align-items: baseline; gap: 2mm; border-bottom: 1.6pt solid #1a1a1a; padding-bottom: 1mm; margin-bottom: 1.6mm; }
.bk-no { background: var(--c1); color: #fff; font-weight: 800; font-size: 8.6pt; width: 5mm; height: 5mm; display: inline-grid; place-items: center; align-self: center; }
.bk-kind { font-size: 7.6pt; font-weight: 700; color: var(--c1); border: .7pt solid var(--c1); padding: 0 1.4mm; align-self: center; }
.bk-h h3 { font-size: 10.4pt; font-weight: 800; letter-spacing: -.01em; }
.pair { display: grid; grid-template-columns: 1fr 1fr; gap: 5mm; }
/* 개념 지도: 단계 상자 + 화살표 */
.flow { display: grid; border-top: .6pt solid #1a1a1a; }
.flow > div { padding: 1.4mm 1.8mm; border-bottom: .5pt solid #bbb; }
.fl-name { background: var(--c2); font-weight: 800; color: var(--c1); text-align: center; font-size: 9.4pt; position: relative; border-left: .5pt solid #fff; }
.fl-name.arrow::after { content: ''; position: absolute; right: -2.2mm; top: 50%; transform: translateY(-50%); border: 2.2mm solid transparent; border-left: 2.2mm solid var(--c1); border-right: 0; z-index: 2; }
.fl-c { background: var(--c2); }
.fl-row { font-weight: 700; font-size: 8.2pt; color: #444; display: flex; align-items: center; }
.fl-cell { border-left: .5pt dotted #bbb; min-height: 11mm; }
/* 비교 표 */
table.cmp { width: 100%; border-collapse: collapse; table-layout: fixed; }
.cmp th, .cmp td { border: .5pt solid #888; padding: 1.4mm 1.8mm; vertical-align: top; }
.cmp tr:first-child th { background: var(--c1); color: #fff; font-weight: 700; text-align: center; border-color: var(--c1); }
.cmp tr:first-child th:first-child { background: #fff; border-color: #fff #888 #888 #fff; }
.cmp th.rh { background: var(--c2); font-size: 8.2pt; text-align: center; vertical-align: middle; }
.cmp td { height: 12mm; }
/* 키워드 */
dl.keys { display: grid; grid-template-columns: 1fr 1fr; column-gap: 5mm; }
dl.keys > div { display: grid; grid-template-columns: 24mm 1fr; border-bottom: .5pt solid #bbb; min-height: 10.5mm; }
dl.keys dt { font-weight: 800; color: var(--c1); padding: 1.4mm 0; display: flex; align-items: center; }
dl.keys dd { padding: 1.4mm 0 1.4mm 2mm; border-left: .5pt dotted #bbb; }
/* 빈칸 정리 */
ol.fill { list-style: none; counter-reset: f; }
ol.fill li { counter-increment: f; padding: 1.5mm 0 1.5mm 6mm; position: relative; border-bottom: .5pt dotted #bbb; line-height: 2.05; font-size: 9.2pt; }
ol.fill li::before { content: counter(f); position: absolute; left: 0; top: 2.1mm; font-weight: 800; color: var(--c1); font-size: 8.4pt; }
.a.f { display: inline-block; min-width: 18mm; padding: 0 2mm; border-bottom: .8pt solid #1a1a1a; text-align: center; line-height: 1.45; font-weight: 700; }
.ft { margin-top: auto; display: flex; justify-content: space-between; font-size: 7pt; color: #888; border-top: .5pt solid #ccc; padding-top: 1.2mm; }
/* 판마다 다른 점 */
.m-memo .a b { color: var(--c1); }
.m-blank .a { color: transparent; }
.m-blank .a b { color: transparent; }
.m-blank .fl-cell, .m-blank .cmp td, .m-blank dl.keys dd { background-image: repeating-linear-gradient(transparent 0 5.6mm, #e2e2e2 5.6mm 5.85mm); background-position: 0 1.4mm; }
.m-teacher .a { color: #c8102e; }
.m-teacher .a b { color: #c8102e; text-decoration: underline; text-decoration-thickness: .7pt; text-underline-offset: 1.2pt; }
`;

const browser = await chromium.launch();
mkdirSync(join(OUT, 'html'), { recursive: true });
const load = async (no) => (await import(pathToFileURL(join(ROOT, 'content', `${no}.js`)).href)).default;

// 쪽 묶음 하나를 PDF로(쪽마다 남는 높이는 답 칸에 나눠 줌)
async function make(name, pages, dir = OUT) {
  mkdirSync(dir, { recursive: true });
  const html = `<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>${name}</title><style>${CSS}</style></head><body>${pages.join('\n')}</body></html>`;
  const hp = join(OUT, 'html', `${name}.html`);
  writeFileSync(hp, html);
  const pg = await browser.newPage({ viewport: { width: 900, height: 1200 }, deviceScaleFactor: 2 });
  await pg.goto(pathToFileURL(hp).href);
  await pg.evaluate(() => document.fonts.ready);
  // 쪽 아래가 비면 그 높이를 답 칸에 고르게 나눠 준다(쓸 자리가 넓어짐, 큰 빈 공간 없음)
  for (let pass = 0; pass < 4; pass++) await pg.evaluate(() => document.querySelectorAll('.page').forEach((p) => {
    const room = p.querySelector('.ft').getBoundingClientRect().top - [...p.children].filter((c) => !c.classList.contains('ft')).pop().getBoundingClientRect().bottom - 12;
    if (room < 20) return;
    const units = [];
    p.querySelectorAll('.flow').forEach((f) => { f.querySelectorAll('.fl-row').forEach((r) => { const cells = []; let n = r.nextElementSibling; while (n && n.classList.contains('fl-cell')) { cells.push(n); n = n.nextElementSibling; } units.push([r, ...cells]); }); });
    p.querySelectorAll('table.cmp tr').forEach((tr) => { if (tr.querySelector('td')) units.push([...tr.querySelectorAll('td')]); });
    p.querySelectorAll('dl.keys').forEach((dl) => { const d = [...dl.children]; for (let i = 0; i < d.length; i += 2) units.push(d.slice(i, i + 2)); });
    const add = Math.min(room / units.length, 90);
    units.forEach((els) => { const h = Math.max(...els.map((e) => e.getBoundingClientRect().height)); els.forEach((e) => { e.style.height = `${h + add}px`; e.style.minHeight = '0'; }); });
  }));
  const over = await pg.evaluate(() => [...document.querySelectorAll('.page')].map((p, i) => {
    const ft = p.querySelector('.ft').getBoundingClientRect(); const last = [...p.children].filter((c) => !c.classList.contains('ft')).pop().getBoundingClientRect();
    return { i: i + 1, room: Math.round((ft.top - last.bottom) / 3.78) };
  }));
  over.forEach((o) => { if (o.room < 1) console.warn(`${name} ${o.i}쪽: 넘침(남은 ${o.room}mm)`); else if (o.room > 15) console.warn(`${name} ${o.i}쪽: 아래 빈 공간 ${o.room}mm`); });
  await pg.pdf({ path: join(dir, `${name}.pdf`), preferCSSPageSize: true, printBackground: true });
  if (wantPng) {
    const pdir = join(OUT, 'png'); mkdirSync(pdir, { recursive: true });
    const els = await pg.$$('.page');
    for (let i = 0; i < els.length; i++) await els[i].screenshot({ path: join(pdir, `${name}-${i + 1}.png`) });
  }
  await pg.close();
  console.log(`${name}: ${pages.length}쪽`);
}

if (SET) {
  // 회차 묶음: 학교마다 답지·테스트 파일, 교사용은 그 회차 전체 한 파일
  const sets = (await import(pathToFileURL(join(ROOT, 'content', 'sets.js')).href)).default[SET];
  const dir = join(OUT, `${SET}회`);
  const all = [];
  for (const [school, list] of Object.entries(sets)) {
    const us = await Promise.all(list.map(load));
    await make(`${SET}회-${school}-답지`, us.map((u) => page(u, 'memo')), dir);
    await make(`${SET}회-${school}-테스트`, us.map((u) => page(u, 'blank')), dir);
    list.forEach((n) => { if (!all.includes(n)) all.push(n); });
  }
  all.sort((a, b) => (/^\d/.test(a) ? 0 : 1) - (/^\d/.test(b) ? 0 : 1) || a.localeCompare(b));
  await make(`${SET}회-교사용-모범답안`, (await Promise.all(all.map(load))).map((u) => page(u, 'teacher')), dir);
} else {
  for (const no of units) {
    const u = await load(no);
    await make(`백지-${no}-학생용`, ['memo', 'blank'].map((m) => page(u, m)));
    await make(`백지-${no}-교사용`, [page(u, 'teacher')]);
  }
}
await browser.close();
