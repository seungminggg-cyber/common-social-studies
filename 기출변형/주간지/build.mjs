// 학교별 내신 주간지 만들기 (2026-11-08 시작)
//
//   node 주간지/build.mjs jakjeon 1          작전고 1주차 → 주간지/out/작전고-1주차.pdf (문제 + 뒤쪽 정답과 해설)
//   node 주간지/build.mjs jakjeon 1 png      쪽 그림(PNG)까지
//   node 주간지/build.mjs jakjeon 1 s2 png   디자인 시안 2로(시안 1~4 비교용, 2026-11-08) → 작전고-1주차-시안2.pdf
//
// 한 주 = 표지(이번 주 계획표) → DAY 1~5 → 정답과 해설. (백지 테스트·오답 기록지는 강사 요청으로 뺌, 2026-11-08)
// DAY마다: 개념 정리(개념서 '한 장 정리') → 개념 O/X(개념서 '이렇게 나온다') → 객관식 6 → 서답형 1.
// 주의: 학교 학습지 사진·원문은 저장소에 올리지 않는다(공개 저장소). 문항은 새로 쓴다.
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { block, inl } from '../../textbook/lib/render.js';
import { ensureTerrain } from '../../textbook/lib/terrain.js';
import { BOOKS, UNITS } from '../lib/units.js';
import { questionHtml } from '../lib/wb-render.js';
import { bigMapText, cleanLabels, numberFigures } from '../lib/prep.js';

const require = createRequire(import.meta.url);
const { chromium } = (() => { try { return require('playwright'); } catch { return require('/opt/node-tools/node_modules/playwright'); } })();
const ROOT = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const school = args[0] || 'jakjeon';
const week = +(args[1] || 1);
const wantPng = args.includes('png');
const STYLE = (args.find((a) => /^s\d$/.test(a)) || '').slice(1); // 디자인 시안 번호(없으면 기본)
const OUT = join(ROOT, 'out');
mkdirSync(OUT, { recursive: true });

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const two = (n) => String(n).padStart(2, '0');
const CIRCLED = ['①', '②', '③', '④', '⑤'];

// ── 내용 모으기 ──
const W = (await import(pathToFileURL(join(ROOT, 'content', school, `w${week}.js`)).href)).default;
const CC = {};
async function cc(unitKey) { // 개념서 개념 계획: 한 장 정리 + '이렇게 나온다'
  const book = UNITS[unitKey].book;
  CC[book] ??= (await import(pathToFileURL(join(ROOT, '../../textbook/content/_cc', `${book}.js`)).href)).default;
  return CC[book][UNITS[unitKey].no];
}
// 개념 O/X: 개념마다 '이렇게 나온다' 한 문장(O·X가 번갈아 나오게), 출제 빈도가 높은 개념부터 n개 → 개념 순서로
function pickOx(spec, n) {
  const list = spec.concepts.map((c, i) => {
    const want = i % 2 ? 'X' : 'O';
    const p = c.pattern.find((x) => x[1] === want) || c.pattern[0];
    return { no: i + 1, stars: c.stars || 1, text: p[0], ox: p[1], why: p[2] || '' };
  });
  return list.sort((a, b) => b.stars - a.stars || a.no - b.no).slice(0, n).sort((a, b) => a.no - b.no);
}
const reusePool = {};
async function reuseQ(id) { // MINIMAX 문항 가져오기: 't2-07-1-003'
  const [b, u, ed] = id.split('-');
  const k = `${ed}/${b}-${u}`;
  reusePool[k] ??= (await import(pathToFileURL(join(ROOT, '../content', ed, `${b}-${u}.js`)).href)).default;
  const q = reusePool[k].find((x) => x.id === id);
  if (!q) throw new Error(`재사용 문항을 찾지 못함: ${id}`);
  return { ...structuredClone(q), unit: `${b}-${u}` };
}

// 문항 모으기: 이 학교 폴더의 문항 파일(w1-07.js 같은 단원 파일, w1-extra.js, private/*.js)을 id로 찾는다.
// private/ 는 학교 학습지에서 옮긴 문제(저장소에 올리지 않음) — 없으면 그 문항은 빼고 경고한다.
const { readdirSync } = await import('node:fs');
const POOL = new Map();
async function loadPool(dir) {
  if (!existsSync(dir)) return;
  for (const f of readdirSync(dir)) {
    if (!/\.js$/.test(f) || /^w\d+\.js$/.test(f)) continue;
    const m = (await import(pathToFileURL(join(dir, f)).href)).default;
    for (const q of m.questions || []) POOL.set(q.id, { ...q, unit: q.unit || m.unit });
  }
}
await loadPool(join(ROOT, 'content', school));
await loadPool(join(ROOT, 'content', school, 'private'));
const missing = [];
const days = [];
for (const d of W.days) {
  const qs = [];
  for (const id of d.items || []) {
    if (/^t[12]-\d\d-\d-\d+$/.test(id)) qs.push(await reuseQ(id));
    else if (POOL.has(id)) qs.push(structuredClone(POOL.get(id)));
    else missing.push(id);
  }
  const ox = (d.ox || []).map(([text, o, why]) => ({ text, ox: o, why: why || '' }));
  days.push({ ...d, unit: d.unit ? UNITS[d.unit] : null, qs, short: null, spec: d.summary ? { summary: d.summary } : null, ox });
}
if (missing.length) console.warn(`찾지 못한 문항 ${missing.length}개(빠짐): ${missing.join(', ')}\n  학교 학습지 문제는 content/${school}/private/ 에 있어야 한다(저장소에 없음 — 학습지 사진을 보고 다시 만든다).`);
// 번호는 한 주 안에서 이어진다(오답 기록지에 적기 쉽게)
let qn = 0;
let sn = 0;
function renumber() {
  qn = 0; sn = 0;
  for (const d of days) for (const q of d.qs) q._n = ++qn;
  for (const d of days) if (d.short) d.short._n = ++sn;
}
renumber();
const all = days.flatMap((d) => [...d.qs, ...(d.short ? [d.short] : [])]);
cleanLabels(all);
bigMapText(all);
numberFigures(all);
await ensureTerrain(all);

// ── HTML ──
const chapterNo = (u) => BOOKS[u.book].chapter.no;
const headLeft = STYLE ? `<b>승민T WEEKLY</b> | ${esc(W.school)} ${week}주차` : `${esc(W.school)} 내신 주간지 <b>WEEK ${two(week)}</b>`;

function coverPage() {
  if (STYLE) return coverStyled();
  const rows = days.map((d) => {
    const n = d.qs.length + (d.short ? 1 : 0);
    const name = d.title || `${d.unit.no} ${d.unit.title}`;
    const ox = d.ox ? `O/X ${d.ox.length} · ` : '';
    return `<tr><td class="d">DAY ${d.day}</td><td class="u">${esc(name)}</td><td class="n">${ox}${n}문항</td><td></td><td></td><td></td><td></td></tr>`;
  }).join('');
  return `<section class="flow" data-kind="cover" data-tab="${esc(W.tab)}"><div class="top"><div class="wk-cover">
    <div class="wk-brand">승민T 통합사회 · 학교별 내신 주간지</div>
    <div class="wk-big"><span>WEEK</span><b>${two(week)}</b></div>
    <div class="wk-school"><b>${esc(W.school)}</b> ${esc(W.grade)} · ${esc(W.exam)}</div>
    <div class="wk-range">${esc(W.range)}</div>
    <div class="wk-name">이름 <i></i></div>
    <h3 class="wk-h">이번 주 계획표</h3>
    <table class="wk-plan"><thead><tr><th>DAY</th><th>단원</th><th>분량</th><th>푼 날</th><th>걸린 시간</th><th>맞은 개수</th><th>확인</th></tr></thead><tbody>${rows}</tbody></table>
    <h3 class="wk-h">이렇게 푼다 (하루 30분)</h3>
    <ol class="wk-how">
      <li>${inl('**개념 정리**를 읽고 모르는 말에 표시한다.')}</li>
      <li>${inl('**개념 O/X**로 개념을 확인한다. 헷갈리면 바로 개념 정리로 돌아간다.')}</li>
      <li>${inl('**객관식**은 시간을 재고 풀고, 고른 근거를 선지 옆에 짧게 적는다. 계산 문제는 풀이 과정을 문제 옆 빈칸에 쓴다.')}</li>
      <li>${inl('책 뒤 **정답과 해설**로 채점하고, 틀린 문제는 번호에 표시해 두고 다시 푼다. 다음 수업에 주간지를 가져온다.')}</li>
    </ol>
    ${W.message ? `<div class="wk-msg">${inl(W.message)}</div>` : ''}
  </div></div></section>`;
}

// 디자인 시안 표지 (2026-11-08 비교용) — 1 브랜드형, 2 실용형, 3·4 섞은형
function coverStyled() {
  const name = (d) => d.title || `${d.unit.no} ${d.unit.title}`;
  const plan = `<table class="wk-plan"><thead><tr><th>DAY</th><th>오늘 공부</th><th>분량</th><th>푼 날</th><th>맞은 개수</th><th>확인</th></tr></thead><tbody>${days.map((d) => `<tr><td class="d">${two(d.day)}</td><td class="u">${esc(name(d))}</td><td class="n">${d.ox ? `O/X ${d.ox.length} · ` : ''}${d.qs.length}문항</td><td></td><td></td><td></td></tr>`).join('')}</tbody></table>`;
  const how = `<ol class="wk-how"><li>${inl('**개념 정리** 읽기 → **O/X**로 확인')}</li><li>${inl('**객관식** 시간 재고 풀기, 근거를 선지 옆에')}</li><li>${inl('책 뒤 **정답과 해설**로 채점, 틀린 문제 다시 풀기')}</li></ol>`;
  const list = `<ol class="wk-list">${days.map((d) => `<li><b>DAY ${two(d.day)}</b><span>${esc(name(d))}</span></li>`).join('')}</ol>`;
  const brand = '승민T 통합사회';
  const sub = '학교별 내신 주간지';
  const total = days.reduce((a, d) => a + d.qs.length, 0);
  const msg = W.message ? `<div class="wk-msg">${inl(W.message)}</div>` : '';
  // 4주 중 몇 주차인지 막대로, 대단원 번호를 큰 로마 숫자 그림으로(강사가 모아 준 참고 표지, 2026-11-08)
  const weeks = W.weeks || 4;
  const prog = `<div class="cv-prog"><span>WEEK ${week} / ${weeks}</span>${Array.from({ length: weeks }, (_, i) => `<i class="${i < week ? 'on' : ''}"></i>`).join('')}</div>`;
  const roman = /^[ⅠⅡⅢⅣⅤ]$/.test(W.tab || '') ? W.tab : '';
  const mark = roman ? `<div class="cv-mark" aria-hidden="true">${roman}</div>` : '';
  const body = {
    1: `<div class="cv cv1">${mark}
      <div class="cv-top"><span>${brand} <b>WEEKLY</b></span>${prog}</div>
      <div class="cv-week"><span>WEEK</span><b>${two(week)}</b></div>
      <div class="cv-school"><b>${esc(W.school)}</b><span>${esc(W.grade)} · ${esc(W.exam)}</span></div>
      <div class="cv-range">${esc(W.range)}</div>
      <div class="cv-inside"><div class="cv-lab">THIS WEEK</div>${list}</div>
      <div class="cv-foot"><span>개념 정리 · O/X · 객관식 ${total}문항 · 정답과 해설</span><span class="cv-name">이름 <i></i></span></div>
    </div>`,
    2: `<div class="cv cv2">
      <div class="cv-top"><span>${brand} · ${sub}</span><span class="cv-name">이름 <i></i></span></div>
      <div class="cv-head"><div class="cv-week"><span>WEEK</span><b>${two(week)}</b></div>
        <div class="cv-id"><b>${esc(W.school)}</b><span>${esc(W.grade)} · ${esc(W.exam)}</span><em>${esc(W.range)}</em></div></div>
      <h3 class="cv-h"><b>01</b>이번 주 계획표</h3>${plan}
      <h3 class="cv-h"><b>02</b>이렇게 푼다 <i>하루 30분</i></h3>${how}
      ${msg}
    </div>`,
    3: `<div class="cv cv3">
      <div class="cv-hero">
        <div class="cv-top"><span>${brand}</span><span>${sub}</span></div>
        <div class="cv-week"><span>WEEK</span><b>${two(week)}</b></div>
        <div class="cv-school"><b>${esc(W.school)}</b><span>${esc(W.grade)} · ${esc(W.exam)}</span></div>
        <div class="cv-range">${esc(W.range)}</div>
      </div>
      <div class="cv-lower">
        <div class="cv-name">이름 <i></i></div>
        <h3 class="cv-h">이번 주 계획표</h3>${plan}
        <h3 class="cv-h">이렇게 푼다 <i>하루 30분</i></h3>${how}
      </div>
    </div>`,
    4: `<div class="cv cv4">
      <div class="cv-side">${mark}
        <div class="cv-top">${brand} <b>WEEKLY</b><br>${sub}</div>
        ${prog}
        <div class="cv-week"><span>WEEK</span><b>${two(week)}</b></div>
        <div class="cv-range">${esc(W.range)}</div>
      </div>
      <div class="cv-main">
        <div class="cv-school"><b>${esc(W.school)}</b><span>${esc(W.grade)} · ${esc(W.exam)}</span></div>
        <div class="cv-name">이름 <i></i></div>
        <h3 class="cv-h">이번 주 계획표</h3>${plan}
        <h3 class="cv-h">이렇게 푼다 <i>하루 30분</i></h3>${how}
        ${msg}
      </div>
    </div>`,
  }[STYLE];
  return `<section class="flow" data-kind="cover" data-tab="${esc(W.tab)}"><div class="top">${body}</div></section>`;
}

function summaryBox(spec) {
  const s = spec.summary;
  const items = (s.items || s.concepts).map((c) => `<div class="wk-c"><div class="wk-c-h"><b>${esc(c.no)}</b><h4>${inl(c.title || '')}</h4></div><div class="wk-c-b">${c.lines.map((l) => `<p>${inl(l)}</p>`).join('')}</div></div>`).join('');
  const traps = (s.traps || []).slice(0, 3).map(([a, b]) => `<li><b>${inl(a)}</b> ${inl(b)}</li>`).join('');
  return `<div class="wk-sum"><div class="wk-sec-t">개념 정리</div><p class="wk-core">${inl(s.core)}</p><div class="wk-grid">${items}</div>${traps ? `<div class="wk-traps"><span>헷갈리지 말자</span><ul>${traps}</ul></div>` : ''}</div>`;
}
function oxBox(ox) {
  return `<div class="wk-ox"><div class="wk-sec-t">개념 O/X <i>맞으면 O, 틀리면 X에 동그라미</i></div><ol>${ox.map((o) => `<li><span class="t">${inl(o.text)}</span><span class="b"><i>O</i><i>X</i></span></li>`).join('')}</ol></div>`;
}
const sepTop = (label, sub) => `<div class="wk-sep"><b>${label}</b>${sub ? `<i>${sub}</i>` : ''}</div>`;
const sep = (label, sub) => `<div class="row row-sep" data-keep="next"><div class="main"><div class="wk-sep"><b>${label}</b>${sub ? `<i>${sub}</i>` : ''}</div></div></div>`;

function shortHtml(s) {
  const data = (s.data || []).map((d) => block(d)).join('');
  const lines = '<i></i>'.repeat(s.lines || 3);
  return `<div class="row row-q" data-qid="${esc(s.id)}"><div class="main"><div class="q wk-short">
    <div class="q-head"><span class="q-no">서답 ${s._n}</span><span class="q-lv lv-${esc(s.level)}">${esc(s.level)}</span><span class="q-meta"><span class="q-type">${esc(s.type || '서술형')}</span></span></div>
    <div class="q-stem">${inl(s.stem)}</div>
    ${data ? `<div class="q-data">${data}</div>` : ''}
    <div class="wk-lines">${lines}</div>
  </div></div></div>`;
}

function dayPage(d) {
  const unit = d.unit;
  const tab = unit ? chapterNo(unit) : W.tab;
  const title = d.title || `${unit.no} ${unit.title}`;
  const total = d.qs.length + (d.short ? 1 : 0) + (d.ox ? d.ox.length : 0);
  const goal = Math.ceil((d.qs.length * 2.5 + (d.ox ? 3 : 0)) / 5) * 5; // 문항당 2분 30초 + O/X 3분, 5분 단위
  const top = `<div class="top" id="day-${d.day}"><div class="wk-day">
      <div class="wk-day-no"><span>DAY</span><b>${d.day}</b><em>${two(d.day)}</em></div>
      <div class="wk-day-t"><span>${esc(unit ? `${BOOKS[unit.book].subject} ${chapterNo(unit)}. ${BOOKS[unit.book].chapter.title}` : W.range)}</span><h2>${esc(title)}</h2></div>
      <div class="wk-day-log"><span>푼 날 <i></i>월 <i></i>일</span><span>걸린 시간 <i></i>분${STYLE ? ` <em class="wk-goal">목표 ${goal}분</em>` : ''}</span><span>맞은 개수 <i></i>/ ${total}</span></div>
    </div></div>`;
  const row = (h) => `<div class="row"><div class="main">${h}</div></div>`;
  const crow = d.spec ? row(summaryBox(d.spec)) + row(oxBox(d.ox)) : row(`<p class="wk-review">${inl(d.note || '')}</p>`);
  const qrows = d.qs.map((q) => questionHtml(q, q._n, { unit: UNITS[q.unit] })).join('\n');
  const head = `data-tab="${esc(tab)}" data-head-left="${headLeft}" data-head-right="${esc(`DAY ${d.day} · ${title}`)}"`;
  // 개념 정리·O/X는 1단(dayc), 문제는 2단(day) — 문제는 남은 자리에 이어 붙고, 긴 문항은 다음 쪽으로
  if (!d.spec) { // 종합 점검: 개념 쪽 없이 머리 + 안내 + 문제
    return `<section class="flow" data-kind="day" ${head}>${top.replace(/<\/div>$/, `<p class="wk-review">${inl(d.note || '')}</p>${sepTop('객관식', `${d.qs.length}문항 · 20분`)}</div>`)}${qrows}</section>`;
  }
  // 강사 요청(2026-11-08): 백지 테스트 칸을 빼고, 개념 정리·O/X 바로 아래에서 객관식이 이어지게(빈 공간 없이)
  const topAll = top.replace(/<\/div>$/, `${summaryBox(d.spec)}${oxBox(d.ox)}${sepTop('객관식', `${d.qs.length}문항${STYLE ? ` · 목표 ${Math.ceil(d.qs.length * 2.5 / 5) * 5}분` : ''}`)}</div>`);
  return `<section class="flow" data-kind="day" ${head}>${topAll}${qrows}${d.short ? sep('서답형', '학교 시험처럼 문장으로') + shortHtml(d.short) : ''}</section>`;
}

function logPage() {
  const rows = '<tr><td></td><td></td><td class="why">개념 · 자료 · 함정 · 실수</td><td></td><td></td></tr>'.repeat(14);
  return `<section class="flow" data-kind="cover" data-tab="${esc(W.tab)}" data-head-left="${headLeft}" data-head-right="오답 기록지"><div class="top"><div class="wk-log">
    <h2>오답 기록지</h2>
    <p>${inl('틀린 문제마다 **왜 틀렸는지** 하나에 동그라미하고, 다시 볼 개념을 적는다. 시험 전 주에 이 표의 문제만 다시 푼다.')}</p>
    <table><thead><tr><th>DAY</th><th>번호</th><th>틀린 까닭</th><th>다시 볼 개념(개념서 쪽)</th><th>다시 풀기</th></tr></thead><tbody>${rows}</tbody></table>
    <div class="wk-log-key">${inl('**개념** 개념을 몰랐다 · **자료** 표·그래프·글을 잘못 읽었다 · **함정** 선지의 바뀐 말(주체·방향·범위)을 못 봤다 · **실수** 알았는데 잘못 골랐다')}</div>
  </div></div></section>`;
}

function answersSection() {
  const rows = [];
  for (const d of days) {
    const title = d.title || `${d.unit.no} ${d.unit.title}`;
    rows.push(`<div class="row row-ah" data-keep="next"><div class="main"><div class="ans-unit"><b>DAY ${d.day}</b> ${esc(title)}</div></div></div>`);
    if (d.ox) {
      rows.push(`<div class="row row-ae"><div class="main"><div class="wk-oxa"><b>개념 O/X</b>${d.ox.map((o, i) => `<span><i>${i + 1}</i> ${o.ox}${o.ox === 'X' && o.why ? ` <em>${inl(o.why)}</em>` : ''}</span>`).join('')}</div></div></div>`);
    }
    rows.push(`<div class="row row-ac"><div class="main"><div class="ans-check wb-quick"><div class="ans-list">${d.qs.map((q) => `<span><b>${two(q._n)}</b> ${CIRCLED[q.answer - 1]}</span>`).join('')}</div></div></div></div>`);
    for (const q of d.qs) {
      rows.push(`<div class="row row-ae"><div class="main"><div class="ans-q"><div class="aq-h"><span class="aq-no">${two(q._n)}</span><span class="aq-a">${CIRCLED[q.answer - 1]}</span><span class="aq-lv lv-${esc(q.level)}">${esc(q.level)}</span><span class="aq-meta">${esc(q.type || '')}</span></div><p>${inl(q.explain)}</p>${q.note ? `<div class="aq-note"><b>보충 설명</b> ${inl(q.note)}</div>` : ''}</div></div></div>`);
    }
    if (d.short) {
      const s = d.short;
      rows.push(`<div class="row row-ae"><div class="main"><div class="ans-q wk-sa"><div class="aq-h"><span class="aq-no">서답 ${s._n}</span><span class="aq-lv lv-${esc(s.level)}">${esc(s.level)}</span><span class="aq-meta">${esc(s.type || '')}</span></div>
        <p><b>모범 답안</b> ${inl(s.answer)}</p>${s.rubric?.length ? `<ul>${s.rubric.map((r) => `<li>${inl(r)}</li>`).join('')}</ul>` : ''}${s.explain ? `<p>${inl(s.explain)}</p>` : ''}</div></div></div>`);
    }
  }
  return `<section class="flow" data-kind="answers" data-tab="답" data-head-left="${headLeft}" data-head-right="정답과 해설"><div class="top"><div class="band band-answers"><span class="band-title">정답과 해설</span><span class="band-sub">WEEK ${two(week)} · ${esc(W.school)}</span></div></div>${rows.join('\n')}</section>`;
}

const name = `${W.school}-${week}주차${STYLE ? `-시안${STYLE}` : ''}`;
const makeHtml = () => { const sections = [coverPage(), ...days.map(dayPage), answersSection()]; return `<!doctype html>
<html lang="ko"><head>
<meta charset="utf-8">
<title>${esc(name)}</title>
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
<link rel="stylesheet" href="../../weekly.css">${STYLE ? `\n<link rel="stylesheet" href="../../styles/s${STYLE}.css">` : ''}
</head>
<body class="theme-b theme-d theme-h wb wbc wk${STYLE ? ` wk-s${STYLE}` : ''} mode-student">
<div id="book"></div>
<div id="source">${sections.join('\n')}</div>
<script>window.LAYOUT = ${JSON.stringify({ cover: 1, dayc: 1, day: 2, answers: 2, soft: [], memoMin: 0.12, spreadMax: 6, memoTitle: '풀이 메모', prompts: { day: ['계산 과정이나 헷갈린 선지를 적어 둔다.'] } })};</script>
<script>${readFileSync(join(ROOT, '../../textbook/lib/paginate.js'), 'utf8')}</script>
</body></html>`; };

// out/html 아래에 두어야 글꼴·테마 상대 경로(../../../textbook)가 맞는다
const htmlDir = join(OUT, 'html');
mkdirSync(htmlDir, { recursive: true });
const htmlPath = join(htmlDir, `${name}.html`);
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 900, height: 1200 }, deviceScaleFactor: 2 });
let failed = false;
async function layout() {
  writeFileSync(htmlPath, makeHtml());
  const pg = await ctx.newPage();
  pg.on('pageerror', (e) => { console.error('페이지 오류:', e.message); failed = true; });
  await pg.goto(pathToFileURL(htmlPath).href);
  await pg.waitForFunction(() => window.PAGINATED === true, null, { timeout: 300000 });
  return pg;
}

// 1차 배치에서 문항 높이를 재고, DAY마다 단을 꽉 채우는 순서로 객관식을 다시 늘어놓는다(서답형은 늘 마지막).
// 단마다 남은 높이에 들어가는 문항 중 원래 순서가 가장 앞선 것을 넣는다 → 쉬운 문항이 대체로 앞에 남는다.
{
  const pg1 = await layout();
  const m = await pg1.evaluate(() => {
    const h = (el) => { const cs = getComputedStyle(el); return el.getBoundingClientRect().height + parseFloat(cs.marginTop) + parseFloat(cs.marginBottom); };
    const rows = {};
    document.querySelectorAll('.row-q[data-qid]').forEach((r) => { rows[r.dataset.qid] = h(r); });
    const sep = document.querySelector('.row-sep'); 
    const full = Math.max(...[...document.querySelectorAll('.region-day .slot')].map((s) => s.clientHeight));
    const first = {};
    document.querySelectorAll('[id^="dq-"], [id^="day-"]').forEach((t) => { first[t.id.replace(/^(dq|day)-/, '')] = t.closest('.region').querySelector('.slot').clientHeight; });
    return { rows, sep: sep ? h(sep) : 0, full, first };
  });
  await pg1.close();
  for (const d of days) {
    const capFirst = m.first[d.day] || m.full;
    const caps = (k) => (k < 2 ? capFirst : m.full) - 2;
    const left = [...d.qs];
    const order = [];
    let col = 0, used = 0;
    while (left.length) {
      const i = left.findIndex((q) => used + m.rows[q.id] <= caps(col));
      if (i < 0 && used > 0) { col += 1; used = 0; continue; }
      const q = left.splice(Math.max(i, 0), 1)[0];
      order.push(q); used += m.rows[q.id];
    }
    d.qs = order;
  }
  renumber();
}
const page = await layout();
const { pages, warn } = await page.evaluate(() => ({ pages: window.PAGES, warn: window.WARN }));
const over = await page.evaluate(() => {
  const out = [];
  document.querySelectorAll('.page').forEach((pg, i) => {
    pg.querySelectorAll('.slot').forEach((s) => { if (s.scrollHeight > s.clientHeight + 2) out.push(`${i + 1}쪽: 단 아래로 넘침`); });
    pg.querySelectorAll('.q-head').forEach((h) => { if (h.getBoundingClientRect().height > 40) out.push(`${i + 1}쪽: 문제 머리 두 줄`); });
  });
  return out;
});
if (over.length) console.warn('넘침 검사:\n  ' + [...new Set(over)].join('\n  '));
if (warn.length) console.warn('경고:\n  ' + warn.join('\n  '));
await page.pdf({ path: join(OUT, `${name}.pdf`), preferCSSPageSize: true, printBackground: true });
if (wantPng) {
  const dir = join(OUT, 'png', name);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const els = await page.$$('.page');
  for (let i = 0; i < els.length; i++) await els[i].screenshot({ path: join(dir, `${two(i + 1)}.png`) });
}
console.log(`${name}: ${pages}쪽 → 주간지/out/${name}.pdf (객관식 ${qn} · 서답형 ${sn})`);
await browser.close();
if (failed) process.exit(1);
