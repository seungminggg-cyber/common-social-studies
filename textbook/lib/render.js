// 내용(content) → HTML 변환기
//
// 디자인과 상관없이 "무엇이 들어가는지"만 HTML로 만듭니다.
// 색·배치·글꼴은 themes/*.css가 정하고, 쪽 나누기는 lib/paginate.js가 브라우저에서 합니다.

import { figure, FIGURE_TYPES } from './figures.js';

const esc = (s) =>
  String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// 빈칸 하나: 글자마다 칸을 만든다. (학생용은 글자가 투명, 교사용은 보임)
function blank(ans) {
  const cells = [...ans]
    .map((ch) => (ch === ' ' ? '<span class="bsp"></span>' : `<span class="bc">${ch}</span>`))
    .join('');
  return `<span class="blank" data-ans="${ans}"><i class="bn"></i>${cells}</span>`;
}

// 문장 안 표시법: [[빈칸]] **굵게** ==형광펜== __밑줄__
export function inl(s) {
  return esc(s)
    .replace(/\[\[(.+?)\]\]/g, (_, a) => blank(a))
    .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
    .replace(/==(.+?)==/g, '<mark>$1</mark>')
    .replace(/__(.+?)__/g, '<u>$1</u>');
}

const CIRCLED = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩'];
const GANADA = ['ㄱ', 'ㄴ', 'ㄷ', 'ㄹ', 'ㅁ', 'ㅂ'];
const two = (n) => String(n).padStart(2, '0');

// ── 블록 하나 그리기 ─────────────────────────────
function block(b) {
  switch (b.t) {
    case 'sec':
      return `<h2 class="sec"><span class="sec-mark">${esc(b.mark)}</span><span class="sec-title">${inl(b.title)}</span></h2>`;
    case 'item':
      return `<h3 class="item"><span class="item-no">${esc(b.no)}</span><span class="item-title">${inl(b.title)}</span></h3>`
        + (b.body || []).map(block).join('');
    case 'p':
      return `<p class="p${b.serif ? ' serif' : ''}">${inl(b.text)}</p>`;
    case 'ul':
      return `<ul class="ul">${b.items.map((x) => `<li>${inl(x)}</li>`).join('')}</ul>`;
    case 'ol':
      return `<ol class="ol">${b.items.map((x, i) => `<li><span class="ol-n">${CIRCLED[i]}</span><span>${inl(x)}</span></li>`).join('')}</ol>`;
    case 'kv':
      return `<table class="kv"><tbody>${b.rows
        .map(([k, v]) => `<tr><th><span>${inl(k)}</span></th><td>${inl(v)}</td></tr>`)
        .join('')}</tbody></table>`;
    case 'table': {
      // 칸: 글자 또는 { text, rs(세로 합치기), cs(가로 합치기), cls: 'hl'(노랑) | 'em'(굵게) | 'hatch'(빗금 빈칸), align }
      // head: ['a','b'] 한 줄 또는 [['a',{text:'b',cs:2}],['c','d']] 여러 줄
      const cellHtml = (c, tag, align) => {
        const o = c && typeof c === 'object' ? c : { text: c };
        const at = [o.rs > 1 ? ` rowspan="${o.rs}"` : '', o.cs > 1 ? ` colspan="${o.cs}"` : ''].join('');
        const cls = [o.cls, (o.align || align) ? `al-${o.align || align}` : ''].filter(Boolean).join(' ');
        return `<${tag}${at}${cls ? ` class="${cls}"` : ''}>${inl(o.text ?? '')}</${tag}>`;
      };
      const grid = (rows) => {
        // 합친 칸을 고려해 각 칸의 실제 열 번호를 계산
        const taken = [];
        return rows.map((row, r) => {
          let c = 0;
          return row.map((cell) => {
            while (taken[r]?.[c]) c++;
            const o = cell && typeof cell === 'object' ? cell : { text: cell };
            for (let i = 0; i < (o.rs || 1); i++) for (let j = 0; j < (o.cs || 1); j++) ((taken[r + i] ||= [])[c + j] = true);
            const at = c;
            c += o.cs || 1;
            return { cell, col: at };
          });
        });
      };
      const headRows = Array.isArray(b.head?.[0]) ? b.head : b.head ? [b.head] : [];
      const al = b.align || [];
      const rowHead = b.rowHeader !== false;
      const cols = (b.widths || []).map((w) => `<col style="width:${w}%">`).join('');
      const thead = headRows.length
        ? `<thead>${grid(headRows).map((row) => `<tr>${row.map(({ cell }) => cellHtml(cell, 'th')).join('')}</tr>`).join('')}</thead>` : '';
      const tbody = `<tbody>${grid(b.rows).map((row) => `<tr>${row
        .map(({ cell, col }) => cellHtml(cell, col === 0 && rowHead ? 'th' : 'td', al[col]))
        .join('')}</tr>`).join('')}</tbody>`;
      const table = `<table class="tbl${b.compact ? ' compact' : ''}">${cols ? `<colgroup>${cols}</colgroup>` : ''}${thead}${tbody}</table>`;
      const simple = !b.rows.some((r) => r.some((c) => c && typeof c === 'object')) && headRows.length === 1;
      // 좁은 단(2단 디자인)에서 쓰는 "쌓은 표" — 테마 CSS가 둘 중 하나만 보여 준다.
      const stack = b.stack && simple
        ? `<div class="tbl-stack">${b.rows
            .map((r) => `<div class="ts-card"><div class="ts-h">${inl(r[0])}</div>${r
              .slice(1)
              .map((c, i) => `<div class="ts-row"><span class="ts-k">${inl(headRows[0][i + 1])}</span><span class="ts-v">${inl(c)}</span></div>`)
              .join('')}</div>`)
            .join('')}</div>`
        : '';
      const title = b.title ? `<div class="tbl-title">${inl(b.title)}</div>` : '';
      const foot = b.source || b.note
        ? `<div class="fig-foot">${b.note ? `<span class="fig-note">${inl(b.note)}</span>` : ''}${b.source ? `<span class="fig-src">${esc(b.source)}</span>` : ''}</div>` : '';
      return `<div class="tbl-wrap${stack ? ' stackable' : ''}">${title}${table}${stack}${foot}</div>`;
    }
    case 'chart':
    case 'venn':
    case 'map':
      return figure(b);
    case 'hub':
      return `<div class="hub"><div class="hub-center"><span>${inl(b.center)}</span></div>${b.spokes
        .map((s, i) => `<div class="hub-spoke s${i + 1}"><b>${inl(s.title)}</b><span>${inl(s.text)}</span></div>`)
        .join('')}</div>`;
    case 'compare':
      return `<div class="compare"><div class="cmp-title"><span>${inl(b.title)}</span></div><div class="cmp-cols">${b.cols
        .map((c) => `<div class="cmp-col"><div class="cmp-h">${inl(c.title)}</div><ul>${c.items.map((x) => `<li>${inl(x)}</li>`).join('')}</ul></div>`)
        .join('<div class="cmp-vs"><span>VS</span></div>')}</div></div>`;
    case 'dialog':
      return `<div class="dialog">${b.rows
        .map(([who, text]) => `<div class="dl-row"><span class="dl-who">${inl(who)}</span><span class="dl-text">${inl(text)}</span></div>`)
        .join('')}</div>`;
    case 'source':
      return `<div class="source"><div class="src-tab"><span class="src-label">자료 읽기</span><span class="src-title">${inl(b.title)}</span></div>
        <div class="src-body">${b.caption ? `<div class="src-cap">${inl(b.caption)}</div>` : ''}${
          b.dialog ? block({ t: 'dialog', rows: b.dialog }) : ''}${b.text ? `<p class="p serif">${inl(b.text)}</p>` : ''}</div>
        <div class="src-interp"><span class="interp-label">해석</span>${inl(b.interp)}</div></div>`;
    case 'tip':
      return `<div class="tip"><div class="tip-who"><span class="tip-avatar">T</span><span class="tip-name">승민T 한마디</span></div><div class="tip-text">${inl(b.text)}</div></div>`;
    case 'example':
      return `<div class="example"><div class="ex-tab"><span class="ex-label">해석 연습</span><span class="ex-title">${inl(b.title)}</span></div>
        <div class="ex-body">${b.stem ? `<div class="ex-stem">${inl(b.stem)}</div>` : ''}${block(b.data)}
        <ol class="ex-steps">${b.steps.map((x, i) => `<li><span class="ex-n">STEP ${i + 1}</span><span>${inl(x)}</span></li>`).join('')}</ol></div></div>`;
    case 'chain':
      return `<div class="chain">${b.title ? `<div class="chain-title">${inl(b.title)}</div>` : ''}<div class="chain-steps">${b.steps
        .map((x) => `<span class="ch-step">${inl(x)}</span>`)
        .join('<span class="ch-arrow">→</span>')}</div></div>`;
    case 'flow':
      return `<ol class="flow">${b.steps
        .map((s, i) => `<li><span class="fl-no">${i + 1}</span><div class="fl-title">${inl(s.title)}</div><div class="fl-text">${inl(s.text)}</div></li>`)
        .join('')}</ol>`;
    default:
      throw new Error(`모르는 블록 종류: ${b.t}`);
  }
}

function note(side) {
  if (!side) return '<aside class="side empty"></aside>';
  const body = side.items
    ? `<ul>${side.items.map((x) => `<li>${inl(x)}</li>`).join('')}</ul>`
    : `<p>${inl(side.text)}</p>`;
  return `<aside class="side"><div class="note"><div class="note-head"><span class="note-tag">개념 더하기</span><span class="note-title">${inl(side.title)}</span></div>${body}</div></aside>`;
}

// 쪽 나누기의 단위. 제목(sec)은 다음 블록과 같은 쪽에 붙어 다닌다(data-keep).
function row(b) {
  const keep = b.t === 'sec' ? ' data-keep="next"' : '';
  return `<div class="row row-${b.t}${b.side ? ' has-side' : ''}"${keep}><div class="main">${block(b)}</div>${note(b.side)}</div>`;
}

// ── 단원 첫머리 (큰 번호 + 제목 + 핵심 질문 + 수능 포인트) ──
function opener(book, u) {
  return `<div class="top">
    <div class="opener">
      <div class="op-deco"><i></i><i></i><i></i></div>
      <div class="op-no">${esc(u.no)}</div>
      <div class="op-text"><div class="op-chapter">${esc(book.chapter.no)}. ${esc(book.chapter.title)}</div><h1 class="op-title">${esc(u.title)}</h1></div>
      <div class="op-sub">승민T 판서 노트</div>
    </div>
    <div class="goal">
      <div class="goal-box goal-q"><div class="goal-label">핵심 질문</div><ul>${u.questions
        .map((q, i) => `<li><span class="gq-n">Q${i + 1}</span><span>${inl(q)}</span></li>`)
        .join('')}</ul></div>
      <div class="goal-box goal-p"><div class="goal-label">수능 포인트</div><p>${inl(u.point)}</p></div>
    </div>
  </div>`;
}

function bandTop(kind, title, u) {
  return `<div class="top"><div class="band band-${kind}"><span class="band-title">${esc(title)}</span>${
    u ? `<span class="band-unit"><b>${esc(u.no)}</b> ${esc(u.title)}</span>` : ''}</div></div>`;
}

// ── 개념 확인 (OX · 빈칸) ──
function checkRows(u) {
  const out = [];
  out.push(`<div class="row row-ins" data-keep="next"><div class="main"><div class="ins">다음 문장이 맞으면 O, 틀리면 X에 표시하시오.</div></div></div>`);
  u.check.ox.forEach(([q, a], i) => {
    out.push(`<div class="row row-ox"><div class="main"><div class="ox"><span class="ck-no">${two(i + 1)}</span><span class="ox-q">${inl(q)}</span><span class="ox-a"><i class="${a === 'O' ? 'ok' : ''}">O</i><i class="${a === 'X' ? 'ok' : ''}">X</i></span></div></div></div>`);
  });
  out.push(`<div class="row row-ins" data-keep="next"><div class="main"><div class="ins">다음 빈칸에 알맞은 말을 쓰시오.</div></div></div>`);
  const n0 = u.check.ox.length;
  u.check.blank.forEach(([q, a], i) => {
    const html = esc(q).replace('(    )', `<span class="fill" data-ans="${esc(a)}"><span>${esc(a)}</span></span>`);
    out.push(`<div class="row row-fill"><div class="main"><div class="fillq"><span class="ck-no">${two(n0 + i + 1)}</span><span class="fill-q">${html}</span></div></div></div>`);
  });
  return out.join('\n');
}

// ── 수능형 문제 ──
function question(q, n) {
  const short = q.choices.every((c) => c.length <= 9);
  const data = (q.data || []).map((d) => (d.t === 'table' ? block(d) : block(d))).join('');
  const bogi = q.bogi
    ? `<div class="bogi"><div class="bogi-t"><span>보기</span></div><ul>${q.bogi
        .map((x, i) => `<li><b>${GANADA[i]}.</b> <span>${inl(x)}</span></li>`)
        .join('')}</ul></div>`
    : '';
  const choices = `<ol class="choices${short ? ' short' : ''}">${q.choices
    .map((c, i) => `<li class="${q.answer === i + 1 ? 'ok' : ''}"><span class="cn">${CIRCLED[i]}</span><span>${inl(c)}</span></li>`)
    .join('')}</ol>`;
  return `<div class="row row-q"><div class="main"><div class="q">
    <div class="q-head"><span class="q-no">${two(n)}</span><span class="q-lv lv-${q.level}" title="난이도">${esc(q.level)}</span></div>
    <div class="q-stem">${inl(q.stem)}</div>
    ${data ? `<div class="q-data">${data}</div>` : ''}
    ${bogi}${choices}
    <div class="q-explain"><b>정답 ${CIRCLED[q.answer - 1]}</b> ${inl(q.explain)}</div>
  </div></div></div>`;
}

// ── 정답과 해설 ──
function answerRows(u, startNo) {
  const ox = u.check.ox.map(([, a], i) => `<span><b>${two(i + 1)}</b> ${a}</span>`).join('');
  const n0 = u.check.ox.length;
  const bl = u.check.blank.map(([, a], i) => `<span><b>${two(n0 + i + 1)}</b> ${esc(a)}</span>`).join('');
  const out = [
    `<div class="row row-ah" data-keep="next"><div class="main"><div class="ans-unit"><b>${esc(u.no)}</b> ${esc(u.title)}</div></div></div>`,
    `<div class="row row-ac"><div class="main"><div class="ans-check"><div class="ans-label">개념 확인</div><div class="ans-list">${ox}${bl}</div></div></div></div>`,
  ];
  u.exam.forEach((q, i) => {
    out.push(`<div class="row row-ae"><div class="main"><div class="ans-q"><div class="aq-h"><span class="aq-no">${two(startNo + i)}</span><span class="aq-a">${CIRCLED[q.answer - 1]}</span></div><p>${inl(q.explain)}</p></div></div></div>`);
  });
  return out.join('\n');
}

// ── 책 전체 ──
export function renderBook(book, { theme, themeName, mode, layout, paginateJs }) {
  const headLeft = `${esc(book.subject)} <b>${esc(book.chapter.no)}. ${esc(book.chapter.title)}</b>`;
  const sections = [];

  sections.push(`<section class="flow" data-kind="cover"><div class="top"><div class="cover">
    <div class="cv-deco"><i></i><i></i><i></i></div>
    <div class="cv-brand">승민T 통합사회</div>
    <div class="cv-title">개념서</div>
    <div class="cv-sub">${esc(book.subject)} · 2022 개정 교육과정 · 수능 대비</div>
    <div class="cv-theme">${esc(themeName)}</div>
    <div class="cv-unit">${esc(book.chapter.no)}. ${esc(book.chapter.title)} (샘플)</div>
  </div></div></section>`);

  let qNo = 1;
  const qStart = [];
  for (const u of book.units) {
    const headRight = `${esc(u.no)} ${esc(u.title)}`;
    const attrs = `data-tab="${esc(book.chapter.no)}" data-head-left="${esc(headLeft)}" data-head-right="${esc(headRight)}"`;
    sections.push(`<section class="flow" data-kind="concept" ${attrs}>${opener(book, u)}${u.concept.map(row).join('\n')}</section>`);
    if (u.check?.ox?.length || u.check?.blank?.length)
      sections.push(`<section class="flow" data-kind="check" ${attrs}>${bandTop('check', '개념 확인', u)}${checkRows(u)}</section>`);
    qStart.push(qNo);
    if (u.exam?.length)
      sections.push(`<section class="flow" data-kind="exam" ${attrs}>${bandTop('exam', '수능형 문제', u)}${u.exam
        .map((q) => question(q, qNo++))
        .join('\n')}</section>`);
  }
  if (book.units.some((u) => u.exam?.length)) sections.push(`<section class="flow" data-kind="answers" data-tab="답" data-head-left="${esc(headLeft)}" data-head-right="정답과 해설">${bandTop('answers', '정답과 해설')}${book.units
    .map((u, i) => answerRows(u, qStart[i]))
    .join('\n')}</section>`);

  return `<!doctype html>
<html lang="ko"><head>
<meta charset="utf-8">
<title>승민T 통합사회 개념서 — ${esc(themeName)}</title>
<link rel="stylesheet" href="../node_modules/@fontsource/noto-serif-kr/400.css">
<link rel="stylesheet" href="../node_modules/@fontsource/noto-serif-kr/600.css">
<link rel="stylesheet" href="../node_modules/@fontsource/nanum-pen-script/400.css">
<style>
@font-face { font-family: 'Pretendard Variable'; font-weight: 45 920; font-style: normal; font-display: block;
  src: url('../node_modules/pretendard/dist/web/variable/woff2/PretendardVariable.woff2') format('woff2-variations'); }
</style>
<link rel="stylesheet" href="../themes/base.css">
<link rel="stylesheet" href="../themes/${theme}.css">
</head>
<body class="theme-${theme} mode-${mode}">
<div id="book"></div>
<div id="source">${sections.join('\n')}</div>
<script>window.LAYOUT = ${JSON.stringify(layout)};</script>
<script>${paginateJs}</script>
</body></html>`;
}
