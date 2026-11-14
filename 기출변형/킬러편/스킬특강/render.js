// MINIMAX 킬러편 스킬특강 교재: 스킬 내용(content/skills.js) + 킬러편 문항(content/k, id로 불러옴) → HTML
//
// 구성: 표지 → 차례 → 00 스킬 지도 → 스킬마다 [스킬 카드(문항 모양·풀이 순서·빠른 풀이·함정) · 대표 예제(문항 + 스킬대로 풀기) · 요약 카드 · 연습 문항]
// 예시문항 특강 교재(../../특강)의 쪽 틀·카드 모양(sp.css)과 문제집의 문항 그리기를 그대로 쓰고, 스킬특강에만 있는 것은 sk.css에 둔다.
// 책 속 설명 문장은 '-이다/-한다'로 끝낸다.
import { block, inl } from '../../../textbook/lib/render.js';
import { questionHtml } from '../../lib/wb-render.js';
import { UNITS, BOOKS } from '../../lib/units.js';
import { page as spPage } from '../../특강/render.js';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const CIRCLED = ['①', '②', '③', '④', '⑤'];
const two = (n) => String(n).padStart(2, '0');
export const TITLE = 'MINIMAX 킬러편 스킬특강';
const HEAD = `승민T 통합사회 <b>${TITLE}</b>`;

const unitOf = (q) => UNITS[q.id.slice(0, 5)];
// 킬러편에서의 자리: '통합사회2 14 단원'
const whereOf = (q) => { const u = unitOf(q); return `${BOOKS[u.book].subject} ${u.no} 단원`; };
const kNo = (q, knum) => (knum[q.id] ? ` · 킬러편 ${knum[q.id]}번` : '');

function cover({ sub, edition, parts }) {
  return `<section class="flow" data-kind="cover"><div class="top"><div class="cover wb-cover sp-cover sk-cover">
    <div class="cv-deco"><i></i><i></i><i></i></div>
    <div class="cv-brand">승민T 통합사회 · 2028 수능 대비</div>
    <div class="cv-title">MINIMAX 킬러편<br>스킬특강</div>
    <div class="cv-sub">${esc(sub)}</div>
    <div class="cv-theme">${esc(edition)}</div>
    <div class="cv-unit">${parts.map(esc).join('<br>')}</div>
  </div></div></section>`;
}

function toc(SKILLS) {
  const rows = [
    ['00', '스킬 지도 · 이 책을 쓰는 법', '', 'sk-intro'],
    ...SKILLS.map((s) => [s.no, s.title, `예제 ${s.examples.length} · 연습 ${s.practice.length}`, `sk-${s.no}`]),
  ];
  return `<section class="flow" data-kind="toc" data-head-left="${esc(HEAD)}" data-head-right="차례"><div class="top"><div class="band band-answers"><span class="band-title">차례</span></div></div>
  <div class="row"><div class="main"><table class="wb-toc sp-toc">${rows
    .map(([no, name, n, id]) => `<tr><td class="no">${esc(no)}</td><td>${inl(name)}</td><td class="n">${esc(n)}</td><td class="pg" data-pg="${esc(id)}"></td></tr>`).join('')}</table></div></div>
  <div class="row"><div class="main"><p class="wb-howto">${inl(
    '**이 책의 구성** — 킬러편 200문항 가운데 풀이 방법이 같은 문항을 열 묶음으로 다시 모았다. 단원이 달라도 문항의 모양이 같으면 푸는 순서가 같다. 스킬마다 **스킬 카드**(문항 모양 · 풀이 순서 · 빠른 풀이 · 함정)를 읽고, **대표 예제**에서 그 순서를 그대로 따라 풀어 본 뒤, **연습 문항**을 시간을 재고 푼다. 문제 머리의 단원 번호와 개념 번호는 개념서(MINIMAP)와 같다.',
  )}</p></div></div></section>`;
}

// ── 00 스킬 지도 ──
function intro(SKILLS, INTRO, qmap, knum) {
  const rows = [];
  const R = (html, keep) => rows.push(`<div class="row"${keep ? ' data-keep="next"' : ''}><div class="main">${html}</div></div>`);
  R(block({ t: 'sec', mark: '1', title: '킬러 문항은 왜 어려운가' }), true);
  R(`<table class="kv sp-trend"><tbody>${INTRO.why.map(([k, v], i) => `<tr><th><span>${i + 1}. ${inl(k)}</span></th><td>${inl(v)}</td></tr>`).join('')}</tbody></table>`);
  R(block({ t: 'sec', mark: '2', title: '스킬 열 가지 한눈에' }), true);
  R(`<div class="tbl-wrap sp-map sk-map"><table class="tbl compact"><thead><tr><th>스킬</th><th>이름</th><th>한 줄 요약</th><th>문항</th></tr></thead><tbody>${SKILLS
    .map((s) => `<tr><td>${s.no}</td><td class="l"><b>${inl(s.title)}</b></td><td class="l">${inl(s.one)}</td><td>${s.examples.length + s.practice.length}</td></tr>`).join('')}</tbody></table></div>`);
  R(block({ t: 'sec', mark: '3', title: '어느 스킬에서나 통하는 다섯 가지' }), true);
  R(`<table class="kv sp-trend"><tbody>${INTRO.common.map(([k, v], i) => `<tr><th><span>${i + 1}. ${inl(k)}</span></th><td>${inl(v)}</td></tr>`).join('')}</tbody></table>`);
  R(block({ t: 'sec', mark: '4', title: '이 책으로 공부하는 순서' }), true);
  R(block({ t: 'kv', rows: INTRO.how }));
  return `<section class="flow" data-kind="intro" data-tab="안내" data-head-left="${esc(HEAD)}" data-head-right="스킬 지도"><div class="top" id="sk-intro">
    <div class="sp-open"><div class="sp-open-no">00</div><div class="sp-open-t"><span>MINIMAX 킬러편 200문항 · 풀이 방법으로 다시 묶기</span><h1>스킬 지도</h1>
    <p>${inl(INTRO.lead)}</p></div></div></div>${rows.join('\n')}</section>`;
}

// ── 스킬 카드 ──
function skillCard(s) {
  return `<div class="row sp-strat-row" data-keep="card"><div class="main"><div class="sp-strat sk-card">
    <div class="sk-shape"><span class="sp-k">이런 문항에 쓴다</span><ul>${s.shape.map((x) => `<li>${inl(x)}</li>`).join('')}</ul></div>
    <ol class="sp-strat-steps">${s.steps.map(([a, b], i) => `<li><span class="n">STEP ${i + 1}</span><b>${inl(a)}</b><span>${inl(b)}</span></li>`).join('')}</ol>
    <div class="sp-strat-tr sk-fast"><span class="sp-k">빠른 풀이</span><ul>${s.fast.map(([k, v]) => `<li><b>${inl(k)}</b> ${inl(v)}</li>`).join('')}</ul></div>
    <div class="sp-strat-tr"><span class="sp-k red">함정</span><ul>${s.traps.map(([k, v]) => `<li><b>${inl(k)}</b> ${inl(v)}</li>`).join('')}</ul></div>
  </div></div></div>`;
}

// ── 대표 예제: 왼쪽에 문항, 오른쪽에 스킬대로 풀기 ──
function exampleCard(s, ex, i, q, teacher, knum) {
  const html = questionHtml(q, i + 1, { unit: unitOf(q), teacher: false });
  const inner = html.slice(html.indexOf('<div class="q'), html.lastIndexOf('</div></div>'));
  const board = teacher
    ? `<div class="sp-judge sk-board"><div class="sp-k">판서 노트 · 정답 ${CIRCLED[q.answer - 1]}</div><p>${inl(q.explain)}</p></div>`
    : '';
  return `<div class="row row-item sp-card-row sk-ex-row" data-keep="card" data-qid="${esc(q.id)}"><div class="main"><div class="sp-card sk-ex">
    <div class="sp-card-h"><span class="sp-ex"><small>예제</small>${i + 1}</span><div class="sp-card-t"><b>${inl(ex.title)}</b><span>${esc(whereOf(q))}${esc(kNo(q, knum))} · ${esc(q.type)}</span></div><span class="sp-tag">스킬 ${s.no}</span>${teacher ? `<span class="sp-ans">정답 ${CIRCLED[q.answer - 1]}</span>` : ''}</div>
    <div class="sk-ex-g"><div class="sk-ex-q">${inner}</div>
    <div class="sk-ex-s"><div class="sp-grid sp-grid-side">
      <div class="sp-k em">먼저 볼 곳</div><div class="sp-v em">${inl(ex.see)}</div>
      <div class="sp-k">스킬대로 풀기</div><div class="sp-v"><ol class="sp-steps">${ex.solve.map((x) => `<li>${inl(x)}</li>`).join('')}</ol></div>
      <div class="sp-k">빠른 풀이</div><div class="sp-v">${inl(ex.fast)}</div>
      <div class="sp-k red">함정</div><div class="sp-v">${inl(ex.trap)}</div>
    </div>${board}</div></div>
  </div></div></div>`;
}

function summaryCard(s) {
  return `<div class="row sk-sum-row" data-keep="card"><div class="main"><div class="sk-sum">
    <div class="sk-sum-h"><b>스킬 ${s.no} 요약 카드</b><span>${inl(s.title)}</span></div>
    <ul>${s.card.map((c) => `<li>${inl(c)}</li>`).join('')}</ul>
  </div></div></div>`;
}

function skillSections(s, qmap, teacher, knum) {
  const attrs = `data-tab="${esc(s.no)}" data-head-left="${esc(`스킬 ${s.no} <b>${s.title}</b>`)}" data-head-right="${esc(TITLE)}"`;
  const top = `<div class="top" id="sk-${s.no}"><div class="sp-open sp-chap"><div class="sp-open-no">${esc(s.no)}</div><div class="sp-open-t"><span>스킬 ${esc(s.no)} · 예제 ${s.examples.length} · 연습 ${s.practice.length}</span><h1>${inl(s.title)}</h1>
    <p>${inl(s.one)}</p></div></div><div class="sp-intent sk-lead">${inl(s.lead)}</div></div>`;
  const exHead = `<div class="row" data-keep="next"><div class="main">${block({ t: 'sec', mark: '예제', title: '대표 예제 — 스킬 순서대로 따라 풀기' })}</div></div>`;
  const exs = s.examples.map((ex, i) => exampleCard(s, ex, i, qmap[ex.id], teacher, knum));
  const out = [`<section class="flow" data-kind="type" ${attrs}>${top}${skillCard(s)}${exHead}${exs.join('\n')}${summaryCard(s)}</section>`];
  const qs = s.practice.map((id) => qmap[id]);
  const band = `<div class="top"><div class="band band-exam wb-band" id="p-${s.no}"><span class="band-title">스킬 ${esc(s.no)} 연습 문항</span><span class="band-sub">${qs.length}문항 · 권장 시간 ${Math.round(qs.length * 2.5)}분</span></div></div>`;
  out.push(`<section class="flow" data-kind="exam" ${attrs}>${band}${qs.map((q, i) => questionHtml(q, s.examples.length + i + 1, { unit: unitOf(q), teacher })).join('\n')}</section>`);
  return out;
}

function quick(SKILLS, qmap) {
  const line = (s) => `<div class="row row-ac"><div class="main"><div class="ans-check wb-quick"><div class="sp-q-l">스킬 ${esc(s.no)} ${inl(s.title)}</div><div class="ans-list">${[...s.examples.map((e) => e.id), ...s.practice]
    .map((id, i) => `<span><b>${i < s.examples.length ? `예${i + 1}` : two(i + 1)}</b> ${CIRCLED[qmap[id].answer - 1]}</span>`).join('')}</div></div></div></div>`;
  return `<section class="flow" data-kind="answers" data-tab="답" data-head-left="${esc(HEAD)}" data-head-right="빠른 정답"><div class="top"><div class="band band-answers"><span class="band-title">빠른 정답</span></div></div>
    ${SKILLS.map(line).join('\n')}</section>`;
}

export function renderSkill({ SKILLS, INTRO, qmap, knum }, { mode }) {
  const teacher = mode === 'teacher';
  const n = SKILLS.reduce((a, s) => a + s.examples.length + s.practice.length, 0);
  const sections = [cover({
    sub: '같은 모양의 킬러 문항을 한 가지 순서로 — 스킬 카드 → 대표 예제 → 연습',
    edition: teacher ? '교사용 · 판서 노트와 해설 포함' : '학생용',
    parts: [`스킬 ${SKILLS.length}가지`, `대표 예제 ${SKILLS.reduce((a, s) => a + s.examples.length, 0)} · 연습 ${SKILLS.reduce((a, s) => a + s.practice.length, 0)} (킬러편 ${n}문항)`],
  })];
  sections.push(toc(SKILLS));
  sections.push(intro(SKILLS, INTRO, qmap, knum));
  for (const s of SKILLS) sections.push(...skillSections(s, qmap, teacher, knum));
  if (teacher) sections.push(quick(SKILLS, qmap));
  return spPage(sections, { title: `${TITLE}${teacher ? ' (교사용)' : ''}`, mode })
    .replace('</head>', '<link rel="stylesheet" href="../../킬러편/스킬특강/sk.css"></head>').replace('class="theme-b', 'class="sk theme-b');
}
