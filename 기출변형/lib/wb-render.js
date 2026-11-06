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
// 발문 속 '<보기>'가 줄 끝에서 '<'만 남고 갈라지지 않게 한 덩어리로 묶는다
const keepBogi = (h) => h.replace(/(〈보기〉|&lt;보기&gt;|<보기>)/g, '<span style="white-space:nowrap">$1</span>');
export const LEVELS = ['상', '중상', '중', '하'];

// 문제 머리의 관련 개념: [2] → "개념 02 이름", [2, 5] → "개념 02·05"
function conceptLabel(q, unit) {
  const list = (Array.isArray(q.concept) ? q.concept : q.concept ? [q.concept] : []).map((n) => two(+n));
  if (!list.length || !unit) return '';
  if (list.length > 1) return `<span class="q-cc">개념 ${list.join('·')}</span>`;
  const c = unit.concepts.find((x) => x.no === list[0]);
  // 개념 이름이 길면 문제 머리가 두 줄로 꺾이므로 번호만 쓴다
  const t = c ? c.title.split(' — ')[0] : '';
  const room = 19 - String(q.level || '').length - String(q.type || '').length;
  return `<span class="q-cc">개념 ${list[0]}${t && t.length <= room ? `<em>${inl(t)}</em>` : ''}</span>`;
}

// 문항 하나 (opts.mock: 모의고사 — 난이도·개념 대신 배점)
export function questionHtml(q, n, { unit, mock, teacher } = {}) {
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
  const explain = `<div class="q-explain"><b>${teacher ? `${mock ? n : two(n)}번 ` : ''}정답 ${CIRCLED[q.answer - 1]}</b> ${inl(q.explain)}${q.note ? `<span class="aq-note"><b>보충 설명</b> ${inl(q.note)}</span>` : ''}</div>`;
  // 교사용: 해설을 문항 아래 따로 된 줄로 둔다(data-keep="card"). 한 단에 함께 들어가면 붙여 두고,
  // 문항+해설이 한 단보다 길면 해설만 다음 단으로 넘어간다(예전에는 한 덩어리라 단 아래로 넘쳤음).
  return `<div class="row row-q" data-qid="${esc(q.id)}"${teacher ? ' data-keep="card"' : ''}><div class="main"><div class="q${mock ? ' q-mock' : ''}">
    ${head}
    <div class="q-stem">${keepBogi(inl(q.stem))}${pts}</div>
    ${data ? `<div class="q-data">${data}</div>` : ''}
    ${bogi}${choices}
    ${teacher ? '' : explain}
  </div></div></div>${teacher ? `<div class="row row-qx"><div class="main"><div class="q q-x">${explain}</div></div></div>` : ''}`;
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
function toc(groups, headLeft = '승민T 통합사회 <b>기출변형 문제집</b>') {
  return `<section class="flow" data-kind="toc" data-head-left="${esc(headLeft)}" data-head-right="차례"><div class="top"><div class="band band-answers"><span class="band-title">차례</span></div></div>${groups
    .map((g) => `<div class="row" data-keep="next"><div class="main"><h3 class="wb-toc-h">${esc(g.label)}</h3></div></div><div class="row"><div class="main"><table class="wb-toc">${g.items
      .map(([name, n, id]) => `<tr><td>${esc(name)}</td><td class="n">${n}문항</td><td class="pg" data-pg="${esc(id)}"></td></tr>`)
      .join('')}</table></div></div>`)
    .join('')}<div class="row"><div class="main"><p class="wb-howto">${inl(
    '**문제 머리 읽는 법** — 번호 옆 글자는 난이도(**상 · 중상 · 중 · 하**), 오른쪽은 개념서의 관련 개념 번호와 문제 유형이다. 틀린 문제는 개념서의 같은 개념 번호로 돌아가 복습한다. 정답과 해설은 별책에 있다.',
  )}</p></div></div></section>`;
}

// ── 단원별 문제 ──
// sets: [{ unit: UNITS[key], qs: [...] }] (책 순서)
// mm(선택): MINIMAX 완성본 — { headLeft, title() → 속표지 HTML, subject(과목) → 과목 간지 HTML, chapter(대단원 key) → 대단원 간지 HTML }
//   과목 간지는 짝수 쪽(data-even), 대단원 간지는 홀수 쪽(data-odd) → 둘이 펼침면. 옛 안쪽 표지 대신 MINIMAX 속표지.
export function renderUnits(sets, { title, edition, mode, mm = null }) {
  const sections = [];
  const byBook = [];
  for (const s of sets) {
    const last = byBook[byBook.length - 1];
    if (last && last.book.key === s.unit.book) last.units.push(s);
    else byBook.push({ book: BOOKS[s.unit.book], units: [s] });
  }
  const total = sets.reduce((a, s) => a + s.qs.length, 0);
  if (mm?.title) sections.push(`<section class="flow" data-kind="mmtitle"><div class="top">${mm.title()}</div></section>`); // MINIMAX 속표지
  if (!mm) sections.push(cover({ title, sub: `2022 개정 교육과정 · 수능 대비 · 단원별 ${total}문항`, edition, parts: [...new Set(byBook.map((b) => b.book.subject))] }));
  sections.push(toc(byBook.map((b) => ({ label: `${b.book.subject} ${b.book.chapter.no}. ${b.book.chapter.title}`, items: b.units.map((s) => [`${s.unit.no} ${s.unit.title}`, s.qs.length, `u-${s.unit.key}`]) })), mm?.headLeft));
  const subStart = new Set(byBook.filter((b, bi) => bi === 0 || byBook[bi - 1].book.subject !== b.book.subject).map((b) => b.book.key)); // 과목이 시작하는 대단원
  for (const { book, units } of byBook) {
    if (mm) {
      if (subStart.has(book.key)) sections.push(`<section class="flow" data-kind="mmsub" data-even="1"><div class="top">${mm.subject(book.subject)}</div></section>`);
      sections.push(`<section class="flow" data-kind="mmdiv" data-odd="1" data-tab="${esc(book.chapter.no)}"><div class="top">${mm.chapter(book.key)}</div></section>`);
    }
    const headLeft = `${esc(book.subject)} <b>${esc(book.chapter.no)}. ${esc(book.chapter.title)}</b>`;
    units.forEach(({ unit, qs }, k) => {
      const attrs = `data-tab="${esc(book.chapter.no)}" data-head-left="${esc(headLeft)}" data-head-right="${esc(`${unit.no} ${unit.title}`)}"`;
      const top = `<div class="top">${k === 0 ? chapterHead(book, units) : ''}${unitBand(unit, qs)}</div>`;
      sections.push(`<section class="flow" data-kind="exam" data-unit="${esc(unit.key)}"${k === 0 ? ' data-nosoft="1"' : ''} ${attrs}>${top}${qs.map((q, i) => questionHtml(q, i + 1, { unit, teacher: mode === 'teacher' })).join('\n')}</section>`);
    });
  }
  return page(sections, { title, mode });
}

// ── 모의고사 ──
// mocks: [{ no, title, range, questions }]
// mx(선택, MAXIMIN 완성본 — build.mjs 2 mock mx): { title(), log(), round(m), headLeft }
//   옛 표지 대신 속표지 → 차례·성적 기록표(짝수 쪽) → 회차마다 간지(홀수 쪽) + 문제. 문항·순서는 그대로.
export function renderMocks(mocks, { title, edition, mode, mx = null }) {
  const sections = mx ? [] : [cover({ title, sub: `2022 개정 교육과정 · 2028 수능 통합사회 형식 · ${mocks.length}회`, edition, parts: mocks.map((m) => `${m.no}회 · ${m.range}`) })];
  if (mx) {
    sections.push(`<section class="flow" data-kind="mxtitle"><div class="top">${mx.title()}</div></section>`);
    sections.push(`<section class="flow" data-kind="mxlog" data-even="1" data-head-left="${mx.headLeft}" data-head-right="차례 · 성적 기록표"><div class="top">${mx.log()}</div></section>`);
  }
  for (const m of mocks) {
    if (mx) sections.push(`<section class="flow" data-kind="mxdiv" data-odd="1" data-tab="${m.no}회"><div class="top">${mx.round(m)}</div></section>`);
    const attrs = `data-tab="${m.no}회" data-head-left="${mx ? mx.headLeft : '승민T 통합사회 <b>실전 모의고사</b>'}" data-head-right="${esc(`${m.no}회 · ${m.range}`)}"`;
    const head = `<div class="top" id="m-${m.no}"><div class="wb-mock">
      <div class="wb-mock-l"><span>2022 개정 · 통합사회</span><b>실전 모의고사 ${m.no}회</b></div>
      <div class="wb-mock-r"><span>${esc(m.range)}</span><span>25문항 · 50점 · 권장 시간 30분</span><span>표시 없는 문항은 2점</span></div>
    </div></div>`;
    sections.push(`<section class="flow" data-kind="mock" ${attrs}>${head}${m.questions.map((q, i) => questionHtml(q, i + 1, { mock: true, teacher: mode === 'teacher' })).join('\n')}</section>`);
  }
  return page(sections, { title, mode });
}

// ── 정답과 해설 ──
// groups: [{ id, title, sub, qs, unit?, mock? }]
// mx(선택, MAXIMIN 정답과 해설 별책): { cover(), headLeft } — 옛 표지 대신 별책 속표지, 회차마다 한 묶음(엄지 색인 '1회'…)
export function renderAnswers(groups, { title, edition, mx = null }) {
  const sections = [mx ? `<section class="flow" data-kind="mxtitle"><div class="top">${mx.cover()}</div></section>` : cover({ title: `${title} 정답과 해설`, sub: '빠른 정답 · 오답 선지까지 풀이', edition, parts: [] })];
  const groupRows = (g) => {
    const rows = [];
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
      // 모의고사는 배점·단원만(유형까지 넣으면 머리 줄이 두 줄로 꺾임)
      const lv = `<span class="aq-lv lv-${esc(q.level)}">${esc(q.level)}</span>`;
      rows.push(`<div class="row row-ae"><div class="main"><div class="ans-q"><div class="aq-h"><span class="aq-no">${two(i + 1)}</span><span class="aq-a">${CIRCLED[q.answer - 1]}</span>${lv}<span class="aq-meta">${meta}${q.type && !g.mock ? `${meta ? ' · ' : ''}${esc(q.type)}` : ''}</span></div><p>${inl(q.explain)}</p>${q.note ? `<div class="aq-note"><b>보충 설명 · 개념서 밖 내용</b> ${inl(q.note)}</div>` : ''}</div></div></div>`);
    });
    return rows;
  };
  // 첫 묶음은 새 쪽에서(속표지 쪽은 그림이 쪽 전체를 덮으므로 이어 싣지 않는다)
  if (mx) groups.forEach((g, gi) => sections.push(`<section class="flow" data-kind="answers"${gi === 0 ? ' data-nosoft="1"' : ''} data-tab="${esc(g.tab)}" data-head-left="${mx.headLeft}" data-head-right="${esc(g.no)} · ${esc(g.title)}">${groupRows(g).join('\n')}</section>`));
  else sections.push(`<section class="flow" data-kind="answers" data-tab="답" data-head-left="승민T 통합사회 <b>기출변형 문제집</b>" data-head-right="정답과 해설">${groups.flatMap(groupRows).join('\n')}</section>`);
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
