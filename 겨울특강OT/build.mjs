// 겨울특강 OT 촬영용 PPT 만들기
//   node art.mjs     (네온 그림 — 처음 한 번, 또는 그림을 바꿀 때)
//   node build.mjs   → out/승민T-통합사회-겨울특강-OT.pptx
// 촬영 환경: 학원 초록 칠판에 빔으로 쏜다.
//   - 바탕은 검정(빛을 안 쏘는 곳 = 칠판 색 그대로). 밝은 네온 글자·선만 쓴다.
//   - 영상(폰 화면)으로 보므로 글자는 크게(본문 20pt 이상), 선은 굵게.
//   - 슬라이드에 적힌 말은 짧게, 말할 내용은 '슬라이드 노트'(발표자 보기)에 적었다.
// 내용 출처: 강사 블로그 글 2개(겨울방학 10주 특강 안내, 학습 앱 소개)와 그 초안.
import { createRequire } from 'node:module';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { COLORS as K } from './palette.mjs';

const require = createRequire(import.meta.url);
const pptxgen = require('pptxgenjs');
const JSZip = require(require.resolve('jszip', { paths: [require.resolve('pptxgenjs')] }));
const ROOT = dirname(fileURLToPath(import.meta.url));
const OUT = join(ROOT, 'out');
const ART = join(OUT, 'art');
mkdirSync(OUT, { recursive: true });
const FILE = join(OUT, '승민T-통합사회-겨울특강-OT.pptx');

// ── 테마: 어두운 화면용. 글자 기본색(Text 1)이 흰색, 바탕(Background 1)이 검정이 되도록 칸을 바꿔 넣었다
//    (강사가 PowerPoint에서 새 글상자를 만들어도 흰 글자로 나오게)
const THEME = {
  name: '승민T 통합사회 OT',
  headFontFace: 'Pretendard ExtraBold',
  bodyFontFace: 'Pretendard',
  colors: {
    dk1: K.text, lt1: K.bg, dk2: K.sub, lt2: '0C1A24',
    accent1: K.neon, accent2: K.mint, accent3: K.yellow, accent4: K.pink, accent5: K.dim, accent6: K.line,
    hlink: K.neon, folHlink: K.pink,
  },
};
const F = { head: 'Pretendard ExtraBold', body: 'Pretendard', semi: 'Pretendard SemiBold', med: 'Pretendard Medium', black: 'Pretendard Black' };

const pres = new pptxgen();
pres.layout = 'LAYOUT_WIDE'; // 13.333 × 7.5 in
pres.author = '이승민';
pres.title = '승민T 통합사회 겨울특강 OT';
pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
const C = {
  white: pres.SchemeColor.text1, sub: pres.SchemeColor.text2, black: pres.SchemeColor.background1, panel: pres.SchemeColor.background2,
  neon: pres.SchemeColor.accent1, mint: pres.SchemeColor.accent2, yellow: pres.SchemeColor.accent3, pink: pres.SchemeColor.accent4,
  dim: pres.SchemeColor.accent5, line: pres.SchemeColor.accent6,
};
const S = pres.ShapeType;
const W = 13.333, H = 7.5, ML = 0.75, CW = W - 2 * ML;

// ── 레이아웃 ──
pres.defineSlideMaster({ title: 'BLANK_DARK', background: { color: K.bg } });
pres.defineSlideMaster({
  title: 'DIVIDER',
  background: { color: K.bg },
  objects: [
    { image: { path: join(ART, 'globe-t1.png'), x: 7.75, y: 0.55, w: 6.6, h: 6.6 } },
    { placeholder: { options: { name: 'title', type: 'title', x: ML, y: 3.45, w: 7.7, h: 1.95, fontFace: F.head, fontSize: 46, color: C.white, align: 'left', valign: 'top', margin: 0, lineSpacingMultiple: 1.08 }, text: '' } },
    { placeholder: { options: { name: 'body', type: 'body', x: ML, y: 5.6, w: 7.4, h: 0.95, fontFace: F.med, fontSize: 22, color: C.sub, align: 'left', valign: 'top', margin: 0, lineSpacingMultiple: 1.2 }, text: '' } },
  ],
});
pres.defineSlideMaster({
  title: 'CONTENT',
  background: { color: K.bg },
  objects: [
    { text: { text: '승민T 통합사회', options: { x: 9.6, y: 0.5, w: 2.98, h: 0.4, fontFace: F.semi, fontSize: 13, color: C.dim, align: 'right', valign: 'middle', margin: 0 } } },
    { placeholder: { options: { name: 'kicker', type: 'body', x: ML, y: 0.5, w: 8.6, h: 0.4, fontFace: F.semi, fontSize: 17, color: C.neon, align: 'left', valign: 'middle', margin: 0, charSpacing: 1 }, text: '' } },
    { placeholder: { options: { name: 'title', type: 'title', x: ML, y: 0.92, w: CW, h: 0.85, fontFace: F.head, fontSize: 36, color: C.white, align: 'left', valign: 'middle', margin: 0 }, text: '' } },
  ],
});

// ── 그리기 도구 ──
const glow = (hex, o = {}) => ({ type: 'outer', color: hex, blur: o.blur ?? 10, offset: 0, angle: 0, opacity: o.opacity ?? 0.45 });
function tx(s, text, x, y, w, h, o = {}) {
  s.addText(text, {
    x, y, w, h, isTextBox: true, margin: 0,
    fontFace: o.font || F.body, fontSize: o.size || 22, color: o.color || C.white, bold: o.bold || false,
    align: o.align || 'left', valign: o.valign || 'top', lineSpacingMultiple: o.lsm || 1.15,
    charSpacing: o.cs, paraSpaceAfter: o.psa, glow: o.glow, objectName: o.name, fit: 'none',
  });
}
const r = (text, o = {}) => ({ text, options: o }); // 글자 조각(색·굵기 바꾸기)
function box(s, x, y, w, h, o = {}) {
  s.addShape(o.shape || (o.snip ? S.snip1Rect : S.rect), {
    x, y, w, h,
    fill: o.fill ? { color: o.fill, transparency: o.ft || 0 } : undefined,
    line: o.line === false ? { type: 'none' } : { color: o.line || C.line, width: o.lw ?? 1.5, transparency: o.lt || 0, dashType: o.dash },
    shadow: o.glow ? glow(o.glow, o.glowOpt) : undefined, objectName: o.name, rectRadius: o.radius,
  });
}
const line = (s, x1, y1, x2, y2, o = {}) => s.addShape(S.line, {
  x: Math.min(x1, x2), y: Math.min(y1, y2), w: Math.abs(x2 - x1) || 0.0001, h: Math.abs(y2 - y1) || 0.0001, flipH: x2 < x1, flipV: y2 < y1,
  line: { color: o.color || C.neon, width: o.w ?? 2.5, dashType: o.dash, endArrowType: o.arrow ? 'triangle' : undefined, transparency: o.t || 0 },
  shadow: o.glow ? glow(o.glow, { blur: 8, opacity: 0.55 }) : undefined,
});
const icon = (s, name, color, x, y, size) => s.addImage({ path: join(ART, `ic-${name}-${color}.png`), x, y, w: size, h: size });
const ping = (s, color, cx, cy, size) => s.addImage({ path: join(ART, `ping-${color}.png`), x: cx - size / 2, y: cy - size / 2, w: size, h: size });
function img(s, path, x, y, w, h, o = {}) { s.addImage({ path, x, y, w, h, rotate: o.rotate, transparency: o.transparency, altText: o.alt }); }
const sizeOf = (p) => { const b = readFileSync(p); return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) }; }; // PNG 크기

let SECTION = '';
function section(title) { SECTION = title; pres.addSection({ title }); }
function content(kicker, title, notes) {
  const s = pres.addSlide({ masterName: 'CONTENT', sectionTitle: SECTION });
  s.addText(kicker, { placeholder: 'kicker' });
  s.addText(title, { placeholder: 'title' });
  if (notes) s.addNotes(notes);
  return s;
}
function divider(no, title, sub, notes) {
  const s = pres.addSlide({ masterName: 'DIVIDER', sectionTitle: SECTION });
  const p = join(ART, `num-${no}.png`), z = sizeOf(p), h = 1.75;
  img(s, p, ML - 0.42, 1.25, (h * z.w) / z.h, h);
  s.addText(title, { placeholder: 'title' });
  s.addText(sub, { placeholder: 'body' });
  if (notes) s.addNotes(notes);
  return s;
}
// 휴대폰 틀 + 앱 화면(없으면 빈 틀에 안내 글)
function phone(s, shot, x, y, h) {
  const w = h * 0.48;
  const p = shot && join(ART, `phone-${shot}.png`);
  if (p && existsSync(p)) { const z = sizeOf(p); img(s, p, x, y, (h * z.w) / z.h, h); return (h * z.w) / z.h; }
  box(s, x, y, w, h, { shape: S.roundRect, radius: 0.25, line: C.dim, lw: 2.5 });
  tx(s, `앱 화면\n(${shot})`, x, y + h / 2 - 0.5, w, 1, { size: 16, color: C.dim, align: 'center' });
  return w;
}

// ════════════════════════ 슬라이드 ════════════════════════

// 1. 표지
section('시작');
{
  const s = pres.addSlide({ masterName: 'BLANK_DARK', sectionTitle: SECTION });
  img(s, join(ART, 'globe-t1.png'), 6.75, -0.35, 8.2, 8.2);
  const lg = join(ROOT, 'assets/academy-logo-white.png'), z = sizeOf(lg);
  img(s, lg, ML, 0.62, (0.52 * z.w) / z.h, 0.52);
  tx(s, '2027 예비 고1 · 겨울방학 특강 OT', ML, 1.75, 7.2, 0.5, { font: F.semi, size: 24, color: C.neon, cs: 1 });
  tx(s, [r('통합사회 1·2', { breakLine: true }), r('10주 완성', { color: C.neon, glow: { size: 8, opacity: 0.35, color: K.neon } })], ML, 2.4, 7.4, 2.55, { font: F.black, size: 72, lsm: 1.02 });
  tx(s, '2028 대입부터 수능 공통 과목,\n이번 겨울에 개념을 끝냅니다', ML, 5.05, 7.0, 0.95, { font: F.med, size: 22, color: C.sub, lsm: 1.2 });
  tx(s, [r('통합사회 '), r('이승민T', { font: F.head, color: C.white })], ML, 6.3, 5, 0.6, { font: F.semi, size: 26, color: C.sub });
  s.addNotes('안녕하세요, 김포 너를위한메이트학원 통합사회 이승민입니다.\n오늘은 예비 고1 겨울방학 통합사회 10주 완성 특강을 소개해 드리겠습니다.\n12월 20일 일요일에 개강해서 2월 21일까지 10번의 수업으로 통합사회1·2 전 범위를 끝내는 수업입니다.');
}

// 2. 강사 소개
{
  const s = content('강사 소개', '통합사회 이승민T', '먼저 제 소개를 짧게 드리겠습니다.\n메이트학원 사회과 대표강사이고, 목동 에듀메이트, 대치 다원교육·리브 아카데미에서 사회를 가르치고 있습니다.\n족보닷컴 22개정 사회탐구 출제위원으로 문제를 직접 만들고 있고, 이번 특강의 개념서와 학습 앱도 제가 직접 만들었습니다.');
  const rows = [
    ['메이트학원 사회과 대표강사', true],
    ['목동 에듀메이트 사회 대표강사', false],
    ['대치 다원교육 · 리브 아카데미', false],
    ['족보닷컴 22개정 사회탐구 출제위원', false],
    ['전) 대치 에듀퍼스트', false],
  ];
  rows.forEach(([t, hi], i) => {
    const y = 2.2 + i * 0.86;
    ping(s, hi ? 'yellow' : 'cyan', ML + 0.28, y + 0.3, 0.62);
    tx(s, t, ML + 0.8, y, 6.6, 0.6, { font: hi ? F.head : F.semi, size: 26, color: hi ? C.yellow : C.white, valign: 'middle' });
  });
  // 오른쪽: 직접 만든 것들
  box(s, 8.55, 2.2, 4.03, 4.1, { snip: true, line: C.neon, lw: 2, fill: K.bg, glow: K.neon, glowOpt: { opacity: 0.35, blur: 12 } });
  tx(s, '이번 특강을 위해\n직접 만들었습니다', 8.9, 2.5, 3.5, 0.95, { font: F.semi, size: 20, color: C.sub, lsm: 1.15 });
  [['book-2', 'MINIMAP 개념서'], ['pencil', '자체 제작 워크북'], ['device-mobile', '통합사회 클래스 앱']].forEach(([ic, t], i) => {
    const y = 3.65 + i * 0.82;
    icon(s, ic, 'cyan', 8.85, y - 0.05, 0.68);
    tx(s, t, 9.6, y, 2.95, 0.58, { font: F.semi, size: 20, valign: 'middle' });
  });
}

// 3. 오늘의 순서
{
  const s = content('OT 순서', '오늘 이야기할 여섯 가지', '오늘은 여섯 가지를 말씀드리겠습니다.\n왜 지금 통합사회를 해야 하는지, 왜 제 수업이어야 하는지, 10주 커리큘럼, 교재인 MINIMAP, 매일 관리하는 학습 앱, 그리고 신청 안내 순서입니다.');
  const items = [['01', '왜 지금\n통합사회인가'], ['02', '왜 승민T\n수업인가'], ['03', '10주\n커리큘럼'], ['04', '교재\nMINIMAP'], ['05', '매일 관리\n학습 앱'], ['', '신청\n안내']];
  const x0 = 1.55, x1 = 11.78, ly = 4.3, step = (x1 - x0) / 5;
  line(s, x0, ly, x1, ly, { color: C.neon, w: 3, glow: K.neon });
  items.forEach(([n, t], i) => {
    const cx = x0 + i * step;
    if (n) tx(s, n, cx - 0.9, 2.9, 1.8, 0.7, { font: F.head, size: 34, color: C.neon, align: 'center', valign: 'bottom' });
    else icon(s, 'map-pin', 'yellow', cx - 0.42, 2.8, 0.84);
    ping(s, n ? 'cyan' : 'yellow', cx, ly, 0.78);
    tx(s, t, cx - 0.98, 4.9, 1.96, 1.05, { font: F.semi, size: 22, align: 'center', lsm: 1.12, color: n ? C.white : C.yellow });
  });
}

// ── PART 1 ──
section('01 왜 지금 통합사회');
divider('01', '왜 예비 고1 겨울방학부터\n통합사회일까?', '중학교 ‘사회’와는 전혀 다른 과목이 됩니다',
  '첫 번째, 왜 예비 고1 겨울방학부터 통합사회를 해야 하는지 말씀드리겠습니다.');

// 착각 두 가지
{
  const s = content('흔한 착각', '겨울방학 계획을 세울 때 흔히 하는 두 가지 생각', '중학교 졸업을 앞두고 겨울방학 계획을 세울 때 이런 생각 한 번쯤 하셨을 겁니다.\n“국·영·수 따라가기도 바쁜데 통합사회는 시험 2~3주 전에 외우면 되지 않을까?”\n“중학교 때 사회는 늘 90점 넘었으니 고등학교 가서도 괜찮겠지.”\n결론부터 말씀드리면, 바뀐 2022 개정 교육과정에서는 이 두 생각이 고등학교 첫 중간고사에서 가장 큰 후회로 돌아올 수 있습니다.');
  const qs = [
    ['국·영·수 따라가기도 바쁜데,\n통합사회는 시험 2~3주 전에\n외우면 되지 않을까?'],
    ['중학교 때 사회는\n늘 90점 넘었으니\n고등학교 가서도 괜찮겠지.'],
  ];
  qs.forEach(([q], i) => {
    const x = ML + i * 6.08;
    box(s, x, 2.15, 5.75, 2.75, { snip: true, line: C.dim, lw: 1.75 });
    tx(s, '“', x + 0.3, 2.0, 1, 1, { font: F.black, size: 72, color: C.neon });
    tx(s, q, x + 0.45, 2.85, 5.0, 1.8, { font: F.semi, size: 26, lsm: 1.18 });
  });
  icon(s, 'alert-triangle', 'yellow', ML - 0.05, 5.32, 0.95);
  tx(s, [r('고등학교 첫 중간고사에서 '), r('가장 큰 후회', { color: C.yellow }), r('로 돌아올 수 있습니다')], ML + 1.0, 5.35, 10.8, 0.6, { font: F.head, size: 30, valign: 'middle' });
  tx(s, '2022 개정 교육과정에서 통합사회는 완전히 달라졌습니다', ML + 1.0, 6.0, 10.8, 0.5, { font: F.med, size: 20, color: C.sub });
}

// 이유 1: 수능까지 이어진다
{
  const s = content('이유 1 · 연속성', '고1 내신에서 끝나지 않는 과목입니다', '첫째, 통합사회는 고1 내신으로 끝나지 않습니다.\n2028 대입부터 통합사회는 문·이과 구분 없이 모두가 치르는 수능 공통 과목이 되었고, 교과서도 통합사회1과 통합사회2 두 권으로 늘었습니다.\n고2 때 배우는 선택 과목과 대학별 논구술의 제시문도 고1 통합사회에서 출발합니다.\n그리고 수능 국어 비문학에서 학생들이 가장 어려워하는 법·경제·윤리 지문도 결국 기본권과 헌법, 기회비용과 비교우위, 롤스와 노직 같은 통합사회 개념입니다.\n이번 겨울에 잡은 개념 하나가 고1 내신부터 고3 수능까지 3년을 책임집니다.');
  const st = [
    ['school', '고1', '통합사회 1·2\n내신', 'cyan', C.neon],
    ['books', '고2', '선택 과목 · 논구술\n제시문의 바탕', 'cyan', C.neon],
    ['target', '고3', '수능 공통 과목\n(2028 대입부터)', 'yellow', C.yellow],
  ];
  const xs = [2.35, 6.67, 10.98];
  st.forEach(([ic, y, d, col, cc], i) => {
    const cx = xs[i];
    icon(s, ic, col, cx - 0.55, 2.05, 1.1);
    tx(s, y, cx - 1.6, 3.1, 3.2, 0.62, { font: F.black, size: 36, color: cc, align: 'center' });
    tx(s, d, cx - 1.75, 3.72, 3.5, 0.9, { font: F.semi, size: 21, align: 'center', lsm: 1.12 });
    if (i < 2) line(s, cx + 0.85, 2.6, xs[i + 1] - 0.85, 2.6, { color: C.neon, w: 3, arrow: true });
  });
  box(s, ML, 4.85, CW, 1.2, { snip: true, line: C.mint, lw: 1.75 });
  icon(s, 'news', 'mint', ML + 0.25, 5.0, 0.9);
  tx(s, '국어 비문학의 법·경제·윤리 지문도 같은 개념에서 나옵니다', ML + 1.3, 4.98, 10.2, 0.48, { font: F.semi, size: 22 });
  tx(s, '기본권과 헌법  ·  기회비용과 비교우위  ·  롤스와 노직의 정의관', ML + 1.3, 5.47, 10.2, 0.45, { font: F.semi, size: 20, color: C.mint });
  tx(s, [r('이번 겨울에 잡은 개념 하나가 '), r('3년', { color: C.yellow, font: F.head }), r('을 책임집니다')], ML, 6.3, CW, 0.55, { font: F.semi, size: 24, align: 'center' });
}

// 이유 2: 학점
{
  const s = content('이유 2 · 고교학점제', '국·영·수와 비슷한 학점으로 반영됩니다', '둘째, 고교학점제에서 고1 통합사회는 국어, 수학, 영어와 큰 차이 없는 학점으로 편성됩니다.\n예전처럼 단위수가 적어서 덜 중요한 과목이 아닙니다.\n어렵게 공부해서 수학 100점을 받는 것과 통합사회 100점을 받는 것이 내신을 계산할 때 비슷한 무게를 가진다는 뜻입니다.\n그래서 공부한 시간 대비 성적을 올리기 가장 좋은 과목이 통합사회입니다.');
  const subs = ['국어', '수학', '영어', '통합사회'];
  const bw = 1.55, gap = 0.42, by = 2.35, bh = 3.5;
  subs.forEach((t, i) => {
    const x = ML + 0.2 + i * (bw + gap), hi = i === 3;
    box(s, x, by, bw, bh, { line: hi ? C.yellow : C.neon, lw: hi ? 2.75 : 1.75, fill: hi ? K.yellow : K.neon, ft: hi ? 84 : 90, glow: hi ? K.yellow : undefined, glowOpt: { opacity: 0.4, blur: 12 } });
    tx(s, t, x, by + bh - 0.75, bw, 0.6, { font: hi ? F.head : F.semi, size: hi ? 24 : 24, color: hi ? C.yellow : C.white, align: 'center', valign: 'middle' });
  });
  const rx = 8.75;
  tx(s, '수학 100점', rx, 2.45, 3.9, 0.7, { font: F.head, size: 36 });
  tx(s, '≒', rx, 3.1, 3.9, 0.7, { font: F.head, size: 36, color: C.dim });
  tx(s, '통합사회 100점', rx, 3.75, 3.9, 0.7, { font: F.head, size: 36, color: C.yellow, glow: { size: 6, opacity: 0.3, color: K.yellow } });
  tx(s, '네 과목 모두 비슷한 학점,\n내신 무게도 비슷합니다', rx, 4.75, 3.9, 1.0, { font: F.med, size: 22, color: C.sub, lsm: 1.2 });
}

// 이유 3: 상위 10%
{
  const s = content('이유 3 · 내신 5등급제', '1등급은 상위 10%뿐입니다', '셋째, 내신이 5등급제로 바뀌면서 1등급은 상위 10%에게만 주어집니다. 2등급은 상위 34%까지입니다.\n중학교는 절대평가라서 90점만 넘으면 A등급, 전교생의 30~50%가 A를 받습니다.\n하지만 고등학교는 1등부터 끝까지 줄을 세우는 상대평가입니다. 중학교 때 A를 받던 학생들끼리 모여서, 그중 10%만 1등급을 받습니다.\n시험 일주일 전에 자습서만 외우고 들어가면 한두 문제 실수로 3~4등급까지 떨어질 수 있습니다.\n이과 최상위권 학생도 이제는 사회 2등급이 뜨는 순간 최상위권 대학과 의약학 계열 진학에 큰 부담이 됩니다.');
  // 왼쪽: 중학교 vs 고등학교
  box(s, ML, 2.15, 6.6, 1.75, { snip: true, line: C.dim, lw: 1.5 });
  tx(s, '중학교 · 절대평가', ML + 0.35, 2.3, 6, 0.45, { font: F.semi, size: 19, color: C.dim });
  tx(s, '90점 넘으면 A등급', ML + 0.35, 2.75, 6.1, 0.45, { font: F.semi, size: 21, color: C.sub });
  tx(s, '전교생의 30~50%가 A', ML + 0.35, 3.2, 6.1, 0.55, { font: F.head, size: 27, color: C.sub });
  box(s, ML, 4.1, 6.6, 1.75, { snip: true, line: C.yellow, lw: 2.25, glow: K.yellow, glowOpt: { opacity: 0.3, blur: 12 }, fill: K.bg });
  tx(s, '고등학교 · 상대평가', ML + 0.35, 4.25, 6, 0.45, { font: F.semi, size: 19, color: C.yellow });
  tx(s, 'A등급 받던 학생들끼리 경쟁', ML + 0.35, 4.7, 6.1, 0.45, { font: F.semi, size: 21 });
  tx(s, '상위 10%만 1등급', ML + 0.35, 5.15, 6.1, 0.55, { font: F.head, size: 27, color: C.yellow });
  tx(s, '한두 문제 실수 → 3~4등급까지 떨어질 수 있습니다', ML, 6.15, 6.8, 0.5, { font: F.semi, size: 21, color: C.sub });
  // 오른쪽: 100명 점 그림
  const gx = 8.25, gy = 2.2, d = 0.27, g = 0.1;
  for (let i = 0; i < 100; i++) {
    const cx = gx + (i % 10) * (d + g), cy = gy + Math.floor(i / 10) * (d + g);
    if (i < 10) s.addShape(S.ellipse, { x: cx, y: cy, w: d, h: d, fill: { color: C.yellow }, line: { type: 'none' }, shadow: glow(K.yellow, { opacity: 0.6, blur: 6 }) });
    else if (i < 34) s.addShape(S.ellipse, { x: cx, y: cy, w: d, h: d, fill: { color: C.neon, transparency: 55 }, line: { type: 'none' } });
    else s.addShape(S.ellipse, { x: cx, y: cy, w: d, h: d, line: { color: C.dim, width: 1 } });
  }
  const gw = 10 * d + 9 * g;
  tx(s, [r('1등급 ', { color: C.yellow, font: F.head }), r('10명', { color: C.yellow, font: F.head }), r('   2등급까지 34명', { color: C.neon })], gx, gy + gw + 0.15, gw + 0.5, 0.5, { font: F.semi, size: 20 });
  tx(s, '100명이 시험을 보면', gx, gy + gw + 0.62, gw, 0.45, { font: F.med, size: 18, color: C.dim });
}

// 이유 4: 사회 → 사회탐구
{
  const s = content('이유 4 · ‘사회’에서 ‘사회탐구’로', '외우는 사회가 아니라, 추론하는 사회탐구입니다', '넷째, 중학교까지는 외워서 푸는 사회였다면 고등학교부터는 두세 번 추론하고 자료를 분석해야 풀리는 사회탐구입니다.\n고등학교 통합사회 내신이 어려운 이유 중 하나가 전공별 분할 수업입니다. 지리, 윤리, 경제, 정치와 법을 전공한 선생님들이 파트를 나눠 들어오시고, 1단원·3단원·5단원을 동시에 나가기도 합니다.\n게다가 교과서 내용이 간결하다 보니, 변별력을 위해 고2·고3 학력평가, 수능 기출, EBS 수능특강의 낯선 지도·도표·사상가 원전을 학교 프린트로 다시 편집해서 출제합니다.\n시중의 평범한 고1 문제집만으로는 1등급이 어려운 구조입니다.');
  // 왼쪽: 학교 수업
  tx(s, '학교 수업', ML, 2.1, 5.4, 0.5, { font: F.head, size: 24, color: C.neon });
  const subs = [['world', '지리'], ['bulb', '윤리'], ['coin', '경제'], ['gavel', '정치와 법']];
  subs.forEach(([ic, t], i) => {
    const x = ML + (i % 2) * 2.75, y = 2.75 + Math.floor(i / 2) * 1.12;
    box(s, x, y, 2.55, 0.95, { snip: true, line: C.line, lw: 1.5 });
    icon(s, ic, 'cyan', x + 0.15, y + 0.12, 0.72);
    tx(s, t, x + 0.95, y, 1.55, 0.95, { font: F.semi, size: 22, valign: 'middle' });
  });
  tx(s, '전공별 선생님이 나누어 수업\n1·3·5단원이 동시에 진행되기도', ML, 5.1, 5.6, 0.9, { font: F.med, size: 20, color: C.sub, lsm: 1.2 });
  // 오른쪽: 시험 자료
  const rx = 7.05;
  tx(s, '시험 자료', rx, 2.1, 5.5, 0.5, { font: F.head, size: 24, color: C.yellow });
  ['고2·고3 전국연합학력평가', '수능 · 평가원 기출', 'EBS 수능특강 지도·도표·원전'].forEach((t, i) => {
    const y = 2.75 + i * 0.72;
    box(s, rx, y, 5.5, 0.58, { line: C.dim, lw: 1.25 });
    tx(s, t, rx + 0.2, y, 5.2, 0.58, { font: F.semi, size: 19, valign: 'middle' });
  });
  icon(s, 'file-text', 'yellow', rx - 0.08, 4.95, 0.75);
  tx(s, '→ 학교 프린트로 다시 편집해서 출제', rx + 0.7, 4.95, 4.9, 0.75, { font: F.head, size: 20, color: C.yellow, valign: 'middle' });
  box(s, ML, 6.08, CW, 0.72, { line: false, fill: K.yellow, ft: 86 });
  tx(s, '시중의 평범한 고1 문제집만으로는 1등급이 어렵습니다', ML, 6.08, CW, 0.72, { font: F.head, size: 24, color: C.yellow, align: 'center', valign: 'middle' });
}

// 이유 5: 시간
{
  const s = content('이유 5 · 시간', '학기 중에는 통합사회를 펼칠 시간이 없습니다', '다섯째, 시간입니다. 3~4월이 되면 학생들은 국·영·수·과 과제와 수행평가에 치여서 통합사회 책을 펼칠 시간조차 없습니다.\n더 무서운 건 4월쯤입니다. 영어·수학에서 벽을 느낀 학생들이 “국·영·수는 단기간에 안 되니 통합사회에 올인하자”며 모든 시간을 통합사회에 쏟기 시작합니다.\n겨울방학에 통합사회 체급을 올려 두지 않은 학생은, 시험 2주 전에 국·영·수 시간을 빼서 통합사회를 하게 되고, 전 과목 계획이 도미노처럼 무너집니다.\n그래서 개념은 반드시 겨울방학에 끝내 두어야 합니다.');
  const pts = [
    ['겨울방학', '지금', '통합사회 개념을\n끝내 둘 시간', 'mint', C.mint],
    ['3월', '입학', '국·영·수·과 과제와\n수행평가에 밀림', 'cyan', C.neon],
    ['4월', '‘사회 올인족’', '국·영·수 대신\n통합사회에 올인', 'cyan', C.neon],
    ['중간고사', '첫 시험', '준비된 학생과\n급한 학생의 차이', 'yellow', C.yellow],
  ];
  const x0 = 1.95, x1 = 11.38, ly = 2.95, step = (x1 - x0) / 3;
  line(s, x0, ly, x1, ly, { color: C.line, w: 3 });
  line(s, x0, ly, x0 + step * 0.98, ly, { color: C.mint, w: 3.5, glow: K.mint });
  pts.forEach(([a, b, d, col, cc], i) => {
    const cx = x0 + i * step;
    tx(s, a, cx - 1.4, 2.0, 2.8, 0.55, { font: F.head, size: 26, color: cc, align: 'center' });
    ping(s, col, cx, ly, 0.72);
    tx(s, b, cx - 1.4, 3.42, 2.8, 0.48, { font: F.semi, size: 21, color: cc, align: 'center' });
    tx(s, d, cx - 1.45, 3.9, 2.9, 0.85, { font: F.med, size: 19, color: C.sub, align: 'center', lsm: 1.15 });
  });
  box(s, ML, 5.25, CW, 1.35, { snip: true, line: C.yellow, lw: 2, fill: K.bg, glow: K.yellow, glowOpt: { opacity: 0.3, blur: 12 } });
  icon(s, 'alert-triangle', 'yellow', ML + 0.3, 5.45, 0.95);
  tx(s, '시험 2주 전에 국·영·수 시간을 빼서 통합사회를 하면', ML + 1.45, 5.4, 10.2, 0.5, { font: F.semi, size: 22 });
  tx(s, '전 과목 계획이 도미노처럼 무너집니다', ML + 1.45, 5.9, 10.2, 0.55, { font: F.head, size: 26, color: C.yellow });
}

// 이유 6: 첫 시험의 성취
{
  const s = content('이유 6 · 자신감', '고교 3년의 자신감은 첫 시험에서 결정됩니다', '여섯째, 고등학교 첫 시험인 1학기 중간고사는 단순한 시험 이상의 의미가 있습니다.\n평생 해 온 국·영·수는 단기간에 성적을 뒤집기 어렵지만, 통합사회는 겨울방학에 올바른 방향으로 준비하면 첫 시험에서 가장 확실하게 1등급을 맛볼 수 있는 과목입니다.\n“나도 고등학교에서 1등급을 할 수 있다”는 자신감을 얻은 학생은 그 힘으로 기말고사와 고3 입시까지 흔들림 없이 달려갈 수 있습니다.');
  tx(s, '“나도 고등학교에서\n1등급을 할 수 있다!”', ML, 2.2, 5.4, 1.5, { font: F.head, size: 34, color: C.mint, lsm: 1.15 });
  tx(s, '국·영·수는 단기간에 뒤집기 어렵지만,\n통합사회는 겨울방학에 제대로 준비하면\n첫 시험에서 가장 확실하게\n1등급을 맛볼 수 있는 과목입니다.', ML, 4.0, 5.6, 2.2, { font: F.med, size: 21, color: C.sub, lsm: 1.3 });
  const steps = [['겨울방학', '개념 완성'], ['1학기 중간', '첫 1등급'], ['기말고사', '흐름 유지'], ['고3 입시', '끝까지']];
  const sx = 6.55, sw = 1.5, sh = 0.85;
  steps.forEach(([a, b], i) => {
    const x = sx + i * sw, y = 5.85 - i * 0.95, hi = i === 1;
    box(s, x, y, sw - 0.08, 6.7 - y, { line: hi ? C.yellow : C.neon, lw: hi ? 2.5 : 1.75, fill: hi ? K.yellow : K.neon, ft: hi ? 85 : 92, glow: hi ? K.yellow : undefined, glowOpt: { opacity: 0.35 } });
    tx(s, a, x, y + 0.1, sw - 0.08, 0.4, { font: F.semi, size: 17, color: hi ? C.yellow : C.white, align: 'center' });
    tx(s, b, x, y + 0.47, sw - 0.08, 0.38, { font: F.med, size: 15, color: C.sub, align: 'center' });
  });
  icon(s, 'trophy', 'yellow', sx + sw * 1 + 0.27, 3.95, 0.9);
}

// PART 1 정리
{
  const s = content('정리', '겨울방학 통합사회, 이유 여섯 가지', '정리하면 이렇습니다.\n수능까지 이어지는 과목이고, 국·영·수와 비슷한 학점으로 반영되며, 1등급은 상위 10%뿐입니다.\n외우는 사회가 아니라 추론하는 사회탐구이고, 학기 중에는 시간이 없으며, 첫 시험의 자신감이 고교 3년을 좌우합니다.\n그래서 이번 겨울방학이 통합사회를 시작할 때입니다.');
  const cells = [
    ['target', '수능까지 이어진다', '2028 대입부터 수능 공통 과목'],
    ['scale', '국·영·수와 비슷한 학점', '100점의 무게가 비슷하다'],
    ['percentage', '1등급은 상위 10%', '5등급제 상대평가'],
    ['chart-dots-3', '사회 → 사회탐구', '학평·수능·수특 자료로 출제'],
    ['hourglass-high', '학기 중엔 시간이 없다', '4월 ‘사회 올인족’의 등장'],
    ['trophy', '첫 시험의 자신감', '고교 3년을 좌우하는 경험'],
  ];
  const cw = 3.75, ch = 2.15, gx = (CW - 3 * cw) / 2;
  cells.forEach(([ic, t, d], i) => {
    const x = ML + (i % 3) * (cw + gx), y = 2.1 + Math.floor(i / 3) * (ch + 0.3);
    box(s, x, y, cw, ch, { snip: true, line: C.line, lw: 1.5 });
    icon(s, ic, i === 2 ? 'yellow' : 'cyan', x + 0.22, y + 0.2, 0.85);
    tx(s, String(i + 1), x + cw - 0.85, y + 0.2, 0.6, 0.6, { font: F.head, size: 28, color: C.dim, align: 'right' });
    tx(s, t, x + 0.3, y + 1.1, cw - 0.5, 0.5, { font: F.head, size: 22, color: i === 2 ? C.yellow : C.white });
    tx(s, d, x + 0.3, y + 1.58, cw - 0.5, 0.45, { font: F.med, size: 17, color: C.sub });
  });
}

// ── PART 2 ──
section('02 왜 승민T 수업');
divider('02', '왜 이승민T의\n통합사회 수업일까?', '원리 이해 · 4단계 워크북 · 킬러 파트 · 1:1 오답 관리',
  '두 번째, 그렇다면 왜 제 수업이어야 하는지 네 가지로 말씀드리겠습니다.');

// 강점 1: 원리 이해
{
  const s = content('강점 1 · 원리 이해와 스토리텔링', '외우게 하지 않고, 이해하게 합니다', '통합사회에서 1등급이 갈리는 지점은 단순한 단답형 암기가 아닙니다. 길어지는 제시문을 빠르게 읽어내는 사회과 특화 문해력, 그리고 낯선 자료를 해석하는 논리적 추론력입니다.\n제 수업은 밑줄만 긋고 넘어가는 주입식 수업이 아닙니다.\n왜 그 시대에 그런 사상가가 등장했는지, 경제 그래프와 기후 자료가 어떤 인과관계로 움직이는지 실생활 사례와 스토리텔링으로 풀어냅니다.\n수업 시간 안에 원리를 납득하기 때문에, 억지로 외우지 않아도 고3 수능까지 남는 장기 기억이 됩니다.');
  box(s, ML, 2.15, 5.0, 2.45, { snip: true, line: C.dim, lw: 1.5 });
  icon(s, 'book-off', 'gray', ML + 0.3, 2.35, 0.85);
  tx(s, '밑줄 긋고 외우는 수업', ML + 0.35, 3.3, 4.4, 0.5, { font: F.semi, size: 22, color: C.sub });
  tx(s, '시험이 끝나면 사라지는 기억', ML + 0.35, 3.82, 4.4, 0.5, { font: F.med, size: 19, color: C.dim });
  line(s, ML + 5.2, 3.37, ML + 6.6, 3.37, { color: C.neon, w: 3.5, arrow: true, glow: K.neon });
  const rx = ML + 6.83;
  box(s, rx, 2.15, 5.0, 2.45, { snip: true, line: C.neon, lw: 2.25, fill: K.bg, glow: K.neon, glowOpt: { opacity: 0.4, blur: 14 } });
  icon(s, 'brain', 'cyan', rx + 0.3, 2.35, 0.85);
  tx(s, '원리 + 스토리텔링', rx + 0.35, 3.3, 4.4, 0.5, { font: F.head, size: 24, color: C.neon });
  tx(s, '고3 수능까지 남는 장기 기억', rx + 0.35, 3.82, 4.4, 0.5, { font: F.semi, size: 20 });
  ['왜 그 시대에\n그 사상가가 나왔을까?', '경제 그래프는\n왜 이렇게 움직일까?', '기후 그래프의 숫자는\n무엇의 결과일까?'].forEach((q, i) => {
    const x = ML + i * 3.98;
    box(s, x, 4.85, 3.8, 1.05, { line: C.mint, lw: 1.25 });
    tx(s, q, x + 0.1, 4.85, 3.6, 1.05, { font: F.semi, size: 19, color: C.mint, valign: 'middle', align: 'center', lsm: 1.1 });
  });
  tx(s, [r('1등급을 가르는 힘 = '), r('사회과 특화 문해력', { color: C.yellow, font: F.head }), r(' + '), r('논리적 추론력', { color: C.yellow, font: F.head })], ML, 6.2, CW, 0.55, { font: F.semi, size: 24, align: 'center' });
}

// 강점 2: 워크북 4단계
{
  const s = content('강점 2 · 자체 제작 워크북', '눈으로만 읽는 ‘가짜 공부’를 막습니다', '많은 학생들이 개념서를 눈으로 두세 번 읽고 나면 “다 안다, 다 외웠다”고 착각합니다. 하지만 책을 덮는 순간 기억이 나지 않고, 선지 표현이 조금만 바뀌어도 오답을 고릅니다.\n이 메타인지의 함정을 깨기 위해, 개념 수업 뒤에는 제가 직접 만든 워크북으로 네 단계를 거칩니다.\n빈칸 채우기, O/X 변형, 사료 분석, 그리고 백지 테스트까지. 눈으로만 읽는 공부를 막고 개념을 완전히 내 것으로 만듭니다.');
  tx(s, '“다 안다, 다 외웠다” → 책을 덮으면 기억나지 않는 착각', ML, 2.0, CW, 0.5, { font: F.med, size: 21, color: C.sub });
  const st = [['pencil', '빈칸 채우기', '핵심 용어를\n직접 써 본다'], ['square-check', 'O/X 변형', '선지 표현이 바뀌어도\n정확히 고른다'], ['file-text', '사료 분석', '낯선 원전·자료를\n스스로 해석한다'], ['writing', '백지 테스트', '아무것도 없이\n처음부터 다시 쓴다']];
  const cw = 2.7, gap = (CW - 4 * cw) / 3, y = 2.8, ch = 3.2;
  st.forEach(([ic, t, d], i) => {
    const x = ML + i * (cw + gap), last = i === 3;
    box(s, x, y, cw, ch, { snip: true, line: last ? C.yellow : C.neon, lw: last ? 2.25 : 1.75, fill: K.bg, glow: last ? K.yellow : undefined, glowOpt: { opacity: 0.35 } });
    tx(s, `0${i + 1}`, x + 0.25, y + 0.2, 1, 0.55, { font: F.head, size: 26, color: last ? C.yellow : C.neon });
    icon(s, ic, last ? 'yellow' : 'cyan', x + cw - 1.05, y + 0.2, 0.82);
    tx(s, t, x + 0.25, y + 1.25, cw - 0.4, 0.55, { font: F.head, size: 24, color: last ? C.yellow : C.white });
    tx(s, d, x + 0.25, y + 1.9, cw - 0.4, 1.0, { font: F.med, size: 18, color: C.sub, lsm: 1.2 });
    if (i < 3) line(s, x + cw + 0.05, y + ch / 2, x + cw + gap - 0.05, y + ch / 2, { color: C.neon, w: 2.5, arrow: true });
  });
  tx(s, '개념 수업 → 워크북 4단계 → 완전히 내 것으로', ML, 6.3, CW, 0.5, { font: F.semi, size: 21, color: C.mint, align: 'center' });
}

// 강점 3: 킬러 파트
{
  const s = content('강점 3 · 킬러 파트 집중 공략', '1등급과 2등급을 가르는 승부처', '통합사회 내신에서 1등급과 2등급을 가르는 승부처는 분명합니다.\n1학기에는 쾨펜의 기후 구분과 낯선 기후 그래프 분석, 인간 중심주의와 생태 중심주의 사상가 비교.\n2학기에는 롤스와 노직 같은 정의관 비교, 기본권과 근로기준법 계산, 기회비용·비교우위 계산, 인구 부양비 도표 분석입니다.\n이 파트들을 고2·고3 학력평가와 수능 기출 수준으로 훈련합니다.');
  tx(s, [r('●  ', { color: C.neon }), r('1학기 · 통합사회1', { color: C.neon }), r('        ●  ', { color: C.pink }), r('2학기 · 통합사회2', { color: C.pink })], ML, 1.95, CW, 0.45, { font: F.semi, size: 19 });
  const tiles = [
    ['temperature', '지리', '쾨펜 기후 구분\n낯선 기후 그래프', 1],
    ['leaf', '윤리', '인간 중심주의\nvs 생태 중심주의', 1],
    ['scale', '윤리', '롤스 vs 노직\n정의관 비교', 2],
    ['gavel', '법', '기본권 ·\n근로기준법 계산', 2],
    ['calculator', '경제', '기회비용 ·\n비교우위 계산', 2],
    ['chart-bar', '지리', '인구 부양비\n도표 분석', 2],
  ];
  const cw = 3.75, ch = 1.95, gx = (CW - 3 * cw) / 2;
  tiles.forEach(([ic, tag, t, sem], i) => {
    const x = ML + (i % 3) * (cw + gx), y = 2.6 + Math.floor(i / 3) * (ch + 0.25);
    const col = sem === 1 ? 'cyan' : 'pink', cc = sem === 1 ? C.neon : C.pink;
    box(s, x, y, cw, ch, { snip: true, line: cc, lw: 1.75 });
    icon(s, ic, col, x + 0.22, y + 0.25, 0.9);
    tx(s, tag, x + 1.25, y + 0.28, 1.5, 0.4, { font: F.semi, size: 16, color: cc });
    tx(s, t, x + 1.25, y + 0.68, cw - 1.4, 1.1, { font: F.head, size: 21, lsm: 1.12 });
  });
}

// 강점 3-2: 타임어택
{
  const s = content('강점 3 · 타임어택 유형', '시험장에서 시간을 빼앗는 유형, 미리 훈련합니다', '시험장에서 학생들 멘탈이 흔들리는 건 시간을 끄는 유형들입니다.\n세 사람의 주장을 비교하는 벤다이어그램, 사상가 순서도, 비율과 전체 수를 함정으로 파 놓은 도표, 그리고 경제 계산 문제입니다.\n이 유형들을 고2·고3 학력평가와 평가원 기출 수준으로 집중 훈련해서, 어렵게 출제하는 학교에 가더라도 앞서 나갈 수 있게 합니다.');
  icon(s, 'stopwatch', 'yellow', ML + 0.35, 2.15, 2.6);
  tx(s, '고2·고3 학평 ·\n평가원 기출 수준으로\n집중 훈련', ML, 4.95, 4.0, 1.5, { font: F.head, size: 24, color: C.yellow, align: 'center', lsm: 1.15 });
  const rows = [['circles-relation', '3자 비판 벤다이어그램', '세 사상가의 주장을 겹쳐 비교'], ['sitemap', '사상가 순서도(알고리즘)', '질문을 따라가며 사상가 찾기'], ['percentage', '비율·전체 수 함정 도표', '비율만 보고 고르면 틀린다'], ['calculator', '경제 계산 문제', '기회비용 · 비교우위 · 근로기준법']];
  const rx = 5.25;
  rows.forEach(([ic, t, d], i) => {
    const y = 2.1 + i * 1.18;
    box(s, rx, y, 7.33, 1.0, { snip: true, line: C.line, lw: 1.5 });
    icon(s, ic, 'cyan', rx + 0.18, y + 0.1, 0.8);
    tx(s, t, rx + 1.15, y + 0.06, 6.0, 0.5, { font: F.head, size: 23 });
    tx(s, d, rx + 1.15, y + 0.54, 6.0, 0.4, { font: F.med, size: 17, color: C.sub });
  });
}

// 강점 4: 1:1 오답 관리
{
  const s = content('강점 4 · 1:1 밀착 오답 관리', '인강과 결정적으로 다른 점', '“인강으로 혼자 들으면 안 되나요?” 하고 묻는 분들이 계십니다.\n인강은 영상을 멈추고 딴짓을 하거나, 테스트에서 모르면 책을 펼쳐 보고 답을 적는 자기기만에 빠지기 쉽습니다.\n현장 수업의 힘은 강제성과 밀착 관리입니다. 매 수업 누적 복습 테스트를 보고, 제가 학생 한 명 한 명의 오답을 직접 확인합니다.\n점수만 매기는 게 아니라 개념 암기가 덜 된 건지, 어휘력·문해력이 부족해 발문을 잘못 읽은 건지, 자료 해석 방법이 흔들린 건지를 진단하고 교정합니다.');
  box(s, ML, 2.1, 5.55, 2.55, { snip: true, line: C.dim, lw: 1.5 });
  tx(s, '인강 혼자 듣기', ML + 0.3, 2.25, 5, 0.5, { font: F.head, size: 22, color: C.sub });
  [['player-pause', '영상 멈추고 딴짓'], ['eye-off', '모르면 책 보고 답 적기']].forEach(([ic, t], i) => {
    const y = 2.9 + i * 0.72;
    icon(s, ic, 'gray', ML + 0.28, y - 0.05, 0.62);
    tx(s, t, ML + 1.0, y, 4.4, 0.52, { font: F.semi, size: 21, color: C.sub, valign: 'middle' });
  });
  tx(s, '→ 자기기만에 빠지기 쉽다', ML + 0.3, 4.12, 5, 0.42, { font: F.med, size: 18, color: C.dim });
  const rx = ML + 6.28;
  box(s, rx, 2.1, 5.55, 2.55, { snip: true, line: C.neon, lw: 2.25, fill: K.bg, glow: K.neon, glowOpt: { opacity: 0.4, blur: 14 } });
  tx(s, '현장 수업', rx + 0.3, 2.25, 5, 0.5, { font: F.head, size: 22, color: C.neon });
  [['clipboard-text', '매 수업 누적 복습 테스트'], ['user-check', '강사가 오답을 1:1로 확인']].forEach(([ic, t], i) => {
    const y = 2.9 + i * 0.72;
    icon(s, ic, 'cyan', rx + 0.28, y - 0.05, 0.62);
    tx(s, t, rx + 1.0, y, 4.4, 0.52, { font: F.semi, size: 21, valign: 'middle' });
  });
  tx(s, '→ 강제성과 밀착 관리', rx + 0.3, 4.12, 5, 0.42, { font: F.semi, size: 18, color: C.mint });
  icon(s, 'zoom-question', 'yellow', ML - 0.05, 5.05, 0.85);
  tx(s, '오답 원인을 진단하고 교정합니다', ML + 0.9, 5.08, 6, 0.75, { font: F.head, size: 24, color: C.yellow, valign: 'middle' });
  ['개념 암기가 부족한가?', '발문을 잘못 읽었나? (어휘·문해력)', '자료 해석 방법이 흔들렸나?'].forEach((t, i) => {
    const w = [3.2, 4.65, 3.6][i], x = ML + [0, 3.4, 8.25][i];
    box(s, x, 6.0, w, 0.7, { line: C.yellow, lw: 1.25 });
    tx(s, t, x, 6.0, w, 0.7, { font: F.semi, size: 18, align: 'center', valign: 'middle' });
  });
}

// ── PART 3 ──
section('03 10주 커리큘럼');
divider('03', '통합사회 1·2\n10주 완성 커리큘럼', '12/20(일) 개강 · 주 1회 · 총 10회로 전 범위 한 바퀴',
  '세 번째, 10주 커리큘럼입니다. 12월 20일 일요일부터 2월 21일까지, 주 1회 총 10번 수업으로 통합사회1·2 전 범위를 한 바퀴 돕니다.');

// 10주 로드맵
{
  const s = content('10주 로드맵', '주 1회, 10주 만에 통합사회 1·2 전 범위', '전체 흐름을 한눈에 보면 이렇습니다.\n1주부터 4주까지는 통합사회1 다섯 단원, 5주부터 10주까지는 통합사회2 다섯 단원입니다.\n통합사회2의 시장경제와 지속가능발전 단원은 계산 문제가 많아서 7주와 8주, 두 번에 나누어 깊이 있게 다룹니다.');
  // 두 노선: 왼쪽에 과목 이름, 오른쪽으로 주차 정거장(1주부터 10주까지 같은 간격 — 통합사회1은 6칸 중 4칸)
  const x0 = 3.05, x1 = W - ML - 0.85, step = (x1 - x0) / 5;
  const row = (label, sub, color, cc, ly, items, wk0, slots) => {
    tx(s, [r(label, { breakLine: true }), r(sub, { font: F.semi, size: 18, color: C.sub })], ML, ly - 0.55, 2.1, 1.1, { font: F.head, size: 24, color: cc, valign: 'middle', lsm: 1.1 });
    const xs = slots.map((k) => x0 + k * step);
    line(s, xs[0], ly, xs[xs.length - 1], ly, { color: cc, w: 3, glow: color === 'cyan' ? K.neon : K.pink });
    items.forEach((t, i) => {
      const cx = xs[i];
      tx(s, `${wk0 + i}주`, cx - 0.9, ly - 0.78, 1.8, 0.45, { font: F.head, size: 22, color: cc, align: 'center' });
      ping(s, color, cx, ly, 0.6);
      tx(s, t, cx - 0.98, ly + 0.4, 1.96, 0.85, { font: F.semi, size: 17, align: 'center', lsm: 1.1 });
    });
  };
  row('통합사회1', '1~4주', 'cyan', C.neon, 3.2, ['Ⅰ 통합적 관점\nⅡ 행복', 'Ⅲ 자연환경과\n인간', 'Ⅳ 문화와\n다양성', 'Ⅴ 생활공간과\n사회'], 1, [0, 1.6667, 3.3333, 5]);
  row('통합사회2', '5~10주', 'pink', C.pink, 5.6, ['Ⅰ 인권 보장과\n헌법', 'Ⅱ 사회 정의와\n불평등', 'Ⅲ 시장경제 (1)\n경제 체제·선택', 'Ⅲ 시장경제 (2)\n금융·무역', 'Ⅳ 세계화와\n평화', 'Ⅴ 미래와\n지속가능한 삶'], 5, [0, 1, 2, 3, 4, 5]);
}

// 통합사회1 자세히
const weekCard = (s, x, y, w, h, wk, unit, themes, cc) => {
  box(s, x, y, w, h, { snip: true, line: cc, lw: 1.5 });
  tx(s, wk, x + 0.28, y + 0.2, 1.1, 0.5, { font: F.head, size: 24, color: cc });
  tx(s, unit, x + 1.25, y + 0.2, w - 1.45, 0.5, { font: F.head, size: 21 });
  tx(s, themes.map((t, i) => r(t, { bullet: { indent: 18 }, breakLine: i < themes.length - 1 })), x + 0.28, y + 0.85, w - 0.5, h - 0.95, { font: F.med, size: 20, color: C.sub, lsm: 1.12, psa: 6 });
};
{
  const s = content('10주 로드맵 · 통합사회1', '1~4주: 통합사회1 다섯 단원', '1주차에는 통합적 관점과 행복 단원을 함께 나갑니다. 시간·공간·사회·윤리적 관점, 그리고 동서양 사상가의 행복론을 비교합니다.\n2주차는 자연환경과 인간입니다. 기후와 지형에 따른 주민 생활, 인간 중심주의와 생태 중심주의 자연관이 핵심입니다.\n3주차는 문화와 다양성, 4주차는 생활공간과 사회입니다.');
  const cards = [
    ['1주', 'Ⅰ 통합적 관점 · Ⅱ 행복', ['시간·공간·사회·윤리적 관점과 통합적 탐구', '동서양 사상가의 행복론, 행복한 삶의 조건']],
    ['2주', 'Ⅲ 자연환경과 인간', ['세계의 기후와 지형별 주민 생활', '인간 중심주의 vs 생태 중심주의, 환경 문제']],
    ['3주', 'Ⅳ 문화와 다양성', ['세계의 문화권과 문화 변동', '문화 상대주의와 보편 윤리, 다문화 사회']],
    ['4주', 'Ⅴ 생활공간과 사회', ['산업화·도시화와 교통·통신 발달', '우리 지역의 공간 변화와 지역 문제 해결']],
  ];
  const w = (CW - 0.3) / 2, h = 2.2;
  cards.forEach(([wk, u, th], i) => weekCard(s, ML + (i % 2) * (w + 0.3), 2.05 + Math.floor(i / 2) * (h + 0.3), w, h, wk, u, th, C.neon));
}
{
  const s = content('10주 로드맵 · 통합사회2', '5~10주: 통합사회2 다섯 단원', '5주차부터는 통합사회2입니다.\n인권 보장과 헌법, 사회 정의와 불평등을 거쳐, 7·8주차에는 시장경제와 지속가능발전을 두 번에 나누어 기회비용, 금융, 비교우위 계산까지 다룹니다.\n9주차 세계화와 평화, 10주차 미래와 지속가능한 삶으로 전 범위를 마무리합니다.');
  const cards = [
    ['5주', 'Ⅰ 인권 보장과 헌법', ['인권 확장의 역사와 새로운 인권', '기본권·권력 분립·청소년 노동권']],
    ['6주', 'Ⅱ 사회 정의와 불평등', ['정의의 기준, 칸트·벤담·베카리아', '자유주의 vs 공동체주의, 사회 복지']],
    ['7주', 'Ⅲ 시장경제와 지속가능발전 (1)', ['자본주의 전개와 경제 체제', '기회비용·합리적 선택, 시장 실패']],
    ['8주', 'Ⅲ 시장경제와 지속가능발전 (2)', ['자산 관리와 금융 상품', '비교우위와 국제 무역, 지속가능발전']],
    ['9주', 'Ⅳ 세계화와 평화', ['세계화와 지역화, 세계도시·다국적 기업', '국제 평화, 남북 분단·동아시아 갈등']],
    ['10주', 'Ⅴ 미래와 지속가능한 삶', ['인구 문제, 에너지 자원의 분포와 소비', '기후변화 대응과 세계시민의 삶']],
  ];
  const w = (CW - 0.3) / 2, h = 1.47;
  cards.forEach(([wk, u, th], i) => {
    const x = ML + (i % 2) * (w + 0.3), y = 2.0 + Math.floor(i / 2) * (h + 0.18);
    box(s, x, y, w, h, { snip: true, line: C.pink, lw: 1.5 });
    tx(s, wk, x + 0.25, y + 0.14, 1.0, 0.46, { font: F.head, size: 22, color: C.pink });
    tx(s, u, x + 1.15, y + 0.14, w - 1.3, 0.46, { font: F.head, size: 20 });
    tx(s, th.join('  ·  '), x + 0.25, y + 0.68, w - 0.45, 0.68, { font: F.med, size: 17, color: C.sub, lsm: 1.1 });
  });
}

// ── PART 4 ──
section('04 교재 MINIMAP');
{
  const s = divider('04', '교재\nMINIMAP 개념서', '작은 지도에서 온 세상을 보듯,\n개념서 한 권에서 만점의 초석을',
    '네 번째, 교재입니다. 이번 특강은 제가 직접 쓴 개념서 MINIMAP으로 수업합니다.');
}
{
  const s = content('교재', '승민T가 직접 쓴 개념서, MINIMAP', 'MINIMAP은 이번 수업을 위해 제가 직접 쓴 통합사회 개념서입니다. 통합사회1, 통합사회2 두 권입니다.\n작은 지도 한 장으로 온 세상을 보듯이, 이 개념서에서 시작해서 만점의 기초를 다진다는 뜻을 담았습니다.\n2028 수능 예시문항과 고1·고2 학력평가 기출을 분석해서, 시험에 나오는 개념과 표현을 그대로 담았습니다.');
  const h = 4.75, w = (h * 1590) / 2246;
  img(s, join(ART, 'cover-t1.jpg'), ML, 2.0, w, h);
  img(s, join(ART, 'cover-t2.jpg'), ML + w + 0.3, 2.0, w, h);
  const rx = ML + 2 * w + 0.85, rw = W - ML - rx;
  tx(s, '통합사회1 · 통합사회2\n두 권', rx, 2.05, rw, 1.05, { font: F.head, size: 28, lsm: 1.12 });
  [['교과서 단원 순서 그대로', 'map-2'], ['2028 수능 예시문항 +\n고1·고2 학평 기출 분석', 'chart-bar'], ['개념 → 기출 선지 →\n수능형 문제까지 한 권에', 'book-2']].forEach(([t, ic], i) => {
    const y = 3.4 + i * 0.98;
    icon(s, ic, 'cyan', rx - 0.05, y - 0.02, 0.62);
    tx(s, t, rx + 0.7, y, rw - 0.7, 0.85, { font: F.semi, size: 19, lsm: 1.12 });
  });
}
{
  const s = content('교재 · MINIMAP 구성', '개념마다 ‘얼마나 자주 나오는지’까지 보입니다', 'MINIMAP의 구성을 보면, 개념마다 번호가 있고 기출에서 얼마나 자주 나왔는지 기본 개념, 빈출, 최다 빈출로 표시해 두었습니다.\n‘이렇게 나온다’에서는 실제 기출 선지 표현을 O/X로 바로 확인합니다.\n사상가는 카드 한 장에 핵심 주장, 원전 읽기, 헷갈리지 말아야 할 점을 모았고, 지도와 통계는 실제 자료로 만들었습니다.\n중단원이 끝나면 한 장 정리와 수능형 문제로 마무리합니다.');
  const pageP = join(ART, 'minimap-page.png');
  const hasPage = existsSync(pageP);
  const PH = 4.25, PW = hasPage ? (PH * sizeOf(pageP).w) / sizeOf(pageP).h : 0;
  const lw = hasPage ? W - ML - PW - 0.45 - ML : CW;
  const feats = [
    ['stars', '출제 빈도 표시', '개념마다 기본 개념 · 빈출 · 최다 빈출'],
    ['square-check', '이렇게 나온다', '실제 기출 선지 표현을 O/X로 바로 확인'],
    ['users', '사상가 카드', '핵심 주장 · 원전 읽기 · 헷갈리지 말자'],
    ['map-2', '실제 지도 · 통계', '문제집처럼 현실적인 지도와 실측 자료'],
    ['notebook', '한 장 정리 + 수능형 문제', '중단원 끝에서 핵심 정리와 실전 연습'],
  ];
  feats.forEach(([ic, t, d], i) => {
    const y = 2.05 + i * 0.97;
    icon(s, ic, i === 0 ? 'yellow' : 'cyan', ML, y, 0.8);
    tx(s, t, ML + 0.95, y + 0.0, lw - 1.0, 0.45, { font: F.head, size: 22, color: i === 0 ? C.yellow : C.white });
    tx(s, d, ML + 0.95, y + 0.45, lw - 1.0, 0.42, { font: F.med, size: 17, color: C.sub });
  });
  if (hasPage) {
    const px = W - ML - PW, py = 2.15;
    box(s, px - 0.06, py - 0.06, PW + 0.12, PH + 0.12, { line: C.neon, lw: 1.5, glow: K.neon, glowOpt: { opacity: 0.4, blur: 14 } });
    img(s, pageP, px, py, PW, PH);
    tx(s, 'MINIMAP 통합사회1 본문 쪽', px, py + PH + 0.15, PW, 0.4, { font: F.med, size: 15, color: C.dim, align: 'right' });
  }
}

// ── PART 5 ──
section('05 매일 관리');
divider('05', '수업은 주 1번,\n공부는 매일', '강사가 직접 만든 학습 앱으로 10주 동안 매일 관리합니다',
  '다섯 번째, 이번 특강의 가장 큰 차별점인 매일 관리 시스템입니다.');

// 수업 없는 날
{
  const s = content('매일 관리', '방학 특강의 흔한 문제: 수업 없는 날, 공부도 쉰다', '방학 특강에서 가장 흔한 문제는 수업 없는 날 공부도 쉬어 버리는 것입니다.\n수업 시간에 이해한 개념도 며칠만 복습하지 않으면 금방 흐려집니다.\n그래서 이번 특강은 수업이 없는 날에도 학생이 매일 조금씩 공부하고, 제가 매일 그 기록을 확인하는 관리 시스템을 함께 운영합니다.\n그 중심에 제가 직접 만든 승민T 통합사회 클래스 앱이 있습니다.');
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const rowY = [2.35, 4.05], dx = 1.0, x0 = 3.05, d = 0.8;
  tx(s, '보통의 특강', ML, rowY[0] + 0.1, 2.6, 0.6, { font: F.head, size: 22, color: C.sub, valign: 'middle' });
  tx(s, '이번 특강', ML, rowY[1] + 0.1, 2.6, 0.6, { font: F.head, size: 22, color: C.neon, valign: 'middle' });
  days.forEach((dd, i) => {
    const x = x0 + i * dx;
    // 보통: 수업 날(일)만
    if (i === 0) s.addShape(S.ellipse, { x, y: rowY[0], w: d, h: d, fill: { color: C.yellow }, line: { type: 'none' } });
    else s.addShape(S.ellipse, { x, y: rowY[0], w: d, h: d, line: { color: C.dim, width: 1.5, dashType: 'dash' } });
    tx(s, i === 0 ? '수업' : dd, x, rowY[0], d, d, { font: F.semi, size: 17, color: i === 0 ? C.black : C.dim, align: 'center', valign: 'middle' });
    // 이번: 매일
    if (i === 0) s.addShape(S.ellipse, { x, y: rowY[1], w: d, h: d, fill: { color: C.yellow }, line: { type: 'none' }, shadow: glow(K.yellow, { opacity: 0.5, blur: 8 }) });
    else s.addShape(S.ellipse, { x, y: rowY[1], w: d, h: d, fill: { color: C.neon, transparency: 20 }, line: { type: 'none' }, shadow: glow(K.neon, { opacity: 0.5, blur: 8 }) });
    tx(s, i === 0 ? '수업' : '앱', x, rowY[1], d, d, { font: F.head, size: 17, color: C.black, align: 'center', valign: 'middle' });
  });
  const nx = x0 + 7 * dx + 0.15, nw = W - ML - nx;
  tx(s, '6일을 쉬면\n개념이 흐려진다', nx, rowY[0] - 0.05, nw, 0.9, { font: F.med, size: 19, color: C.dim, valign: 'middle', lsm: 1.1 });
  tx(s, '매일 조금씩,\n선생님이 매일 확인', nx, rowY[1] - 0.05, nw, 0.9, { font: F.semi, size: 19, color: C.mint, valign: 'middle', lsm: 1.1 });
  box(s, ML, 5.55, CW, 1.15, { snip: true, line: C.neon, lw: 2, fill: K.bg, glow: K.neon, glowOpt: { opacity: 0.35, blur: 12 } });
  icon(s, 'device-mobile', 'cyan', ML + 0.3, 5.68, 0.9);
  tx(s, [r('그 중심에, 강사가 직접 만든 '), r('승민T 통합사회 클래스', { color: C.neon, font: F.head }), r(' 앱')], ML + 1.4, 5.55, 10.3, 1.15, { font: F.semi, size: 26, valign: 'middle' });
}

// 하루: 아침
const dayRow = (s, x, y, w, ic, col, t, d) => {
  icon(s, ic, col, x, y, 0.78);
  tx(s, t, x + 0.95, y + 0.0, w - 0.95, 0.5, { font: F.head, size: 24 });
  tx(s, d, x + 0.95, y + 0.5, w - 0.95, 0.9, { font: F.med, size: 18, color: C.sub, lsm: 1.18 });
};
{
  const s = content('앱으로 보내는 하루 · 아침 · 등하교 3분', '오늘의 10문제와 1분 개념 카드', '학생의 하루를 따라가 보겠습니다. 아침이나 등하교 시간, 앱을 열면 오늘의 10문제가 기다립니다.\n통합사회1·2 전 단원 600여 문제 중 매일 새로운 문제가 나오고, 틀리면 바로 왜 틀렸는지 해설이 나와서 3분이면 그날 복습이 끝납니다.\n벤담과 밀, 동화주의와 다문화주의처럼 시험마다 헷갈리는 비교 개념은 1분 카드로 정리했습니다. 키워드를 가렸다 보였다 하면서 스스로 암기 테스트를 합니다.');
  const ph = 4.95; let x = ML;
  x += phone(s, 'quiz', x, 1.95, ph) + 0.3;
  x += phone(s, 'card', x, 1.95, ph) + 0.55;
  const w = W - ML - x;
  icon(s, 'sunrise', 'mint', x, 2.0, 0.6);
  tx(s, '아침 · 등하교 3분', x + 0.7, 2.0, w - 0.7, 0.6, { font: F.semi, size: 19, color: C.mint, valign: 'middle' });
  dayRow(s, x, 2.95, w, 'list-check', 'cyan', '오늘의 10문제', '전 단원 600여 문제 중\n매일 새 문제 · 틀리면 바로 해설');
  dayRow(s, x, 4.55, w, 'cards', 'cyan', '1분 비교 카드', '벤담 vs 밀처럼 헷갈리는 개념을\n가렸다 보였다 셀프 테스트');
}
{
  const s = content('앱으로 보내는 하루 · 저녁', '플래너와 집중 타이머로 혼자 공부하는 시간까지', '저녁에 스스로 공부하는 시간에는, 오늘 할 공부를 플래너에 적고 끝낸 만큼 체크하면 달성률이 쌓입니다. “오늘 뭐 하지?” 고민하는 시간이 줄어듭니다.\n25분, 50분, 100분 집중 타이머와 빗소리·도서관 같은 집중 사운드로 혼자 공부하는 시간에도 흐름을 지킵니다. 완주한 집중 횟수도 기록으로 남습니다.');
  const ph = 4.95, pw = 2 * (ph * 0.48) + 0.3;
  let x = W - ML - pw - 0.05;
  const tw = x - 0.55 - ML;
  icon(s, 'moon', 'mint', ML, 2.0, 0.6);
  tx(s, '저녁 · 스스로 공부하는 시간', ML + 0.7, 2.0, tw - 0.7, 0.6, { font: F.semi, size: 19, color: C.mint, valign: 'middle' });
  dayRow(s, ML, 2.95, tw, 'checklist', 'cyan', '플래너 · 달성률', '오늘 할 공부를 적고\n끝낸 만큼 체크하면 달성률이 쌓인다');
  dayRow(s, ML, 4.55, tw, 'clock', 'cyan', '집중 타이머 · 집중 사운드', '25·50·100분 타이머와 빗소리·도서관 소리\n완주한 집중 횟수도 기록');
  x += phone(s, 'planner', x, 1.95, ph) + 0.3;
  phone(s, 'timer', x, 1.95, ph);
}
{
  const s = content('앱으로 보내는 하루 · 시험 전', '틀린 문제만 골라 마지막 점검', '시험 전에는 약점만 골라서 봅니다.\n퀴즈에서 틀린 문제는 오답 노트에 자동으로 저장됩니다.\n주간 테스트 점수는 반 평균과 비교해 볼 수 있고, 내신 기간에는 틀렸던 문제만 모은 시험지를 인쇄해서 마지막 점검을 할 수 있습니다.');
  const ph = 4.95; let x = ML;
  x += phone(s, 'weak', x, 1.95, ph) + 0.3;
  x += phone(s, 'scores', x, 1.95, ph) + 0.55;
  const w = W - ML - x;
  icon(s, 'flag', 'mint', x, 2.0, 0.6);
  tx(s, '시험 전 · 약점만 골라서', x + 0.7, 2.0, w - 0.7, 0.6, { font: F.semi, size: 19, color: C.mint, valign: 'middle' });
  dayRow(s, x, 2.95, w, 'notebook', 'cyan', '오답 노트 자동 저장', '퀴즈에서 틀린 문제가\n저절로 모인다');
  dayRow(s, x, 4.35, w, 'chart-bar', 'cyan', '주간 테스트 vs 반 평균', '내 점수를 반 평균과 비교');
  dayRow(s, x, 5.45, w, 'file-text', 'cyan', '오답 시험지 인쇄', '내신 기간, 틀린 문제만 모아서');
}

// 선생님 확인
{
  const s = content('선생님 관리 화면', '학생이 공부한 기록, 선생님이 매일 확인합니다', '학생이 앱에서 공부한 기록은 제 관리 화면에 그대로 모입니다.\n최근 7일 동안 누가 공부했는지 보이고, 며칠째 쉬고 있는 학생은 맨 위에 표시되어 바로 연락합니다.\n반 전체가 많이 틀린 문제는 다음 수업에서 다시 다룹니다.\n수업 영상을 봤는지도 영상 시청 뒤 한 줄 요약으로 확인합니다.\n수업 시간에만 만나는 선생님이 아니라, 10주 동안 매일 옆에서 확인하는 선생님이 되겠습니다.');
  const wide = join(ART, 'phone-dashboard-wide.png');
  let rx;
  if (existsSync(wide)) {
    const z = sizeOf(wide), w = 6.3, h = (w * z.h) / z.w;
    img(s, wide, ML, 2.0, w, Math.min(h, 4.3));
    rx = ML + w + 0.45;
  } else rx = ML + phone(s, 'dashboard', ML, 1.95, 4.95) + 0.55;
  const w = W - ML - rx;
  [['users', '최근 7일, 누가 공부했는지', '며칠째 쉬는 학생은 맨 위 → 바로 연락'], ['chart-bar', '어떤 문제를 많이 틀렸는지', '반 전체 오답은 다음 수업에서 다시'], ['video', '수업 영상을 봤는지', '시청 후 한 줄 요약으로 인증']].forEach(([ic, t, d], i) => {
    const y = 2.0 + i * 1.15;
    icon(s, ic, 'cyan', rx, y, 0.75);
    tx(s, t, rx + 0.9, y, w - 0.9, 0.48, { font: F.head, size: 21 });
    tx(s, d, rx + 0.9, y + 0.48, w - 0.9, 0.45, { font: F.med, size: 17, color: C.sub });
  });
  tx(s, '수업 시간에만 만나는 선생님이 아니라,\n10주 동안 매일 옆에서 확인하는 선생님', rx, 5.65, w, 1.0, { font: F.head, size: 21, color: C.mint, lsm: 1.2 });
}

// 학부모님께
{
  const s = content('학부모님께', '매주 학습 리포트를 보내 드립니다', '학부모님께는 매주 학습 리포트 문자를 보내 드립니다. 주간 테스트 점수, 반 평균, 숙제 수행률, 그리고 제 코멘트를 정리해서 보내 드립니다.\n성적과 학습 기록은 학생 본인과 담당 강사만 볼 수 있고, 다른 학생 정보는 볼 수 없도록 막혀 있습니다.');
  // 문자 예시(가상 자료)
  const mx = ML + 0.2, my = 2.05, mw = 5.3;
  box(s, mx, my, mw, 4.6, { shape: S.roundRect, radius: 0.3, line: C.dim, lw: 2 });
  tx(s, '학습 리포트 문자 예시 (가상)', mx + 0.3, my + 0.2, mw - 0.6, 0.4, { font: F.semi, size: 15, color: C.dim });
  box(s, mx + 0.3, my + 0.75, mw - 0.6, 3.55, { shape: S.roundRect, radius: 0.2, line: C.neon, lw: 1.5, fill: K.neon, ft: 90 });
  tx(s, [
    r('[승민T 통합사회] 3주차 리포트', { font: F.head, color: C.neon, breakLine: true }),
    r('김하늘 학생', { breakLine: true }),
    r(' ', { breakLine: true }),
    r('주간 테스트  86점 (반 평균 78점)', { breakLine: true }),
    r('숙제 수행률  100%', { breakLine: true }),
    r('앱 공부  7일 중 6일', { breakLine: true }),
    r(' ', { breakLine: true }),
    r('기후 그래프 해석이 많이 좋아졌어요.', { color: C.mint }),
  ], mx + 0.55, my + 0.95, mw - 1.1, 3.2, { font: F.med, size: 18, lsm: 1.2 });
  const rx = 7.0, w = W - ML - rx;
  icon(s, 'message', 'cyan', rx, 2.15, 0.85);
  tx(s, '매주 학습 리포트 문자', rx + 1.05, 2.15, w - 1.05, 0.55, { font: F.head, size: 24 });
  tx(s, '주간 테스트 점수 · 반 평균 ·\n숙제 수행률 · 선생님 코멘트', rx + 1.05, 2.72, w - 1.05, 0.95, { font: F.med, size: 19, color: C.sub, lsm: 1.2 });
  icon(s, 'shield-lock', 'mint', rx, 4.25, 0.85);
  tx(s, '개인정보 보호', rx + 1.05, 4.25, w - 1.05, 0.55, { font: F.head, size: 24 });
  tx(s, '성적과 학습 기록은\n학생 본인과 담당 강사만 볼 수 있습니다', rx + 1.05, 4.82, w - 1.05, 0.95, { font: F.med, size: 19, color: C.sub, lsm: 1.2 });
}

// 관리 사이클
{
  const s = content('10주 동안 매주', '매주 반복되는 관리 사이클', '정리하면, 10주 동안 매주 이 사이클이 반복됩니다.\n수업에서 대단원 개념을 배우고, 매일 앱으로 오늘의 10문제와 개념 카드, 플래너로 복습합니다. 저는 매일 학습 기록을 확인하고 쉬는 학생을 챙깁니다.\n주간 테스트로 점수를 기록하고 오답 노트를 정리한 뒤, 다음 수업은 많이 틀린 문제부터 다시 짚고 시작합니다.\n이 사이클을 10주 동안 반복하면, 통합사회1·2 전 범위를 한 바퀴 돌고 약점까지 정리한 상태로 고등학교 첫 학기를 시작할 수 있습니다.');
  // 다섯 단계를 한 줄 노선으로, 위쪽 되돌이 선으로 '매주 반복'
  const nodes = [
    ['chalkboard', '수업', '대단원\n개념 수업'],
    ['device-mobile', '매일 복습', '오늘의 10문제\n카드 · 플래너'],
    ['user-check', '매일 확인', '기록 확인 ·\n쉬는 학생 관리'],
    ['clipboard-text', '주간 테스트', '점수 기록 ·\n오답 노트 정리'],
    ['repeat', '다음 수업', '많이 틀린\n문제부터 다시'],
  ];
  const x0 = 1.75, x1 = W - 1.75, ny = 3.35, nr = 0.5, step = (x1 - x0) / 4, ty = 2.25;
  line(s, x0, ny, x1, ny, { color: C.neon, w: 3, glow: K.neon });
  // 되돌이 선: 5 → 위로 → 왼쪽 → 1
  line(s, x1, ny - nr, x1, ty, { color: C.mint, w: 2.5, dash: 'dash' });
  line(s, x1, ty, x0, ty, { color: C.mint, w: 2.5, dash: 'dash' });
  line(s, x0, ty, x0, ny - nr - 0.04, { color: C.mint, w: 2.5, dash: 'dash', arrow: true });
  box(s, W / 2 - 1.6, ty - 0.25, 3.2, 0.5, { fill: K.bg, line: false });
  tx(s, '10주 동안 매주 반복', W / 2 - 1.6, ty - 0.25, 3.2, 0.5, { font: F.semi, size: 18, color: C.mint, align: 'center', valign: 'middle' });
  nodes.forEach(([ic, t, d], i) => {
    const nx = x0 + i * step;
    s.addShape(S.ellipse, { x: nx - nr, y: ny - nr, w: 2 * nr, h: 2 * nr, fill: { color: K.bg }, line: { color: C.neon, width: 2.25 }, shadow: glow(K.neon, { opacity: 0.45, blur: 8 }) });
    icon(s, ic, 'cyan', nx - 0.37, ny - 0.37, 0.74);
    tx(s, `${i + 1}  ${t}`, nx - 1.25, ny + 0.65, 2.5, 0.5, { font: F.head, size: 22, align: 'center' });
    tx(s, d, nx - 1.2, ny + 1.15, 2.4, 0.8, { font: F.med, size: 17, color: C.sub, align: 'center', lsm: 1.12 });
  });
  box(s, ML, 5.55, CW, 1.2, { snip: true, line: C.yellow, lw: 2, fill: K.bg, glow: K.yellow, glowOpt: { opacity: 0.3, blur: 12 } });
  tx(s, [r('10주 반복하면 → '), r('통합사회1·2 전 범위 한 바퀴', { font: F.head }), r(' + 약점 정리')], ML + 0.4, 5.62, CW - 0.8, 0.5, { font: F.semi, size: 22, align: 'center' });
  tx(s, '고등학교 첫 학기를 준비된 상태로 시작합니다', ML + 0.4, 6.1, CW - 0.8, 0.55, { font: F.head, size: 26, color: C.yellow, align: 'center' });
}

// ── 신청 안내 ──
section('신청 안내');
{
  const s = content('신청 안내', '2027 겨울방학 통합사회 10주 완성', '신청 안내입니다.\n12월 20일 일요일에 개강해서 2월 21일까지 총 10회 수업이고, 이후에는 정규반으로 이어질 예정입니다.\n수능과 고1 내신 통합사회를 준비하는 학생 대상이고, 정원은 25명입니다.\n장소는 김포 사우역에서 걸어서 5분, 너를위한메이트학원입니다.\n상담은 학원 전화나 문자, 카카오톡 채널로 남겨 주시면 됩니다.');
  const rows = [
    ['calendar', '기간', '12/20(일) ~ 2/21(일) · 총 10회', '이후 정규반으로 전환 예정'],
    ['users', '대상', '수능 · 고1 내신 통합사회 준비 학생', '정원 25명'],
    ['books', '교재', 'MINIMAP 통합사회1·2 개념서', '+ 자체 제작 워크북'],
    ['map-pin', '장소', '너를위한메이트학원 김포관', '김포시 사우중로 92, 3층 · 사우역 도보 5분'],
  ];
  rows.forEach(([ic, k, v, d], i) => {
    const y = 2.0 + i * 1.02;
    icon(s, ic, 'cyan', ML, y + 0.05, 0.72);
    tx(s, k, ML + 0.9, y + 0.05, 1.1, 0.5, { font: F.semi, size: 20, color: C.neon });
    tx(s, v, ML + 2.0, y, 6.2, 0.5, { font: F.head, size: 23 });
    tx(s, d, ML + 2.0, y + 0.5, 6.2, 0.4, { font: F.med, size: 17, color: C.sub });
  });
  const bx = 9.05, bw = W - ML - bx;
  box(s, bx, 2.0, bw, 3.95, { snip: true, line: C.yellow, lw: 2.25, fill: K.bg, glow: K.yellow, glowOpt: { opacity: 0.35, blur: 14 } });
  icon(s, 'phone', 'yellow', bx + 0.3, 2.2, 0.75);
  tx(s, '상담 · 문의', bx + 1.15, 2.2, bw - 1.3, 0.75, { font: F.head, size: 22, color: C.yellow, valign: 'middle' });
  tx(s, '031-8049-0716', bx + 0.32, 3.15, bw - 0.5, 0.55, { font: F.head, size: 26 });
  tx(s, '평일 오후 4~10시', bx + 0.32, 3.68, bw - 0.5, 0.4, { font: F.med, size: 16, color: C.sub });
  tx(s, '010-5528-9505', bx + 0.32, 4.25, bw - 0.5, 0.55, { font: F.head, size: 26 });
  tx(s, '문자 전용', bx + 0.32, 4.78, bw - 0.5, 0.4, { font: F.med, size: 16, color: C.sub });
  tx(s, '카카오톡 채널 ‘너를위한메이트 김포’', bx + 0.32, 5.3, bw - 0.5, 0.45, { font: F.semi, size: 15, color: C.sub });
  tx(s, '문자: 김포관 + 학교·학년 + 상담 희망 과목 + 통화 가능 시간', ML, 6.3, CW, 0.45, { font: F.med, size: 17, color: C.dim });
}

// 마무리
{
  const s = pres.addSlide({ masterName: 'BLANK_DARK', sectionTitle: SECTION });
  img(s, join(ART, 'globe-t1.png'), -1.35, -0.35, 8.2, 8.2);
  const lp = join(ART, 'logo-cyan.png'), z = sizeOf(lp), lw = 5.6;
  tx(s, '이번 겨울, 10주 동안', 7.0, 1.65, 5.6, 0.6, { font: F.semi, size: 26, color: C.sub });
  tx(s, '고등학교 첫 시험의\n지도를 함께 그립니다', 7.0, 2.3, 5.8, 1.8, { font: F.black, size: 40, lsm: 1.12 });
  img(s, lp, 6.75, 4.35, lw, (lw * z.h) / z.w);
  tx(s, [r('통합사회 '), r('이승민T', { font: F.head, color: C.white })], 7.0, 5.95, 3.6, 0.6, { font: F.semi, size: 24, color: C.sub, valign: 'middle' });
  const lg = join(ROOT, 'assets/academy-logo-white.png'), zz = sizeOf(lg), hh = 0.48;
  img(s, lg, W - ML - (hh * zz.w) / zz.h, 6.02, (hh * zz.w) / zz.h, hh);
  s.addNotes('작은 지도 한 장으로 온 세상을 보듯이, 이번 겨울 10주 동안 MINIMAP과 함께 고등학교 첫 시험까지 가는 길을 같이 그리겠습니다.\n확실한 개념 설명과 꼼꼼한 관리로 통합사회를 끝내고 싶다면, 너를위한메이트학원 승민T 수업에서 만나겠습니다. 감사합니다.');
}

// 촬영 전 점검(발표 때는 숨김)
section('촬영 전 점검');
{
  const s = pres.addSlide({ masterName: 'BLANK_DARK', sectionTitle: SECTION });
  s.hidden = true;
  box(s, 0.5, 0.5, W - 1, H - 1, { line: C.neon, lw: 2, dash: 'dash' });
  [[0.08, 0.08], [W - 0.42, 0.08], [0.08, H - 0.42], [W - 0.42, H - 0.42]].forEach(([x, y]) => box(s, x, y, 0.34, 0.34, { line: C.white, lw: 2 }));
  line(s, W / 2 - 0.3, H / 2, W / 2 + 0.3, H / 2, { color: C.white, w: 1.5 });
  line(s, W / 2, H / 2 - 0.3, W / 2, H / 2 + 0.3, { color: C.white, w: 1.5 });
  tx(s, '촬영 전 점검 화면 (발표할 때는 숨겨진 슬라이드)', 0.8, 0.75, 9, 0.5, { font: F.head, size: 22 });
  tx(s, '① 점선 틀이 칠판 안에 다 들어오게 빔 크기·위치를 맞춘다   ② 카메라로 색과 글자 크기를 확인한다', 0.8, 1.25, 11.8, 0.45, { font: F.med, size: 16, color: C.sub });
  const sw = [['흰색', C.white], ['보조 글자', C.sub], ['하늘(주 색)', C.neon], ['민트', C.mint], ['분필 노랑', C.yellow], ['분홍(통합사회2)', C.pink], ['흐린 글자', C.dim]];
  sw.forEach(([t, c], i) => {
    const x = 0.8 + i * 1.73;
    box(s, x, 2.0, 1.55, 1.0, { fill: c, line: false });
    tx(s, t, x, 3.08, 1.6, 0.4, { font: F.semi, size: 15, color: c });
  });
  [72, 44, 32, 24, 20, 16].forEach((pt, i) => {
    const y = [3.75, 4.75, 5.45, 5.98, 6.38, 6.72][i];
    tx(s, `${pt}pt  통합사회 1등급 ABC 123`, 0.8, y, 11.5, pt / 72 + 0.15, { font: i < 2 ? F.head : F.semi, size: pt });
  });
}

// ════════════════════════ 저장 + 테마 색 넣기 ════════════════════════
await pres.writeFile({ fileName: FILE });
{
  const zip = await JSZip.loadAsync(readFileSync(FILE));
  const part = 'ppt/theme/theme1.xml';
  let xml = await zip.file(part).async('string');
  const SLOTS = ['dk1', 'lt1', 'dk2', 'lt2', 'accent1', 'accent2', 'accent3', 'accent4', 'accent5', 'accent6', 'hlink', 'folHlink'];
  const scheme = `<a:clrScheme name="${THEME.name}">` + SLOTS.map((k) => `<a:${k}><a:srgbClr val="${THEME.colors[k]}"/></a:${k}>`).join('') + '</a:clrScheme>';
  xml = xml.replace(/<a:clrScheme\b[\s\S]*?<\/a:clrScheme>/, scheme).replace(/(<a:(?:theme|fontScheme)\b[^>]*?\bname=")[^"]*"/g, (_, h) => `${h}${THEME.name}"`);
  zip.file(part, xml);
  // 폴더 항목은 빼고 저장(클라우드 드라이브에서 열 때 문제가 되는 경우가 있음)
  for (const k of Object.keys(zip.files)) if (zip.files[k].dir) delete zip.files[k];
  writeFileSync(FILE, await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' }));
}
console.log('완성:', FILE, `(${pres.slides.length}장)`);
