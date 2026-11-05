// 내용(content) → HTML 변환기
//
// 디자인과 상관없이 "무엇이 들어가는지"만 HTML로 만듭니다.
// 색·배치·글꼴은 themes/*.css가 정하고, 쪽 나누기는 lib/paginate.js가 브라우저에서 합니다.

import { figure, FIGURE_TYPES } from './figures.js';
import { icon } from './icons.js';
import { hasPhoto, photoUrl, collectPhotos, credits, creditsData } from './photos.js';

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
    case 'diagram':
    case 'photo':
      return figure(b, inl);
    case 'figrow': {
      // 그림 여러 개를 가로로 나란히 (기후 그래프 비교 등). 한글 파일에는 줄 전체를 한 장의 그림으로 넣는다.
      const foot = b.source || b.note
        ? `<div class="fig-foot">${b.note ? `<span class="fig-note">${inl(b.note)}</span>` : ''}${b.source ? `<span class="fig-src">${esc(b.source)}</span>` : ''}</div>` : '';
      return `<div class="figrow-wrap">${b.title ? `<div class="tbl-title">${inl(b.title)}</div>` : ''}<div class="figrow"${
        b._fig ? ` data-row="${b._fig}"` : ''} style="grid-template-columns:repeat(${b.items.length},1fr)">${b.items.map((x) => figure(x, inl)).join('')}</div>${foot}</div>`;
    }
    case 'hub':
      return `<div class="hub"><div class="hub-center"><span>${inl(b.center)}</span></div>${b.spokes
        .map((s, i) => `<div class="hub-spoke s${i + 1}">${s.icon ? `<span class="hub-ic">${icon(s.icon, { size: 16 })}</span>` : ''}<b>${inl(s.title)}</b><span>${inl(s.text)}</span></div>`)
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
        .map((x) => (typeof x === 'object' ? `<span class="ch-step">${x.icon ? icon(x.icon, { size: 14, cls: 'ic ch-ic' }) : ''}${inl(x.text)}</span>` : `<span class="ch-step">${inl(x)}</span>`))
        .join('<span class="ch-arrow">→</span>')}</div></div>`;
    case 'flow':
      return `<ol class="flow">${b.steps
        .map((s, i) => `<li${s.icon ? ' class="has-ic"' : ''}><span class="fl-no">${i + 1}</span>${s.icon ? `<span class="fl-ic">${icon(s.icon, { size: 18 })}</span>` : ''}<div class="fl-title">${inl(s.title)}</div><div class="fl-text">${inl(s.text)}</div></li>`)
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

// 사상가 카드 — 머리+핵심 주장 / 원전 읽기 / 기출 선지 를 따로 줄(row)로 만들어 쪽을 넘겨도 이어지게
function thinkerRows(b) {
  const parts = [];
  const keys = (b.keywords || []).map((k) => `<span class="tk-key">${inl(k)}</span>`).join('');
  const terms = b.terms
    ? `<dl class="tk-terms">${b.terms.map(([k, v]) => `<div><dt>${inl(k)}</dt><dd>${inl(v)}</dd></div>`).join('')}</dl>` : '';
  const face = hasPhoto(b.photo) ? `<img class="tk-photo" src="${photoUrl(b.photo)}" alt="" style="object-position:${b.photoPos || '50% 22%'}">` : '';
  parts.push(`<div class="tk tk-head${face ? ' has-photo' : ''}" data-initial="${esc([...String(b.name)][0])}">${face}<div class="tk-top"><span class="tk-name">${inl(b.name)}</span>${
    b.era ? `<span class="tk-era">${esc(b.era)}</span>` : ''}</div>${keys ? `<div class="tk-keys">${keys}</div>` : ''}</div>`
    + `<div class="tk tk-body"><div class="tk-label">핵심 주장</div><ol class="tk-claims">${b.claims
      .map((c, i) => `<li><span class="tk-n">${i + 1}</span><span>${inl(c)}</span></li>`).join('')}</ol>${terms}</div>`);
  if (b.quotes?.length)
    parts.push(`<div class="tk tk-quote"><div class="tk-label">원전 읽기</div>${b.quotes
      .map((q) => `<div class="tk-q"><p class="serif">${inl(q.text)}</p><div class="tk-from">— ${esc(q.from)}</div>${
        q.note ? `<div class="tk-qnote"><span class="tk-ql">풀이</span> ${inl(q.note)}</div>` : ''}</div>`).join('')}</div>`);
  if (b.ox?.length)
    parts.push(`<div class="tk tk-ox"><div class="tk-label">기출 선지로 확인하기</div><table class="tk-oxt"><tbody>${b.ox
      .map(([st, a, why]) => `<tr><td class="tk-s">${inl(st)}</td><td class="tk-a"><span class="${a === 'O' ? 'o' : 'x'}">${a}</span></td><td class="tk-why">${why ? inl(why) : ''}</td></tr>`)
      .join('')}</tbody></table>${b.vs ? `<div class="tk-vs"><b>헷갈리지 말자</b> ${inl(b.vs)}</div>` : ''}</div>`);
  // 카드 조각은 data-keep="card"로 묶여 한 쪽에 통째로 들어간다(쪽보다 클 때만 조각 경계에서 나뉨).
  // 나뉜 경우 다음 쪽 맨 위 조각에 "(이어서)" 이름표가 보인다.
  const cont = `<div class="tk-cont">${inl(b.name)} <span>(이어서)</span></div>`;
  return parts
    .map((h, i) => `<div class="row row-tk${i === 0 ? ' tk-first' : ''}${i === parts.length - 1 ? ' tk-last' : ''}"${
      i < parts.length - 1 ? ' data-keep="card"' : ''} data-tk="${esc(b.name)}"><div class="main">${i ? cont : ''}${h}</div></div>`)
    .join('');
}

// 쪽 나누기의 단위. 제목(sec)은 다음 블록과 같은 쪽에 붙어 다닌다(data-keep).
function row(b) {
  if (b.t === 'thinker') return thinkerRows(b);
  if (b.t === 'photo' && !b.items.some((it) => hasPhoto(it.src))) return ''; // 사진을 아직 못 받았으면 건너뜀
  const keep = b.t === 'sec' ? ' data-keep="next"' : '';
  return `<div class="row row-${b.t}${b.side ? ' has-side' : ''}"${keep}><div class="main">${block(b)}</div>${note(b.side)}</div>`;
}

// ── 단원 첫머리 (큰 번호 + 제목 + 핵심 질문 + 수능 포인트) ──
function opener(book, u) {
  return `<div class="top" id="u${esc(u.no)}">
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
  const id = u && (kind === 'check' || kind === 'exam') ? ` id="${kind[0]}${esc(u.no)}"` : '';
  return `<div class="top"${id}><div class="band band-${kind}"><span class="band-title">${esc(title)}</span>${
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

// 책 끝 '사진 출처' 쪽 (위키미디어 공용 사진의 저작자·라이선스·주소)
function creditsSection(root, attrs) {
  const ids = collectPhotos(root);
  const C = credits(), D = creditsData();
  const item = (id) => {
    const c = C[id];
    const who = c.attribution || c.author || '작자 미상';
    return `<li><b>${esc(c.caption || '')}</b> — ${esc(who)}${c.authorUrl ? ` (${esc(c.authorUrl)})` : ''}, ${esc(c.license)}${c.licenseUrl ? ` (${esc(c.licenseUrl)})` : ''}, 위키미디어 공용 「${esc((c.title || '').replace(/^File:/, ''))}」 ${esc(c.page || '')}</li>`;
  };
  // 쪽 나눔(paginate.js)은 .row 단위로 옮기므로, 목록을 몇 줄씩 .row로 나눠 담는다
  const rows = [];
  if (ids.length) {
    rows.push(`<div class="row"><p class="credits">${esc(D.photoIntro)}</p></div>`);
    for (let i = 0; i < ids.length; i += 4) rows.push(`<div class="row"><ol class="cr-list" start="${i + 1}">${ids.slice(i, i + 4).map(item).join('')}</ol></div>`);
  }
  rows.push(`<div class="row" data-keep="next"><h4 class="cr-h">${esc(D.dataTitle)}</h4></div>`);
  for (let i = 0; i < D.data.length; i += 3) rows.push(`<div class="row"><dl class="cr-data">${D.data.slice(i, i + 3).map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl></div>`);
  rows.push(`<div class="row"><p class="cr-small"><b>AWS Terrain Tiles 원문 출처</b> ${D.terrain.map(esc).join(' ')}</p></div>`);
  rows.push(`<div class="row"><p class="cr-small">${esc(D.mit)}</p></div>`);
  return `<section class="flow" data-kind="credits" ${attrs}>${bandTop('answers', '사진·자료 출처')}${rows.join('')}</section>`;
}

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
  sections.push(creditsSection(book.units, `data-tab="출처" data-head-left="${esc(headLeft)}" data-head-right="사진·자료 출처"`));

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
<body class="theme-${theme === 'd' ? 'b theme-d' : theme} mode-${mode}">
<div id="book"></div>
<div id="source">${sections.join('\n')}</div>
<script>window.LAYOUT = ${JSON.stringify(layout)};</script>
<script>${paginateJs}</script>
</body></html>`;
}

// ── 통합본: 여러 대단원을 한 권으로 ─────────────────
// part 'book'    : 표지 → 이 책의 주인 → 차례 → 이 책의 구성 → (간지 → 학습 계획표 → 중단원들) × 대단원
// part 'answers' : 별책 정답과 해설 (표지 → 대단원별 정답과 해설)
// 간지(data-odd)는 양면 인쇄에서 늘 오른쪽(홀수) 쪽에 오도록 paginate.js가 필요할 때 메모 쪽을 끼운다.
// 쪽 번호가 필요한 곳은 data-pg="찾을 id" 를 달아 두면 쪽 나누기가 끝난 뒤 채워진다.
export function renderFull(full, { mode, layout, paginateJs, part = 'book', theme = 'b' }) {
  const { subject, chapters } = full;
  const sections = [];
  const add = (kind, attrs, inner) => sections.push(`<section class="flow" data-kind="${kind}" ${attrs || ''}>${inner}</section>`);
  const chapterList = chapters.map((ch) => `<li><b>${esc(ch.chapter.no)}</b><span>${esc(ch.chapter.title)}</span></li>`).join('');
  const unitsOf = (ch) => ch.units;

  if (part === 'answers') {
    add('cover', '', `<div class="top"><div class="cover cover-ans">
      <div class="cv-brand">승민T 통합사회 · 개념서 별책</div>
      <div class="cv-title">정답과<br>해설</div>
      <div class="cv-sub">${esc(subject)} · 개념 확인과 수능형 문제의 정답, 해설</div>
      <ul class="cv-chapters">${chapterList}</ul>
    </div></div>`);
    chapters.forEach((ch) => {
      let q = 1;
      const starts = ch.units.map((u) => { const k = q; q += u.exam?.length || 0; return k; });
      add('answers', `data-tab="${esc(ch.chapter.no)}" data-head-left="${esc(subject)} <b>정답과 해설</b>" data-head-right="${esc(ch.chapter.no)}. ${esc(ch.chapter.title)}"`,
        `${bandTop('answers', `${ch.chapter.no}. ${ch.chapter.title}`)}${ch.units.map((u, i) => answerRows(u, starts[i])).join('\n')}`);
    });
  } else {
    // 표지
    add('cover', '', `<div class="top"><div class="cover">
      <div class="cv-brand">승민T 통합사회</div>
      <div class="cv-title">개념서</div>
      <div class="cv-sub">${esc(subject)} · 2022 개정 교육과정 · 수능 대비</div>
      ${mode === 'teacher' ? '<div class="cv-badge">교사용</div>' : ''}
      <ul class="cv-chapters">${chapterList}</ul>
    </div></div>`);
    // 표지 뒤: 이 책의 주인 (+ 특강 진도표가 있으면 함께)
    const sc = full.schedule;
    if (sc) add('owner', '', `<div class="top"><div class="owner owner-plan">
      <div class="ow-box ow-compact"><div class="ow-title">이 책의 주인</div><div class="ow-grid">
        <div class="ow-line"><span>학교</span><i></i></div><div class="ow-line"><span>학년 · 반</span><i></i></div>
        <div class="ow-line"><span>이름</span><i></i></div><div class="ow-line"><span>연락처</span><i></i></div></div>
      </div>
      <div class="sch"><div class="sch-head"><span class="sch-title">${esc(sc.title)}</span><span class="sch-sub">한 주에 한 번 · 3시간</span></div>
        <table class="sch-t"><thead><tr><th>주차</th><th>날짜</th><th>교재</th><th>범위</th><th>쪽</th><th>숙제</th><th>쪽지 시험</th></tr></thead><tbody>${sc.weeks
          .map((w, i) => `<tr class="${w.book === subject ? 'this' : 'other'}"><td class="sc-no">${i + 1}주</td><td class="sc-date">월 &nbsp;&nbsp; 일</td><td class="sc-book">${esc(w.book)}</td><td class="sc-range">${esc(w.range)}</td><td class="sc-pg">${
            w.pages ? `<span data-pgr="${w.pages.join('|')}"></span>` : w.book === subject ? '' : esc(w.vol || '2권')}</td><td class="sc-chk"><i></i></td><td class="sc-score">&nbsp;&nbsp;&nbsp;점</td></tr>`).join('')}</tbody></table>
        <div class="sch-flow">${sc.flow.map(([t, m, d]) => `<div><b>${esc(t)}</b><span class="sf-m">${esc(m)}</span><span class="sf-d">${esc(d)}</span></div>`).join('<i>→</i>')}</div>
        <div class="sch-hw">${inl(sc.homework)}</div>
      </div>
      <div class="ow-note">이 책의 설명·자료·문제는 승민T 통합사회 수업을 위해 새로 쓴 것입니다. 사상가의 글은 원전을 새로 옮기거나 요지만 정리했고,
      그래프와 지도의 출처는 각 그림 아래에 적었습니다. "개념도"는 원리를 보여 주려고 단순하게 그린 그림, "가상 자료"는 실제 값이 아닌 연습용 자료입니다.</div>
    </div></div>`);
    else add('owner', '', `<div class="top"><div class="owner">
      <div class="ow-box"><div class="ow-title">이 책의 주인</div>
        <div class="ow-line"><span>학교</span><i></i></div>
        <div class="ow-line"><span>학년 · 반</span><i></i></div>
        <div class="ow-line"><span>이름</span><i></i></div>
        <div class="ow-line"><span>공부 시작한 날</span><i></i></div>
      </div>
      <div class="ow-note">이 책의 설명·자료·문제는 승민T 통합사회 수업을 위해 새로 쓴 것입니다. 사상가의 글은 원전을 새로 옮기거나 요지만 정리했고,
      그래프와 지도의 출처는 각 그림 아래에 적었습니다. "개념도"는 원리를 보여 주려고 단순하게 그린 그림, "가상 자료"는 실제 값이 아닌 연습용 자료입니다.</div>
    </div></div>`);
    // 차례
    const tocUnits = (ch) => unitsOf(ch).map((u) => `<li class="toc-u"><span class="toc-no">${esc(u.no)}</span><span class="toc-t">${esc(u.title)}</span>
        <span class="toc-sub">개념 확인 <i data-pg="c${esc(u.no)}"></i> · 수능형 문제 <i data-pg="e${esc(u.no)}"></i></span><span class="toc-dots"></span><span class="toc-pg" data-pg="u${esc(u.no)}"></span></li>`).join('');
    add('toc', '', `<div class="top"><div class="toc"><div class="toc-head"><span class="toc-title">차례</span><span class="toc-en">CONTENTS</span></div>
      <ul class="toc-list"><li class="toc-guide"><span class="toc-t">이 책의 구성</span><span class="toc-dots"></span><span class="toc-pg" data-pg="guide"></span></li>
      ${chapters.map((ch, i) => `<li class="toc-ch"><span class="toc-chno">${esc(ch.chapter.no)}</span><span class="toc-t">${esc(ch.chapter.title)}</span><span class="toc-dots"></span><span class="toc-pg" data-pg="ch${i}"></span></li>${tocUnits(ch)}`).join('')}
      </ul><div class="toc-foot">별책 · 정답과 해설</div></div></div>`);
    // 이 책의 구성
    const GUIDE = [
      ['간지 · 학습 계획표', '대단원을 시작하기 전에 중단원 목록과 꼭 잡을 내용을 확인하고, 뒷면의 계획표에 공부한 날과 점수를 적는다.'],
      ['단원 첫머리', '핵심 질문 두 개와 수능 포인트. 시험에 어떤 자료와 선지로 나오는지 먼저 보고 시작한다.'],
      ['개념 정리', `${esc(full.basis || '교과서 9종의 공통 내용')}을 수능에 맞게 정리했다. <b>굵은 글씨</b>는 핵심어, <mark>형광펜</mark>은 시험에 그대로 나오는 문장이다.`],
      ['빈칸과 빈칸 정답 띠', '본문의 번호 빈칸을 직접 채운다. 정답은 그 쪽 맨 아래 띠에 있으니 채운 뒤에 확인한다.'],
      ['개념 더하기', '본문 아래 회색 상자. 용어 뜻, 헷갈리는 개념, 교과서마다 다른 표현을 정리했다.'],
      ['사상가 카드', '핵심 주장 → 원전 읽기 → 기출 선지로 확인하기 → 헷갈리지 말자. 사상가 문제는 카드 한 장으로 끝낸다.'],
      ['그래프 · 지도 · 표', '수능 자료와 같은 모양으로 그렸다. 그림 아래의 설명과 출처, "개념도·가상 자료" 표시를 꼭 함께 읽는다.'],
      ['자료 읽기 · 해석 연습', '제시문과 자료를 읽는 법을 단계(STEP)별로 연습한다. 함정 선지가 어디서 나오는지 표시했다.'],
      ['승민T 한마디', '그 중단원에서 시험 직전에 다시 볼 한 줄 정리.'],
      ['정리 노트 · 오답 노트', '쪽 아래 남는 칸. 핵심어를 다시 쓰거나 틀린 문제와 다시 볼 쪽을 적는다.'],
      ['개념 확인', 'O/X와 빈칸 채우기로 개념을 점검한다. 맞힌 개수를 학습 계획표에 적는다.'],
      ['수능형 문제', '학력평가·수능 예시문항과 같은 형식의 새 문제. 정답과 해설은 별책에 있다.'],
    ];
    add('guide', '', `<div class="top" id="guide"><div class="guide"><div class="band band-guide"><span class="band-title">이 책의 구성</span><span class="band-unit">이렇게 공부하세요</span></div>
      <ol class="guide-list">${GUIDE.map(([t, d], i) => `<li><span class="gd-n">${two(i + 1)}</span><div><b>${t}</b><p>${d}</p></div></li>`).join('')}</ol>
      <div class="guide-flow"><span>1회독</span> 개념 정리를 읽으며 빈칸 채우기 → <span>2회독</span> 개념 확인과 수능형 문제 풀기 → <span>시험 직전</span> 승민T 한마디·오답 노트 다시 보기</div>
    </div></div>`);

    chapters.forEach((ch, ci) => {
      const d = full.dividers?.[ch.chapter.no] || {};
      const headLeft = `${esc(subject)} <b>${esc(ch.chapter.no)}. ${esc(ch.chapter.title)}</b>`;
      // 간지 (오른쪽 쪽)
      add('divider', `data-odd="1" data-tab="${esc(ch.chapter.no)}"`, `<div class="top" id="ch${ci}"><div class="divider">
        <div class="dv-bg">${esc(ch.chapter.no)}</div>
        <div class="dv-label">대단원 ${ci + 1}</div>
        <div class="dv-no">${esc(ch.chapter.no)}</div>
        <div class="dv-title">${esc(ch.chapter.title)}</div>
        ${d.lead ? `<div class="dv-lead">${inl(d.lead)}</div>` : ''}
        <ol class="dv-units">${unitsOf(ch).map((u) => `<li><b>${esc(u.no)}</b><span>${esc(u.title)}</span><i data-pg="u${esc(u.no)}"></i></li>`).join('')}</ol>
        ${d.keys ? `<div class="dv-keys"><div class="dv-kt">이 대단원에서 꼭 잡을 것</div><ul>${d.keys.map((k) => `<li>${inl(k)}</li>`).join('')}</ul></div>` : ''}
      </div></div>`);
      // 간지 뒷면: 학습 계획표
      const rows = unitsOf(ch).map((u) => {
        const nc = (u.check?.ox?.length || 0) + (u.check?.blank?.length || 0);
        return `<tr><td class="pl-u"><b>${esc(u.no)}</b> ${esc(u.title)}</td><td class="pl-pg" data-pg="u${esc(u.no)}"></td><td>월 &nbsp;&nbsp; 일</td><td>월 &nbsp;&nbsp; 일</td><td>&nbsp;&nbsp;&nbsp; / ${nc}</td><td>&nbsp;&nbsp;&nbsp; / ${u.exam?.length || 0}</td></tr>`;
      }).join('');
      add('plan', `data-tab="${esc(ch.chapter.no)}" data-head-left="${headLeft}" data-head-right="학습 계획표"`, `<div class="top"><div class="plan">
        <div class="band band-plan"><span class="band-title">학습 계획표</span><span class="band-unit"><b>${esc(ch.chapter.no)}</b> ${esc(ch.chapter.title)}</span></div>
        <table class="plan-t"><thead><tr><th>중단원</th><th>쪽</th><th>1회독</th><th>2회독</th><th>개념 확인</th><th>수능형 문제</th></tr></thead><tbody>${rows}</tbody></table>
        <ul class="plan-how"><li><b>1회독</b> 개념 정리를 읽고 빈칸을 채운 날을 적는다.</li><li><b>2회독</b> 개념 확인·수능형 문제를 다시 푼 날을 적는다.</li><li>맞힌 개수가 80%가 안 되는 중단원은 시험 전에 한 번 더 본다.</li></ul>
        <div class="memo plan-memo"><div class="memo-head"><span class="memo-tag">나의 목표</span><span class="memo-q">이 대단원을 마치면 꼭 설명할 수 있어야 할 것을 적어 보자.</span></div><div class="memo-lines"></div></div>
      </div></div>`);
      // 중단원들 (수능형 문제 번호는 대단원마다 01부터)
      let qNo = 1;
      for (const u of ch.units) {
        const attrs = `data-tab="${esc(ch.chapter.no)}" data-head-left="${headLeft}" data-head-right="${esc(u.no)} ${esc(u.title)}"`;
        add('concept', attrs, `${opener(ch, u)}${u.concept.map(row).join('\n')}`);
        if (u.check?.ox?.length || u.check?.blank?.length) add('check', attrs, `${bandTop('check', '개념 확인', u)}${checkRows(u)}`);
        if (u.exam?.length) add('exam', attrs, `${bandTop('exam', '수능형 문제', u)}${u.exam.map((q) => question(q, qNo++)).join('\n')}`);
      }
    });
    // 사진 출처
    const cr = creditsSection(full.chapters, `data-tab="출처" data-head-left="${esc(subject)}" data-head-right="사진·자료 출처"`);
    if (cr) add('credits', `data-tab="출처" data-head-left="${esc(subject)}" data-head-right="사진·자료 출처"`, cr.replace(/^<section[^>]*>|<\/section>$/g, ''));
    // 뒤표지 (양면 인쇄에서 늘 왼쪽 쪽 = 마지막 쪽)
    add('backcover', `data-even="1"`, `<div class="top" id="back"><div class="cover cover-back">
      <div class="cv-brand">승민T 통합사회</div>
      <div class="bk-title">${esc(subject)} 개념서</div>
      <ul class="bk-points">
        <li>${esc(full.basis || '교과서 9종의 공통 내용')}을 수능에 맞게 정리한 개념 정리</li>
        <li>2028 수능 예시문항과 학력평가를 분석한 수능 포인트·자료 해석 연습</li>
        <li>사상가 카드와 초상, 실제 지형을 살린 지도, 실제 통계 그래프와 개념 인포그래픽, 현장 사진</li>
        <li>개념 확인 O/X·빈칸과 수능형 문제, 별책 정답과 해설</li>
      </ul>
      <ul class="cv-chapters">${chapterList}</ul>
    </div></div>`);
  }

  const title = part === 'answers' ? `승민T 통합사회 개념서 ${subject} — 정답과 해설` : `승민T 통합사회 개념서 ${subject}${mode === 'teacher' ? ' (교사용)' : ''}`;
  return `<!doctype html>
<html lang="ko"><head>
<meta charset="utf-8">
<title>${esc(title)}</title>
<link rel="stylesheet" href="../node_modules/@fontsource/noto-serif-kr/400.css">
<link rel="stylesheet" href="../node_modules/@fontsource/noto-serif-kr/600.css">
<link rel="stylesheet" href="../node_modules/@fontsource/nanum-pen-script/400.css">
<style>
@font-face { font-family: 'Pretendard Variable'; font-weight: 45 920; font-style: normal; font-display: block;
  src: url('../node_modules/pretendard/dist/web/variable/woff2/PretendardVariable.woff2') format('woff2-variations'); }
</style>
<link rel="stylesheet" href="../themes/base.css">
<link rel="stylesheet" href="../themes/${theme}.css">
<link rel="stylesheet" href="../themes/book.css">
${theme === 'd' ? '<link rel="stylesheet" href="../themes/d-book.css">' : ''}
</head>
<body class="theme-${theme === 'd' ? 'b theme-d' : theme} mode-${mode} full-book part-${part}">
<div id="book"></div>
<div id="source">${sections.join('\n')}</div>
<script>window.LAYOUT = ${JSON.stringify(layout)};</script>
<script>${paginateJs}</script>
</body></html>`;
}
