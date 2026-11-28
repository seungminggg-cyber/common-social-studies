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
import { ensureTerrain } from '../../textbook/lib/terrain.js';
import { blankPage } from './lib/blank.js';

const require = createRequire(import.meta.url);
const { chromium } = (() => { try { return require('playwright'); } catch { return require('/opt/node-tools/node_modules/playwright'); } })();
const ROOT = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const school = args[0] || 'inguk';
const wantPng = args.includes('png');
const ONLY = (args.find((a) => a.startsWith('only=')) || '').slice(5).split(',').filter(Boolean);
const OUT = join(ROOT, 'out');
mkdirSync(join(OUT, 'html'), { recursive: true });

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const two = (n) => String(n).padStart(2, '0');
const imp = async (f) => (await import(pathToFileURL(f).href)).default;

// ── 원고 모으기 ──
const CDIR = join(ROOT, 'content', school);
const BOOK = await imp(join(CDIR, 'book.js'));
const SERIES = BOOK.series || 'MINT'; // 시리즈 이름(강사 확인 전 제안: MINT 총정리)
const units = [];
const skipped = [];
for (const no of BOOK.units) {
  if (ONLY.length && !ONLY.includes(no)) continue;
  const f = join(CDIR, `${no}.js`);
  if (!existsSync(f)) { skipped.push(no); continue; }
  const u = await imp(f);
  const pf = join(CDIR, 'private', `${no}.js`);
  u.priv = existsSync(pf) ? await imp(pf) : null;
  // 켜고 끄는 묶음(예: 16 윤리 부분 opt: 'ethics'): book.js의 opt에서 false면 뺀다
  const on = (o) => !o || (BOOK.opt || {})[o] !== false;
  u.sum = u.sum.filter((x) => on(x.opt));
  u.ox = u.ox.filter((x) => on(x[3]));
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
const readMin = (html) => Math.max(0.5, html.replace(/<[^>]+>/g, '').length / 250); // 꼼꼼히 읽기(외우며): 1분에 약 250자
// 강사 결정(2026-11-28): 책을 PART 1 학습지 개념 총정리(빈칸 없는 정리) / PART 2 연습문제 총정리(학습지 문제 그대로 · O/X · 계산 풀이 · 백지테스트 · 백지도)로 나눈다. 빈칸판은 뺀다.
const CIRC = ['①', '②', '③', '④', '⑤'];
const band = (k, label, sub, id) => `<div class="sm-band"${id ? ` id="${id}"` : ''}><b>${two(k)}</b><span>${label}</span>${sub ? `<i>${sub}</i>` : ''}</div>`;

function unitOpener(u, part, id, items) {
  const ch = chapterOf(u);
  return `<div class="sm-open${part === 2 ? ' sm-open2' : ''}" id="${id}">
    <div class="sm-open-no"><span>${esc(ch.chapter.no)}. ${esc(ch.chapter.title)}</span><b>${esc(u.no)}</b></div>
    <div class="sm-open-t"><h2>${esc(u.title)}</h2><p>${part === 1 ? esc(u.source) : 'PART 2 연습문제 총정리'}</p></div>
  </div>`;
}
function sumRows(u) {
  return u.sum.map((s, i) => {
    const body = star(sumVersion(s.blocks).map(render).join(''));
    const head = `<div class="sm-h"><b>${two(i + 1)}</b><h3>${star(inl(s.h.replace(KEY, '$1')))}</h3><span class="sm-pg">${s.pg ? `학습지 ${esc(s.pg)}쪽` : '필수 개념 참고'}</span></div>`;
    return `<div class="row sm-row" data-min="${readMin(body).toFixed(2)}" data-cnt="0"><div class="main"><div class="sm-item">${head}${body}</div></div></div>`;
  }).join('\n');
}
// 학습지에 실린 문제(그대로, private/<중단원>.js의 problems)
function probRows(u) {
  return (u.priv?.problems || []).map((q, i) => {
    const data = (q.data || []).map(render).join('');
    const bogi = q.bogi ? `<div class="pq-bogi"><span>〈보기〉</span><ol>${q.bogi.map((x, k) => `<li><b>${'ㄱㄴㄷㄹ'[k]}.</b> ${inl(x)}</li>`).join('')}</ol></div>` : '';
    const short = q.choices && q.choices.every((c) => [...c].length <= 8);
    const choices = q.choices ? `<ol class="pq-ch${short ? ' pq-ch-short' : ''}">${q.choices.map((c, k) => `<li><b>${CIRC[k]}</b> ${inl(c)}</li>`).join('')}</ol>` : '';
    const fill = q.fill ? `<ol class="pq-fill">${q.fill.map((f) => `<li>${inl(f.replace(/___/g, '<<B>>')).replace(/&lt;&lt;B&gt;&gt;/g, '<span class="pq-blank"></span>')}</li>`).join('')}</ol>` : '';
    const n = q.fill ? q.fill.length : 1;
    return `<div class="row" data-min="${q.fill ? n * 0.5 : 2.5}" data-cnt="${n}"><div class="main"><div class="pq"><div class="cc-h"><span class="cc-tag">학습지 문제 ${i + 1}</span><span class="sm-pg">${esc(q.from)}</span></div>
      <p class="pq-stem">${inl(q.stem)}</p>${data}${bogi}${choices}${fill}</div></div></div>`;
  }).join('\n');
}
function oxRows(u) {
  return u.ox.map(([text], i) => `<div class="row ox-row" data-min="0.7" data-cnt="1"><div class="main"><div class="ox-q"><span class="ox-n">${i + 1}</span><span class="ox-t">${inl(text)}</span><span class="ox-b"><i>O</i><i>X</i></span><div class="ox-fix"><em>X라면 바르게 고쳐 쓰기</em><i></i></div></div></div></div>`).join('\n');
}
function calcRows(u) {
  const c = u.calc;
  const rows = [];
  rows.push(`<div class="row" data-keep="next" data-min="1" data-cnt="0"><div class="main"><div class="cc-formula"><b>공식 모음</b><ul>${c.formulas.map((f) => `<li>${inl(f)}</li>`).join('')}</ul></div></div></div>`);
  (u.priv?.examples || []).forEach((e, i) => {
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
const attrs = (u, part, kind) => `data-kind="${kind}" data-tab="${esc(u.big)}" data-head-left="${esc(headLeft)}" data-head-right="${esc(`${u.no} ${u.title} · ${part}`)}"`;
function sumSection(u) {
  return `<section class="flow" ${attrs(u, '학습지 개념 총정리', 'sum')}><div class="top">${unitOpener(u, 1, `u${u.no}-sum`, [`학습지 개념 총정리 ${u.sum.length}항목`])}</div>${sumRows(u)}</section>`;
}
function practiceSections(u) {
  const parts = [];
  const np = (u.priv?.problems || []).length;
  if (np) parts.push({ kind: 'prob', label: '학습지 문제', sub: `학습지에 실린 문제 그대로 ${np}개 · 정답과 풀이는 별책`, rows: probRows(u) });
  parts.push({ kind: 'ox', label: 'O/X', sub: `${u.ox.length}문항 · 맞으면 O, 틀리면 X에 표시하고 X는 바르게 고쳐 쓴다`, rows: oxRows(u) });
  if (u.calc) parts.push({ kind: 'calc', label: '계산 풀이', sub: '학습지 예시 → 단계별 풀이 → 숫자를 바꾼 연습', rows: calcRows(u) });
  return parts.map((p, k) => {
    const id = `u${u.no}-${p.kind}`;
    const top = k === 0 ? unitOpener(u, 2, id, parts.map((x) => x.label)) + band(k + 1, p.label, p.sub) : band(k + 1, p.label, p.sub, id);
    return `<section class="flow" ${attrs(u, p.label, p.kind)}${k === 0 ? ' data-nosoft="1"' : ''}><div class="top">${top}</div>${p.rows}</section>`;
  });
}
function partPage(no, title, lines) {
  return `<section class="flow" data-kind="part" data-tab="${no === 1 ? 'Ⅲ' : 'Ⅳ'}" data-head-left="${esc(headLeft)}" data-head-right="PART ${no}" id="part-${no}"><div class="top"><div class="sm-part"><span>PART ${two(no)}</span><h1>${title}</h1><ul>${lines.map((l) => `<li>${inl(l)}</li>`).join('')}</ul></div></div></section>`;
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
    <div class="sm-cv-parts"><span>PART 1 학습지 개념 총정리</span><span>PART 2 연습문제 총정리</span></div>
    <div class="cv-foot"><span>정답과 해설은 별책</span><span class="cv-name">이름 <i></i></span></div>
  </div></div></section>`;
}
function guidePage(bigs, appendList) {
  const cell = (id, on = true) => (on ? `<td><span data-pg="${id}"></span></td>` : '<td class="na">—</td>');
  const r1 = [];
  const r2 = [];
  let lastBig = '';
  const btRow = (big) => `<tr class="toc-bt"><td></td><td>${esc(big)} 대단원 백지테스트</td><td colspan="3"><span data-pg="blank-${esc(big)}"></span>쪽</td></tr>`;
  for (const u of units) {
    if (u.big !== lastBig) {
      if (lastBig && bigs.includes(lastBig)) r2.push(btRow(lastBig));
      lastBig = u.big;
      r1.push(`<tr class="toc-big"><td colspan="3">${esc(u.big)}. ${esc(BIG_TITLE[u.big] || '')}</td></tr>`);
      r2.push(`<tr class="toc-big"><td colspan="5">${esc(u.big)}. ${esc(BIG_TITLE[u.big] || '')}</td></tr>`);
    }
    r1.push(`<tr><td class="no">${esc(u.no)}</td><td>${esc(u.title)}</td>${cell(`u${u.no}-sum`)}</tr>`);
    r2.push(`<tr><td class="no">${esc(u.no)}</td><td>${esc(u.title)}</td>${cell(`u${u.no}-prob`, !!(u.priv?.problems || []).length)}${cell(`u${u.no}-ox`)}${cell(`u${u.no}-calc`, !!u.calc)}</tr>`);
  }
  if (lastBig && bigs.includes(lastBig)) r2.push(btRow(lastBig));
  for (const a of appendList) r2.push(`<tr class="toc-bt"><td></td><td>${esc(a.title)}</td><td colspan="3">${a.ans ? 'Ⅴ 백지테스트 뒤' : '책 맨 뒤'}</td></tr>`);
  return `<section class="flow" data-kind="guide" data-tab="Ⅲ" data-head-left="${esc(headLeft)}" data-head-right="차례"><div class="top"><div class="sm-guide">
    <h2>차례</h2>
    <div class="sm-toc2">
      <table class="sm-toc"><thead><tr><th colspan="2">PART 1 학습지 개념 총정리</th><th>쪽</th></tr></thead><tbody>${r1.join('')}</tbody></table>
      <table class="sm-toc"><thead><tr><th colspan="2">PART 2 연습문제 총정리</th><th>학습지 문제</th><th>O/X</th><th>계산</th></tr></thead><tbody>${r2.join('')}</tbody></table>
    </div>
  </div></div></section>`;
}

// 정답 별책
function answerBook(blankAns) {
  const rows = [];
  for (const u of units) {
    rows.push(`<div class="row" data-keep="next"><div class="main"><div class="ans-u"><b>${esc(u.no)}</b> ${esc(u.title)}</div></div></div>`);
    (u.priv?.problems || []).forEach((q, i) => {
      const ans = q.fill ? q.answer.map((x, k) => `${k + 1}) ${x}`).join(' / ') : CIRC[q.answer - 1];
      rows.push(`<div class="row"><div class="main"><div class="ans-sec"><h4>학습지 문제 ${i + 1} · ${esc(q.from)} <span class="ans-a">${inl(ans)}</span></h4>${q.steps ? `<ol class="ans-steps">${q.steps.map((x) => `<li>${inl(x)}</li>`).join('')}</ol>` : ''}</div></div></div>`);
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
  return [`<section class="flow" data-kind="answers" data-tab="답" data-head-left="${esc(headLeft)}" data-head-right="정답과 해설(별책)"><div class="top"><div class="ans-cover"><span>${SERIES} 총정리 · ${esc(BOOK.school)}</span><h1>정답과 해설</h1><p>학습지 문제 정답과 풀이 · O/X 정답과 고친 문장 · 계산 연습 풀이 · 백지테스트 모범 답안 · 백지도 정답</p></div></div>${rows.join('\n')}</section>`, btSec];
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
await ensureTerrain(units.map((u) => u.sum)); // 지형도 바탕(없을 때만 만듦)
const bigs = [...new Set(units.map((u) => u.big))];
const blankAns = [];
const body = [partPage(1, '학습지 개념 총정리', ['★ = 학교 선생님 필기·강조, **학습지 ○쪽** = 학습지 위치, **필수 개념 참고** = 학습지 밖 시험 범위'])];
for (const u of units) body.push(sumSection(u));
body.push(partPage(2, '연습문제 총정리', ['중단원마다 학습지 문제(그대로) → O/X → 계산 풀이', '대단원 끝 백지테스트, 맨 끝 Ⅳ·Ⅴ 백지도', '정답과 풀이는 별책']));
for (const big of bigs) {
  for (const u of units.filter((x) => x.big === big)) body.push(...practiceSections(u));
  if (!ONLY.length) body.push(...(await blankSections(big, blankAns)));
}
// 백지도(Ⅳ·Ⅴ 나라 위치, 백지도 채팅의 학교판 PDF): book.blankMap이 켜져 있고 파일이 있으면 본문 뒤(붙일 PDF 앞)에 넣는다
const BM = BOOK.blankMap && !ONLY.length ? { title: 'Ⅳ·Ⅴ 백지도(나라 위치)', file: `out/append/백지도_${BOOK.school}_학생용.pdf`, ans: `out/append/백지도_${BOOK.school}_정답.pdf` } : null;
if (BM && !existsSync(join(ROOT, BM.file))) console.warn(`백지도 PDF 없음: ${BM.file} (README의 '백지도' 참고)`);
const appendList = [...(BM && existsSync(join(ROOT, BM.file)) ? [BM] : []), ...(BOOK.append || []).filter((a) => existsSync(join(ROOT, a.file)))];
const name = `${BOOK.school}-총정리${ONLY.length ? `-${ONLY.join('·')}` : ''}`;
const student = page(name, [coverPage(), guidePage(ONLY.length ? [] : bigs.filter((b) => BOOK.blank?.[b]), appendList), ...body],
  { cover: 1, guide: 1, part: 1, sum: 1, prob: 1, ox: 2, calc: 1, bt: 1, soft: ['prob', 'ox', 'calc'], softMin: 0.2, memoMin: 0.18, spreadMax: 4, memoTitle: '정리 노트', prompts: { sum: ['헷갈리는 개념을 내 말로 다시 적는다.'], prob: ['풀이 과정과 헷갈린 선지를 적는다.'], ox: ['틀린 O/X 문장을 바르게 고쳐 다시 써 본다.'], calc: ['풀이 과정을 여기에 적는다.'] } });
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
const bmAns = appendList.find((x) => x.ans && existsSync(join(ROOT, x.ans)));
if (bmAns) {
  const tmp = join(OUT, `${name}-정답-tmp.pdf`);
  execFileSync('pdfunite', [a.pdf, join(ROOT, bmAns.ans), tmp]);
  renameSync(tmp, a.pdf);
}
console.log(`${name}: 학생용 ${s.pages}쪽${appendList.length ? ` + 붙인 PDF ${appendList.map((x) => x.title).join(', ')}` : ''} → 총정리/out/${name}.pdf · 정답 별책 ${a.pages}쪽 → ${name}-정답.pdf`);
await browser.close();
if (failed) process.exit(1);
