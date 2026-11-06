// 2028 예시문항 특강 교재: 분석 내용 + 연습 문항 → HTML
//
// 문제집(../lib/wb-render.js)의 문항 그리기와 개념서의 블록 그리기·쪽 나누기·시안 H를 그대로 쓰고,
// 특강에만 있는 부분(안내 쪽, 유형 머리, 예시문항 분석 카드, 함정·점검표, 쌍둥이 세트 머리)만 여기서 만든다.
import { block, inl } from '../../textbook/lib/render.js';
import { questionHtml } from '../lib/wb-render.js';
import { UNITS, BOOKS } from '../lib/units.js';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const CIRCLED = ['①', '②', '③', '④', '⑤'];
const GANADA = ['ㄱ', 'ㄴ', 'ㄷ', 'ㄹ', 'ㅁ'];
const two = (n) => String(n).padStart(2, '0');
export const TITLE = '2028 수능 예시문항 완전 분석';
const HEAD = `승민T 통합사회 <b>${TITLE}</b>`;

// 'u: t2-05' → '통합사회2 05 다양한 정의관의 특징과 적용'
const unitName = (k) => { const u = UNITS[k]; return u ? `${BOOKS[u.book].subject} ${u.no} ${u.title}` : k; };
const unitShort = (k) => { const u = UNITS[k]; return u ? `${u.book.startsWith('t1') ? '통사1' : '통사2'} ${BOOKS[u.book].chapter.no}-${u.no}` : k; };
// 관련 개념: '개념서 05 단원 개념 02·03'
const conceptRef = (units) => units.map(([k, cs]) => `${UNITS[k].no} 단원 개념 ${cs.map(two).join('·')}`).join(' / ');
const typeOf = (TYPES, no) => TYPES.find((t) => t.items.includes(no));

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

function toc(TYPES, nSet) {
  const items = [
    ['수업 안내 · 예시문항 한눈에', '', 'sp-intro'],
    ...TYPES.map((t) => [`유형 ${t.no}  ${t.title}`, `예시 ${t.items.join('·')}번 · 연습 ${t.qs.length}문항`, `t-${t.key}`]),
    ['예시문항 쌍둥이 세트 (전 범위 25문항)', `${nSet}문항 · 50점`, 'sp-set'],
  ];
  return `<section class="flow" data-kind="toc" data-head-left="${esc(HEAD)}" data-head-right="차례"><div class="top"><div class="band band-answers"><span class="band-title">차례</span></div></div>
  <div class="row"><div class="main"><table class="wb-toc sp-toc">${items
    .map(([name, n, id]) => `<tr><td>${esc(name)}</td><td class="n">${esc(n)}</td><td class="pg" data-pg="${esc(id)}"></td></tr>`).join('')}</table></div></div>
  <div class="row"><div class="main"><p class="wb-howto">${inl(
    '**이 책 쓰는 법** — ① 평가원이 공개한 예시문항 원문(따로 나눠 줌)을 먼저 시간을 재며 푼다. ② 유형별로 **출제 의도 → 풀이 순서 → 문항 분석 → 함정 선지**를 읽으며 내 풀이와 견준다. ③ 같은 유형의 **연습 문항**으로 전략을 몸에 익힌다. ④ 마지막에 예시문항과 단원·배점·형식이 같은 **쌍둥이 세트**로 실전 점검을 한다. 문항 머리의 “개념 NN”은 개념서(MINIMAP)의 같은 단원 개념 번호다.',
  )}</p></div></div></section>`;
}

// ── 안내 쪽: 예시문항 한눈에 ──
function intro(TYPES, ITEMS, OVERVIEW, teacher) {
  const rows = [];
  const R = (html, keep) => rows.push(`<div class="row"${keep ? ' data-keep="next"' : ''}><div class="main">${html}</div></div>`);
  R(block({ t: 'sec', mark: '1', title: '2028 수능 통합사회, 무엇이 달라졌나' }), true);
  R(`<table class="kv sp-trend"><tbody>${OVERVIEW.trends.map(([k, v], i) => `<tr><th><span>${i + 1}. ${inl(k)}</span></th><td>${inl(v)}</td></tr>`).join('')}</tbody></table>`);
  // 단원별 문항 수 (분석 결과를 셈)
  const keys = ['1-Ⅰ', '1-Ⅱ', '1-Ⅲ', '1-Ⅳ', '1-Ⅴ', '2-Ⅰ', '2-Ⅱ', '2-Ⅲ', '2-Ⅳ', '2-Ⅴ'];
  const cnt = Object.fromEntries(keys.map((k) => [k, 0]));
  for (const it of Object.values(ITEMS)) {
    const u = UNITS[it.units[0][0]];
    cnt[`${u.book[1]}-${BOOKS[u.book].chapter.no}`] += 1;
  }
  const fmt = (kind) => Object.entries(OVERVIEW.points).map(([p, l]) => `${p}점 ${l.length}문항`).join(' · ');
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
  R(block({ t: 'sec', mark: '3', title: '25문항 지도 — 번호 · 단원 · 유형' }), true);
  const head = ['번호', '배점', '단원', '주제', '형식', '유형', ...(teacher ? ['정답'] : [])];
  const body = Object.entries(ITEMS).map(([no, it]) => {
    const t = typeOf(TYPES, +no);
    return [`${no}`, `${it.pts}`, unitShort(it.units[0][0]), it.topic.split(' — ')[0], it.form.replace(/ \(.*\)/, ''), `${t.no}`, ...(teacher ? [CIRCLED[it.ans - 1]] : [])];
  });
  R(`<div class="tbl-wrap sp-map"><table class="tbl compact"><thead><tr>${head.map((h) => `<th>${h}</th>`).join('')}</tr></thead><tbody>${body
    .map((r) => `<tr>${r.map((c, i) => `<td class="${i === 3 ? 'l' : ''}">${inl(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>
    <div class="fig-foot"><span class="fig-note">${inl(`유형: ${TYPES.map((t) => `${t.no} ${t.title.split(' — ')[0]}`).join(' · ')}`)}</span></div></div>`);
  R(block({ t: 'sec', mark: '4', title: '특강 운영 예시 (3시간)' }), true);
  R(block({ t: 'kv', rows: [
    ['0:00~0:35', '예시문항 원문(평가원 공개 PDF) 30분 실전 풀이 + 채점. 틀린 번호를 위 표에 동그라미 친다.'],
    ['0:35~1:50', '유형 01~04 분석: 출제 의도 → 풀이 순서 → 예시문항 분석 카드 → 함정 선지. 유형마다 연습 문항 2~3개를 바로 푼다.'],
    ['1:50~2:20', '유형 05~07 분석과 연습 문항(계산은 손으로 직접).'],
    ['2:20~3:00', '쌍둥이 세트는 숙제(30분 재고 풀기) 또는 남은 시간에 절반. 다음 시간에 정답과 해설(별책)로 오답 정리.'],
  ] }));
  return `<section class="flow" data-kind="intro" data-tab="안내" data-head-left="${esc(HEAD)}" data-head-right="수업 안내 · 예시문항 한눈에"><div class="top" id="sp-intro">
    <div class="sp-open"><div class="sp-open-no">00</div><div class="sp-open-t"><span>2028학년도 대학수학능력시험 · 사회탐구 영역(통합사회)</span><h1>예시문항 25문항 한눈에</h1>
    <p>${inl('예시문항은 2028 수능의 **설계도**다. 단원·배점·형식·자료의 모양을 먼저 익혀 두면 실제 시험에서 낯선 문항이 줄어든다.')}</p></div></div></div>${rows.join('\n')}</section>`;
}

// ── 예시문항 분석 카드 (한 문항 = 한 덩어리) ──
function itemCard(no, it, teacher) {
  const form = /보기|적어도|벤/.test(it.form) ? 'bogi' : 'choice';
  const label = (i) => (form === 'bogi' ? GANADA[i] : CIRCLED[i]);
  const judge = teacher
    ? `<div class="sp-judge"><div class="sp-k">판서 노트 · 선지 판정</div><table><tbody>${it.judge
        .map(([ox, why], i) => `<tr class="${ox === 'O' ? 'o' : 'x'}"><th>${label(i)}</th><td class="ox">${ox}</td><td>${inl(why)}</td></tr>`).join('')}</tbody></table></div>`
    : '';
  return `<div class="row row-item sp-card-row" data-keep="card" id="ex-${no}"><div class="main"><div class="sp-card">
    <div class="sp-card-h"><span class="sp-ex"><small>예시</small>${two(no)}</span><div class="sp-card-t"><b>${inl(it.topic)}</b><span>${esc(it.pts)}점 · ${esc(it.form)} · 개념서 ${esc(conceptRef(it.units))}</span></div>${teacher ? `<span class="sp-ans">정답 ${CIRCLED[it.ans - 1]}</span>` : '<span class="sp-ans mine">내 답 <i></i></span>'}</div>
    <div class="sp-grid">
      <div class="sp-k">핵심 자료</div><div class="sp-v">${inl(it.data)}</div>
      <div class="sp-k">묻는 것</div><div class="sp-v">${inl(it.ask)}</div>
      <div class="sp-k em">결정적 단서</div><div class="sp-v em">${inl(it.clue)}</div>
      <div class="sp-k">풀이 순서</div><div class="sp-v"><ol class="sp-steps">${it.steps.map((s) => `<li>${inl(s)}</li>`).join('')}</ol></div>
      <div class="sp-k red">함정 선지</div><div class="sp-v"><ul class="sp-traps">${it.traps.map(([n, w]) => `<li><b>${esc(n)}</b> ${inl(w)}</li>`).join('')}</ul></div>
    </div>${judge}
  </div></div></div>`;
}

// ── 유형 하나: 머리 + 의도 + 풀이 순서 + 분석 카드 + 함정 모음·점검표 (1단) → 연습 문항 (2단) ──
function typeSections(t, ITEMS, teacher) {
  const tab = t.no;
  const headLeft = `${esc(HEAD)}`;
  const headRight = `유형 ${t.no} ${t.title.split(' — ')[0]}`;
  const units = [...new Set(t.items.flatMap((n) => ITEMS[n].units.map(([k]) => k)))];
  const top = `<div class="top" id="t-${t.key}"><div class="sp-open"><div class="sp-open-no">${t.no}</div><div class="sp-open-t"><span>유형 ${t.no} · 예시문항 ${t.items.map((n) => `${n}번`).join(' · ')}</span><h1>${inl(t.title.split(' — ')[0])}</h1>${t.title.includes(' — ') ? `<p>${inl(t.title.split(' — ')[1])}</p>` : ''}
    <p class="sp-units">${units.map((k) => esc(unitName(k))).join(' · ')}</p></div></div></div>`;
  const rows = [];
  rows.push(`<div class="row" data-keep="next"><div class="main">${block({ t: 'sec', mark: 'A', title: '출제 의도 — 이 유형은 무엇을 재는가' })}</div></div>`);
  rows.push(`<div class="row"><div class="main"><p class="p sp-intent">${inl(t.intent)}</p></div></div>`);
  rows.push(`<div class="row" data-keep="next"><div class="main">${block({ t: 'sec', mark: 'B', title: '풀이 순서 — 3단계 전략' })}</div></div>`);
  rows.push(`<div class="row"><div class="main">${block({ t: 'flow', steps: t.steps.map(([title, text]) => ({ title, text })) })}</div></div>`);
  rows.push(`<div class="row" data-keep="next"><div class="main">${block({ t: 'sec', mark: 'C', title: '예시문항 분석' })}</div></div>`);
  t.items.forEach((n) => rows.push(itemCard(n, ITEMS[n], teacher)));
  rows.push(`<div class="row" data-keep="next"><div class="main">${block({ t: 'sec', mark: 'D', title: '함정 선지는 이렇게 만들어진다' })}</div></div>`);
  rows.push(`<div class="row"><div class="main"><table class="kv sp-trap-t"><tbody>${t.traps.map(([k, v]) => `<tr><th><span>${inl(k)}</span></th><td>${inl(v)}</td></tr>`).join('')}</tbody></table>
    <div class="sp-check"><b>풀고 나서 점검</b><ul>${t.check.map((c) => `<li><i></i>${inl(c)}</li>`).join('')}</ul></div></div></div>`);
  const attrs = `data-tab="${tab}" data-head-left="${headLeft}" data-head-right="${esc(headRight)}"`;
  const lv = ['상', '중상', '중', '하'].map((l) => `${l} ${t.qs.filter((q) => q.level === l).length}`).join(' · ');
  const band = `<div class="top"><div class="band band-exam wb-band" id="p-${t.key}"><span class="band-title">유형 ${t.no} 연습 문항</span><span class="band-sub">${t.qs.length}문항 · ${lv}</span></div></div>`;
  return [
    `<section class="flow" data-kind="type" ${attrs}>${top}${rows.join('\n')}</section>`,
    `<section class="flow" data-kind="exam" ${attrs}>${band}${t.qs.map((q, i) => questionHtml(q, i + 1, { unit: UNITS[q.unit], teacher })).join('\n')}</section>`,
  ];
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
function quick(TYPES, set) {
  const line = (label, qs) => `<div class="row row-ac"><div class="main"><div class="ans-check wb-quick"><div class="sp-q-l">${esc(label)}</div><div class="ans-list">${qs
    .map((q, i) => `<span><b>${two(i + 1)}</b> ${CIRCLED[q.answer - 1]}</span>`).join('')}</div></div></div></div>`;
  return `<section class="flow" data-kind="answers" data-tab="답" data-head-left="${esc(HEAD)}" data-head-right="빠른 정답"><div class="top"><div class="band band-answers"><span class="band-title">빠른 정답</span></div></div>
    ${TYPES.map((t) => line(`유형 ${t.no} 연습`, t.qs)).join('\n')}
    ${[0, 10, 20].map((s) => line(`쌍둥이 세트 ${s + 1}~${Math.min(s + 10, set.questions.length)}`, set.questions.slice(s, s + 10)).replace(/<b>(\d\d)<\/b>/g, (m, d) => `<b>${two(+d + s)}</b>`)).join('\n')}</section>`;
}

export function renderLecture({ TYPES, ITEMS, OVERVIEW, set }, { mode, edition }) {
  const teacher = mode === 'teacher';
  const nPractice = TYPES.reduce((a, t) => a + t.qs.length, 0);
  const sections = [cover({
    title: TITLE,
    sub: '출제 의도 → 풀이 순서 → 함정 선지 → 같은 유형 연습',
    edition: teacher ? '교사용 · 판서 노트와 해설 포함' : '학생용',
    parts: ['2028학년도 수능 예시문항 25문항', `유형별 전략 7 · 연습 ${nPractice} · 쌍둥이 세트 ${set.questions.length}`],
  })];
  sections.push(toc(TYPES, set.questions.length));
  sections.push(intro(TYPES, ITEMS, OVERVIEW, teacher));
  for (const t of TYPES) sections.push(...typeSections(t, ITEMS, teacher));
  sections.push(setSection(set, teacher));
  if (teacher) sections.push(quick(TYPES, set));
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
