// 2028 예시문항 특강 교재: 분석 내용 + 연습 문항 → HTML
//
// 구성(강사 요청 2026-11-07): 개념서 단원 순서(통합사회1 Ⅰ~Ⅴ → 통합사회2 Ⅰ~Ⅴ)
//   표지 → 차례 → 00 예시문항 한눈에 → 풀이 전략 7가지(짧게) → 대단원마다 [출제 포인트 · 예시문항 분석 카드 · 연습 문항] → 쌍둥이 세트
// 문제집(../lib/wb-render.js)의 문항 그리기와 개념서의 블록 그리기·쪽 나누기·시안 H를 그대로 쓰고,
// 특강에만 있는 부분(안내 쪽, 전략 카드, 대단원 머리, 예시문항 분석 카드, 쌍둥이 세트 머리)만 여기서 만든다.
// 책 속 설명 문장은 '-이다/-한다'로 끝낸다('-하자' 말투를 쓰지 않음, 강사 요청).
import { block, inl } from '../../textbook/lib/render.js';
import { questionHtml } from '../lib/wb-render.js';
import { UNITS, BOOKS } from '../lib/units.js';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const CIRCLED = ['①', '②', '③', '④', '⑤'];
const GANADA = ['ㄱ', 'ㄴ', 'ㄷ', 'ㄹ', 'ㅁ'];
const two = (n) => String(n).padStart(2, '0');
export const TITLE = '2028 수능 예시문항 완전 분석';
const HEAD = `승민T 통합사회 <b>${TITLE}</b>`;

const subNo = (bookKey) => bookKey[1]; // 't2-3' → '2'
const tabOf = (bookKey) => `${subNo(bookKey)}·${BOOKS[bookKey].chapter.no}`; // 엄지 색인: '1·Ⅲ'
const chapName = (bookKey) => `${BOOKS[bookKey].subject} ${BOOKS[bookKey].chapter.no}. ${BOOKS[bookKey].chapter.title}`;
const unitShort = (k) => { const u = UNITS[k]; return u ? `통사${subNo(u.book)} ${BOOKS[u.book].chapter.no}-${u.no}` : k; };
// 관련 개념: '05 단원 개념 02·03'
const conceptRef = (units) => units.map(([k, cs]) => `${UNITS[k].no} 단원 개념 ${cs.map(two).join('·')}`).join(' / ');
const typeOf = (TYPES, no) => TYPES.find((t) => t.items.includes(no));
const shortTitle = (t) => t.title.split(' — ')[0];

function cover({ title, sub, edition, parts }) {
  return `<section class="flow" data-kind="cover"><div class="top"><div class="cover wb-cover sp-cover">
    <div class="cv-deco"><i></i><i></i><i></i></div>
    <div class="cv-brand">승민T 통합사회 · 예비 고3 겨울 특강</div>
    <div class="cv-title">${esc(title)}</div>
    <div class="cv-sub">${esc(sub)}</div>
    <div class="cv-theme">${esc(edition)}</div>
    <div class="cv-unit">${parts.map(esc).join('<br>')}</div>
  </div></div></section>`;
}

function toc(CHAPTERS, practice, nSet) {
  const rows = [
    ['00', '수업 안내 · 예시문항 25문항 한눈에', '', 'sp-intro'],
    ['', '풀이 전략 7가지', '유형별 출제 의도 · 풀이 순서 · 함정', 'sp-strat'],
    ...CHAPTERS.map((c) => [tabOf(c.key), chapName(c.key),
      `${c.items.length ? `예시 ${c.items.join('·')}번` : '예시문항 없음(학평 1번)'} · 연습 ${practice[c.key].length}문항`, `c-${c.key}`]),
    ['', '예시문항 쌍둥이 세트 (전 범위)', `${nSet}문항 · 50점`, 'sp-set'],
  ];
  return `<section class="flow" data-kind="toc" data-head-left="${esc(HEAD)}" data-head-right="차례"><div class="top"><div class="band band-answers"><span class="band-title">차례</span></div></div>
  <div class="row"><div class="main"><table class="wb-toc sp-toc">${rows
    .map(([no, name, n, id]) => `<tr><td class="no">${esc(no)}</td><td>${esc(name)}</td><td class="n">${esc(n)}</td><td class="pg" data-pg="${esc(id)}"></td></tr>`).join('')}</table></div></div>
  <div class="row"><div class="main"><p class="wb-howto">${inl(
    '**이 책의 구성** — 예시문항 25문항을 개념서(MINIMAP)의 단원 순서대로 싣는다. 실제 시험지도 대체로 이 순서로 문항을 놓으므로, 시험지를 앞에서부터 푸는 흐름과 겨울 특강에서 단원을 배우는 순서가 같다. 앞쪽의 **풀이 전략 7가지**는 문항 모양별 풀이법이고, 각 문항 분석 카드의 “전략 NN” 표시를 보고 해당 전략으로 돌아가 다시 읽는다. 대단원 끝의 **연습 문항**은 같은 단원·같은 모양의 새 문항이다. 문항 머리의 “개념 NN”은 개념서의 같은 단원 개념 번호이다.',
  )}</p></div></div></section>`;
}

// ── 00 안내: 예시문항 한눈에 ──
function intro(TYPES, ITEMS, OVERVIEW, teacher) {
  const rows = [];
  const R = (html, keep) => rows.push(`<div class="row"${keep ? ' data-keep="next"' : ''}><div class="main">${html}</div></div>`);
  R(block({ t: 'sec', mark: '1', title: '2028 수능 통합사회, 무엇이 달라졌나' }), true);
  R(`<table class="kv sp-trend"><tbody>${OVERVIEW.trends.map(([k, v], i) => `<tr><th><span>${i + 1}. ${inl(k)}</span></th><td>${inl(v)}</td></tr>`).join('')}</tbody></table>`);
  const keys = ['1-Ⅰ', '1-Ⅱ', '1-Ⅲ', '1-Ⅳ', '1-Ⅴ', '2-Ⅰ', '2-Ⅱ', '2-Ⅲ', '2-Ⅳ', '2-Ⅴ'];
  const cnt = Object.fromEntries(keys.map((k) => [k, 0]));
  for (const it of Object.values(ITEMS)) {
    const u = UNITS[it.units[0][0]];
    cnt[`${subNo(u.book)}-${BOOKS[u.book].chapter.no}`] += 1;
  }
  const fmt = () => Object.entries(OVERVIEW.points).map(([p, l]) => `${p}점 ${l.length}문항`).join(' · ');
  R(block({ t: 'sec', mark: '2', title: '대단원별 문항 수와 배점' }), true);
  R(`<div class="sp-two">${block({
    t: 'chart', kind: 'bar', title: '대단원별 문항 수 (25문항)', h: 210,
    categories: keys.map((k) => k.replace('1-', '통1 ').replace('2-', '통2 ')),
    series: [{ name: '문항 수', values: keys.map((k) => cnt[k]) }],
    y: { min: 0, max: 5, step: 1, label: '(문항)' },
    note: '통합사회1 9문항 : 통합사회2 16문항. 통합사회1 Ⅰ단원(통합적 관점)은 예시문항에 없다.',
    source: '자료: 2028학년도 수능 예시문항(한국교육과정평가원) 분류',
  })}<div class="sp-facts">${block({ t: 'kv', rows: [
    ['배점', `${fmt()} = 50점`],
    ['형식', '옳은 것 15 · <보기> 고르기 7(“적어도 한 사람” 1 포함) · 옳지 않은 것 2 · 빈칸 1'],
    ['자료', '지도·그래프·표 13문항, 사료·문서 4문항, 사상가 제시문 6문항'],
    ['시간', '30분 · 25문항 → 한 문항 평균 72초. 2.5점 8문항에 시간을 더 쓴다.'],
  ] })}</div></div>`);
  R(block({ t: 'sec', mark: '3', title: '25문항 지도 — 번호 · 단원 · 풀이 전략' }), true);
  const head = ['번호', '배점', '단원', '주제', '형식', '전략', ...(teacher ? ['정답'] : [])];
  const body = Object.entries(ITEMS).map(([no, it]) => {
    const t = typeOf(TYPES, +no);
    return [`${no}`, `${it.pts}`, unitShort(it.units[0][0]), it.topic.split(' — ')[0], it.form.replace(/ \(.*\)/, ''), `${t.no}`, ...(teacher ? [CIRCLED[it.ans - 1]] : [])];
  });
  R(`<div class="tbl-wrap sp-map"><table class="tbl compact"><thead><tr>${head.map((h) => `<th>${h}</th>`).join('')}</tr></thead><tbody>${body
    .map((r) => `<tr>${r.map((c, i) => `<td class="${i === 3 ? 'l' : ''}">${inl(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>
    <div class="fig-foot"><span class="fig-note">${inl(`전략: ${TYPES.map((t) => `${t.no} ${shortTitle(t)}`).join(' · ')}`)}</span></div></div>`);
  R(block({ t: 'sec', mark: '4', title: '특강 운영 예시 (3시간)' }), true);
  R(block({ t: 'kv', rows: [
    ['0:00~0:35', '예시문항 원문(평가원 공개 PDF)을 30분 동안 실전처럼 풀고 채점한다. 틀린 번호는 위 표에 동그라미 친다.'],
    ['0:35~0:55', '풀이 전략 7가지를 훑는다. 틀린 문항이 어느 전략에 속하는지 표시한다.'],
    ['0:55~2:20', '통합사회1 Ⅰ단원부터 통합사회2 Ⅴ단원까지 차례로 문항 분석 카드를 읽고, 대단원 끝 연습 문항을 2~3개씩 바로 푼다.'],
    ['2:20~3:00', '쌍둥이 세트는 숙제(30분 재고 풀기)로 내거나 남은 시간에 절반을 푼다. 다음 시간에 정답과 해설(별책)로 오답을 정리한다.'],
  ] }));
  return `<section class="flow" data-kind="intro" data-tab="안내" data-head-left="${esc(HEAD)}" data-head-right="수업 안내 · 예시문항 한눈에"><div class="top" id="sp-intro">
    <div class="sp-open"><div class="sp-open-no">00</div><div class="sp-open-t"><span>2028학년도 대학수학능력시험 · 사회탐구 영역(통합사회)</span><h1>예시문항 25문항 한눈에</h1>
    <p>${inl('예시문항은 2028 수능의 **설계도**이다. 단원·배점·형식·자료의 모양을 먼저 익혀 두면 실제 시험에서 낯선 문항이 줄어든다.')}</p></div></div></div>${rows.join('\n')}</section>`;
}

// ── 풀이 전략 7가지 (유형별 출제 의도·풀이 순서·함정을 한 장씩 짧게) ──
function strategies(TYPES) {
  const cards = TYPES.map((t) => `<div class="row sp-strat-row" data-keep="card" id="s-${t.key}"><div class="main"><div class="sp-strat">
    <div class="sp-strat-h"><span class="sp-ex"><small>전략</small>${t.no}</span><div class="sp-card-t"><b>${inl(shortTitle(t))}</b><span>예시문항 ${t.items.map((n) => `${n}번`).join(' · ')}</span></div></div>
    <p class="sp-strat-i">${inl(t.intent)}</p>
    <ol class="sp-strat-steps">${t.steps.map(([a, b], i) => `<li><span class="n">STEP ${i + 1}</span><b>${inl(a)}</b><span>${inl(b)}</span></li>`).join('')}</ol>
    <div class="sp-strat-tr"><span class="sp-k red">함정</span><ul>${t.traps.map(([k, v]) => `<li><b>${inl(k)}</b> ${inl(v)}</li>`).join('')}</ul></div>
    <div class="sp-strat-ck"><span class="sp-k">점검</span>${t.check.map((c) => `<span><i></i>${inl(c)}</span>`).join('')}</div>
  </div></div></div>`);
  return `<section class="flow" data-kind="type" data-tab="안내" data-head-left="${esc(HEAD)}" data-head-right="풀이 전략 7가지"><div class="top" id="sp-strat">
    <div class="sp-open"><div class="sp-open-no">✓</div><div class="sp-open-t"><span>문항의 모양에 따라 푸는 법</span><h1>풀이 전략 7가지</h1>
    <p>${inl('예시문항 25문항은 일곱 가지 모양으로 나뉜다. 단원이 달라도 모양이 같으면 푸는 순서가 같다. 뒤의 문항 분석 카드에 붙은 “전략 NN”이 이 쪽의 번호이다.')}</p></div></div></div>${cards.join('\n')}</section>`;
}

// ── 예시문항 분석 카드 (한 문항 = 한 덩어리) ──
function itemCard(no, it, t, teacher) {
  const form = /보기|적어도|벤/.test(it.form) ? 'bogi' : 'choice';
  const label = (i) => (form === 'bogi' ? GANADA[i] : CIRCLED[i]);
  const judge = teacher
    ? `<div class="sp-judge"><div class="sp-k">판서 노트 · 선지 판정</div><table><tbody>${it.judge
        .map(([ox, why], i) => `<tr class="${ox === 'O' ? 'o' : 'x'}"><th>${label(i)}</th><td class="ox">${ox}</td><td>${inl(why)}</td></tr>`).join('')}</tbody></table></div>`
    : '';
  return `<div class="row row-item sp-card-row" data-keep="card" id="ex-${no}"><div class="main"><div class="sp-card">
    <div class="sp-card-h"><span class="sp-ex"><small>예시</small>${two(no)}</span><div class="sp-card-t"><b>${inl(it.topic)}</b><span>${esc(it.pts)}점 · ${esc(it.form)} · 개념서 ${esc(conceptRef(it.units))}</span></div><span class="sp-tag">전략 ${t.no}<em>${esc(shortTitle(t))}</em></span>${teacher ? `<span class="sp-ans">정답 ${CIRCLED[it.ans - 1]}</span>` : '<span class="sp-ans mine">내 답 <i></i></span>'}</div>
    <div class="sp-grid">
      <div class="sp-k">핵심 자료</div><div class="sp-v">${inl(it.data)}</div>
      <div class="sp-k">묻는 것</div><div class="sp-v">${inl(it.ask)}</div>
      <div class="sp-k em">결정적 단서</div><div class="sp-v em">${inl(it.clue)}</div>
      <div class="sp-k">풀이 순서</div><div class="sp-v"><ol class="sp-steps">${it.steps.map((s) => `<li>${inl(s)}</li>`).join('')}</ol></div>
      <div class="sp-k red">함정 선지</div><div class="sp-v"><ul class="sp-traps">${it.traps.map(([n, w]) => `<li><b>${esc(n)}</b> ${inl(w)}</li>`).join('')}</ul></div>
    </div>${judge}
  </div></div></div>`;
}

// ── 대단원 하나: 머리(출제 포인트) + 분석 카드 (1단) → 연습 문항 (2단) ──
function chapterSections(c, TYPES, ITEMS, qs, teacher) {
  const b = BOOKS[c.key];
  const attrs = `data-tab="${esc(tabOf(c.key))}" data-head-left="${esc(`${b.subject} <b>${b.chapter.no}. ${b.chapter.title}</b>`)}" data-head-right="${esc(TITLE)}"`;
  const exUnits = new Set(c.items.flatMap((n) => ITEMS[n].units.map(([k]) => k)));
  const top = `<div class="top" id="c-${c.key}"><div class="sp-open sp-chap"><div class="sp-open-no">${esc(b.chapter.no)}</div><div class="sp-open-t"><span>${esc(b.subject)} · ${c.items.length ? `예시문항 ${c.items.map((n) => `${n}번`).join(' · ')}` : '예시문항 없음 · 학력평가 1번 단원'}</span><h1>${esc(b.chapter.title)}</h1>
    <ul class="sp-units">${b.units.map((u) => `<li class="${exUnits.has(u.key) ? 'on' : ''}"><b>${esc(u.no)}</b> ${esc(u.title)}</li>`).join('')}</ul></div></div>
    <div class="sp-point"><div class="sp-point-h"><b>출제 포인트</b><span>전 범위 시험 4회(2028 예시문항 + 2026 고2 학력평가 3회) 100문항 중 <em>${c.freq}문항</em></span></div><ul>${c.points.map((p) => `<li>${inl(p)}</li>`).join('')}</ul></div></div>`;
  const cards = c.items.map((n) => itemCard(n, ITEMS[n], typeOf(TYPES, n), teacher));
  const out = [`<section class="flow" data-kind="type" ${attrs}>${top}${cards.join('\n')}</section>`];
  if (qs.length) {
    const lv = ['상', '중상', '중', '하'].map((l) => `${l} ${qs.filter((q) => q.level === l).length}`).join(' · ');
    const band = `<div class="top"><div class="band band-exam wb-band" id="p-${c.key}"><span class="band-title">${esc(b.chapter.no)}단원 연습 문항</span><span class="band-sub">${qs.length}문항 · ${lv}</span></div></div>`;
    out.push(`<section class="flow" data-kind="exam" ${attrs}>${band}${qs.map((q, i) => questionHtml(q, i + 1, { unit: UNITS[q.unit], teacher })).join('\n')}</section>`);
  }
  return out;
}

function setSection(set, teacher) {
  const attrs = `data-tab="세트" data-head-left="${esc(HEAD)}" data-head-right="예시문항 쌍둥이 세트"`;
  const head = `<div class="top" id="sp-set"><div class="wb-mock">
      <div class="wb-mock-l"><span>2028 수능 예시문항 형식 · 통합사회</span><b>쌍둥이 세트</b></div>
      <div class="wb-mock-r"><span>${esc(set.range)}</span><span>${set.questions.length}문항 · 50점 · 권장 시간 30분</span><span>번호마다 예시문항과 단원·배점·형식이 같다 · 표시 없는 문항은 2점</span></div>
    </div></div>`;
  return `<section class="flow" data-kind="mock" ${attrs}>${head}${set.questions.map((q, i) => questionHtml(q, i + 1, { mock: true, teacher })).join('\n')}</section>`;
}

// 빠른 정답(교사용 끝)
function quick(CHAPTERS, practice, set) {
  const line = (label, qs, start = 0) => `<div class="row row-ac"><div class="main"><div class="ans-check wb-quick"><div class="sp-q-l">${esc(label)}</div><div class="ans-list">${qs
    .map((q, i) => `<span><b>${two(start + i + 1)}</b> ${CIRCLED[q.answer - 1]}</span>`).join('')}</div></div></div></div>`;
  return `<section class="flow" data-kind="answers" data-tab="답" data-head-left="${esc(HEAD)}" data-head-right="빠른 정답"><div class="top"><div class="band band-answers"><span class="band-title">빠른 정답</span></div></div>
    ${CHAPTERS.filter((c) => practice[c.key].length).map((c) => line(`${BOOKS[c.key].subject} ${BOOKS[c.key].chapter.no}단원 연습`, practice[c.key])).join('\n')}
    ${[0, 10, 20].map((s) => line(`쌍둥이 세트 ${s + 1}~${Math.min(s + 10, set.questions.length)}`, set.questions.slice(s, s + 10), s)).join('\n')}</section>`;
}

// 연습 문항을 대단원별로 모은다(개념서 중단원 순서)
export function practiceByChapter(CHAPTERS, all) {
  const out = Object.fromEntries(CHAPTERS.map((c) => [c.key, []]));
  for (const q of all) out[UNITS[q.unit].book].push(q);
  for (const k of Object.keys(out)) out[k].sort((a, b) => a.unit.localeCompare(b.unit));
  return out;
}

export function renderLecture({ TYPES, ITEMS, OVERVIEW, CHAPTERS, practice, set }, { mode }) {
  const teacher = mode === 'teacher';
  const nPractice = Object.values(practice).reduce((a, l) => a + l.length, 0);
  const sections = [cover({
    title: TITLE,
    sub: '개념서 단원 순서 · 풀이 전략 → 문항 분석 → 함정 선지 → 같은 단원 연습',
    edition: teacher ? '교사용 · 판서 노트와 해설 포함' : '학생용',
    parts: ['2028학년도 수능 예시문항 25문항', `풀이 전략 7 · 연습 ${nPractice} · 쌍둥이 세트 ${set.questions.length}`],
  })];
  sections.push(toc(CHAPTERS, practice, set.questions.length));
  sections.push(intro(TYPES, ITEMS, OVERVIEW, teacher));
  sections.push(strategies(TYPES));
  for (const c of CHAPTERS) sections.push(...chapterSections(c, TYPES, ITEMS, practice[c.key], teacher));
  sections.push(setSection(set, teacher));
  if (teacher) sections.push(quick(CHAPTERS, practice, set));
  return page(sections, { title: `${TITLE}${teacher ? ' (교사용)' : ''}`, mode });
}

export function page(sections, { title, mode }) {
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
<link rel="stylesheet" href="../../특강/sp.css">
</head>
<body class="theme-b theme-d theme-h wb sp mode-${mode}">
<div id="book"></div>
<div id="source">${sections.join('\n')}</div>
<script>window.LAYOUT = __LAYOUT__;</script>
<script>__PAGINATE__</script>
</body></html>`;
}
