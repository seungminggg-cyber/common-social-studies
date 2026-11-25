// 2028 수능 통합사회 정규반 OT 촬영용 PPT 만들기 (겨울특강OT 코드를 고쳐 씀)
//   node art.mjs     (네온 그림 — 처음 한 번, 또는 그림을 바꿀 때)
//   node build.mjs   → out/승민T-2028수능-통합사회-연간커리큘럼-OT-칠판용.pptx  (검정 바탕, 학원 칠판에 빔으로 쏠 때)
//   OT_INVERT=1 node build.mjs → …-반전용.pptx (학원 PC·빔이 색을 반전시킬 때, 먼저 python3 invert_art.py)
//   OT_NAVY=1 node build.mjs   → …-남색.pptx  (화면 녹화·배포용 남색 바탕)
// 촬영 환경: 학원 초록 칠판에 빔으로 쏜다.
//   - 바탕은 검정(빛을 안 쏘는 곳 = 칠판 색 그대로). 밝은 네온 글자·선만 쓴다.
//   - 영상(폰 화면)으로 보므로 글자는 크게(본문 20pt 이상), 선은 굵게.
//   - 슬라이드에 적힌 말은 짧게, 말할 내용은 '슬라이드 노트'(발표자 보기)에 적었다.
// 내용 출처: 저장소 맨 위 '작업의뢰서_수능반OT.md'와 강사 수정 요청(2026-11-25). 문의처·장소는 지난 겨울특강 OT와 같음(강사 확인).
// 강사 소개는 예비 고1 겨울특강 OT와 같은 쪽. 교재 설명은 저장소 기록(CLAUDE.md, 기출변형/참고)에서 확인한 사실만.
import { createRequire } from 'node:module';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { COLORS as KB, NAVY_BG } from './palette.mjs';
import { applyAnimations } from './anim.mjs';

const require = createRequire(import.meta.url);
const pptxgen = require('pptxgenjs');
const JSZip = require(require.resolve('jszip', { paths: [require.resolve('pptxgenjs')] }));
const ROOT = dirname(fileURLToPath(import.meta.url));
const OUT = join(ROOT, 'out');
// 반전용(OT_INVERT=1): 학원 PC·빔이 화면 색을 반전시킬 때 쓰는 판. 색과 그림을 미리 반대로 뒤집어 둔다(반전 × 반전 = 원래 색).
const INVERT = process.env.OT_INVERT === '1';
// 남색 판(OT_NAVY=1): 바탕만 미니맵 남색으로(화면 녹화·배포용). 칠판에 쏘면 남색이 푸르스름한 얼룩으로 보이므로 촬영은 검정(칠판용)으로.
const NAVY = process.env.OT_NAVY === '1' && !INVERT;
const K0 = NAVY ? { ...KB, bg: NAVY_BG } : KB;
const inv = (h) => (0xffffff ^ parseInt(h, 16)).toString(16).toUpperCase().padStart(6, '0');
const K = INVERT ? Object.fromEntries(Object.entries(K0).map(([k, v]) => [k, inv(v)])) : K0;
const ART = join(OUT, INVERT ? 'art-inv' : 'art'); // 반전용 그림은 python3 invert_art.py로 만든다
const asset = (name) => (INVERT ? join(ART, name) : join(ROOT, 'assets', name));
mkdirSync(OUT, { recursive: true });
const FILE = join(OUT, `승민T-2028수능-통합사회-연간커리큘럼-OT-${INVERT ? '반전용' : NAVY ? '남색' : '칠판용'}.pptx`);

// ── 테마: 어두운 화면용. 글자 기본색(Text 1)이 흰색, 바탕(Background 1)이 검정이 되도록 칸을 바꿔 넣었다
//    (강사가 PowerPoint에서 새 글상자를 만들어도 흰 글자로 나오게)
const THEME = {
  name: '승민T 통합사회 수능반 OT',
  headFontFace: 'Pretendard',
  bodyFontFace: 'Pretendard',
  colors: {
    dk1: K.text, lt1: K.bg, dk2: K.sub, lt2: INVERT ? inv('0C1A24') : '0C1A24',
    accent1: K.neon, accent2: K.mint, accent3: K.yellow, accent4: K.pink, accent5: K.dim, accent6: K.line,
    hlink: K.neon, folHlink: K.pink,
  },
};
const F = { head: 'Pretendard ExtraBold', body: 'Pretendard', semi: 'Pretendard SemiBold', med: 'Pretendard Medium', black: 'Pretendard Black' };

const pres = new pptxgen();
pres.defineLayout({ name: 'W1610', width: 13.333, height: 8.333 });
pres.layout = 'W1610'; // 16:10 (학원 빔 화면 비율. 16:9면 남는 위아래에 검은 띠가 생기고, 색 반전 화면에서는 그 띠가 밝게 보였다)
pres.author = '이승민';
pres.title = '승민T 2028 수능 대비 통합사회 연간 커리큘럼 OT';
pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
const C = {
  white: pres.SchemeColor.text1, sub: pres.SchemeColor.text2, black: pres.SchemeColor.background1, panel: pres.SchemeColor.background2,
  neon: pres.SchemeColor.accent1, mint: pres.SchemeColor.accent2, yellow: pres.SchemeColor.accent3, pink: pres.SchemeColor.accent4,
  dim: pres.SchemeColor.accent5, line: pres.SchemeColor.accent6,
};
const S = pres.ShapeType;
const W = 13.333, H = 8.333, ML = 0.75, CW = W - 2 * ML;
const DY = (8.333 - 7.5) / 2; // 16:9 기준으로 잡은 배치를 16:10 화면 가운데로 내리는 만큼

// ── 레이아웃 ──
pres.defineSlideMaster({ title: 'BLANK_DARK', background: { color: K.bg } });
pres.defineSlideMaster({
  title: 'DIVIDER',
  background: { color: K.bg },
  objects: [
    { placeholder: { options: { name: 'title', type: 'title', x: ML, y: 3.45 + DY, w: 7.7, h: 1.95, fontFace: 'Pretendard', bold: true, fontSize: 46, color: C.white, align: 'left', valign: 'top', margin: 0, lineSpacingMultiple: 1.08 }, text: '' } },
    { placeholder: { options: { name: 'body', type: 'body', x: ML, y: 5.6 + DY, w: 7.4, h: 0.95, fontFace: F.med, fontSize: 22, color: C.sub, align: 'left', valign: 'top', margin: 0, lineSpacingMultiple: 1.2 }, text: '' } },
  ],
});
pres.defineSlideMaster({
  title: 'CONTENT',
  background: { color: K.bg },
  objects: [
    { placeholder: { options: { name: 'kicker', type: 'body', x: ML, y: 0.5 + DY, w: 8.6, h: 0.4, fontFace: F.semi, fontSize: 17, color: C.neon, align: 'left', valign: 'middle', margin: 0, charSpacing: 1 }, text: '' } },
    { placeholder: { options: { name: 'title', type: 'title', x: ML, y: 0.92 + DY, w: CW, h: 0.85, fontFace: 'Pretendard', bold: true, fontSize: 36, color: C.white, align: 'left', valign: 'middle', margin: 0 }, text: '' } },
  ],
});

// ── 그리기 도구 ──
const glow = (hex, o = {}) => ({ type: 'outer', color: hex, blur: o.blur ?? 10, offset: 0, angle: 0, opacity: o.opacity ?? 0.45 });
const HEAVY = new Set([F.head, F.black]);
const face = (font) => (HEAVY.has(font) ? { fontFace: F.body, bold: true } : { fontFace: font || F.body });
function tx(s, text, x, y, w, h, o = {}) {
  s.addText(text, {
    x, y, w, h, isTextBox: true, margin: 0,
    ...face(o.font), fontSize: o.size || 22, color: o.color || C.white, ...(o.bold ? { bold: true } : {}),
    align: o.align || 'left', valign: o.valign || 'top', lineSpacingMultiple: o.lsm || 1.15,
    charSpacing: o.cs, paraSpaceAfter: o.psa, glow: o.glow, objectName: o.name, fit: 'none',
  });
}
// 글자 조각(색·굵기 바꾸기). font는 글자 조각에서도 굵기로 바꾼다
// size는 글자 조각에서 fontSize로 바꿔 넣는다(pptxgenjs 글자 조각은 fontSize만 읽음)
const r = (text, o = {}) => { const { font, size, ...rest } = o; return { text, options: { ...(font ? face(font) : {}), ...(size ? { fontSize: size } : {}), ...rest } }; };
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

// ── 애니메이션 표시(실제 효과는 anim.mjs가 파일에 써 넣음) ──
// mark(s, '이름') 다음에 만든 도형은 그 이름의 묶음이 된다(mark(s, null)로 끝).
// plan(s, { auto, clicks })로 묶음마다 [이름, 효과, 시작 ms, 설정]을 정한다.
//   auto = 슬라이드가 열리면 저절로, clicks = 클릭 한 번마다(그 안에서는 차례로 저절로).
const ALL = [];
let NAMEK = 0;
function newSlide(masterName, { shift = true } = {}) {
  const s = pres.addSlide({ masterName, sectionTitle: SECTION });
  s.groups = {}; s.cur = null; s.spec = null; s.cues = []; s.notes = '';
  const tag = (o) => {
    if (shift && o && !o.placeholder && typeof o.y === 'number') o.y += DY;
    if (s.cur && o && !o.placeholder) { o.objectName = `${s.cur}~${++NAMEK}`; s.groups[s.cur].push(o.objectName); }
    return o;
  };
  const at = s.addText.bind(s), as = s.addShape.bind(s), ai = s.addImage.bind(s);
  s.addText = (t, o = {}) => at(t, tag(o));
  s.addShape = (k, o = {}) => as(k, tag(o));
  s.addImage = (o = {}) => ai(tag(o));
  ALL.push(s);
  return s;
}
function mark(s, label) { s.cur = label; if (label) s.groups[label] ||= []; }
function plan(s, { auto = [], clicks = [] }) {
  mark(s, null);
  const conv = (steps) => steps.map(([g, fx, at, o = {}]) => {
    if (!s.groups[g]?.length) throw new Error(`묶음 없음: ${g}`);
    return { names: s.groups[g], fx, at, ...o };
  });
  s.spec = { auto: conv(auto), clicks: clicks.map((c) => conv(c.steps)) };
  s.cues = clicks.map((c) => c.cue);
}
const seqs = (names, fx, start, gap, o) => names.map((g, i) => [g, fx, start + i * gap, o]); // 차례로
const range = (p, n) => Array.from({ length: n }, (_, i) => `${p}${i}`);

// 지구본: 반짝이는 GIF(계속 반복) 위에 서울에서 뻗는 화살표. burst면 화살표를 하나씩(arc0~) 닦아내기로 뻗게 한다
const GLOBE = JSON.parse(readFileSync(join(ART, 'globe-arcs.json'), 'utf8'));
function globe(s, x, y, size, burst = false) {
  mark(s, null);
  img(s, join(ART, NAVY ? 'globe-loop-navy.gif' : 'globe-loop.gif'), x, y, size, size);
  if (!burst) { img(s, join(ART, 'globe-arcs-all.png'), x, y, size, size); return []; }
  return GLOBE.arcs.map((a, k) => {
    mark(s, `arc${k}`);
    img(s, join(ART, `globe-arc-${String(a.i).padStart(2, '0')}.png`), x + a.box[0] * size, y + a.box[1] * size, a.box[2] * size, a.box[3] * size);
    mark(s, null);
    return [`arc${k}`, 'wipe', 0, { dir: a.dir, dur: 450 }];
  });
}
const arcSteps = (arcs, start, gap = 130) => arcs.map(([g, fx, , o], k) => [g, fx, start + k * gap, o]);

// 내용 슬라이드. part = 1~NP(오른쪽 위 점 NP개 중 지금 파트를 노랗게), 0이면 점 없음
// 파트: 1 강사·교재 · 2 왜 지금부터 · 3 수시 최저·승민T 교재 · 4 1년 로드맵 · 5 수업 방식과 관리 · 6 등록 안내
const NP = 6;
function content(part, kicker, title, notes) {
  const s = newSlide('CONTENT');
  s.addText(kicker, { placeholder: 'kicker' });
  s.addText(title, { placeholder: 'title' });
  if (part) {
    for (let i = 1; i <= NP; i++) {
      const d = i === part ? 0.2 : 0.13, cx = W - ML - (NP - i) * 0.3 - 0.1;
      s.addShape(S.ellipse, { x: cx - d / 2, y: 0.7 - d / 2, w: d, h: d, fill: i <= part ? { color: i === part ? C.yellow : C.dim } : undefined, line: { color: i === part ? C.yellow : C.dim, width: 1.25 } });
    }
  }
  s.notes = notes || '';
  return s;
}
// 형광펜: 글자 뒤에 깔리는 옅은 노란 띠(닦아내기로 그어지게 쓴다). 글자보다 먼저 그린다
const hl = (s, x, y, w, h) => box(s, x, y, w, h, { line: false, fill: K.yellow, ft: 82 });
// 숫자 올라가기: 같은 자리에 숫자 글상자를 여러 개 겹쳐 두고, 중간 숫자는 잠깐씩만(flash) 보이게 한다.
// 중간 숫자 이름에는 TMP가 붙어서 PDF(pdf.py)에서는 지워진다. 돌려주는 함수(시작 ms, 간격 ms) → 애니메이션 단계 목록
function countUp(s, key, vals, fmt, x, y, w, h, o) {
  vals.forEach((v, i) => { mark(s, i === vals.length - 1 ? key : `${key}TMP${i}`); tx(s, fmt(v), x, y, w, h, o); });
  mark(s, null);
  return (start = 0, gap = 60) => {
    const n = vals.length - 1, end = start + n * gap;
    return [...vals.slice(0, -1).map((_, i) => [`${key}TMP${i}`, 'flash', start + i * gap, { dur: gap }]), [key, 'fade', end, { dur: 1 }], [key, 'pulse', end + 80, { by: 1.15 }]];
  };
}
function divider(no, title, sub, notes) {
  const s = newSlide('DIVIDER');
  globe(s, 7.75, 0.55, 6.6);
  const p = join(ART, `num-${no}.png`), z = sizeOf(p), h = 1.75;
  mark(s, 'num'); img(s, p, ML - 0.42, 1.25, (h * z.w) / z.h, h); mark(s, null);
  s.addText(title, { placeholder: 'title' });
  s.addText(sub, { placeholder: 'body' });
  s.notes = notes || '';
  plan(s, { auto: [['num', 'flicker', 200]] });
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
// 파트 구분 화면은 따로 두지 않고, 각 슬라이드 위 작은 표시(파트 이름 + 오른쪽 위 점)로 파트를 알린다.
// 2026-11-25 강사 수정: 목차·'2028 수능 무엇이 바뀌나'·'숫자로 보여 드리는 결과' 삭제, 강사 소개를 앞으로,
//   수시 최저 새 구성 → 교재 4권을 한 장씩, 수업 3시간 30분, 숙제 원칙(고3·N수), 웹앱은 관리 원칙 끝으로.

// 1. 표지 — '통합사회 이승민'이 가장 잘 보이게
section('시작');
{
  const s = newSlide('BLANK_DARK');
  const arcs = globe(s, 6.75, -0.35, 8.2, true);
  const lg = asset('academy-logo-white.png'), z = sizeOf(lg);
  mark(s, 'logo'); img(s, lg, ML, 0.62, (0.52 * z.w) / z.h, 0.52);
  mark(s, 'kick'); tx(s, '2028 수능 대비', ML, 1.55, 6.4, 0.55, { font: F.semi, size: 26, color: C.neon, cs: 1 });
  mark(s, 'kick2'); tx(s, '연간 커리큘럼 OT', ML, 2.1, 6.4, 0.7, { font: F.head, size: 34 });
  mark(s, 'name');
  tx(s, [r('통합사회', { size: 54, breakLine: true }), r('이승민', { size: 112, color: C.yellow, glow: { size: 10, opacity: 0.4, color: K.yellow } })], ML, 3.15, 6.4, 3.0, { font: F.black, lsm: 1.0 });
  plan(s, { auto: [['logo', 'fade', 0], ['kick', 'fade', 150], ['kick2', 'fade', 350], ...arcSteps(arcs, 500), ['name', 'zoom', 900, { from: 0.85, dur: 600 }], ['name', 'pulse', 1700, { by: 1.06 }]] });
  s.notes = '안녕하세요, 통합사회 이승민입니다.\n오늘은 2028 수능을 준비하는 예비 고3, N수생, 그리고 학부모님께 통합사회 1년 연간 커리큘럼을 소개해 드리려고 합니다.\n겨울에 시작해서 11월 수능까지, 1년을 어떻게 가는지 차근차근 말씀드리겠습니다.';
}

// 2. 강사 소개 — 예비 고1 겨울특강 OT와 같은 쪽('특강' → '수업'만 바꿈)
section('강사 소개');
{
  const s = content(1, '강사 소개', '통합사회 이승민T', '먼저 제 소개를 짧게 드리겠습니다.\n메이트학원 사회과 대표강사이고, 대치 다원교육·리브 아카데미에서 사회를 가르치고 있습니다.\n족보닷컴 22개정 사회탐구 출제위원으로 문제를 직접 만들고 있고, 이번 수업의 개념서 MINIMAP, 주간지 MINT, 학습 앱도 제가 직접 만들었습니다.');
  const rows = [
    ['메이트학원 사회과 대표강사', true],
    ['대치 다원교육 · 리브 아카데미', false],
    ['족보닷컴 22개정 사회탐구 출제위원', false],
    ['전) 대치 에듀퍼스트', false],
  ];
  rows.forEach(([t, hi], i) => {
    const y = 2.35 + i * 0.98;
    mark(s, `row${i}`);
    ping(s, hi ? 'yellow' : 'cyan', ML + 0.28, y + 0.3, 0.62);
    tx(s, t, ML + 0.8, y, 6.6, 0.6, { font: hi ? F.head : F.semi, size: 26, color: hi ? C.yellow : C.white, valign: 'middle' });
  });
  mark(s, 'card');
  box(s, 8.55, 2.2, 4.03, 4.1, { snip: true, line: C.neon, lw: 2, fill: K.bg, glow: K.neon, glowOpt: { opacity: 0.35, blur: 12 } });
  tx(s, '이번 수업을 위해\n직접 만들었습니다', 8.9, 2.5, 3.5, 0.95, { font: F.semi, size: 20, color: C.sub, lsm: 1.15 });
  [['book-2', 'MINIMAP 개념서'], ['notebook', '주간지 MINT'], ['device-mobile', '통합사회 클래스 앱']].forEach(([ic, t], i) => {
    const y = 3.65 + i * 0.82;
    icon(s, ic, 'cyan', 8.85, y - 0.05, 0.68);
    tx(s, t, 9.6, y, 2.95, 0.58, { font: F.semi, size: 20, valign: 'middle' });
  });
  plan(s, { auto: seqs(range('row', 4), 'float', 0, 160), clicks: [{ cue: "오른쪽 '직접 만들었습니다' 상자", steps: [['card', 'zoom', 0, { from: 0.9 }]] }] });
}

// 3. 교재와 학습 도구(한 장으로 합침 — 교재마다 자세한 설명은 뒤 '승민T 통합사회 교재' 네 장에서)
{
  const s = content(1, '교재와 학습 도구', '직접 분석하고, 직접 만든 교재', '수업에 쓰는 교재도 모두 제가 직접 만들었습니다. 들어간 문항만 1,300여 개입니다.\n평가원 예시문항과 2025년, 2026년 학력평가 200문항을 하나하나 분석해서, 그 출제 방식에 맞춰 만든 문항입니다.\n모든 문항은 정답을 가리고 처음부터 다시 풀어 보는 방식으로 두 번 검수했습니다.\n2028 예시문항 분석 특강 교재로 7가지 유형별 풀이 전략도 정리했습니다. 교재 하나하나는 뒤에서 자세히 보여 드리겠습니다.');
  const cnt = countUp(s, 'cnt', [0, 150, 300, 450, 600, 750, 900, 1050, 1200, 1300], (v) => v.toLocaleString('en-US'), ML - 0.1, 1.95, 4.5, 1.55, { font: F.black, size: 96, color: C.yellow, align: 'right', valign: 'middle', glow: { size: 10, opacity: 0.35, color: K.yellow } });
  mark(s, 'unit'); tx(s, '여 문항', ML + 4.5, 2.5, 2.4, 0.8, { font: F.head, size: 36, valign: 'middle' });
  const lines = [
    ['report-analytics', 'cyan', '예시문항 + 2025~2026 학평 200문항 분석', C.white, F.semi],
    ['circle-check', 'mint', '정답 가리고 다시 풀기, 두 차례 검수', C.mint, F.head],
    ['presentation', 'cyan', '2028 예시문항 분석 특강 교재 · 7가지 유형', C.white, F.semi],
  ];
  lines.forEach(([ic, col, t, cc, f], i) => {
    const y = 3.85 + i * 0.78;
    mark(s, `t${i}`);
    icon(s, ic, col, ML, y, 0.6);
    tx(s, t, ML + 0.8, y, 6.6, 0.6, { font: f, size: 21, color: cc, valign: 'middle' });
  });
  // 오른쪽: 교재 표지 4개(2×2)
  const ch = 2.2, cw = (ch * 1590) / 2246, g = 0.3, gx = 8.0 + (W - ML - 8.0 - (2 * cw + g)) / 2, gy = 1.98;
  const covers = ['cover-mmap1.jpg', 'cover-mmx.jpg', 'cover-maxi.jpg', null];
  covers.forEach((f, i) => {
    const x = gx + (i % 2) * (cw + g), y = gy + Math.floor(i / 2) * (ch + 0.3);
    mark(s, `cv${i}`);
    if (f) img(s, join(ART, f), x, y, cw, ch);
    else {
      box(s, x, y, cw, ch, { snip: true, line: C.mint, lw: 1.75, fill: K.bg, glow: K.mint, glowOpt: { opacity: 0.3, blur: 10 } });
      const lp = join(ART, 'logo-mint.png'), z = sizeOf(lp), lw = cw - 0.25;
      img(s, lp, x + 0.125, y + ch / 2 - (lw * z.h) / z.w / 2, lw, (lw * z.h) / z.w);
    }
  });
  plan(s, { auto: [['unit', 'fade', 0], ...seqs(range('cv', 4), 'float', 150, 200)], clicks: [
    { cue: '숫자 1,300 올라가기', steps: [...cnt(0, 65), ...seqs(range('t', 3), 'fade', 800, 250)] },
  ] });
}

// ── 수능 통합사회, 왜 지금부터 해야 할까요? ──
section('왜 지금부터');
{
  const s = content(2, '수능 통합사회, 왜 지금부터 해야 할까요? · 1 / 5', '고3 1학기에는 시간이 없습니다', '수능 통합사회, 왜 지금부터 해야 할까요? 다섯 가지로 말씀드리겠습니다.\n첫째, 고3 1학기에는 시간이 없습니다. 수시에 반영되는 마지막 내신 학기라서 내신 시험에 수행평가, 생기부까지 한꺼번에 몰립니다.\n합격한 선배들 이야기를 들어 보면 “1학기엔 내신 때문에 수능 공부를 못 해서 여름에 몰아서 했다”는 말이 정말 많이 나옵니다.\n여름은 개념이 끝난 상태로 실전에 들어가야 하는 때입니다. 그래서 개념은 학교가 시작하기 전, 이번 겨울에 끝내야 합니다.');
  const segs = [
    { x: ML, w: 3.0, k: '겨울방학', big: '개념 1회독', d: '학교 시작 전', col: C.yellow, hi: true },
    { x: ML + 3.1, w: 5.6, k: '고3 1학기', chips: ['내신', '수행평가', '생기부'], d: '수시에 반영되는 마지막 내신 학기', col: C.neon },
    { x: ML + 8.8, w: 3.0, k: '여름부터', big: '실전', d: '개념이 끝난 상태로', col: C.neon },
  ];
  segs.forEach((g, i) => {
    mark(s, `seg${i}`);
    box(s, g.x, 2.1, g.w, 1.95, { snip: true, line: g.col, lw: g.hi ? 2.5 : 1.75, fill: K.bg, glow: g.hi ? K.yellow : undefined, glowOpt: { opacity: 0.35, blur: 12 } });
    tx(s, g.k, g.x + 0.25, 2.22, g.w - 0.4, 0.42, { font: F.semi, size: 20, color: g.col });
    if (g.big) tx(s, g.big, g.x + 0.25, 2.7, g.w - 0.4, 0.65, { font: F.black, size: 32, color: g.hi ? C.yellow : C.white });
    if (g.chips) g.chips.reduce((x, c) => {
      const cw = 0.45 + c.length * 0.33;
      box(s, x, 2.75, cw, 0.6, { line: C.white, lw: 1.75 });
      tx(s, c, x, 2.75, cw, 0.6, { font: F.head, size: 22, align: 'center', valign: 'middle' });
      return x + cw + 0.18;
    }, g.x + 0.25);
    tx(s, g.d, g.x + 0.25, 3.5, g.w - 0.4, 0.42, { font: F.med, size: 18, color: C.sub });
  });
  mark(s, 'quote');
  box(s, ML, 4.35, CW, 1.3, { snip: true, line: C.mint, lw: 1.75 });
  icon(s, 'quote', 'mint', ML + 0.25, 4.55, 0.85);
  tx(s, '“1학기엔 내신 때문에 수능 공부를 못 해서, 여름에 몰아서 했어요”', ML + 1.3, 4.45, 10.3, 0.62, { font: F.semi, size: 23, valign: 'middle' });
  tx(s, '합격생 경험담에서 반복되는 말', ML + 1.3, 5.07, 10.3, 0.45, { font: F.med, size: 18, color: C.mint });
  mark(s, 'hl'); hl(s, ML, 5.95, 8.4, 0.72);
  mark(s, 'end'); tx(s, '→ 개념은 학교가 시작하기 전, 겨울에', ML + 0.2, 5.95, 8.2, 0.72, { font: F.head, size: 28, color: C.yellow, valign: 'middle' });
  plan(s, { auto: seqs(range('seg', 3), 'float', 0, 300), clicks: [
    { cue: '합격생 경험담', steps: [['quote', 'float', 0]] },
    { cue: '결론 “개념은 겨울에”', steps: [['hl', 'wipe', 0, { dir: 'l', dur: 500 }], ['end', 'fade', 200], ['seg0', 'pulse', 700, { by: 1.06 }]] },
  ] });
}
{
  const s = content(2, '수능 통합사회, 왜 지금부터 해야 할까요? · 2 / 5', '통합사회 수업은 고1에서 끝납니다', '둘째, 2년의 공백입니다.\n통합사회는 고1 때 배우고, 고2·고3 때는 학교에서 통합사회 수업이 없습니다.\n그러니까 예비 고3 학생들은 고1 때 배운 내용을 대부분 잊어버린 상태입니다. 한 번 배웠으니까 괜찮겠지, 하고 들어가면 큰일 납니다.\n솔직히 말씀드리면 처음부터 다시 1회독이 필요합니다. 그 1회독을 이번 겨울에 하자는 겁니다.');
  const cols = [['고1', '통합사회1·2', '학교에서 배움', true], ['고2', '학교 수업 없음', '', false], ['고3', '학교 수업 없음', '', false]];
  const cw = 3.85, gap = (CW - 3 * cw) / 2;
  cols.forEach(([y, a, b, on], i) => {
    const x = ML + i * (cw + gap);
    mark(s, `c${i}`);
    box(s, x, 2.75, cw, 2.1, { snip: true, line: on ? C.neon : C.dim, lw: on ? 2.5 : 1.75, dash: on ? undefined : 'dash', fill: on ? K.bg : undefined, glow: on ? K.neon : undefined, glowOpt: { opacity: 0.4, blur: 12 } });
    icon(s, on ? 'school' : 'school-off', on ? 'cyan' : 'gray', x + 0.3, 2.95, 0.8);
    tx(s, y, x + 1.25, 2.95, 2.4, 0.8, { font: F.black, size: 36, color: on ? C.neon : C.dim, valign: 'middle' });
    tx(s, a, x + 0.3, 3.9, cw - 0.5, 0.5, { font: F.head, size: 24, color: on ? C.white : C.dim });
    if (b) tx(s, b, x + 0.3, 4.35, cw - 0.5, 0.42, { font: F.med, size: 19, color: C.sub });
  });
  const bx0 = ML + cw + gap, bx1 = ML + 3 * cw + 2 * gap;
  mark(s, 'br');
  line(s, bx0, 2.45, bx1, 2.45, { color: C.yellow, w: 3, glow: K.yellow });
  line(s, bx0, 2.45, bx0, 2.65, { color: C.yellow, w: 3 });
  line(s, bx1, 2.45, bx1, 2.65, { color: C.yellow, w: 3 });
  box(s, (bx0 + bx1) / 2 - 1.2, 2.17, 2.4, 0.56, { fill: K.bg, line: false });
  tx(s, '2년 공백', (bx0 + bx1) / 2 - 1.2, 2.17, 2.4, 0.56, { font: F.black, size: 28, color: C.yellow, align: 'center', valign: 'middle' });
  mark(s, 'say'); tx(s, '예비 고3 = 고1 내용을 대부분 잊은 상태', ML, 5.2, CW, 0.55, { font: F.semi, size: 24, color: C.sub });
  mark(s, 'hl'); hl(s, ML, 5.85, 6.6, 0.72);
  mark(s, 'end'); tx(s, '→ 처음부터 다시 1회독', ML + 0.2, 5.85, 6.4, 0.72, { font: F.head, size: 30, color: C.yellow, valign: 'middle' });
  plan(s, { auto: [['c0', 'fade', 0], ['c1', 'fade', 300], ['c2', 'fade', 500]], clicks: [
    { cue: '‘2년 공백’', steps: [['br', 'wipe', 0, { dir: 'l', dur: 700 }]] },
    { cue: '결론 “다시 1회독”', steps: [['say', 'fade', 0], ['hl', 'wipe', 500, { dir: 'l', dur: 500 }], ['end', 'fade', 700]] },
  ] });
}
{
  const s = content(2, '수능 통합사회, 왜 지금부터 해야 할까요? · 3 / 5', '3~4문제가 등급을 가릅니다', '셋째, 통합사회는 몇 문제 차이로 등급이 갈리는 시험입니다.\n2026년 3월 고2 학력평가 통합사회의 1등급 컷이 50점 만점에 약 42점이었습니다.\n25문항 중에 서너 문제만 틀려도 1등급이 아닐 수 있다는 뜻입니다.\n이런 시험에서는 아는 것과 40분 안에 실수 없이 푸는 것이 다릅니다. 40분 실전 감각은 하루아침에 생기지 않고, 회차를 쌓아야 생깁니다. 그래서 시작이 빨라야 합니다.');
  mark(s, 'yak'); tx(s, '약', ML, 2.9, 0.7, 0.7, { font: F.semi, size: 30, color: C.sub, valign: 'middle' });
  const cnt = countUp(s, 'cnt', [0, 6, 12, 18, 24, 30, 35, 39, 42], (v) => String(v), ML + 0.55, 1.95, 2.85, 2.0, { font: F.black, size: 120, color: C.yellow, align: 'center', valign: 'middle', glow: { size: 10, opacity: 0.35, color: K.yellow } });
  mark(s, 'unit'); tx(s, [r('점'), r(' / 50', { color: C.sub, font: F.semi, size: 26 })], ML + 3.45, 2.95, 2.4, 0.75, { font: F.head, size: 38, valign: 'middle' });
  mark(s, 'cap'); tx(s, '2026년 3월 고2 학력평가\n통합사회 1등급 컷', ML, 4.05, 5.6, 0.95, { font: F.semi, size: 22, color: C.sub, lsm: 1.2 });
  // 25문항 칸: 21칸은 하늘, 마지막 4칸은 노랑
  const gx = 7.75, gy = 2.0, d = 0.66, g = 0.13;
  mark(s, 'sq');
  for (let i = 0; i < 21; i++) box(s, gx + (i % 5) * (d + g), gy + Math.floor(i / 5) * (d + g), d, d, { line: C.neon, lw: 1.75, fill: K.neon, ft: 85 });
  for (let i = 21; i < 25; i++) {
    mark(s, `y${i}`);
    box(s, gx + (i % 5) * (d + g), gy + Math.floor(i / 5) * (d + g), d, d, { line: C.yellow, lw: 2.75, glow: K.yellow, glowOpt: { opacity: 0.6, blur: 8 } });
  }
  mark(s, 'sqcap'); tx(s, [r('25문항 중 '), r('3~4문제', { color: C.yellow, font: F.head }), r(' 차이')], gx - 0.4, gy + 5 * (d + g) + 0.05, 4.8, 0.5, { font: F.semi, size: 22, align: 'center' });
  mark(s, 'clock');
  icon(s, 'stopwatch', 'mint', ML, 5.35, 0.75);
  tx(s, '40분 실전 감각 = 쌓은 회차만큼', ML + 0.95, 5.35, 6.0, 0.75, { font: F.head, size: 22, color: C.mint, valign: 'middle' });
  plan(s, { auto: [['yak', 'fade', 0], ['unit', 'fade', 0], ['cap', 'fade', 200]], clicks: [
    { cue: '숫자 42 올라가기', steps: cnt(0, 70) },
    { cue: '25문항 중 3~4문제', steps: [['sq', 'fade', 0], ...seqs(['y21', 'y22', 'y23', 'y24'], 'flicker', 400, 220), ['sqcap', 'fade', 1300], ['clock', 'float', 1700]] },
  ] });
}
{
  const s = content(2, '수능 통합사회, 왜 지금부터 해야 할까요? · 4 / 5', '이과 최상위권도 함께 보는 시험', '넷째, 이 시험은 문과, 이과 모두가 봅니다.\n지금까지는 이과 상위권 학생들이 과학탐구를 보니까 사회 과목에서 만날 일이 없었죠. 이제는 이과 최상위권 학생들도 똑같이 통합사회를 봅니다.\n그리고 피할 수도 없습니다. 예전처럼 나한테 맞는 다른 과목으로 갈아탈 수도 없습니다.\n상대평가에서 경쟁하는 사람이 넓어졌다는 것, 이게 지금 준비를 시작해야 하는 이유입니다.');
  const cards = [
    ['medal', 'yellow', C.yellow, '이과 최상위권도 응시', '같은 시험지, 같은 상대평가'],
    ['arrows-exchange', 'cyan', C.neon, '갈아탈 과목 없음', '사탐·과탐 중 고르던 방식 폐지'],
  ];
  cards.forEach(([ic, col, cc, a, b], i) => {
    const x = ML + i * 6.05;
    mark(s, `k${i}`);
    box(s, x, 2.15, 5.75, 2.75, { snip: true, line: cc, lw: 2.25, fill: K.bg, glow: i === 0 ? K.yellow : undefined, glowOpt: { opacity: 0.3, blur: 12 } });
    icon(s, ic, col, x + 0.35, 2.4, 1.05);
    tx(s, a, x + 0.35, 3.55, 5.2, 0.62, { font: F.head, size: 30, color: cc });
    tx(s, b, x + 0.35, 4.18, 5.2, 0.48, { font: F.med, size: 21, color: C.sub });
  });
  mark(s, 'hl'); hl(s, ML, 5.45, 9.3, 0.75);
  mark(s, 'end'); tx(s, '피할 수도, 갈아탈 수도 없는 과목', ML + 0.2, 5.45, 9.1, 0.75, { font: F.head, size: 30, color: C.yellow, valign: 'middle' });
  plan(s, { auto: [['k0', 'float', 0], ['k1', 'float', 350]], clicks: [{ cue: '결론 “피할 수 없는 과목”', steps: [['hl', 'wipe', 0, { dir: 'l', dur: 600 }], ['end', 'fade', 250]] }] });
}
{
  const s = content(2, '수능 통합사회, 왜 지금부터 해야 할까요? · 5 / 5', 'N수생에게도 처음 배우는 과목입니다', '다섯째, N수생 이야기입니다.\n2027 수능은 지금 체제로 치르는 마지막 해였고, N수생이 약 20만 명으로 23년 만에 가장 많았습니다.\n그런데 2028 수능에는 옛 교육과정 시험이 없습니다. 그러니까 재수를 하면 2022 개정 통합사회를 새로 배워야 합니다.\n고1 때 통합사회를 배우지 않은 N수생에게는 완전히 새로운 과목입니다. 겨울 1회독은 선택이 아니라 필수입니다.');
  mark(s, 'yak'); tx(s, '약', ML, 2.9, 0.7, 0.7, { font: F.semi, size: 30, color: C.sub, valign: 'middle' });
  const cnt = countUp(s, 'cnt', [0, 3, 6, 9, 12, 15, 17, 19, 20], (v) => String(v), ML + 0.55, 1.95, 2.85, 2.0, { font: F.black, size: 120, color: C.yellow, align: 'center', valign: 'middle', glow: { size: 10, opacity: 0.35, color: K.yellow } });
  mark(s, 'unit'); tx(s, '만 명', ML + 3.45, 2.95, 2.0, 0.75, { font: F.head, size: 38, valign: 'middle' });
  mark(s, 'cap'); tx(s, '2027 수능 N수생\n23년 만에 최대', ML, 4.05, 5.4, 0.95, { font: F.semi, size: 22, color: C.sub, lsm: 1.2 });
  const rx = 7.0, rw = W - ML - rx;
  mark(s, 'a');
  box(s, rx, 2.1, rw, 1.3, { snip: true, line: C.dim, lw: 1.75 });
  tx(s, '2027 수능', rx + 0.3, 2.2, rw - 0.5, 0.5, { font: F.head, size: 24, color: C.sub });
  tx(s, '현행 체제의 마지막 해', rx + 0.3, 2.72, rw - 0.5, 0.5, { font: F.med, size: 21, color: C.sub });
  mark(s, 'ar'); line(s, rx + rw / 2, 3.5, rx + rw / 2, 3.95, { color: C.yellow, w: 3, arrow: true });
  mark(s, 'b');
  box(s, rx, 4.05, rw, 1.55, { snip: true, line: C.yellow, lw: 2.5, fill: K.bg, glow: K.yellow, glowOpt: { opacity: 0.35, blur: 12 } });
  tx(s, '2028 수능', rx + 0.3, 4.15, rw - 0.5, 0.5, { font: F.head, size: 24, color: C.yellow });
  tx(s, '옛 교육과정 시험 없음\n→ 2022 개정 통합사회 새로 배우기', rx + 0.3, 4.62, rw - 0.5, 0.9, { font: F.semi, size: 20, lsm: 1.15 });
  mark(s, 'hl'); hl(s, ML, 5.95, 8.0, 0.72);
  mark(s, 'end'); tx(s, '겨울 1회독은 선택이 아니라 필수', ML + 0.2, 5.95, 7.8, 0.72, { font: F.head, size: 28, color: C.yellow, valign: 'middle' });
  plan(s, { auto: [['yak', 'fade', 0], ['unit', 'fade', 0], ...cnt(300, 70), ['cap', 'fade', 1100]], clicks: [
    { cue: '2027 → 2028', steps: [['a', 'fade', 0], ['ar', 'wipe', 350, { dir: 't' }], ['b', 'zoom', 650, { from: 0.9 }]] },
    { cue: '결론 “겨울 1회독은 필수”', steps: [['hl', 'wipe', 0, { dir: 'l', dur: 500 }], ['end', 'fade', 200]] },
  ] });
}


// ── 수시 최저와 통합사회(2026-11-25 강사 새 구성) ──
section('수시 최저');
{
  const s = content(3, '수시 최저와 통합사회', '통합사회로 최저 맞추기, 과연 쉬울까요?', '수시 최저 이야기입니다. 통합사회는 고1 때 배운 과목이니까 최저 맞추기 쉽지 않을까, 이렇게 생각하실 수 있습니다. 과연 쉬울까요?\n첫째, 통합사회는 상대적으로 진입장벽이 낮고 과목 자체 난이도도 높지 않습니다. 그래서 등급컷은 무조건 만점에 가깝게 나옵니다. 한두 문제 실수가 바로 등급을 가릅니다.\n둘째, 2028 수능은 개정 첫해입니다. 시중 문제집의 퀄리티가 아직 불확실하고, 혼자 공부하면 제대로 된 효율이 나오지 않을 수 있습니다.\n그래서, 승민T 통합사회입니다. 지금부터 제가 직접 만든 교재를 한 권씩 보여 드리겠습니다.');
  const cards = [
    ['01', '모두가 잘 보는 과목', ['상대적으로 진입장벽 낮음', '과목 자체 난이도 낮음'], '→ 무조건 만점에 가까운 등급컷'],
    ['02', '2028 수능, 개정 첫해', ['불확실한 시중 문제집 퀄리티', '혼자서는 제대로 된 효율이 어려움'], ''],
  ];
  const cw = 5.82, ch = 3.05, y0 = 2.05;
  cards.forEach(([no, head, items, out], i) => {
    const x = ML + i * (CW - cw);
    mark(s, `k${i}`);
    box(s, x, y0, cw, ch, { snip: true, line: C.neon, lw: 2, fill: K.bg });
    tx(s, no, x + 0.3, y0 + 0.22, 0.9, 0.6, { font: F.black, size: 30, color: C.neon, valign: 'middle' });
    tx(s, head, x + 1.15, y0 + 0.22, cw - 1.35, 0.6, { font: F.head, size: 25, valign: 'middle' });
    items.forEach((t, j) => {
      const y = y0 + 1.08 + j * 0.62;
      ping(s, 'cyan', x + 0.5, y + 0.26, 0.42);
      tx(s, t, x + 0.85, y, cw - 1.05, 0.52, { font: F.semi, size: 21, valign: 'middle' });
    });
    if (out) { mark(s, `o${i}`); tx(s, out, x + 0.3, y0 + 2.38, cw - 0.5, 0.52, { font: F.head, size: 23, color: C.yellow, valign: 'middle' }); }
  });
  mark(s, 'hl'); hl(s, ML, 5.5, 7.6, 0.8);
  mark(s, 'end'); tx(s, '그래서, 승민T 통합사회', ML + 0.25, 5.5, 7.3, 0.8, { font: F.black, size: 32, color: C.yellow, valign: 'middle' });
  plan(s, { clicks: [
    { cue: '01 모두가 잘 보는 과목', steps: [['k0', 'float', 0], ['o0', 'flicker', 600]] },
    { cue: '02 개정 첫해', steps: [['k1', 'float', 0]] },
    { cue: '“그래서, 승민T 통합사회”', steps: [['hl', 'wipe', 0, { dir: 'l', dur: 600 }], ['end', 'zoom', 250, { from: 0.85 }], ['end', 'pulse', 800]] },
  ] });
}

// ── 승민T 통합사회 교재(한 장에 한 권: 왼쪽 표지, 오른쪽 설명) ──
function bookSlide(no, title, notes, drawCover, name, nameColor, sub, feats) {
  const s = content(3, `승민T 통합사회 교재 · ${no} / 4`, title, notes);
  const coverW = drawCover(s);
  mark(s, null);
  const rx = ML + coverW + 0.65, rw = W - ML - rx;
  mark(s, 'name');
  tx(s, name, rx, 1.95, rw, 0.8, { font: F.black, size: 44, color: nameColor, valign: 'middle' });
  tx(s, sub, rx, 2.72, rw, 0.5, { font: F.semi, size: 23, color: C.sub });
  // 설명(d)이 없는 줄은 한 줄 높이로
  let y = 3.5;
  feats.forEach(([ic, col, t, d], i) => {
    mark(s, `f${i}`);
    icon(s, ic, col, rx, y + (d ? 0.02 : -0.06), d ? 0.62 : 0.56);
    tx(s, t, rx + 0.8, y - 0.04, rw - 0.8, 0.42, { font: F.head, size: 22, color: col === 'yellow' ? C.yellow : col === 'mint' ? C.mint : C.white, valign: d ? 'top' : 'middle' });
    if (d) tx(s, d, rx + 0.8, y + 0.36, rw - 0.8, 0.38, { font: F.med, size: 18, color: C.sub });
    y += d ? 0.8 : 0.64;
  });
  plan(s, { auto: [['cover', 'float', 0], ['name', 'fade', 350], ...seqs(range('f', feats.length), 'float', 650, 220)] });
  return s;
}
const CH = 4.6, CWD = (CH * 1590) / 2246; // 표지 크기
const coverImg = (file) => (s) => { mark(s, 'cover'); img(s, join(ART, file), ML, 1.98, CWD, CH); return CWD; };

bookSlide(1, '개념은 MINIMAP으로', 'MINIMAP은 제가 직접 쓴 통합사회1, 통합사회2 개념서입니다. 작은 지도 한 장으로 온 세상을 보듯, 이 책에서 만점의 기초를 다진다는 뜻입니다.\n개념마다 기출에서 얼마나 자주 나왔는지 기본 개념, 빈출, 최다 빈출로 표시해 두었습니다.\n‘이렇게 나온다’에서는 실제 기출 선지 표현을 O/X로 바로 확인하고, 사상가는 카드 한 장에 핵심 주장, 원전 읽기, 헷갈리지 말 점을 정리했습니다.\n중단원 끝에는 한 장 정리와 수능형 문제로 마무리합니다.',
  (s) => {
    mark(s, 'cover');
    const h = CH - 0.25, w = (h * 1590) / 2246;
    img(s, join(ART, 'cover-mmap2.jpg'), ML + 0.6, 1.98, w, h);
    img(s, join(ART, 'cover-mmap1.jpg'), ML, 1.98 + 0.25, w, h);
    return w + 0.6;
  },
  'MINIMAP', C.neon, '통합사회1 · 통합사회2 개념서', [
    ['stars', 'yellow', '출제 빈도 표시', '개념마다 기본 개념 · 빈출 · 최다 빈출'],
    ['square-check', 'cyan', '이렇게 나온다', '실제 기출 선지 표현을 O/X로 확인'],
    ['users', 'cyan', '사상가 카드', '핵심 주장 · 원전 읽기 · 헷갈리지 말자'],
    ['notebook', 'cyan', '한 장 정리 + 수능형 문제', '중단원 끝에서 정리와 실전 연습'],
  ]);
bookSlide(2, '기출 분석과 변형은 MINIMAX로', 'MINIMAX는 기출분석서입니다. 2028 예시문항과 2025년, 2026년 학력평가 200문항을 분석하고, 그 출제 방식 그대로 단원별 변형 문항을 만들었습니다.\n기본편이 약 500문항, 심화편이 약 500문항이고, 심화편은 중상, 상 난이도 위주입니다.\n모든 문항은 정답을 가리고 다시 풀어 보는 방식으로 두 번 검수했습니다.',
  coverImg('cover-mmx.jpg'), 'MINIMAX', C.neon, '기출분석서 · 기본편 · 심화편', [
    ['report-analytics', 'yellow', '기출 분석', '2028 예시문항 + 2025~2026 학평 200문항'],
    ['file-pencil', 'cyan', '단원별 변형 문항', '분석한 출제 방식 그대로'],
    ['stairs-up', 'cyan', '기본편 약 500 · 심화편 약 500', '심화편은 중상 · 상 난이도 위주'],
    ['circle-check', 'cyan', '두 차례 검수', '정답을 가리고 다시 풀기'],
  ]);
bookSlide(3, '실전은 MAXIMIN으로', 'MAXIMIN은 실전 모의고사입니다. 최저점, MIN을 만점, MAX로 끌어올린다는 뜻입니다.\n모두 10회로, 통합사회1 범위 3회, 통합사회2 범위 3회, 전 범위 4회입니다. 회마다 수능과 같은 25문항, 50점이고 정답과 해설은 별책입니다.\n파이널 시기에 쓸 MAXIMIN FINAL 8회도 준비할 예정입니다.',
  coverImg('cover-maxi.jpg'), 'MAXIMIN', C.yellow, '실전 모의고사 10회', [
    ['clipboard-text', 'yellow', '10회 구성', '통합사회1 3회 · 통합사회2 3회 · 전 범위 4회'],
    ['stopwatch', 'cyan', '수능과 같은 형식', '회마다 25문항 · 50점'],
    ['book-2', 'cyan', '정답과 해설 별책', '회차별 풀이와 해설'],
    ['flag', 'cyan', '+ MAXIMIN FINAL 8회', '파이널 시기 실전용 (예정)'],
  ]);
bookSlide(4, '매일의 복습은 MINT로', 'MINT는 제가 직접 만든 주간지입니다. 한 주 분량을 하루 30분씩 나눠서 공부하도록 만들었습니다.\n많은 학생들이 개념서를 눈으로 두세 번 읽고 나면 다 안다고 착각합니다. 그래서 MINT는 하루 30분 분량이 빈칸 채우기, O/X 변형, 사료 분석, 실전문제 풀이 순서로 되어 있습니다.\n눈으로만 읽는 가짜 공부 대신, 매일 손으로 풀어 보는 습관을 만듭니다.',
  (s) => {
    mark(s, 'cover');
    box(s, ML, 1.98, CWD, CH, { snip: true, line: C.mint, lw: 2.25, fill: K.bg, glow: K.mint, glowOpt: { opacity: 0.35, blur: 14 } });
    tx(s, '주간지', ML, 2.55, CWD, 0.5, { font: F.semi, size: 22, color: C.sub, align: 'center' });
    const lp = join(ART, 'logo-mint.png'), z = sizeOf(lp), lw = CWD - 0.4;
    img(s, lp, ML + 0.2, 1.98 + CH / 2 - (lw * z.h) / z.w / 2, lw, (lw * z.h) / z.w);
    tx(s, '하루 30분', ML, 1.98 + CH - 1.05, CWD, 0.5, { font: F.head, size: 22, color: C.mint, align: 'center' });
    return CWD;
  },
  'MINT', C.mint, '승민T 자체 제작 주간지', [
    ['clock', 'yellow', '하루 30분, 네 단계 순서대로', '눈으로만 읽는 대신, 매일 손으로 풀기'],
    ['pencil', 'mint', '01  빈칸 채우기', ''],
    ['square-check', 'mint', '02  O/X 변형', ''],
    ['file-text', 'mint', '03  사료 분석', ''],
    ['pencil-question', 'mint', '04  실전문제 풀이', ''],
  ]);

// ── 1년 로드맵 ──
section('1년 로드맵');
{
  const s = content(4, '1년 로드맵', '1년을 네 구간으로 달립니다', '1년 로드맵입니다. 네 구간으로 나눠서 달립니다.\n첫 번째 구간은 개념입니다. 1월부터 3월 20일까지 통합사회1·2 전 범위와 2028 예시문항 7가지 유형을 끝내고 3월 학평을 봅니다.\n두 번째는 기출 N제 구간입니다. 3월 말부터 6월 초까지 기출 분석과 변형 문제, 수능특강으로 6월 모의평가를 준비합니다.\n세 번째는 6월 중순부터 9월 초까지 고난도와 주간 실전입니다. 첫 수업은 6월 모의평가 분석이고, 수특·수완·6모를 반영한 고난도 문제를 풉니다.\n마지막 파이널은 9월 모의평가 분석으로 시작해서 수능까지 실전 모의고사에 집중합니다.');
  const st = [
    ['개념', '1월 ~ 3월 20일', '통합사회1·2 전 범위\n+ 예시문항 7가지 유형'],
    ['기출 N제', '3월 말 ~ 6월 초', '기출 분석·변형 문항\n+ 수능특강'],
    ['고난도 + 주간 실전', '6월 중순 ~ 9월 초', '6모 분석으로 시작\n수특·수완·6모 반영'],
    ['파이널', '9월 ~ 수능', '9모 분석으로 시작\n실전 모의고사 집중'],
  ];
  const ex = ['3월 학평', '6월 모평', '9월 모평', '수능'];
  const xs = [1.95, 4.85, 7.75, 10.65], ly = 3.35;
  mark(s, 'line'); line(s, 1.3, ly, 12.45, ly, { color: C.neon, w: 3.5, glow: K.neon });
  st.forEach(([n, p, d], i) => {
    const cx = xs[i], hi = i === 0;
    mark(s, `s${i}`);
    tx(s, n, cx - 1.45, 1.98, 2.9, 0.48, { font: F.head, size: 24, color: hi ? C.yellow : C.white, align: 'center' });
    tx(s, p, cx - 1.45, 2.45, 2.9, 0.42, { font: F.semi, size: 19, color: hi ? C.yellow : C.neon, align: 'center' });
    s.addShape(S.ellipse, { x: cx - 0.36, y: ly - 0.36, w: 0.72, h: 0.72, fill: { color: K.bg }, line: { color: hi ? C.yellow : C.neon, width: 3 }, shadow: glow(hi ? K.yellow : K.neon, { opacity: 0.5, blur: 8 }) });
    tx(s, String(i + 1), cx - 0.36, ly - 0.36, 0.72, 0.72, { font: F.head, size: 24, color: hi ? C.yellow : C.white, align: 'center', valign: 'middle' });
    mark(s, `d${i}`);
    tx(s, d, cx - 1.42, 4.2, 2.84, 0.95, { font: F.med, size: 19, color: C.sub, align: 'center', lsm: 1.18 });
    mark(s, `e${i}`);
    const exx = i === 3 ? 12.35 : cx + 1.45;
    s.addShape(S.diamond, { x: exx - 0.17, y: ly - 0.17, w: 0.34, h: 0.34, fill: { color: C.yellow }, line: { type: 'none' }, shadow: glow(K.yellow, { opacity: 0.6, blur: 6 }) });
    tx(s, ex[i], exx - 0.75, ly + 0.27, 1.5, 0.42, { font: F.head, size: 18, color: C.yellow, align: 'center' });
  });
  mark(s, 'hl'); hl(s, ML, 5.55, 8.6, 0.72);
  mark(s, 'end'); tx(s, '3월 20일, 통합사회1·2 개념 완주 → 3월 학평', ML + 0.2, 5.55, 8.4, 0.72, { font: F.head, size: 26, color: C.yellow, valign: 'middle' });
  const stp = [['line', 'wipe', 0, { dir: 'l', dur: 1600 }]];
  for (let i = 0; i < 4; i++) stp.push([`s${i}`, 'zoom', 150 + i * 380, { from: 0.7 }], [`d${i}`, 'fade', 300 + i * 380], [`e${i}`, 'flicker', 330 + i * 380]);
  plan(s, { auto: stp, clicks: [{ cue: '‘3월 20일 개념 완주’', steps: [['hl', 'wipe', 0, { dir: 'l', dur: 500 }], ['end', 'fade', 200], ['s0', 'pulse', 600]] }] });
}
{
  const s = content(4, '1년 로드맵', '1년 동안, 매주 실전', '그리고 1년 내내 빠지지 않는 게 있습니다. 매주 실전 모의고사입니다.\n매주 수업 시간에 한 번씩, 1년 동안 약 45번을 봅니다.\n오른쪽은 1년 동안의 주요 시험 일정입니다. 날짜는 예상입니다. 1월 말 수능특강 출간, 3월 24일 3월 학평, 5월 학평과 수능완성, 6월 모의평가, 7월 학평, 9월 모의평가, 10월 학평, 그리고 11월 수능입니다.\n이 시험들 사이사이를 매주 실모로 채워서, 실전 감각이 끊기지 않게 합니다.');
  mark(s, 'yak'); tx(s, '약', ML, 2.95, 0.7, 0.7, { font: F.semi, size: 30, color: C.sub, valign: 'middle' });
  const cnt = countUp(s, 'cnt', [0, 5, 10, 15, 20, 25, 30, 35, 40, 43, 45], (v) => String(v), ML + 0.55, 1.95, 3.1, 2.1, { font: F.black, size: 130, color: C.yellow, align: 'center', valign: 'middle', glow: { size: 10, opacity: 0.35, color: K.yellow } });
  mark(s, 'unit'); tx(s, '회', ML + 3.7, 3.0, 1.0, 0.75, { font: F.head, size: 40, valign: 'middle' });
  mark(s, 'cap'); tx(s, '매주 수업 시간\n실전 모의고사', ML, 4.2, 5.5, 1.0, { font: F.semi, size: 24, color: C.sub, lsm: 1.2 });
  mark(s, 'cal'); icon(s, 'calendar-event', 'mint', ML, 5.45, 0.7);
  tx(s, '1월 개강부터 11월 수능까지', ML + 0.9, 5.45, 5.0, 0.7, { font: F.semi, size: 22, color: C.mint, valign: 'middle' });
  const rx = 7.05, ev = [
    ['1월 말', '수능특강 출간'], ['3월 24일', '3월 학력평가'], ['5월', '5월 학력평가'], ['5월 말', '수능완성 출간'], ['6월', '6월 모의평가'],
    ['7월', '7월 학력평가'], ['9월', '9월 모의평가'], ['10월', '10월 학력평가'], ['11월 18일', '수능'],
  ];
  mark(s, 'evh'); tx(s, '주요 일정 (날짜는 예상)', rx, 1.95, 5.5, 0.45, { font: F.semi, size: 20, color: C.neon });
  mark(s, 'evl'); line(s, rx + 0.12, 2.62, rx + 0.12, 2.6 + 8 * 0.45, { color: C.line, w: 2 });
  ev.forEach(([d, t], i) => {
    const y = 2.45 + i * 0.45, hi = i === 8, mo = i === 4 || i === 6;
    mark(s, `ev${i}`);
    s.addShape(S.ellipse, { x: rx + 0.02, y: y + 0.11, w: 0.2, h: 0.2, fill: { color: hi ? C.yellow : mo ? C.neon : C.dim }, line: { type: 'none' } });
    tx(s, d, rx + 0.45, y, 1.55, 0.42, { font: F.head, size: 20, color: hi ? C.yellow : C.neon, valign: 'middle' });
    tx(s, t, rx + 2.05, y, 3.5, 0.42, { font: hi || mo ? F.head : F.semi, size: 20, color: hi ? C.yellow : C.white, valign: 'middle' });
  });
  plan(s, { auto: [['evh', 'fade', 0], ['evl', 'wipe', 0, { dir: 't', dur: 1500 }], ...seqs(range('ev', 9), 'fade', 100, 150), ['yak', 'fade', 0], ['unit', 'fade', 0]], clicks: [
    { cue: '숫자 45 올라가기', steps: [...cnt(0, 60), ['cap', 'fade', 800], ['cal', 'fade', 1100]] },
  ] });
}


// ── 수업 방식과 관리 원칙 ──
section('수업 방식');
{
  const s = content(5, '수업 방식과 관리 원칙', '매주 3시간 30분, 이렇게 씁니다', '수업은 매주 한 번, 3시간 30분입니다. 이렇게 나눠서 씁니다.\n처음 15분은 복습 테스트로 지난 수업 내용을 떠올립니다. 다음 2시간 35분은 수업, 마지막 40분은 실전 모의고사와 오답 정리입니다.\n노란색으로 표시한 복습 테스트와 실전 모의고사는 학생이 직접 떠올리고 풀어 보는 시간입니다. 이게 왜 중요한지는 다음 장에서 말씀드리겠습니다.');
  const parts = [['복습 테스트', 15, '15분', true, 'pencil-question'], ['수업', 155, '2시간 35분', false, 'chalkboard'], ['실전 모의고사\n+ 오답 정리', 40, '40분', true, 'clipboard-text']];
  const T = 210, by = 2.75, bh = 1.15;
  mark(s, 'tick');
  [0, 60, 120, 180, 210].forEach((m) => {
    const x = ML + (CW * m) / T;
    line(s, x, by - 0.25, x, by - 0.05, { color: C.dim, w: 1.5 });
    tx(s, m === 210 ? '210분' : `${m}`, x - 0.6, by - 0.68, 1.2, 0.4, { font: F.semi, size: 16, color: C.dim, align: m === 210 ? 'right' : 'center' });
  });
  let x = ML;
  parts.forEach(([t, m, lab, hi, ic], i) => {
    const w = (CW * m) / T;
    mark(s, `b${i}`);
    box(s, x + 0.03, by, w - 0.06, bh, { line: hi ? C.yellow : C.neon, lw: 2, fill: hi ? K.yellow : K.neon, ft: hi ? 70 : 85, glow: hi ? K.yellow : undefined, glowOpt: { opacity: 0.4, blur: 10 } });
    mark(s, `l${i}`);
    // 복습 테스트 칸이 좁아서 이름이 옆 칸까지 나가므로, 수업 이름은 칸 가운데쯤에서 시작
    const lx = i === 0 ? ML : i === 1 ? x + 2.9 : x + 0.15;
    icon(s, ic, hi ? 'yellow' : 'cyan', lx, by + bh + 0.25, 0.62);
    tx(s, t, lx, by + bh + 0.95, i === 2 ? w - 0.1 : 2.8, i === 2 ? 0.85 : 0.5, { font: F.head, size: 22, color: hi ? C.yellow : C.white, lsm: 1.05 });
    tx(s, lab, lx, by + bh + (i === 2 ? 1.8 : 1.42), 2.2, 0.45, { font: F.semi, size: 20, color: C.sub });
    x += w;
  });
  mark(s, 'hl'); hl(s, ML, 6.0, 7.6, 0.68);
  mark(s, 'end'); tx(s, '노란 칸 = 직접 떠올리고 풀어 보는 시간', ML + 0.2, 6.0, 7.4, 0.68, { font: F.head, size: 25, color: C.yellow, valign: 'middle' });
  const st = [['tick', 'fade', 0]];
  let t = 200;
  parts.forEach(([, m], i) => { const d = Math.max(350, m * 7); st.push([`b${i}`, 'wipe', t, { dir: 'l', dur: d }], [`l${i}`, 'fade', t + 150]); t += d; });
  plan(s, { auto: st, clicks: [{ cue: '‘직접 떠올리고 풀어 보는 시간’', steps: [['hl', 'wipe', 0, { dir: 'l', dur: 500 }], ['end', 'fade', 200], ['b0', 'pulse', 700, { by: 1.08 }], ['b2', 'pulse', 700, { by: 1.06 }]] }] });
}
{
  const s = content(5, '수업 방식과 관리 원칙', '고3은 학기 중 숙제 없이, 내신에 집중', '숙제 원칙입니다. 1·2월 겨울방학에는 매주 교재와 주간지 숙제가 있습니다.\n3월부터 6월, 학기 중에는 고3 학생이 내신에 집중할 수 있도록 숙제를 내지 않습니다. 대신 수업 시간의 복습 테스트와 실전 모의고사로 채웁니다. N수생은 같은 기간에도 교재와 주간지 숙제를 그대로 합니다.\n7월부터 수능까지는 다시 매주 교재와 주간지 숙제입니다.\n숙제가 없어도 괜찮은 근거가 있습니다. 한 연구에서 네 번 다시 읽은 무리는 1주일 뒤 40%, 한 번 읽고 세 번 시험 본 무리는 61%를 기억했습니다. 복습 테스트와 실전 모의고사가 바로 이 방법입니다.');
  const rows = [
    ['1~2월', '', '매주 교재 + 주간지 숙제', '겨울방학 · 개념 1회독', 'line'],
    ['3~6월', '고3', '숙제 없음', '내신 집중 · 복습 테스트 + 실전 모의고사로', 'yellow'],
    ['3~6월', 'N수', '교재 + 주간지 숙제', '같은 패턴 그대로', 'line'],
    ['7월~수능', '', '매주 교재 + 주간지 숙제', '고3 · N수 모두', 'line'],
  ];
  const lw = 6.75, rh = 1.0, gap = 0.14;
  rows.forEach(([p, who, a, b, col], i) => {
    const y = 2.0 + i * (rh + gap), hi = col === 'yellow';
    mark(s, `r${i}`);
    box(s, ML, y, lw, rh, { snip: true, line: hi ? C.yellow : C.line, lw: hi ? 2.5 : 1.75, fill: K.bg, glow: hi ? K.yellow : undefined, glowOpt: { opacity: 0.35, blur: 12 } });
    tx(s, p, ML + 0.22, y + (who ? 0.1 : 0), 1.6, who ? 0.45 : rh, { font: F.head, size: 21, color: hi ? C.yellow : C.neon, valign: who ? 'top' : 'middle' });
    if (who) tx(s, who, ML + 0.22, y + 0.5, 1.6, 0.4, { font: F.semi, size: 18, color: hi ? C.yellow : C.sub });
    tx(s, a, ML + 1.85, y + 0.1, lw - 2.0, 0.45, { font: F.head, size: 22, color: hi ? C.yellow : C.white });
    tx(s, b, ML + 1.85, y + 0.55, lw - 2.0, 0.38, { font: F.med, size: 17, color: C.sub });
  });
  // 오른쪽: 1주일 뒤 기억(막대)
  const cx = 8.0, base = 5.55, hmax = 2.7;
  mark(s, 'ch');
  tx(s, '1주일 뒤 기억', cx, 1.98, 4.6, 0.45, { font: F.head, size: 22, color: C.neon });
  line(s, cx, base, W - ML, base, { color: C.dim, w: 2 });
  tx(s, 'Roediger & Karpicke (2006)', cx, 6.42, 4.6, 0.36, { font: F.med, size: 15, color: C.dim });
  const bars = [['4번 다시 읽기', 40, false], ['1번 읽고 3번 시험', 61, true]];
  bars.forEach(([t, v, hi], i) => {
    const bx = cx + 0.3 + i * 2.3, bw = 1.5, h = (hmax * v) / 61;
    mark(s, `bar${i}`);
    box(s, bx, base - h, bw, h, { line: hi ? C.yellow : C.dim, lw: 2, fill: hi ? K.yellow : K.gray, ft: hi ? 70 : 80, glow: hi ? K.yellow : undefined, glowOpt: { opacity: 0.4, blur: 10 } });
    mark(s, `bl${i}`);
    tx(s, t, bx - 0.45, base + 0.08, bw + 0.9, 0.42, { font: F.semi, size: 17, color: hi ? C.yellow : C.sub, align: 'center' });
    if (!hi) { mark(s, 'v0'); tx(s, '40%', bx - 0.3, base - h - 0.82, bw + 0.6, 0.78, { font: F.black, size: 38, color: C.sub, align: 'center', valign: 'bottom' }); }
  });
  const bx1 = cx + 0.3 + 2.3;
  const cnt = countUp(s, 'v1', [0, 10, 20, 30, 40, 50, 55, 59, 61], (v) => `${v}%`, bx1 - 0.45, base - hmax - 0.88, 2.4, 0.82, { font: F.black, size: 42, color: C.yellow, align: 'center', valign: 'bottom', glow: { size: 8, opacity: 0.35, color: K.yellow } });
  plan(s, { auto: [['r0', 'float', 0], ['r2', 'float', 250], ['r3', 'float', 450]], clicks: [
    { cue: '3~6월 고3 숙제 없음', steps: [['r1', 'zoom', 0, { from: 0.9 }], ['r1', 'pulse', 600, { by: 1.04 }]] },
    { cue: '연구: 다시 읽기 40% vs 시험 61%', steps: [['ch', 'fade', 0], ['bar0', 'wipe', 200, { dir: 'b', dur: 600 }], ['bl0', 'fade', 300], ['v0', 'fade', 800], ['bar1', 'wipe', 1100, { dir: 'b', dur: 800 }], ['bl1', 'fade', 1200], ...cnt(1300, 70)] },
  ] });
}
// 학생용 웹앱(관리 원칙 마지막 쪽)
{
  const s = content(5, '수업 방식과 관리 원칙', '수업 없는 날에도, 학생용 웹앱', '마지막으로 관리 도구입니다. 제가 직접 만든 학생용 웹앱이 있습니다.\n앱을 열면 오늘의 10문제가 나오고, 틀리면 바로 해설을 봅니다. 틀린 문제는 오답 노트에 저절로 모입니다.\n플래너와 집중 타이머로 혼자 공부하는 시간도 기록할 수 있습니다.\n그리고 학생이 앱에서 공부한 기록은 제 관리 화면에 그대로 모여서, 누가 공부했는지, 어떤 문제를 많이 틀렸는지 제가 매일 확인합니다.');
  const ph = 4.6; let x = ML;
  mark(s, 'ph0'); x += phone(s, 'quiz', x, 1.98, ph) + 0.3;
  mark(s, 'ph1'); x += phone(s, 'weak', x, 1.98, ph) + 0.6;
  mark(s, null);
  const w = W - ML - x;
  const rows = [
    ['list-check', 'cyan', '오늘의 10문제', '매일 새 문제 · 틀리면 바로 해설'],
    ['notebook', 'cyan', '오답 노트 자동 저장', '틀린 문제가 저절로 모임'],
    ['checklist', 'cyan', '플래너 · 집중 타이머', '혼자 공부하는 시간까지 기록'],
    ['users', 'yellow', '선생님이 매일 확인', '누가 공부했는지, 무엇을 틀렸는지'],
  ];
  rows.forEach(([ic, col, t, d], i) => {
    const y = 2.1 + i * 1.08;
    mark(s, `r${i}`);
    icon(s, ic, col, x, y, 0.7);
    tx(s, t, x + 0.9, y - 0.04, w - 0.9, 0.48, { font: F.head, size: 23, color: col === 'yellow' ? C.yellow : C.white });
    tx(s, d, x + 0.9, y + 0.45, w - 0.9, 0.42, { font: F.med, size: 18, color: C.sub });
  });
  plan(s, { auto: [['ph0', 'float', 0], ['ph1', 'float', 250], ...seqs(range('r', 3), 'fade', 550, 220)], clicks: [{ cue: '‘선생님이 매일 확인’', steps: [['r3', 'zoom', 0, { from: 0.85 }], ['r3', 'pulse', 500]] }] });
}

// ── 등록 안내 ──
section('등록 안내');
{
  const s = content(6, '등록 안내', '2028 수능 대비 연간 커리큘럼', '등록 안내입니다.\n개강은 2027년 1월 4일 월요일입니다. 수업은 매주 한 번, 3시간 30분입니다.\n1·2월 겨울방학에는 월요일 오전 10시부터 1시 반까지, 3월부터는 토요일 오후 2시 반부터 6시까지 수업합니다.\n장소는 김포 사우역에서 걸어서 5분, 너를 위한 메이트 학원 김포관입니다.\n상담은 학원 전화나 문자, 카카오톡 채널로 남겨 주시면 됩니다.');
  const vx = ML + 2.45, vw = 8.95 - vx;
  mark(s, 'r0');
  icon(s, 'calendar', 'cyan', ML, 2.0, 0.66);
  tx(s, '개강', ML + 0.85, 2.04, 1.5, 0.5, { font: F.semi, size: 20, color: C.neon });
  tx(s, '2027. 1. 4.(월)', vx, 1.98, vw, 0.55, { font: F.head, size: 25, color: C.yellow });
  tx(s, '매주 1회 · 3시간 30분', vx, 2.52, vw, 0.4, { font: F.med, size: 18, color: C.sub });
  mark(s, 'r1');
  icon(s, 'clock', 'cyan', ML, 3.2, 0.66);
  tx(s, '수업 시간', ML + 0.85, 3.24, 1.5, 0.5, { font: F.semi, size: 20, color: C.neon });
  [['1~2월', '월요일 오전 10시 ~ 1시 반'], ['3월 이후', '토요일 오후 2시 반 ~ 6시']].forEach(([p, t], i) => {
    const y = 3.18 + i * 0.66;
    tx(s, p, vx, y, 1.25, 0.55, { font: F.semi, size: 19, color: C.sub, valign: 'middle' });
    tx(s, t, vx + 1.25, y, vw - 1.25, 0.55, { font: F.head, size: 22, valign: 'middle' });
  });
  mark(s, 'r2');
  icon(s, 'map-pin', 'cyan', ML, 4.8, 0.66);
  tx(s, '장소', ML + 0.85, 4.84, 1.5, 0.5, { font: F.semi, size: 20, color: C.neon });
  tx(s, '너를위한메이트학원 김포관', vx, 4.78, vw, 0.55, { font: F.head, size: 23 });
  tx(s, '김포시 사우중로 92, 3층 · 사우역 도보 5분', vx, 5.32, vw, 0.4, { font: F.med, size: 17, color: C.sub });
  const bx = 9.25, bw = W - ML - bx;
  mark(s, 'contact');
  box(s, bx, 2.0, bw, 3.95, { snip: true, line: C.yellow, lw: 2.25, fill: K.bg, glow: K.yellow, glowOpt: { opacity: 0.35, blur: 14 } });
  icon(s, 'phone', 'yellow', bx + 0.3, 2.2, 0.72);
  tx(s, '상담 · 문의', bx + 1.1, 2.2, bw - 1.2, 0.72, { font: F.head, size: 22, color: C.yellow, valign: 'middle' });
  tx(s, '031-8049-0716', bx + 0.3, 3.15, bw - 0.4, 0.55, { font: F.head, size: 25 });
  tx(s, '평일 오후 4~10시', bx + 0.3, 3.68, bw - 0.4, 0.4, { font: F.med, size: 16, color: C.sub });
  tx(s, '010-5528-9505', bx + 0.3, 4.25, bw - 0.4, 0.55, { font: F.head, size: 25 });
  tx(s, '문자 전용', bx + 0.3, 4.78, bw - 0.4, 0.4, { font: F.med, size: 16, color: C.sub });
  tx(s, '카카오톡 채널\n‘너를위한메이트 김포’', bx + 0.3, 5.2, bw - 0.4, 0.65, { font: F.semi, size: 16, color: C.sub, lsm: 1.1 });
  mark(s, 'glowc');
  box(s, bx, 2.0, bw, 3.95, { snip: true, line: C.yellow, lw: 3, glow: K.yellow, glowOpt: { opacity: 0.85, blur: 22 } });
  plan(s, { auto: [...seqs(range('r', 3), 'float', 0, 200), ['contact', 'fade', 800], ['glowc', 'breathe', 1300, { dur: 1300 }]] });
}
// 마무리
{
  const s = newSlide('BLANK_DARK');
  const arcs = globe(s, -1.35, -0.35, 8.2, true);
  mark(s, 'l1'); tx(s, '불확실한 통합사회,', 6.9, 1.55, 6.0, 0.8, { font: F.black, size: 38 });
  mark(s, 'hl'); hl(s, 6.8, 2.38, 5.9, 0.85);
  mark(s, 'l2'); tx(s, '효율적으로 완벽하게.', 6.95, 2.38, 5.8, 0.85, { font: F.black, size: 38, color: C.yellow, valign: 'middle' });
  mark(s, 'name'); tx(s, [r('통합사회 '), r('이승민', { color: C.yellow })], 6.9, 3.85, 6.0, 1.1, { font: F.black, size: 54, valign: 'middle' });
  const lg = asset('academy-logo-white.png'), zz = sizeOf(lg), hh = 0.5;
  mark(s, 'aclogo'); img(s, lg, 6.95, 5.35, (hh * zz.w) / zz.h, hh);
  plan(s, { auto: [...arcSteps(arcs, 0), ['l1', 'fade', 300], ['hl', 'wipe', 1000, { dir: 'l', dur: 600 }], ['l2', 'fade', 1200], ['name', 'zoom', 2000, { from: 0.85 }], ['aclogo', 'fade', 2500]] });
  s.notes = '마지막으로 한 말씀 드리겠습니다.\n2028 수능 통합사회는 개정 첫해라 아직 불확실한 것이 많습니다. 그래서 더더욱 혼자보다, 검증된 방법으로 준비해야 합니다.\n불확실한 통합사회, 효율적으로, 그리고 완벽하게 끝내겠습니다.\n지금까지 통합사회 이승민이었습니다. 감사합니다.';
}

// 촬영 전 점검(발표 때는 숨김)
section('촬영 전 점검');
{
  const s = newSlide('BLANK_DARK', { shift: false });
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

// ════════════════════════ 저장 + 테마 색 넣기 + 애니메이션 ════════════════════════
// 발표자 노트 맨 위에 클릭 안내
const CIRC = '①②③④⑤⑥';
for (const s of ALL) {
  let cue = '';
  if (s.cues.length) cue = `▶ 클릭 ${s.cues.length}번 — ${s.cues.map((c, i) => `${CIRC[i]} ${c}`).join('   ')}\n(나머지 움직임은 저절로 나옵니다)\n\n`;
  else if (s.spec?.auto.length) cue = '▶ 클릭 없음 — 움직임은 저절로 나옵니다(다음 클릭 = 다음 슬라이드)\n\n';
  if (cue || s.notes) s.addNotes(cue + s.notes);
}
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
const an = await applyAnimations(FILE, ALL.map((s) => s.spec));
console.log('완성:', FILE, `(${pres.slides.length}장, 애니메이션 ${an.slides}장, 같은 그림 ${an.dedup}개 합침)`);
