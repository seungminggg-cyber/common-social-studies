// 초록 칠판 + 빔 프로젝터용 시범강의 PPT (2028 수능 예시문항 통합사회 5·15·21번)
//
//   NODE_PATH=<pptxgenjs·jszip·react-icons·sharp 설치 폴더>/node_modules \
//     node 기출변형/특강/칠판/build-deck.cjs <원문 폴더> <저장할 .pptx>
//
// - 원문 폴더(저장소 밖 또는 out/ 아래, 커밋 금지): content.cjs(문항 글자·그래프 값), q5-map.png(흰 선 지도)
//   → 만드는 법은 README.md
// - 화면: 16:9, 바탕 검정(빔이 빛을 안 쏘는 곳 = 칠판 그대로), 글자는 흰 분필색.
//   문제·선지는 왼쪽 약 58%에만 두고 오른쪽은 모든 장에서 비워 판서 칸으로 쓴다(장을 넘겨도 판서가 안 겹침).
// - 장 구성: 표지 → 문항마다 [앞장: 발문 + 자료] [뒷장: 발문(작게) + 자료(작게) + 선지].
//   풀이·힌트는 화면에 넣지 않는다(강사가 판서). 정답·단서는 발표자 노트에만(기출변형/특강/content/analysis.js).
const path = require('path');
const fs = require('fs');
const pptxgen = require('pptxgenjs');
const JSZip = require('jszip');

const [srcDir, outFile] = process.argv.slice(2);
if (!srcDir || !outFile) {
  console.log('쓰는 법: node build-deck.cjs <원문 폴더> <저장할 .pptx>');
  process.exit(1);
}
const T = require(path.resolve(srcDir, 'content.cjs'));

// ---------- 테마 ----------
const FONT = '맑은 고딕';
const THEME = {
  name: '초록 칠판',
  headFontFace: FONT,
  bodyFontFace: FONT,
  colors: {
    dk1: '000000', lt1: 'FFFFFF', dk2: '262626', lt2: 'A6A6A6',
    accent1: 'FFE45C', // 분필 노랑 (문항 번호)
    accent2: '9AD8FF', accent3: 'FFA3BE', accent4: 'B9F08C',
    accent5: 'D9D9D9', // 상자·표 선
    accent6: 'FFC27A', hlink: '9AD8FF', folHlink: 'FFA3BE',
  },
};

const pres = new pptxgen();
pres.layout = 'LAYOUT_WIDE'; // 13.333 × 7.5 in (16:9)
pres.theme = { headFontFace: FONT, bodyFontFace: FONT };
pres.title = '2028 수능 예시문항 통합사회 시범강의';
pres.author = '승민T';
const C = pres.SchemeColor;
const WHITE = C.background1, MUTED = C.background2, CHALK = C.accent1, LINE = C.accent5;
const HEX = THEME.colors;

// 판서 칸을 뺀 왼쪽 영역
const ZX = 0.5, ZW = 7.3, TOP = 0.35, BOTTOM = 6.95;

// ---------- 글자 폭 어림 (줄 수 계산용, 한글 1em) ----------
function emWidth(s) {
  let w = 0, prev = null;
  for (const ch of s) {
    const ko = /[\u1100-\u11FF\u3130-\u318F\uAC00-\uD7A3\u3200-\u32FF\u2460-\u24FF\u3008-\u300F\u4E00-\u9FFF℃]/.test(ch);
    if (ko) w += 1.0;
    else if (ch === ' ') w += 0.3;
    else if (/[A-Z0-9]/.test(ch)) w += 0.6;
    else if (/[a-z]/.test(ch)) w += 0.52;
    else if (/[−~=]/.test(ch)) w += 0.6;
    else w += 0.38; // 문장 부호
    // 미리보기(LibreOffice)는 한글과 영문·숫자·괄호 사이를 조금 띄운다 → 넉넉히 어림
    if (prev !== null && ch !== ' ' && prev !== ko) w += 0.25;
    prev = ch === ' ' ? null : ko;
  }
  return w;
}
// 어절 단위로 줄을 나눠 몇 줄인지 센다(여유 3%)
function lineCount(s, pt, wIn) {
  const max = (wIn * 72) / pt / 1.03;
  let lines = 1, cur = 0;
  for (const word of s.split(' ')) {
    const ww = emWidth(word);
    const add = cur === 0 ? ww : ww + 0.3;
    if (cur + add > max && cur > 0) { lines++; cur = ww; } else cur += add;
  }
  return lines;
}
const LS = 1.18; // 줄 간격 배수
const textH = (s, pt, w) => (lineCount(s, pt, w) * pt * LS) / 72 + 0.04;

// ---------- 레이아웃(틀) ----------
const footer = (y) => ({
  text: { text: T.source, options: { x: ZX, y, w: ZW, h: 0.3, fontSize: 10, color: MUTED, margin: 0, valign: 'bottom', lang: 'ko-KR' } },
});
pres.defineSlideMaster({ title: 'TITLE', background: { color: HEX.dk1 }, objects: [footer(7.05)] });
const stemPh = (name, size, h) => ({
  placeholder: {
    options: { name, type: 'title', x: ZX, y: TOP, w: ZW, h, fontSize: size, bold: true, color: WHITE, align: 'left', valign: 'top', margin: 0, lineSpacingMultiple: LS, lang: 'ko-KR' },
    text: '',
  },
});
// 앞장: 발문 20pt
pres.defineSlideMaster({ title: 'PROBLEM', background: { color: HEX.dk1 }, objects: [stemPh('title', 18, 1.1), footer(7.05)] });
// 뒷장: 발문 15pt
pres.defineSlideMaster({ title: 'CHOICES', background: { color: HEX.dk1 }, objects: [stemPh('title', 15, 0.75), footer(7.05)] });

// ---------- 공통 그리기 ----------
const tx = (s, text, o) => s.addText(text, { isTextBox: true, margin: 0, color: WHITE, valign: 'top', lineSpacingMultiple: LS, lang: 'ko-KR', fit: 'none', ...o });
const line = (s, x, y, w, h, o = {}) => s.addShape(pres.shapes.LINE, { x, y, w, h, line: { color: o.color || WHITE, width: o.width || 1.25 } });
const box = (s, x, y, w, h, o = {}) => s.addShape(pres.shapes.RECTANGLE, { x, y, w, h, fill: o.fill ? { color: o.fill } : { type: 'none' }, line: { color: o.color || LINE, width: o.width || 1.25 }, objectName: o.name });

// 발문: "5. …… [2.5점]" — 번호만 분필 노랑
function stem(s, q, size) {
  s.addText([
    { text: `${q.no}. `, options: { color: CHALK } },
    { text: `${q.stem} ` },
    { text: `[${q.pts}점]`, options: { bold: false } },
  ], { placeholder: 'title' });
  // 굵은 글씨라 폭을 8% 넉넉히 잡아 줄 수를 센다
  const lines = lineCount(`${q.no}. ${q.stem} [${q.pts}점]`, size * 1.08, ZW);
  return TOP + (lines * size * LS) / 72 + 0.04;
}

// 걸린 들여쓰기 문단: 한 글상자에 여러 문단, "머리\t내용" — 줄이 바뀌면 내용 시작 위치(marL)에 맞춤.
// pptxgenjs에는 글머리표 없는 걸린 들여쓰기가 없어서 표식(▪) 글머리표로 만든 뒤 finish()에서 buNone으로 바꾼다.
const HANG_MARK = '25AA';
function hang(s, rows, o) {
  const { x, y, w, h, fontSize, marL, tabs = [marL], gap = 6, valign = 'top' } = o;
  s.addText(rows.map((t, i) => ({
    text: t,
    options: {
      bullet: { characterCode: HANG_MARK, indent: marL * 72 },
      tabStops: tabs.map((position) => ({ position, alignment: 'l' })),
      paraSpaceAfter: i < rows.length - 1 ? gap : 0,
      breakLine: i < rows.length - 1,
    },
  })), { isTextBox: true, x, y, w, h, fontSize, color: WHITE, margin: 0, valign, lineSpacingMultiple: LS, lang: 'ko-KR', fit: 'none' });
}
// 어림 높이(문단 사이 간격 포함)
const hangH = (texts, pt, w, gap = 6) => texts.reduce((a, t) => a + textH(t, pt, w) - 0.04, 0) + (gap / 72) * (texts.length - 1) + 0.06;

// 선지 ①~⑤: 번호 뒤에서 줄이 바뀌어도 내용끼리 맞춤
const CIRCLED = ['①', '②', '③', '④', '⑤'];
function choices(s, list, y, size, bottom = BOTTOM) {
  const nw = 0.42;
  hang(s, list.map((c, i) => `${CIRCLED[i]}\t${c}`), { x: ZX, y, w: ZW, h: bottom - y, fontSize: size, marL: nw, gap: 9 });
}

// 5번 그래프: 월 기온 편차(점, 왼쪽 축 ℃)·월 강수 편차(막대, 오른쪽 축 mm). 원본 그대로 다시 그림.
// legendTop: 범례를 아래 대신 단위 줄((℃)와 (mm) 사이)에 둔다 — 높이가 모자랄 때
function devGraph(s, x, y, w, h, g, fs, legendTop = false) {
  const k = fs / 13;
  const legH = 0.36 * k;
  const unitH = legendTop ? legH + 0.04 * k : 0.3 * k, lw = 0.5 * k, rw = 0.55 * k;
  const monH = 0.28 * k, grpH = 0.32 * k;
  const px = x + lw, pw = w - lw - rw;
  const py = y + unitH + 0.12 * k;
  const ph = h - (py - y) - monH - grpH - (legendTop ? 0 : legH + 0.08 * k) - 0.06 * k;
  const yOf = (degC) => py + ((30 - degC) / 60) * ph;
  tx(s, g.left.unit, { x: x, y, w: lw + 0.3, h: unitH, fontSize: fs, valign: 'bottom' });
  tx(s, g.right.unit, { x: px + pw - 0.3, y, w: rw + 0.3, h: unitH, fontSize: fs, align: 'right', valign: 'bottom' });
  // 막대(뒤) → 틀·선(앞) → 점(맨 앞)
  const gw = pw / 3;
  for (let gi = 0; gi < 3; gi++) {
    for (let mi = 0; mi < 2; mi++) {
      const v = g.prec[gi][mi] / 3; // mm → ℃ 눈금(30 ℃ = 90 mm)
      const bx = px + gw * gi + gw * (mi === 0 ? 0.19 : 0.5);
      const top = Math.min(yOf(0), yOf(v)), bh = Math.abs(yOf(v) - yOf(0));
      s.addShape(pres.shapes.RECTANGLE, { x: bx, y: top, w: gw * 0.31, h: bh, fill: { color: WHITE, transparency: 62 }, line: { color: WHITE, width: 1 } });
    }
  }
  box(s, px, py, pw, ph, { color: WHITE, width: 1.25 });
  line(s, px + gw, py, 0, ph, { width: 0.75 });
  line(s, px + gw * 2, py, 0, ph, { width: 0.75 });
  line(s, px, yOf(0), pw, 0, { width: 1.25 });
  const tick = 0.07 * k;
  g.left.ticks.forEach((t, i) => {
    const ty = yOf(t);
    line(s, px - tick, ty, tick, 0, { width: 1 });
    tx(s, String(t).replace('-', '−'), { x, y: ty - 0.13 * k, w: lw - tick - 0.04, h: 0.26 * k, fontSize: fs, align: 'right', valign: 'middle' });
    const r = g.right.ticks[i];
    line(s, px + pw, ty, tick, 0, { width: 1 });
    tx(s, String(r).replace('-', '−'), { x: px + pw + tick + 0.04, y: ty - 0.13 * k, w: rw - tick - 0.04, h: 0.26 * k, fontSize: fs, valign: 'middle' });
  });
  const d = 0.12 * k;
  for (let gi = 0; gi < 3; gi++) {
    for (let mi = 0; mi < 2; mi++) {
      const cx = px + gw * gi + gw * (mi === 0 ? 0.19 : 0.5) + gw * 0.155;
      s.addShape(pres.shapes.OVAL, { x: cx - d / 2, y: yOf(g.temp[gi][mi]) - d / 2, w: d, h: d, fill: { color: WHITE }, line: { color: WHITE, width: 0.5 } });
      tx(s, g.months[mi], { x: cx - gw * 0.25, y: py + ph + 0.05 * k, w: gw * 0.5, h: monH, fontSize: fs, align: 'center' });
    }
    tx(s, g.groups[gi], { x: px + gw * gi, y: py + ph + 0.05 * k + monH, w: gw, h: grpH, fontSize: fs + 1, align: 'center' });
  }
  // 범례: ● 기온 편차  ▭ 강수 편차
  const lwid = 2.75 * k, lx = px + (pw - lwid) / 2;
  const ly = legendTop ? y : py + ph + 0.08 * k + monH + grpH;
  box(s, lx, ly, lwid, legH, { color: WHITE, width: 1 });
  const dd = 0.11 * k;
  s.addShape(pres.shapes.OVAL, { x: lx + 0.12 * k, y: ly + legH / 2 - dd / 2, w: dd, h: dd, fill: { color: WHITE }, line: { color: WHITE, width: 0.5 } });
  tx(s, g.legend[0], { x: lx + 0.28 * k, y: ly, w: 1.1 * k, h: legH, fontSize: fs, valign: 'middle' });
  s.addShape(pres.shapes.RECTANGLE, { x: lx + 1.45 * k, y: ly + legH * 0.22, w: 0.26 * k, h: legH * 0.56, fill: { color: WHITE, transparency: 62 }, line: { color: WHITE, width: 1 } });
  tx(s, g.legend[1], { x: lx + 1.78 * k, y: ly, w: 1.0 * k, h: legH, fontSize: fs, valign: 'middle' });
}

// 15번 (나): 벤 다이어그램 + 범례
function venn(s, q, x, y, w, h, fs) {
  const k = fs / 15;
  const ew = 2.05 * k, eh = Math.min(h - 0.3 * k, 1.5 * k), ov = 0.62 * k;
  const ey = y + (h - eh) / 2 + 0.1 * k;
  const ex = x;
  for (const [i, ox] of [[0, ex], [1, ex + ew - ov]]) {
    s.addShape(pres.shapes.OVAL, { x: ox, y: ey, w: ew, h: eh, fill: { type: 'none' }, line: { color: WHITE, width: 1.5 } });
    // 갑·을 이름표: 타원 윗변에 걸치게(검정 바탕으로 선을 가림)
    tx(s, i === 0 ? q.venn.left : q.venn.right, { x: ox + ew / 2 - 0.22 * k, y: ey - 0.17 * k, w: 0.44 * k, h: 0.34 * k, fontSize: fs, align: 'center', valign: 'middle', fill: { color: HEX.dk1 } });
  }
  const cy = ey + eh / 2 - 0.18 * k;
  const regionX = [ex + (ew - ov) / 2, ex + ew - ov / 2, ex + ew - ov + ew - (ew - ov) / 2];
  q.venn.regions.forEach((r, i) => tx(s, r, { x: regionX[i] - 0.25 * k, y: cy, w: 0.5 * k, h: 0.36 * k, fontSize: fs + 1, align: 'center', valign: 'middle' }));
  // 범례 상자
  const lx = ex + 2 * ew - ov + 0.35 * k, lw = x + w - lx, rowH = 0.34 * k;
  const lh = rowH * q.legend.rows.length + 0.42 * k, ly = y + (h - lh) / 2 + 0.05 * k;
  box(s, lx, ly, lw, lh, { color: WHITE, width: 1 });
  tx(s, q.legend.title, { x: lx + lw / 2 - 0.55 * k, y: ly - 0.16 * k, w: 1.1 * k, h: 0.32 * k, fontSize: fs - 1, align: 'center', valign: 'middle', fill: { color: HEX.dk1 } });
  q.legend.rows.forEach(([a, t], i) => tx(s, `${a} : ${t}`, { x: lx + 0.15 * k, y: ly + 0.25 * k + rowH * i, w: lw - 0.25 * k, h: rowH, fontSize: fs - 1, valign: 'middle' }));
}

// 21번 표
function sitTable(s, t, x, y, w, fs, rowH) {
  tx(s, t.title, { x, y, w, h: rowH * 0.85, fontSize: fs, align: 'center', valign: 'middle' });
  const b = { type: 'solid', pt: 1.25, color: HEX.accent5 };
  s.addTable(t.rows.map((r) => r.map((c) => ({ text: c, options: { color: WHITE, fontSize: fs, align: 'center', valign: 'middle', border: [b, b, b, b], margin: 0, lang: 'ko-KR' } }))), {
    x, y: y + rowH * 0.95, w, colW: [w * 0.34, w * 0.33, w * 0.33], rowH,
  });
  return y + rowH * 0.95 + rowH * t.rows.length;
}

// ---------- 슬라이드 ----------
const notes = {}; // analysis.js에서 채움

function titleSlide() {
  pres.addSection({ title: '표지' });
  const s = pres.addSlide({ masterName: 'TITLE', sectionTitle: '표지' });
  tx(s, '2028학년도 대학수학능력시험 예시문항', { x: ZX, y: 2.0, w: ZW, h: 0.5, fontSize: 24 });
  tx(s, '사회탐구 영역 (통합사회)', { x: ZX, y: 2.6, w: ZW, h: 0.9, fontSize: 44, bold: true });
  tx(s, '5번 · 15번 · 21번', { x: ZX, y: 3.65, w: ZW, h: 0.65, fontSize: 32, bold: true, color: CHALK });
  tx(s, '승민T', { x: ZX, y: 4.75, w: ZW, h: 0.5, fontSize: 22 });
}

function q5() {
  const q = T.q5;
  pres.addSection({ title: '5번' });
  // 앞장: 발문 + 자료(글·식·지도·그래프)
  let s = pres.addSlide({ masterName: 'PROBLEM', sectionTitle: '5번' });
  let y = stem(s, q, 18) + 0.12;
  const pad = 0.2, fs = 15, iw = ZW - pad * 2;
  const bodyH = textH(q.box, fs, iw);
  box(s, ZX, y, ZW, BOTTOM - y);
  // 글은 어림 높이 칸 안에서 가운데 — 실제 줄 수가 달라도 위아래 여백이 고르게
  tx(s, q.box, { x: ZX + pad, y: y + 0.1, w: iw, h: bodyH, fontSize: fs, align: 'justify', valign: 'middle' });
  let fy = y + 0.1 + bodyH + 0.04;
  const fx = ZX + 1.1;
  tx(s, `○ ${q.f1[0]}`, { x: fx, y: fy, w: 5.6, h: 0.3, fontSize: fs, valign: 'middle' });
  fy += 0.34;
  // ○ 월 강수 편차 = 월 강수량 − ( 연 강수량 / 12 )
  const lead = `○ ${q.f2[0]}`, leadW = (emWidth(lead) * fs) / 72 + 0.08;
  tx(s, lead, { x: fx, y: fy + 0.15, w: leadW + 0.1, h: 0.3, fontSize: fs, valign: 'middle' });
  const px0 = fx + leadW + 0.02;
  tx(s, '(', { x: px0, y: fy, w: 0.18, h: 0.6, fontSize: 28, valign: 'middle' });
  tx(s, q.f2[1], { x: px0 + 0.2, y: fy + 0.01, w: 1.15, h: 0.28, fontSize: fs, align: 'center', valign: 'middle' });
  line(s, px0 + 0.22, fy + 0.3, 1.1, 0, { width: 1 });
  tx(s, q.f2[2], { x: px0 + 0.2, y: fy + 0.32, w: 1.15, h: 0.28, fontSize: fs, align: 'center', valign: 'middle' });
  tx(s, ')', { x: px0 + 1.36, y: fy, w: 0.18, h: 0.6, fontSize: 28, valign: 'middle' });
  fy += 0.7;
  const figH = BOTTOM - 0.1 - fy, mapW = figH * q.mapAspect;
  s.addImage({ path: path.resolve(srcDir, q.map), x: ZX + pad, y: fy, w: mapW, h: figH, altText: '세 지역이 표시된 동아시아·동남아시아·오세아니아 지도' });
  devGraph(s, ZX + pad + mapW + 0.2, fy, ZW - pad * 2 - mapW - 0.2, figH, q.graph, 12, true);
  s.addNotes(notes.front[5]);

  // 뒷장: 발문 + 작은 지도·그래프 + 선지
  s = pres.addSlide({ masterName: 'CHOICES', sectionTitle: '5번' });
  y = stem(s, q, 15) + 0.12;
  const mh = 2.55, mw = mh * q.mapAspect;
  s.addImage({ path: path.resolve(srcDir, q.map), x: ZX, y, w: mw, h: mh, altText: '세 지역이 표시된 지도' });
  devGraph(s, ZX + mw + 0.3, y, 4.3, mh, q.graph, 10.5);
  choices(s, q.choices, y + mh + 0.28, 18);
  s.addNotes(notes.back[5]);
}

function q15() {
  const q = T.q15;
  pres.addSection({ title: '15번' });
  // 앞장: 발문 + (가) 제시문 + (나) 그림
  let s = pres.addSlide({ masterName: 'PROBLEM', sectionTitle: '15번' });
  let y = stem(s, q, 18) + 0.12;
  const labW = 0.78, fs = 16, sayW = 0.62, tx0 = ZX + labW + 0.2, tw = ZW - labW - 0.32;
  const says = q.ga.map(([who, t]) => `${who} :\t${t}`);
  const gaH = hangH(q.ga.map(([, t]) => t), fs, tw - sayW, 10) + 0.3, naH = 2.15;
  box(s, ZX, y, ZW, gaH + naH);
  line(s, ZX + labW, y, 0, gaH + naH, { color: LINE });
  line(s, ZX, y + gaH, ZW, 0, { color: LINE });
  tx(s, '(가)', { x: ZX, y, w: labW, h: gaH, fontSize: fs, align: 'center', valign: 'middle' });
  tx(s, '(나)', { x: ZX, y: y + gaH, w: labW, h: naH, fontSize: fs, align: 'center', valign: 'middle' });
  hang(s, says, { x: tx0, y: y + 0.1, w: tw, h: gaH - 0.2, fontSize: fs, marL: sayW, gap: 10, valign: 'middle' });
  venn(s, q, ZX + labW + 0.3, y + gaH + 0.1, ZW - labW - 0.5, naH - 0.2, 15);
  s.addNotes(notes.front[15]);

  // 뒷장: 발문 + 작은 (나) + 〈보 기〉 + 선지
  s = pres.addSlide({ masterName: 'CHOICES', sectionTitle: '15번' });
  y = stem(s, q, 15) + 0.1;
  venn(s, q, ZX + 0.3, y, ZW - 0.6, 1.55, 13);
  y += 1.55 + 0.4;
  const bfs = 17, gl = 0.42, al = 0.58, bw = ZW - 0.5;
  const bh = hangH(q.bogi.map(([, , t]) => t), bfs, bw - gl - al - 0.12, 8) + 0.5;
  box(s, ZX, y, ZW, bh);
  tx(s, '〈보 기〉', { x: ZX + ZW / 2 - 0.7, y: y - 0.18, w: 1.4, h: 0.36, fontSize: 16, align: 'center', valign: 'middle', fill: { color: HEX.dk1 } });
  hang(s, q.bogi.map(([g, a2, t]) => `${g}. ${a2} :\t${t}`), { x: ZX + 0.25, y: y + 0.22, w: bw, h: bh - 0.37, fontSize: bfs, marL: gl + al + 0.12, gap: 8, valign: 'middle' });
  y += bh + 0.32;
  const cw = ZW / 5;
  q.choices.forEach((c, i) => tx(s, `${CIRCLED[i]} ${c}`, { x: ZX + cw * i, y, w: cw, h: 0.45, fontSize: 20 }));
  s.addNotes(notes.back[15]);
}

async function teacherIcon() {
  // 수업 장면의 교사 그림 대신 흰 선 아이콘(Font Awesome, react-icons)
  try {
    const React = require('react');
    const { renderToStaticMarkup } = require('react-dom/server');
    const { FaChalkboardTeacher } = require('react-icons/fa');
    const sharp = require('sharp');
    const svg = renderToStaticMarkup(React.createElement(FaChalkboardTeacher, { color: '#FFFFFF', size: 512 }));
    const buf = await sharp(Buffer.from(svg)).png().toBuffer();
    return 'image/png;base64,' + buf.toString('base64');
  } catch (e) {
    console.warn('아이콘 없이 만듦:', e.message);
    return null;
  }
}

const BUBBLE = { w: 5.6, tip: [0.42, 0.18] }; // 말풍선 꼬리 끝: 오른쪽 변에서 0.42in 밖, 가운데보다 0.18in 아래(교사 아이콘 쪽)
async function q21() {
  const q = T.q21;
  pres.addSection({ title: '21번' });
  // 앞장: 발문 + 수업 장면(말풍선 + 표 두 개)
  let s = pres.addSlide({ masterName: 'PROBLEM', sectionTitle: '21번' });
  let y = stem(s, q, 18) + 0.2;
  const fs = 17, bh = textH(q.bubble, fs, BUBBLE.w - 0.36) + 0.3;
  s.addText(q.bubble, {
    shape: pres.shapes.ROUNDED_RECTANGULAR_CALLOUT, objectName: 'bubble', x: ZX, y, w: BUBBLE.w, h: bh,
    fill: { color: HEX.dk1 }, line: { color: WHITE, width: 1.5 }, color: WHITE, fontSize: fs, margin: [10, 13, 10, 13],
    valign: 'middle', lineSpacingMultiple: LS, lang: 'ko-KR',
  });
  const icon = await teacherIcon();
  if (icon) s.addImage({ data: icon, x: ZX + BUBBLE.w + 0.5, y: y + bh / 2 - 0.3, w: 1.15, h: 1.15 * 0.8, altText: '교사' });
  y += bh + 0.45;
  const tw = 3.35;
  sitTable(s, q.tables[0], ZX, y, tw, 20, 0.55);
  sitTable(s, q.tables[1], ZX + tw + 0.5, y, tw, 20, 0.55);
  s.addNotes(notes.front[21]);

  // 뒷장: 발문 + 작은 표 + 선지
  s = pres.addSlide({ masterName: 'CHOICES', sectionTitle: '21번' });
  y = stem(s, q, 15) + 0.12;
  const tw2 = 2.7;
  const end = sitTable(s, q.tables[0], ZX, y, tw2, 14, 0.36);
  sitTable(s, q.tables[1], ZX + tw2 + 0.4, y, tw2, 14, 0.36);
  choices(s, q.choices, end + 0.3, 18);
  s.addNotes(notes.back[21]);
}

// ---------- 발표자 노트(화면에는 안 나옴) ----------
async function loadNotes() {
  const a = await import(path.resolve(__dirname, '../content/analysis.js'));
  const strip = (t) => String(t).replace(/\*\*/g, '');
  notes.front = {}; notes.back = {};
  for (const n of [5, 15, 21]) {
    const it = a.ITEMS[n];
    notes.front[n] = [
      `정답 ${CIRCLED[it.ans - 1]} (${it.pts}점)`,
      `핵심 단서: ${strip(it.clue)}`,
      '풀이 순서:', ...it.steps.map((st, i) => `${i + 1}) ${strip(st)}`),
    ].join('\n');
    const mark = n === 15 ? ['ㄱ', 'ㄴ', 'ㄷ', 'ㄹ'] : CIRCLED;
    notes.back[n] = [
      `정답 ${CIRCLED[it.ans - 1]}`,
      ...it.judge.map(([ox, why], i) => `${mark[i]} ${ox} — ${strip(why)}`),
      '함정:', ...it.traps.map(([k, t]) => `${k} ${strip(t)}`),
    ].join('\n');
  }
}

// ---------- 저장 뒤 손보기 ----------
async function finish(file) {
  // 1) 테마 색: pptx 스킬의 applyTheme가 있으면 쓰고, 없으면 직접 바꿈
  const zip = await JSZip.loadAsync(fs.readFileSync(file));
  const themePath = Object.keys(zip.files).find((f) => /^ppt\/theme\/theme\d+\.xml$/.test(f));
  let th = await zip.file(themePath).async('string');
  const c = THEME.colors;
  const clr = ['dk1', 'lt1', 'dk2', 'lt2', 'accent1', 'accent2', 'accent3', 'accent4', 'accent5', 'accent6', 'hlink', 'folHlink']
    .map((k) => `<a:${k}><a:srgbClr val="${c[k]}"/></a:${k}>`).join('');
  th = th.replace(/<a:clrScheme\b[^>]*>[\s\S]*?<\/a:clrScheme>/, `<a:clrScheme name="${THEME.name}">${clr}</a:clrScheme>`);
  // 2) 한글 글꼴: 테마의 동아시아 글꼴 칸을 맑은 고딕으로
  th = th.replace(/<a:ea typeface=""\/>/g, `<a:ea typeface="${FONT}"/>`);
  zip.file(themePath, th);
  // 3) 말풍선 꼬리를 오른쪽 아래(교사 아이콘 쪽)로
  for (const f of Object.keys(zip.files).filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n))) {
    let x = await zip.file(f).async('string');
    // 4) 걸린 들여쓰기 문단의 표식 글머리표(▪)를 '글머리표 없음'으로
    x = x.replace(/(?:<a:buSzPct val="\d+"\/>)?(?:<a:buFont[^>]*\/>)?<a:buChar char="(?:&#x25AA;|\u25AA|▪)"\/>/g, '<a:buNone/>');
    zip.file(f, x);
    if (!x.includes('wedgeRoundRectCallout')) continue;
    const m = x.match(/name="bubble"[\s\S]*?<a:ext cx="(\d+)" cy="(\d+)"/);
    const [cx, cy] = [Number(m[1]), Number(m[2])];
    const emu = 914400;
    const adj1 = Math.round(((cx / 2 + BUBBLE.tip[0] * emu) / cx) * 100000);
    const adj2 = Math.round(((BUBBLE.tip[1] * emu) / cy) * 100000);
    x = x.replace(/(<a:prstGeom prst="wedgeRoundRectCallout">)\s*<a:avLst\s*(?:\/>|><\/a:avLst>)/, `$1<a:avLst><a:gd name="adj1" fmla="val ${adj1}"/><a:gd name="adj2" fmla="val ${adj2}"/><a:gd name="adj3" fmla="val 16667"/></a:avLst>`);
    zip.file(f, x);
  }
  // 폴더 항목 없이 다시 묶기(클라우드 저장소에서 열 때 문제가 되므로)
  const out = new JSZip();
  for (const [n, e] of Object.entries(zip.files)) if (!e.dir) out.file(n, await e.async('nodebuffer'), { createFolders: false });
  fs.writeFileSync(file, await out.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' }));
}

(async () => {
  await loadNotes();
  titleSlide();
  q5();
  q15();
  await q21();
  fs.mkdirSync(path.dirname(path.resolve(outFile)), { recursive: true });
  await pres.writeFile({ fileName: outFile });
  await finish(outFile);
  console.log('저장:', outFile);
})();
