// 학교 학습지 총정리 만들기 (MINT 총정리, 2026-11-27 시작 — 인천국제고가 첫 견본)
//
//   node 기출변형/총정리/build.mjs inguk            → 총정리/out/인천국제고-총정리.pdf(학생용) · -정답.pdf(별책)
//   node 기출변형/총정리/build.mjs inguk png        쪽 그림(PNG)까지
//   node 기출변형/총정리/build.mjs inguk only=10    중단원 하나만(견본) → 인천국제고-총정리-10.pdf
//
// 중단원마다: ① 자세한 정리 → ② 빈칸 테스트(같은 원고에서 핵심어만 비움) → ③ O/X → ④ 계산 풀이(계산 있는 중단원만)
// 대단원 끝: 백지테스트(content/<학교>/blank/*.js). 맨 뒤: 붙일 PDF(book.append, 예: 모의고사)가 있으면 붙인다.
// 원고 표시법: {{핵심어}} = 빈칸(정리판에서는 굵게), ★ = 학교 선생님 강조, **굵게**, ==형광펜==
// 주의: 학습지 원문·사진·결과 PDF는 저장소에 올리지 않는다. 학습지 숫자 예시·문제는 content/<학교>/private/ (gitignore).
import { createRequire } from 'node:module';
import { writeFileSync, mkdirSync, rmSync, existsSync, readFileSync, readdirSync, renameSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { block, inl } from '../../textbook/lib/render.js';
import { BOOKS, UNITS } from '../lib/units.js';
import { svgBlock } from './lib/svg.js';
import { blankPage } from './lib/blank.js';

const require = createRequire(import.meta.url);
const { chromium } = (() => { try { return require('playwright'); } catch { return require('/opt/node-tools/node_modules/playwright'); } })();
const ROOT = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const school = args[0] || 'inguk';
const wantPng = args.includes('png');
const ONLY = (args.find((a) => a.startsWith('only=')) || '').slice(5).split(',').filter(Boolean);
const SERIES = 'MINT';
const OUT = join(ROOT, 'out');
mkdirSync(join(OUT, 'html'), { recursive: true });

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const two = (n) => String(n).padStart(2, '0');
const imp = async (f) => (await import(pathToFileURL(f).href)).default;

// ── 원고 모으기 ──
const CDIR = join(ROOT, 'content', school);
const BOOK = await imp(join(CDIR, 'book.js'));
const units = [];
const skipped = [];
for (const no of BOOK.units) {
  if (ONLY.length && !ONLY.includes(no)) continue;
  const f = join(CDIR, `${no}.js`);
  if (!existsSync(f)) { skipped.push(no); continue; }
  const u = await imp(f);
  const pf = join(CDIR, 'private', `${no}.js`);
  u.priv = existsSync(pf) ? await imp(pf) : null;
  if (!u.priv && u.calc) console.warn(`[${no}] 학습지 예시(private/${no}.js)가 없어 계산 풀이의 학습지 예시를 뺀다(학습지를 보고 다시 만든다).`);
  units.push(u);
}
if (skipped.length) console.warn(`아직 원고가 없는 중단원(건너뜀): ${skipped.join(', ')}`);

// ── 핵심어 표시 바꾸기: 같은 원고 → 정리판(굵게) / 빈칸판(번호 빈칸) ──
function mapStrings(v, f) {
  if (typeof v === 'string') return f(v);
  if (Array.isArray(v)) return v.map((x) => mapStrings(x, f));
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, ['t', 'kind'].includes(k) ? x : mapStrings(x, f)]));
  return v;
}
const KEY = /\{\{(.+?)\}\}/g;
const sumVersion = (blocks) => mapStrings(blocks, (s) => s.replace(KEY, '**$1**'));
function blankVersion(blocks, answers) {
  return mapStrings(blocks, (s) => s.replace(KEY, (_, a) => { answers.push(a); return `⟦${answers.length}⟧`; }));
}
const fillBlanks = (html, answers) => html.replace(/⟦(\d+)⟧/g, (_, n) => {
  const a = answers[n - 1] || '';
  const w = Math.max(3.2, [...a].length * 1.05 + 1.6); // 글자 수에 맞춘 칸 너비(em)
  return `<span class="bk" style="min-width:${w.toFixed(1)}em"><i>${n}</i></span>`;
});
const star = (html) => html.replace(/★/g, '<span class="star">★</span>');
const render = (b) => (b.t === 'svg' ? svgBlock(b, inl) : block(b));

// ── 쪽 만들기 ──
const chapterOf = (u) => BOOKS[UNITS[u.unit].book];
const headLeft = `<b>${SERIES}</b> 총정리 | ${esc(BOOK.school)}`;
const sectionAttrs = (u, part, kind, extra = '') => `data-kind="${kind}" data-tab="${esc(u.big)}" data-head-left="${esc(headLeft)}" data-head-right="${esc(`${u.no} ${u.title} · ${part}`)}" ${extra}`;
const PARTS = ['자세한 정리', '빈칸 테스트', 'O/X', '계산 풀이'];
const partBand = (k, sub, id) => `<div class="sm-band"${id ? ` id="${id}"` : ''}><b>${two(k + 1)}</b><span>${PARTS[k]}</span>${sub ? `<i>${sub}</i>` : ''}</div>`;
const readMin = (html) => Math.max(0.5, html.replace(/<[^>]+>/g, '').length / 450); // 꼼꼼히 읽기: 1분에 약 450자

function unitOpener(u) {
  const ch = chapterOf(u);
  const parts = PARTS.filter((_, k) => k < 3 || u.calc).map((p, k) => `<li><b>${two(k + 1)}</b>${p}</li>`).join('');
  return `<div class="sm-open" id="u${u.no}-sum">
    <div class="sm-open-no"><span>${esc(ch.chapter.no)}. ${esc(ch.chapter.title)}</span><b>${esc(u.no)}</b></div>
    <div class="sm-open-t"><h2>${esc(u.title)}</h2><p>${esc(u.source)}</p></div>
    <ol class="sm-open-parts">${parts}</ol>
  </div>`;
}
function sumRows(u, mode, answers) {
  if (mode !== 'sum') u._secAns = [];
  return u.sum.map((s, i) => {
    const from = answers ? answers.length : 0;
    const blocks = mode === 'sum' ? sumVersion(s.blocks) : blankVersion(s.blocks, answers);
    const title = mode === 'sum' ? s.h.replace(KEY, '$1') : s.h.replace(KEY, '$1');
    let body = blocks.map(render).join('');
    if (mode !== 'sum') body = fillBlanks(body, answers);
    body = star(body);
    const head = `<div class="sm-h"><b>${two(i + 1)}</b><h3>${star(inl(title))}</h3><span class="sm-pg">${s.pg ? `학습지 ${esc(s.pg)}쪽` : '학습지 없음(개념서)'}</span></div>`;
    const n = mode === 'sum' ? 0 : (body.match(/class="bk"/g) || []).length;
    if (mode !== 'sum') u._secAns.push({ no: two(i + 1), h: title, from, to: answers.length });
    const min = mode === 'sum' ? readMin(body) : n * 0.35;
    return `<div class="row sm-row" data-min="${min.toFixed(2)}" data-cnt="${n}"><div class="main"><div class="sm-item">${head}${body}</div></div></div>`;
  }).join('\n');
}
function oxRows(u) {
  return u.ox.map(([text], i) => `<div class="row ox-row" data-min="0.7" data-cnt="1"><div class="main"><div class="ox-q"><span class="ox-n">${i + 1}</span><span class="ox-t">${inl(text)}</span><span class="ox-b"><i>O</i><i>X</i></span><div class="ox-fix"><em>X라면 바르게 고쳐 쓰기</em><i></i></div></div></div></div>`).join('\n');
}
function calcRows(u) {
  const c = u.calc;
  const rows = [];
  rows.push(`<div class="row" data-keep="next" data-min="1" data-cnt="0"><div class="main"><div class="cc-formula"><b>공식 모음</b><ul>${c.formulas.map((f) => `<li>${inl(f)}</li>`).join('')}</ul></div></div></div>`);
  const ex = u.priv?.examples || [];
  ex.forEach((e, i) => {
    rows.push(`<div class="row" data-min="3" data-cnt="0"><div class="main"><div class="cc-ex"><div class="cc-h"><span class="cc-tag">학습지 예시 ${i + 1}</span><b>${inl(e.title)}</b><span class="sm-pg">${esc(e.from)}</span></div>
      <p class="cc-stem">${inl(e.stem)}</p>${(e.data || []).map(render).join('')}
      <div class="cc-steps"><span>단계별 풀이</span><ol>${e.steps.map((s) => `<li>${inl(s)}</li>`).join('')}</ol></div></div></div></div>`);
  });
  c.practice.forEach((p, i) => {
    rows.push(`<div class="row" data-min="6" data-cnt="${p.asks.length}"><div class="main"><div class="cc-pr"><div class="cc-h"><span class="cc-tag cc-tag2">연습 ${i + 1}</span><b>${inl(p.title)}</b><span class="sm-pg">숫자를 바꾼 문제</span></div>
      <p class="cc-stem">${inl(p.stem)}</p>${(p.data || []).map(render).join('')}
      ${p.formula ? `<div class="cc-given"><b>공식</b> ${inl(p.formula)}</div>` : ''}
      <ol class="cc-asks">${p.asks.map((a) => `<li><span>${inl(a)}</span><i></i></li>`).join('')}</ol></div></div></div>`);
  });
  return rows.join('\n');
}

function unitSections(u) {
  const answers = [];
  const blankBody = sumRows(u, 'blank', answers);
  u._answers = answers;
  const out = [];
  out.push(`<section class="flow" ${sectionAttrs(u, PARTS[0], 'sum')}><div class="top">${unitOpener(u)}${partBand(0, '학습지 순서대로, ★는 학교 선생님이 강조한 곳')}</div>${sumRows(u, 'sum')}</section>`);
  out.push(`<section class="flow" ${sectionAttrs(u, PARTS[1], 'blank')}><div class="top">${partBand(1, `정리와 같은 모양 · 빈칸 ${answers.length}개 · 정답은 별책`, `u${u.no}-blank`)}</div>${blankBody}</section>`);
  out.push(`<section class="flow" ${sectionAttrs(u, PARTS[2], 'ox')}><div class="top">${partBand(2, `${u.ox.length}문항 · 맞으면 O, 틀리면 X에 표시하고 X는 바르게 고쳐 쓴다`, `u${u.no}-ox`)}</div>${oxRows(u)}</section>`);
  if (u.calc) out.push(`<section class="flow" ${sectionAttrs(u, PARTS[3], 'calc')}><div class="top">${partBand(3, '학습지 예시 → 단계별 풀이 → 숫자를 바꾼 연습', `u${u.no}-calc`)}</div>${calcRows(u)}</section>`);
  return out;
}

// 대단원 끝 백지테스트
const BIG_TITLE = { 'Ⅲ': '시장경제와 지속가능발전', 'Ⅳ': '세계화와 평화', 'Ⅴ': '미래와 지속가능한 삶' };
async function blankSections(big, answerOut) {
  const keys = BOOK.blank?.[big] || [];
  const out = [];
  for (const k of keys) {
    const f = join(CDIR, 'blank', `${k}.js`);
    if (!existsSync(f)) { console.warn(`백지테스트 원고 없음: blank/${k}.js`); continue; }
    const P = await imp(f);
    const { test, answer, cells } = blankPage(P);
    const id = out.length === 0 ? `blank-${big}` : '';
    out.push(`<section class="flow" data-kind="bt" data-tab="${esc(big)}" data-head-left="${esc(headLeft)}" data-head-right="${esc(`${big} 대단원 백지테스트`)}"><div class="top"><div class="bt-band"${id ? ` id="${id}"` : ''}><b>${esc(big)}</b><span>백지테스트</span><em>${esc(P.title)}</em><i>${cells}칸 · 목표 ${P.min}분</i></div></div><div class="row" data-min="${P.min}" data-cnt="${cells}"><div class="main">${test}</div></div></section>`);
    answerOut.push({ big, title: P.title, html: answer });
  }
  return out;
}

function coverPage() {
  return `<section class="flow" data-kind="cover" data-tab="Ⅲ"><div class="top"><div class="cv cv1 sm-cv">
    <div class="cv-mark" aria-hidden="true">Ⅲ</div>
    <div class="cv-top"><span>통합사회2 내신 · 학교 학습지 총정리</span><span>${esc(BOOK.exam)}</span></div>
    <div class="cv-wm"><h1 class="wm wm-two"><span class="wm-a">MINT</span><span class="wm-b">총정리</span></h1><p>승민T 학교별 내신 · 학습지 총정리</p></div>
    <div class="sm-cv-school"><b>${esc(BOOK.school)}</b><span>${esc(BOOK.grade)}</span></div>
    <div class="sm-cv-title">학습지 총정리</div>
    <div class="cv-range">${esc(BOOK.range)}</div>
    <div class="sm-cv-parts"><span>자세한 정리</span><span>빈칸 테스트</span><span>O/X</span><span>계산 풀이</span><span>백지테스트</span></div>
    <div class="cv-foot"><span>정답과 해설은 별책</span><span class="cv-name">이름 <i></i></span></div>
  </div></div></section>`;
}
function guidePage(bigs, appendList) {
  const rows = [];
  let lastBig = '';
  for (const u of units) {
    if (u.big !== lastBig) {
      if (lastBig && bigs.includes(lastBig)) rows.push(`<tr class="toc-bt"><td></td><td>${esc(lastBig)} 대단원 백지테스트</td><td colspan="4"><span data-pg="blank-${esc(lastBig)}"></span>쪽</td></tr>`);
      lastBig = u.big;
      rows.push(`<tr class="toc-big"><td colspan="6">${esc(u.big)}. ${esc(BIG_TITLE[u.big] || '')}</td></tr>`);
    }
    const cell = (id, on = true) => (on ? `<td><span data-pg="${id}"></span></td>` : '<td class="na">—</td>');
    rows.push(`<tr><td class="no">${esc(u.no)}</td><td>${esc(u.title)}</td>${cell(`u${u.no}-sum`)}${cell(`u${u.no}-blank`)}${cell(`u${u.no}-ox`)}${cell(`u${u.no}-calc`, !!u.calc)}</tr>`);
  }
  if (lastBig && bigs.includes(lastBig)) rows.push(`<tr class="toc-bt"><td></td><td>${esc(lastBig)} 대단원 백지테스트</td><td colspan="4"><span data-pg="blank-${esc(lastBig)}"></span>쪽</td></tr>`);
  for (const a of appendList) rows.push(`<tr class="toc-bt"><td></td><td>${esc(a.title)}</td><td colspan="4">책 맨 뒤</td></tr>`);
  return `<section class="flow" data-kind="guide" data-tab="Ⅲ" data-head-left="${esc(headLeft)}" data-head-right="차례 · 이 책 쓰는 법"><div class="top"><div class="sm-guide">
    <h2>차례</h2>
    <table class="sm-toc"><thead><tr><th>중단원</th><th></th><th>정리</th><th>빈칸</th><th>O/X</th><th>계산</th></tr></thead><tbody>${rows.join('')}</tbody></table>
    <h2>이 책 쓰는 법</h2>
    <ol class="sm-how">
      <li>${inl('**자세한 정리**를 학습지 옆에 펴 놓고 읽는다. 쪽마다 붙은 **학습지 ○쪽**으로 학교 학습지를 찾아볼 수 있다. **★는 학교 선생님이 강조한 곳**이니 두 번 읽는다.')}</li>
      <li>${inl('**빈칸 테스트**는 정리와 같은 모양에서 핵심어만 비웠다. 정리를 덮고 채운 뒤 **별책 정답**으로 채점한다. 틀린 칸은 정리 쪽에서 다시 찾아 읽는다.')}</li>
      <li>${inl('**O/X**는 학습지 문장을 살짝 바꾼 것이다. X라면 어디가 틀렸는지 찾아 **바르게 고쳐 쓴다**.')}</li>
      <li>${inl('**계산 풀이**(08·10)는 학습지 예시의 풀이 단계를 따라 읽고, 숫자를 바꾼 연습 문제를 공식대로 직접 푼다.')}</li>
      <li>${inl('대단원이 끝나면 **백지테스트**로 머릿속에 남은 것을 확인한다.')}</li>
      <li>${inl('쪽 아래의 **목표 시간**을 보고 시간을 재며 풀고, **걸린 시간과 채점 결과**를 적는다. 수업 때 선생님이 이 칸을 보고 도와준다.')}</li>
    </ol>
  </div></div></section>`;
}

// 정답 별책
function answerBook(blankAns) {
  const rows = [];
  for (const u of units) {
    rows.push(`<div class="row" data-keep="next"><div class="main"><div class="ans-u"><b>${esc(u.no)}</b> ${esc(u.title)}</div></div></div>`);
    u._secAns.forEach((g, k) => {
      const list = u._answers.slice(g.from, g.to).map((a, j) => `<span><i>${g.from + j + 1}</i>${inl(a)}</span>`).join('');
      rows.push(`<div class="row"${k === 0 ? ' data-keep="next"' : ''}><div class="main">${k === 0 ? '<div class="ans-sec"><h4>빈칸 테스트</h4></div>' : ''}<p class="ans-bk"><b>${g.no}</b>${list}</p></div></div>`);
    });
    rows.push(`<div class="row"><div class="main"><div class="ans-sec"><h4>O/X</h4><ol class="ans-ox">${u.ox.map(([, o, fix]) => `<li><b class="${o === 'O' ? 'o' : 'x'}">${o}</b>${fix ? ` ${inl(fix)}` : ''}</li>`).join('')}</ol></div></div></div>`);
    if (u.calc) {
      u.calc.practice.forEach((p, i) => {
        rows.push(`<div class="row"><div class="main"><div class="ans-sec"><h4>계산 연습 ${i + 1} · ${inl(p.title)}</h4><ol class="ans-steps">${p.steps.map((s) => `<li>${inl(s)}</li>`).join('')}</ol><p class="ans-fin"><b>답</b> ${inl(p.answer)}</p></div></div></div>`);
      });
    }
  }
  const bt = blankAns.map((b) => `<div class="row"><div class="main"><div class="ans-sec ans-btw"><h4>${esc(b.big)} 백지테스트 모범 답안 · ${esc(b.title)}</h4>${b.html}</div></div></div>`).join('\n');
  const btSec = bt ? `<section class="flow" data-kind="answers1" data-tab="답" data-head-left="${esc(headLeft)}" data-head-right="백지테스트 모범 답안">${bt}</section>` : '';
  return [`<section class="flow" data-kind="answers" data-tab="답" data-head-left="${esc(headLeft)}" data-head-right="정답과 해설(별책)"><div class="top"><div class="ans-cover"><span>${SERIES} 총정리 · ${esc(BOOK.school)}</span><h1>정답과 해설</h1><p>빈칸 테스트 정답 · O/X 정답과 고친 문장 · 계산 연습 풀이 · 백지테스트 모범 답안</p></div></div>${rows.join('\n')}</section>`, btSec];
}

const page = (title, sections, layout) => `<!doctype html>
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
<link rel="stylesheet" href="../../styles/mint.css">
</head>
<body class="theme-b theme-d theme-h sm mode-student">
<div id="book"></div>
<div id="source">${sections.join('\n')}</div>
<script>window.LAYOUT = ${JSON.stringify(layout)};</script>
<script>${readFileSync(join(ROOT, '../../textbook/lib/paginate.js'), 'utf8')}</script>
</body></html>`;

// ── 조립 ──
const bigs = [...new Set(units.map((u) => u.big))];
const blankAns = [];
const body = [];
for (const big of bigs) {
  for (const u of units.filter((x) => x.big === big)) body.push(...unitSections(u));
  if (!ONLY.length) body.push(...(await blankSections(big, blankAns)));
}
const appendList = (BOOK.append || []).filter((a) => existsSync(join(ROOT, a.file)));
const name = `${BOOK.school}-총정리${ONLY.length ? `-${ONLY.join('·')}` : ''}`;
const student = page(name, [coverPage(), guidePage(ONLY.length ? [] : bigs.filter((b) => BOOK.blank?.[b]), appendList), ...body],
  { cover: 1, guide: 1, sum: 1, blank: 1, ox: 2, calc: 1, bt: 1, soft: ['ox', 'calc'], softMin: 0.2, memoMin: 0.18, spreadMax: 4, memoTitle: '정리 노트', prompts: { sum: ['헷갈리는 개념을 내 말로 다시 적는다.'], blank: ['틀린 빈칸의 핵심어를 여기에 다시 써 본다.'], ox: ['틀린 O/X 문장을 바르게 고쳐 다시 써 본다.'], calc: ['풀이 과정을 여기에 적는다.'] } });
const answers = page(`${name}-정답`, answerBook(blankAns), { answers: 2, answers1: 1, memoMin: 2 });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 900, height: 1200 }, deviceScaleFactor: 2 });
let failed = false;
async function make(html, file, post) {
  const htmlPath = join(OUT, 'html', `${file}.html`);
  writeFileSync(htmlPath, html);
  const pg = await ctx.newPage();
  pg.on('pageerror', (e) => { console.error('페이지 오류:', e.message); failed = true; });
  await pg.goto(pathToFileURL(htmlPath).href);
  await pg.waitForFunction(() => window.PAGINATED === true, null, { timeout: 300000 });
  if (post) await pg.evaluate(post, units.map((u) => u.no));
  const info = await pg.evaluate(() => {
    const out = [];
    document.querySelectorAll('.page').forEach((p, i) => p.querySelectorAll('.slot').forEach((s) => { if (s.scrollHeight > s.clientHeight + 2) out.push(`${i + 1}쪽: 단 아래로 넘침`); }));
    return { pages: window.PAGES, warn: window.WARN, over: [...new Set(out)] };
  });
  if (info.over.length) console.warn(`${file} 넘침:\n  ${info.over.join('\n  ')}`);
  if (info.warn.length) console.warn(`${file} 경고:\n  ${info.warn.join('\n  ')}`);
  const pdf = join(OUT, `${file}.pdf`);
  await pg.pdf({ path: pdf, preferCSSPageSize: true, printBackground: true });
  if (wantPng) {
    const dir = join(OUT, 'png', file);
    rmSync(dir, { recursive: true, force: true });
    mkdirSync(dir, { recursive: true });
    const els = await pg.$$('.page');
    for (let i = 0; i < els.length; i++) await els[i].screenshot({ path: join(dir, `${two(i + 1)}.png`) });
  }
  await pg.close();
  return { pdf, pages: info.pages };
}

// 쪽마다 목표 시간·채점 칸, 옆 색인(중단원)
function postStudent(unitNos) {
  const step = Math.min(26, 210 / Math.max(unitNos.length + 1, 1));
  document.querySelectorAll('.page').forEach((pg) => {
    if (pg.classList.contains('page-cover')) return;
    let min = 0;
    let cnt = 0;
    pg.querySelectorAll('.row[data-min]').forEach((r) => { min += +r.dataset.min; cnt += +r.dataset.cnt; });
    const foot = pg.querySelector('.page-foot');
    const strip = foot.querySelector('.strip');
    if (strip) strip.remove();
    if (!pg.classList.contains('page-guide') && pg.querySelector('.row[data-min]')) {
      const goal = Math.max(1, Math.round(min));
      const box = document.createElement('div');
      box.className = 'sm-log';
      box.innerHTML = `<span class="g">목표 <b>${goal}</b>분</span><span>걸린 시간 <i></i>분</span>${cnt ? `<span>채점 <i></i>/ <b>${cnt}</b></span>` : '<span>읽기 <u>1</u><u>2</u><u>3</u></span>'}`;
      foot.insertBefore(box, foot.firstChild);
    }
    // 옆 색인: 중단원 번호가 아래로 내려가며
    const m = /^(\d\d) /.exec(pg.querySelector('.ph-right')?.textContent || '');
    const tab = pg.querySelector('.edge-tab');
    if (m && tab) {
      const k = unitNos.indexOf(m[1]);
      tab.classList.add('sm-tab');
      tab.style.top = `${30 + k * step}mm`;
      tab.innerHTML = `<span><b>${m[1]}</b></span>`;
    } else if (tab && pg.classList.contains('page-bt')) {
      tab.classList.add('sm-tab');
      tab.style.top = `${30 + unitNos.length * step}mm`;
      tab.innerHTML = '<span><small>백지</small></span>';
    }
  });
}

const s = await make(student, name, postStudent);
const a = await make(answers, `${name}-정답`, null);
// 맨 뒤에 붙일 PDF(모의고사 등)
if (appendList.length) {
  const tmp = join(OUT, `${name}-tmp.pdf`);
  execFileSync('pdfunite', [s.pdf, ...appendList.map((x) => join(ROOT, x.file)), tmp]);
  renameSync(tmp, s.pdf);
}
console.log(`${name}: 학생용 ${s.pages}쪽${appendList.length ? ` + 붙인 PDF ${appendList.map((x) => x.title).join(', ')}` : ''} → 총정리/out/${name}.pdf · 정답 별책 ${a.pages}쪽 → ${name}-정답.pdf`);
await browser.close();
if (failed) process.exit(1);
