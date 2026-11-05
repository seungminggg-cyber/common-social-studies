// 기출변형 문제집: 문항 → HTML
//
// 개념서(textbook)의 블록 그리기(block)·문장 표시(inl)·쪽 나누기(paginate.js)·시안 H 디자인을 그대로 쓰고,
// 문제집에 필요한 부분(표지, 차례, 단원 띠, 모의고사 머리, 빠른 정답, 해설)만 여기서 만든다.
import { block, inl } from '../../textbook/lib/render.js';
import { BOOKS, UNITS } from './units.js';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const CIRCLED = ['①', '②', '③', '④', '⑤'];
const GANADA = ['ㄱ', 'ㄴ', 'ㄷ', 'ㄹ', 'ㅁ'];
const two = (n) => String(n).padStart(2, '0');
export const LEVELS = ['상', '중상', '중', '하'];

// 문제 머리의 관련 개념: [2] → "개념 02 이름", [2, 5] → "개념 02·05"
function conceptLabel(q, unit) {
  const list = (Array.isArray(q.concept) ? q.concept : q.concept ? [q.concept] : []).map((n) => two(+n));
  if (!list.length || !unit) return '';
  if (list.length > 1) return `<span class="q-cc">개념 ${list.join('·')}</span>`;
  const c = unit.concepts.find((x) => x.no === list[0]);
  return `<span class="q-cc">개념 ${list[0]}${c ? `<em>${inl(c.title.split(' — ')[0])}</em>` : ''}</span>`;
}

// 문항 하나 (opts.mock: 모의고사 — 난이도·개념 대신 배점)
export function questionHtml(q, n, { unit, mock } = {}) {
  const short = q.choices.every((c) => String(c).length <= 9);
  const data = (q.data || []).map((d) => block(d)).join('');
  const bogi = q.bogi
    ? `<div class="bogi"><div class="bogi-t"><span>보기</span></div><ul>${q.bogi.map((x, i) => `<li><b>${GANADA[i]}.</b> <span>${inl(x)}</span></li>`).join('')}</ul></div>`
    : '';
  const choices = `<ol class="choices${short ? ' short' : ''}">${q.choices
    .map((c, i) => `<li class="${q.answer === i + 1 ? 'ok' : ''}"><span class="cn">${CIRCLED[i]}</span><span>${inl(c)}</span></li>`)
    .join('')}</ol>`;
  const pts = mock && q.points && q.points !== 2 ? ` <span class="q-pts">[${q.points}점]</span>` : '';
  const head = mock
    ? `<div class="q-head"><span class="q-no">${n}</span></div>`
    : `<div class="q-head"><span class="q-no">${two(n)}</span><span class="q-lv lv-${esc(q.level)}">${esc(q.level)}</span><span class="q-meta">${conceptLabel(q, unit)}${q.type ? `<span class="q-type">${esc(q.type)}</span>` : ''}</span></div>`;
  return `<div class="row row-q"><div class="main"><div class="q${mock ? ' q-mock' : ''}">
    ${head}
    <div class="q-stem">${inl(q.stem)}${pts}</div>
    ${data ? `<div class="q-data">${data}</div>` : ''}
    ${bogi}${choices}
    <div class="q-explain"><b>정답 ${CIRCLED[q.answer - 1]}</b> ${inl(q.explain)}</div>
  </div></div></div>`;
}

const lvCount = (qs) => LEVELS.map((l) => `${l} ${qs.filter((q) => q.level === l).length}`).join(' · ');

function unitBand(unit, qs) {
  return `<div class="band band-exam wb-band" id="u-${esc(unit.key)}"><span class="band-title">${esc(unit.no)} ${esc(unit.title)}</span><span class="band-sub">${qs.length}문항 · ${lvCount(qs)}</span></div>`;
}

// 대단원 첫머리(간지 대신 첫 쪽 위에 얹는 머리): 중단원 목록과 문항 수
function chapterHead(book, units) {
  return `<div class="wb-chap">
    <div class="wb-chap-no">${esc(book.chapter.no)}</div>
    <div class="wb-chap-t"><span>${esc(book.subject)}</span><h1>${esc(book.chapter.title)}</h1></div>
    <ul>${units.map(({ unit, qs }) => `<li><b>${esc(unit.no)}</b> ${esc(unit.title)} <i>${qs.length}문항</i></li>`).join('')}</ul>
  </div>`;
}

function cover({ title, sub, edition, parts }) {
  return `<section class="flow" data-kind="cover"><div class="top"><div class="cover wb-cover">
    <div class="cv-deco"><i></i><i></i><i></i></div>
    <div class="cv-brand">승민T 통합사회</div>
    <div class="cv-title">${esc(title)}</div>
    <div class="cv-sub">${esc(sub)}</div>
    <div class="cv-theme">${esc(edition)}</div>
    <div class="cv-unit">${parts.map(esc).join('<br>')}</div>
  </div></div></section>`;
}

// 차례: [{ label, items: [[이름, 문항 수, id]] }]
function toc(groups) {
  return `<section class="flow" data-kind="toc" data-head-left="승민T 통합사회 <b>기출변형 문제집</b>" data-head-right="차례"><div class="top"><div class="band band-answers"><span class="band-title">차례</span></div></div>${groups
    .map((g) => `<div class="row" data-keep="next"><div class="main"><h3 class="wb-toc-h">${esc(g.label)}</h3></div></div><div class="row"><div class="main"><table class="wb-toc">${g.items
      .map(([name, n, id]) => `<tr><td>${esc(name)}</td><td class="n">${n}문항</td><td class="pg" data-pg="${esc(id)}"></td></tr>`)
      .join('')}</table></div></div>`)
    .join('')}<div class="row"><div class="main"><p class="wb-howto">${inl(
    '**문제 머리 읽는 법** — 번호 옆 글자는 난이도(**상 · 중상 · 중 · 하**), 오른쪽은 개념서의 관련 개념 번호와 문제 유형이다. 틀린 문제는 개념서의 같은 개념 번호로 돌아가 복습한다. 정답과 해설은 별책에 있다.',
  )}</p></div></div></section>`;
}

// ── 단원별 문제 ──
// sets: [{ unit: UNITS[key], qs: [...] }] (책 순서)
export function renderUnits(sets, { title, edition, mode }) {
  const sections = [];
  const byBook = [];
  for (const s of sets) {
    const last = byBook[byBook.length - 1];
    if (last && last.book.key === s.unit.book) last.units.push(s);
    else byBook.push({ book: BOOKS[s.unit.book], units: [s] });
  }
  const total = sets.reduce((a, s) => a + s.qs.length, 0);
  sections.push(cover({ title, sub: `2022 개정 교육과정 · 수능 대비 · 단원별 ${total}문항`, edition, parts: [...new Set(byBook.map((b) => b.book.subject))] }));
  sections.push(toc(byBook.map((b) => ({ label: `${b.book.subject} ${b.book.chapter.no}. ${b.book.chapter.title}`, items: b.units.map((s) => [`${s.unit.no} ${s.unit.title}`, s.qs.length, `u-${s.unit.key}`]) }))));
  for (const { book, units } of byBook) {
    const headLeft = `${esc(book.subject)} <b>${esc(book.chapter.no)}. ${esc(book.chapter.title)}</b>`;
    units.forEach(({ unit, qs }, k) => {
      const attrs = `data-tab="${esc(book.chapter.no)}" data-head-left="${esc(headLeft)}" data-head-right="${esc(`${unit.no} ${unit.title}`)}"`;
      const top = `<div class="top">${k === 0 ? chapterHead(book, units) : ''}${unitBand(unit, qs)}</div>`;
      sections.push(`<section class="flow" data-kind="exam" ${attrs}>${top}${qs.map((q, i) => questionHtml(q, i + 1, { unit })).join('\n')}</section>`);
    });
  }
  return page(sections, { title, mode });
}

// ── 모의고사 ──
// mocks: [{ no, title, range, questions }]
export function renderMocks(mocks, { title, edition, mode }) {
  const sections = [cover({ title, sub: `2022 개정 교육과정 · 2028 수능 통합사회 형식 · ${mocks.length}회`, edition, parts: mocks.map((m) => `${m.no}회 · ${m.range}`) })];
  for (const m of mocks) {
    const attrs = `data-tab="${m.no}회" data-head-left="승민T 통합사회 <b>실전 모의고사</b>" data-head-right="${esc(`${m.no}회 · ${m.range}`)}"`;
    const head = `<div class="top" id="m-${m.no}"><div class="wb-mock">
      <div class="wb-mock-l"><span>2022 개정 · 통합사회</span><b>실전 모의고사 ${m.no}회</b></div>
      <div class="wb-mock-r"><span>${esc(m.range)}</span><span>25문항 · 50점 · 권장 시간 30분</span><span>표시 없는 문항은 2점</span></div>
    </div></div>`;
    sections.push(`<section class="flow" data-kind="mock" ${attrs}>${head}${m.questions.map((q, i) => questionHtml(q, i + 1, { mock: true })).join('\n')}</section>`);
  }
  return page(sections, { title, mode });
}

// ── 정답과 해설 ──
// groups: [{ id, title, sub, qs, unit?, mock? }]
export function renderAnswers(groups, { title, edition }) {
  const sections = [cover({ title: `${title} 정답과 해설`, sub: '빠른 정답 · 오답 선지까지 풀이', edition, parts: [] })];
  const rows = [];
  for (const g of groups) {
    rows.push(`<div class="row row-ah" data-keep="next"><div class="main"><div class="ans-unit"><b>${esc(g.no)}</b> ${esc(g.title)}</div></div></div>`);
    // 빠른 정답 (10개씩 한 줄)
    for (let i = 0; i < g.qs.length; i += 10) {
      const cells = g.qs.slice(i, i + 10).map((q, k) => `<span><b>${two(i + k + 1)}</b> ${CIRCLED[q.answer - 1]}</span>`).join('');
      rows.push(`<div class="row row-ac"${i + 10 < g.qs.length ? ' data-keep="next"' : ''}><div class="main"><div class="ans-check wb-quick"><div class="ans-list">${cells}</div></div></div></div>`);
    }
    g.qs.forEach((q, i) => {
      const meta = g.mock
        ? `${q.points || 2}점 · ${esc(UNITS[q.unit]?.book ? `${BOOKS[UNITS[q.unit].book].subject} ${UNITS[q.unit].no} ${UNITS[q.unit].title}` : '')}`
        : '';
      const lv = `<span class="aq-lv lv-${esc(q.level)}">${esc(q.level)}</span>`;
      rows.push(`<div class="row row-ae"><div class="main"><div class="ans-q"><div class="aq-h"><span class="aq-no">${two(i + 1)}</span><span class="aq-a">${CIRCLED[q.answer - 1]}</span>${lv}<span class="aq-meta">${meta}${q.type ? `${meta ? ' · ' : ''}${esc(q.type)}` : ''}</span></div><p>${inl(q.explain)}</p></div></div></div>`);
    });
  }
  sections.push(`<section class="flow" data-kind="answers" data-tab="답" data-head-left="승민T 통합사회 <b>기출변형 문제집</b>" data-head-right="정답과 해설">${rows.join('\n')}</section>`);
  return page(sections, { title: `${title} 정답과 해설`, mode: 'teacher' });
}

function page(sections, { title, mode }) {
  return `<!doctype html>
<html lang="ko"><head>
<meta charset="utf-8">
<title>${esc(title)}</title>
<link rel="stylesheet" href="../../../textbook/node_modules/@fontsource/noto-serif-kr/400.css">
<link rel="stylesheet" href="../../../textbook/node_modules/@fontsource/noto-serif-kr/600.css">
<link rel="stylesheet" href="../../../textbook/node_modules/font-kopubworld/css.local/all.css">
<style>
@font-face { font-family: 'Pretendard Variable'; font-weight: 45 920; font-style: normal; font-display: block;
  src: url('../../../textbook/node_modules/pretendard/dist/web/variable/woff2/PretendardVariable.woff2') format('woff2-variations'); }
</style>
<link rel="stylesheet" href="../../../textbook/themes/base.css">
<link rel="stylesheet" href="../../../textbook/themes/h.css">
<link rel="stylesheet" href="../../wb.css">
</head>
<body class="theme-b theme-d theme-h wb mode-${mode}">
<div id="book"></div>
<div id="source">${sections.join('\n')}</div>
<script>window.LAYOUT = __LAYOUT__;</script>
<script>__PAGINATE__</script>
</body></html>`;
}
