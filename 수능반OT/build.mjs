// 2028 수능 통합사회 정규반 OT 촬영용 PPT 만들기 (겨울특강OT 코드를 고쳐 씀)
//   node art.mjs     (네온 그림 — 처음 한 번, 또는 그림을 바꿀 때)
//   node build.mjs   → out/승민T-2028수능-통합사회-정규반-OT-칠판용.pptx  (검정 바탕, 학원 칠판에 빔으로 쏠 때)
//   OT_INVERT=1 node build.mjs → …-반전용.pptx (학원 PC·빔이 색을 반전시킬 때, 먼저 python3 invert_art.py)
//   OT_NAVY=1 node build.mjs   → …-남색.pptx  (화면 녹화·배포용 남색 바탕)
// 촬영 환경: 학원 초록 칠판에 빔으로 쏜다.
//   - 바탕은 검정(빛을 안 쏘는 곳 = 칠판 색 그대로). 밝은 네온 글자·선만 쓴다.
//   - 영상(폰 화면)으로 보므로 글자는 크게(본문 20pt 이상), 선은 굵게.
//   - 슬라이드에 적힌 말은 짧게, 말할 내용은 '슬라이드 노트'(발표자 보기)에 적었다.
// 내용 출처: 저장소 맨 위 '작업의뢰서_수능반OT.md'(강사가 준 사실만 씀). 문의처·장소는 지난 겨울특강 OT와 같음(강사 확인).
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
const FILE = join(OUT, `승민T-2028수능-통합사회-정규반-OT-${INVERT ? '반전용' : NAVY ? '남색' : '칠판용'}.pptx`);

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
pres.title = '승민T 2028 수능 통합사회 정규반 OT';
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
const r = (text, o = {}) => { const { font, ...rest } = o; return { text, options: font ? { ...face(font), ...rest } : rest }; };
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

// 내용 슬라이드. part = 1~8(오른쪽 위 점 8개 중 지금 파트를 노랗게), 0이면 점 없음
function content(part, kicker, title, notes) {
  const s = newSlide('CONTENT');
  s.addText(kicker, { placeholder: 'kicker' });
  s.addText(title, { placeholder: 'title' });
  if (part) {
    for (let i = 1; i <= 8; i++) {
      const d = i === part ? 0.2 : 0.13, cx = W - ML - (8 - i) * 0.3 - 0.1;
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
// 파트 구분 화면은 따로 두지 않고, 각 슬라이드 위 작은 표시(파트 이름 + 오른쪽 위 점 8개)로 파트를 알린다.

// 1. 표지
section('시작');
{
  const s = newSlide('BLANK_DARK');
  const arcs = globe(s, 6.75, -0.35, 8.2, true);
  const lg = asset('academy-logo-white.png'), z = sizeOf(lg);
  mark(s, 'logo'); img(s, lg, ML, 0.62, (0.52 * z.w) / z.h, 0.52);
  mark(s, 'kick'); tx(s, '2028 수능 통합사회 · 정규반 OT', ML, 1.45, 7.0, 0.5, { font: F.semi, size: 24, color: C.neon, cs: 1 });
  mark(s, 'title'); tx(s, [r('겨울에 시작해서,', { breakLine: true }), r('11월에 끝낸다', { color: C.yellow, glow: { size: 8, opacity: 0.35, color: K.yellow } })], ML, 2.0, 7.6, 2.3, { font: F.black, size: 62, lsm: 1.05 });
  mark(s, 'sub'); tx(s, '예비 고3 · N수생 1년 정규반', ML, 4.3, 6.2, 0.5, { font: F.med, size: 22, color: C.sub });
  [['개강', '2027. 1. 2.(토)', 2.45, true], ['수업', '매주 1회 3시간', 2.35, false], ['수능(예상)', '2027. 11. 18.(목)', 2.65, false]].reduce((x, [k, v, w, hi], i) => {
    mark(s, `chip${i}`);
    box(s, x, 5.0, w, 1.0, { snip: true, line: hi ? C.yellow : C.neon, lw: 2, fill: K.bg });
    tx(s, k, x + 0.2, 5.08, w - 0.3, 0.36, { font: F.semi, size: 16, color: hi ? C.yellow : C.neon });
    tx(s, v, x + 0.2, 5.42, w - 0.3, 0.48, { font: F.head, size: 20 });
    return x + w + 0.15;
  }, ML);
  mark(s, 'name'); tx(s, [r('통합사회 '), r('이승민T', { font: F.head, color: C.white })], ML, 6.3, 5, 0.55, { font: F.semi, size: 24, color: C.sub });
  plan(s, { auto: [['logo', 'fade', 0], ['kick', 'fade', 150], ['title', 'float', 350], ...arcSteps(arcs, 600), ['sub', 'fade', 1000], ...seqs(range('chip', 3), 'float', 1300, 200), ['name', 'fade', 2000]] });
  s.notes = '안녕하세요, 김포 너를 위한 메이트 학원 통합사회 이승민입니다.\n오늘은 2028학년도 수능을 준비하는 예비 고3, N수생, 그리고 학부모님께 통합사회 1년 정규반을 소개해 드리려고 합니다.\n개강은 2027년 1월 2일 토요일이고, 매주 한 번 3시간 수업으로 11월 수능까지 쭉 이어집니다.\n겨울에 시작해서 11월에 끝내는 1년, 어떻게 가는지 지금부터 말씀드리겠습니다.';
}

// 2. 오늘 이야기할 것
{
  const s = content(0, '오늘의 순서', '오늘 이야기할 여덟 가지', '오늘은 여덟 가지 순서로 말씀드리겠습니다.\n2028 수능에서 무엇이 바뀌는지, 왜 하필 지금 겨울방학부터 시작해야 하는지, 수시 최저와 통합사회가 어떤 관계인지, 그리고 1년 로드맵, 수업 방식, 교재, 제 소개, 마지막으로 등록 안내입니다.\n이 중에서 가장 중요한 건 두 번째, 왜 지금인가입니다. 이 부분은 꼭 끝까지 들어 주세요.');
  const items = ['수능\n변화', '왜\n지금인가', '수시\n최저', '1년\n로드맵', '수업\n방식', '교재', '강사\n소개', '등록\n안내'];
  const x0 = 1.35, x1 = 11.98, ly = 4.1, step = (x1 - x0) / 7;
  mark(s, 'line'); line(s, x0, ly, x1, ly, { color: C.neon, w: 3, glow: K.neon });
  items.forEach((t, i) => {
    const cx = x0 + i * step, hi = i === 1;
    mark(s, `stop${i}`);
    tx(s, String(i + 1).padStart(2, '0'), cx - 0.75, 2.75, 1.5, 0.7, { font: F.head, size: 32, color: hi ? C.yellow : C.neon, align: 'center', valign: 'bottom' });
    ping(s, hi ? 'yellow' : 'cyan', cx, ly, hi ? 0.95 : 0.75);
    tx(s, t, cx - 0.75, 4.7, 1.5, 1.05, { font: hi ? F.head : F.semi, size: 22, align: 'center', lsm: 1.12, color: hi ? C.yellow : C.white });
  });
  mark(s, 'star');
  box(s, x0 + step - 0.8, 5.85, 1.6, 0.48, { snip: true, line: C.yellow, lw: 2 });
  tx(s, '가장 중요', x0 + step - 0.8, 5.85, 1.6, 0.48, { font: F.head, size: 18, color: C.yellow, align: 'center', valign: 'middle' });
  plan(s, { auto: [['line', 'wipe', 0, { dir: 'l', dur: 1000 }], ...seqs(range('stop', 8), 'zoom', 150, 140, { from: 0.6 })], clicks: [{ cue: '‘가장 중요’ 표시', steps: [['star', 'flicker', 0], ['stop1', 'pulse', 500, { by: 1.15 }]] }] });
}

// ── ① 2028 수능, 무엇이 바뀌나 ──
section('① 2028 수능 변화');
{
  const s = content(1, '① 2028 수능, 무엇이 바뀌나', '문·이과 구분 없이, 모두가 봅니다', '먼저 2028 수능에서 무엇이 바뀌는지부터 보겠습니다.\n가장 큰 변화는 선택과목이 없어진다는 겁니다. 지금까지는 사회탐구, 과학탐구 중에서 골라서 봤죠.\n2028 수능부터는 문과, 이과 구분 없이 모든 수험생이 통합사회와 통합과학을 둘 다 봅니다.\n그러니까 통합사회는 누구도 피해 갈 수 없는 과목이 됐습니다.');
  [['books', '문과', 2.15], ['flask', '이과', 4.05]].forEach(([ic, t, y], i) => {
    mark(s, `g${i}`);
    box(s, ML, y, 3.3, 1.35, { snip: true, line: C.dim, lw: 2 });
    icon(s, ic, 'gray', ML + 0.3, y + 0.28, 0.8);
    tx(s, t, ML + 1.3, y, 1.9, 1.35, { font: F.head, size: 30, color: C.sub, valign: 'middle' });
  });
  mark(s, 'lines');
  line(s, ML + 3.35, 2.82, 5.95, 3.77, { color: C.neon, w: 3, glow: K.neon });
  line(s, ML + 3.35, 4.72, 5.95, 3.77, { color: C.neon, w: 3, glow: K.neon });
  line(s, 5.95, 3.77, 6.5, 3.77, { color: C.neon, w: 3, arrow: true, glow: K.neon });
  mark(s, 'all');
  box(s, 6.65, 2.15, W - ML - 6.65, 3.25, { snip: true, line: C.neon, lw: 2.5, fill: K.bg, glow: K.neon, glowOpt: { opacity: 0.4, blur: 14 } });
  icon(s, 'users-group', 'cyan', 6.95, 2.4, 0.75);
  tx(s, '모든 수험생', 7.85, 2.4, 4, 0.75, { font: F.semi, size: 24, color: C.neon, valign: 'middle' });
  tx(s, [r('통합사회', { color: C.yellow, glow: { size: 6, opacity: 0.3, color: K.yellow } }), r('  +  ', { color: C.dim }), r('통합과학')], 6.95, 3.45, W - ML - 7.15, 1.2, { font: F.black, size: 35, valign: 'middle' });
  tx(s, '둘 다 응시', 6.95, 4.6, 4, 0.55, { font: F.semi, size: 22, color: C.sub });
  mark(s, 'hl'); hl(s, ML, 5.85, 6.25, 0.7);
  mark(s, 'end');
  icon(s, 'ban', 'yellow', ML + 0.1, 5.88, 0.64);
  tx(s, '2028 수능 · 선택과목 폐지', ML + 0.9, 5.85, 5.5, 0.7, { font: F.head, size: 28, color: C.yellow, valign: 'middle' });
  plan(s, { auto: [['g0', 'fade', 0], ['g1', 'fade', 200]], clicks: [
    { cue: '문과·이과 → 모든 수험생', steps: [['lines', 'wipe', 0, { dir: 'l', dur: 600 }], ['all', 'zoom', 500, { from: 0.9 }]] },
    { cue: '‘선택과목 폐지’ 강조', steps: [['hl', 'wipe', 0, { dir: 'l', dur: 500 }], ['end', 'fade', 200]] },
  ] });
}
{
  const s = content(1, '① 2028 수능, 무엇이 바뀌나', '처음 치르는 시험, 이렇게 봅니다', '시험 모양을 보면, 통합사회는 25문항, 40분, 50점 만점입니다.\n내신은 5등급제로 바뀌었지만, 수능은 지금처럼 9등급 상대평가 그대로입니다.\n범위는 고1 때 배우는 통합사회1과 통합사회2 전 범위입니다.\n그리고 중요한 점, 이 시험은 아직 아무도 실전으로 치러 본 적이 없습니다. 평가원이 낸 문항은 예시문항 25개뿐이고, 평가원이 직접 내는 첫 실전 시험이 2027년 6월 모의평가입니다.\nEBS 수능특강 통합사회도 2027년 1월 말에 처음 나옵니다.');
  [['25', '문항'], ['40', '분'], ['50', '점']].forEach(([n, u], i) => {
    const cx = ML + 1.97 + i * 3.93;
    mark(s, `n${i}`);
    tx(s, [r(n, { color: i === 0 ? C.yellow : C.white }), r(' ' + u, { size: 28, color: C.sub, font: F.semi })], cx - 1.9, 1.95, 3.8, 1.5, { font: F.black, size: 72, align: 'center', valign: 'middle' });
    if (i < 2) { mark(s, null); line(s, cx + 1.96, 2.25, cx + 1.96, 3.2, { color: C.line, w: 2 }); }
  });
  const facts = [
    ['수능은 9등급 상대평가', '그대로 (5등급제는 내신만)', C.white],
    ['범위: 통합사회1·2 전체', '고1 과목 · 2022 개정 교육과정', C.white],
    ['평가원 문항은 예시문항 25개뿐', '첫 실전: 2027년 6월 모의평가', C.yellow],
    ['EBS 수능특강 통합사회', '2027년 1월 말 첫 출간', C.white],
  ];
  facts.forEach(([a, b, cc], i) => {
    const x = ML + (i % 2) * 5.98, y = 3.85 + Math.floor(i / 2) * 1.35;
    mark(s, `f${i}`);
    box(s, x, y, 5.82, 1.17, { snip: true, line: cc === C.yellow ? C.yellow : C.line, lw: cc === C.yellow ? 2.25 : 1.75 });
    tx(s, a, x + 0.3, y + 0.13, 5.3, 0.48, { font: F.head, size: 23, color: cc });
    tx(s, b, x + 0.3, y + 0.62, 5.3, 0.42, { font: F.med, size: 20, color: C.sub });
  });
  plan(s, { auto: [...seqs(range('n', 3), 'zoom', 0, 300, { from: 0.6 }), ['n0', 'pulse', 1100], ['n1', 'pulse', 1250], ['n2', 'pulse', 1400]],
    clicks: [{ cue: '네 가지 사실', steps: [...seqs(['f0', 'f1', 'f3'], 'float', 0, 220), ['f2', 'zoom', 800, { from: 0.9 }]] }] });
}

// ── ② 왜 지금(겨울방학)부터인가 ──
section('② 왜 지금인가');
{
  const s = content(2, '② 왜 지금인가 · 1 / 5', '고3 1학기에는 시간이 없습니다', '이제 오늘 가장 중요한 이야기, 왜 지금 겨울방학부터 해야 하는지입니다.\n첫째, 고3 1학기에는 시간이 없습니다. 수시에 반영되는 마지막 내신 학기라서 내신 시험에 수행평가, 생기부까지 한꺼번에 몰립니다.\n합격한 선배들 이야기를 들어 보면 “1학기엔 내신 때문에 수능 공부를 못 해서 여름에 몰아서 했다”는 말이 정말 많이 나옵니다.\n여름은 개념이 끝난 상태로 실전에 들어가야 하는 때입니다. 그래서 개념은 학교가 시작하기 전, 이번 겨울에 끝내야 합니다.');
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
  const s = content(2, '② 왜 지금인가 · 2 / 5', '통합사회 수업은 고1에서 끝납니다', '둘째, 2년의 공백입니다.\n통합사회는 고1 때 배우고, 고2·고3 때는 학교에서 통합사회 수업이 없습니다.\n그러니까 예비 고3 학생들은 고1 때 배운 내용을 대부분 잊어버린 상태입니다. 한 번 배웠으니까 괜찮겠지, 하고 들어가면 큰일 납니다.\n솔직히 말씀드리면 처음부터 다시 1회독이 필요합니다. 그 1회독을 이번 겨울에 하자는 겁니다.');
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
  const s = content(2, '② 왜 지금인가 · 3 / 5', '3~4문제가 등급을 가릅니다', '셋째, 통합사회는 몇 문제 차이로 등급이 갈리는 시험입니다.\n2026년 3월 고2 학력평가 통합사회의 1등급 컷이 50점 만점에 약 42점이었습니다.\n25문항 중에 서너 문제만 틀려도 1등급이 아닐 수 있다는 뜻입니다.\n이런 시험에서는 아는 것과 40분 안에 실수 없이 푸는 것이 다릅니다. 40분 실전 감각은 하루아침에 생기지 않고, 회차를 쌓아야 생깁니다. 그래서 시작이 빨라야 합니다.');
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
  const s = content(2, '② 왜 지금인가 · 4 / 5', '이과 최상위권도 함께 보는 시험', '넷째, 이 시험은 문과, 이과 모두가 봅니다.\n지금까지는 이과 상위권 학생들이 과학탐구를 보니까 사회 과목에서 만날 일이 없었죠. 이제는 이과 최상위권 학생들도 똑같이 통합사회를 봅니다.\n그리고 피할 수도 없습니다. 예전처럼 나한테 맞는 다른 과목으로 갈아탈 수도 없습니다.\n상대평가에서 경쟁하는 사람이 넓어졌다는 것, 이게 지금 준비를 시작해야 하는 이유입니다.');
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
  const s = content(2, '② 왜 지금인가 · 5 / 5', 'N수생에게도 처음 배우는 과목입니다', '다섯째, N수생 이야기입니다.\n2027 수능은 지금 체제로 치르는 마지막 해였고, N수생이 약 20만 명으로 23년 만에 가장 많았습니다.\n그런데 2028 수능에는 옛 교육과정 시험이 없습니다. 그러니까 재수를 하면 2022 개정 통합사회를 새로 배워야 합니다.\n고1 때 통합사회를 배우지 않은 N수생에게는 완전히 새로운 과목입니다. 겨울 1회독은 선택이 아니라 필수입니다.');
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

// ── ③ 수시 최저와 통합사회 ──
section('③ 수시 최저');
const MINNOTE = '2028학년도 대입 시행계획(2026년 4월 발표) 기준 · 세부 기준은 2028 수시 모집요강에서 다시 확인';
{
  const s = content(3, '③ 수시 최저와 통합사회', '주요 대학 수능 최저, 한눈에', '다음은 수시 최저 이야기입니다. 2026년 4월에 발표된 2028학년도 시행계획 기준으로 정리했습니다.\n서울대는 수시 최저를 전면 폐지했습니다. 연세대는 추천형, 종합인재형, 그리고 새로 생기는 논술에 최저가 있고, 사회와 과학을 각각 한 과목으로 셉니다.\n고려대는 학업우수 4개 합 9, 논술 4개 합 8이고, 탐구는 사회·과학 중 좋은 한 과목입니다. 학교추천은 의학과를 빼고 최저가 없어졌습니다.\n서강대, 성균관대, 한양대도 보시는 것처럼 최저가 있습니다. 세부 기준은 꼭 2028 수시 모집요강에서 다시 확인해 주세요.');
  const rows = [
    ['서울대', '수시 최저 전면 폐지', ''],
    ['연세대', '추천형 · 종합인재형 · 논술(신설) 최저', '사회·과학을 각각 1과목으로 · 국어·수학 포함 조건 있음'],
    ['고려대', '학업우수 4합9 · 논술 4합8', '탐구는 사회·과학 중 좋은 1과목 · 학교추천은 최저 폐지(의학과 제외)'],
    ['서강대', '지역균형 3개 각 3등급 · 일반Ⅱ·논술 3합7', '일반Ⅱ 신설 · 탐구 1과목'],
    ['성균관대', '국·수·영·사탐·과탐 중 3개 합 5~7', '전형·학과별 · 2028부터 사회·과학 분리(의예만 평균)'],
    ['한양대', '추천형 3개 각 3등급 · 학업형·논술 3합7', '학업형은 사회·과학 분리 · 탐구 좋은 1과목 · 의예는 2과목 평균'],
  ];
  const y0 = 1.98, rh = 0.73;
  rows.forEach(([u, a, b], i) => {
    const y = y0 + i * rh;
    mark(s, `r${i}`);
    if (i) line(s, ML, y - 0.04, W - ML, y - 0.04, { color: C.line, w: 1 });
    tx(s, u, ML, y, 1.75, rh - 0.08, { font: F.head, size: 23, color: C.yellow, valign: 'middle' });
    if (b) {
      tx(s, a, ML + 1.9, y + 0.02, CW - 1.9, 0.38, { font: F.head, size: 21 });
      tx(s, b, ML + 1.9, y + 0.38, CW - 1.9, 0.3, { font: F.med, size: 16, color: C.sub });
    } else tx(s, a, ML + 1.9, y, CW - 1.9, rh - 0.08, { font: F.head, size: 21, valign: 'middle' });
  });
  mark(s, null);
  tx(s, MINNOTE, ML, y0 + 6 * rh + 0.08, CW, 0.38, { font: F.med, size: 15, color: C.dim });
  plan(s, { auto: seqs(range('r', 6), 'float', 0, 180) });
}
{
  const s = content(3, '③ 수시 최저와 통합사회', '통합사회 한 과목이 최저의 한 칸을 채웁니다', '그럼 통합사회가 최저에서 어떤 역할을 하는지 계산해 보겠습니다.\n연세대 추천형 인문은 2개 과목 합 4입니다. 국어 2등급에 통합사회 2등급이면 합이 4, 최저를 맞춥니다.\n고려대 학업우수는 4개 합 9입니다. 국어 3, 수학 3, 영어 2에 통합사회 1등급이면 합 9로 충족입니다.\n보시는 것처럼 통합사회 한 과목이 최저의 한 칸을 그대로 채웁니다. 통합사회 1~2등급은 수시 합격의 열쇠가 될 수 있습니다.');
  const eq = (key, y, label, parts, total) => {
    mark(s, `${key}L`);
    tx(s, label, ML, y, CW, 0.45, { font: F.semi, size: 21, color: C.neon });
    const tw = parts.length > 2 ? 1.75 : 2.3, op = 0.5, ty = y + 0.55, th = 1.15;
    let x = ML;
    parts.forEach(([sub, g, hi], i) => {
      mark(s, `${key}t${i}`);
      if (i) tx(s, '+', x, ty, op, th, { font: F.head, size: 34, color: C.dim, align: 'center', valign: 'middle' });
      if (i) x += op;
      box(s, x, ty, tw, th, { snip: true, line: hi ? C.yellow : C.line, lw: hi ? 2.75 : 1.75, fill: K.bg, glow: hi ? K.yellow : undefined, glowOpt: { opacity: 0.45, blur: 12 } });
      tx(s, sub, x, ty + 0.08, tw, 0.4, { font: F.semi, size: 18, color: hi ? C.yellow : C.sub, align: 'center' });
      tx(s, g, x, ty + 0.42, tw, 0.65, { font: F.black, size: 36, color: hi ? C.yellow : C.white, align: 'center', valign: 'middle' });
      x += tw;
    });
    mark(s, `${key}R`);
    tx(s, '=', x, ty, op, th, { font: F.head, size: 34, color: C.dim, align: 'center', valign: 'middle' });
    tx(s, String(total), x + op, ty, 0.85, th, { font: F.black, size: 54, color: C.yellow, align: 'center', valign: 'middle' });
    mark(s, `${key}C`);
    icon(s, 'circle-check', 'mint', x + op + 0.95, ty + 0.22, 0.72);
    tx(s, '충족', x + op + 1.7, ty, 1.0, th, { font: F.head, size: 26, color: C.mint, valign: 'middle' });
    mark(s, null);
  };
  eq('a', 2.0, '연세대 추천형 인문 · 2개 과목 합 4', [['국어', '2'], ['통합사회', '2', true]], 4);
  eq('b', 4.15, '고려대 학업우수 · 4개 합 9', [['국어', '3'], ['수학', '3'], ['영어', '2'], ['통합사회', '1', true]], 9);
  tx(s, MINNOTE, ML, 6.45, CW, 0.38, { font: F.med, size: 15, color: C.dim });
  const steps = (k, n) => [['' + k + 'L', 'fade', 0], ...seqs(range(`${k}t`, n), 'float', 250, 250), [`${k}R`, 'zoom', 250 + n * 250, { from: 0.6 }], [`${k}C`, 'flicker', 550 + n * 250], [`${k}t${n - 1}`, 'pulse', 900 + n * 250]];
  plan(s, { clicks: [{ cue: '연세대 계산', steps: steps('a', 2) }, { cue: '고려대 계산', steps: steps('b', 4) }] });
}

// ── ④ 1년 로드맵 ──
section('④ 1년 로드맵');
{
  const s = content(4, '④ 1년 로드맵', '1년을 네 구간으로 달립니다', '1년 로드맵입니다. 네 구간으로 나눠서 달립니다.\n첫 번째 구간은 개념입니다. 1월부터 3월 20일까지 통합사회1·2 전 범위와 2028 예시문항 7가지 유형을 끝내고 3월 학평을 봅니다.\n두 번째는 기출 N제 구간입니다. 3월 말부터 6월 초까지 기출 분석과 변형 문제, 수능특강으로 6월 모의평가를 준비합니다.\n세 번째는 6월 중순부터 9월 초까지 고난도와 주간 실전입니다. 첫 수업은 6월 모의평가 분석이고, 수특·수완·6모를 반영한 고난도 문제를 풉니다.\n마지막 파이널은 9월 모의평가 분석으로 시작해서 수능까지 실전 모의고사에 집중합니다.');
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
  const s = content(4, '④ 1년 로드맵', '1년 동안, 매주 실전', '그리고 1년 내내 빠지지 않는 게 있습니다. 매주 실전 모의고사입니다.\n25문항, 40분, 실제 수능과 똑같은 조건으로 매주 한 번씩, 1년 동안 약 45번을 봅니다.\n오른쪽은 1년 동안의 주요 시험 일정입니다. 날짜는 예상입니다. 1월 말 수능특강 출간, 3월 24일 3월 학평, 5월 학평과 수능완성, 6월 모의평가, 7월 학평, 9월 모의평가, 10월 학평, 그리고 11월 수능입니다.\n이 시험들 사이사이를 매주 실모로 채워서, 실전 감각이 끊기지 않게 합니다.');
  mark(s, 'yak'); tx(s, '약', ML, 2.95, 0.7, 0.7, { font: F.semi, size: 30, color: C.sub, valign: 'middle' });
  const cnt = countUp(s, 'cnt', [0, 5, 10, 15, 20, 25, 30, 35, 40, 43, 45], (v) => String(v), ML + 0.55, 1.95, 3.1, 2.1, { font: F.black, size: 130, color: C.yellow, align: 'center', valign: 'middle', glow: { size: 10, opacity: 0.35, color: K.yellow } });
  mark(s, 'unit'); tx(s, '회', ML + 3.7, 3.0, 1.0, 0.75, { font: F.head, size: 40, valign: 'middle' });
  mark(s, 'cap'); tx(s, '매주 실전 모의고사\n25문항 · 40분', ML, 4.2, 5.5, 1.0, { font: F.semi, size: 24, color: C.sub, lsm: 1.2 });
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

// ── ⑤ 수업 방식과 관리 원칙 ──
section('⑤ 수업 방식');
{
  const s = content(5, '⑤ 수업 방식과 관리 원칙', '매주 3시간, 이렇게 씁니다', '수업은 매주 한 번 3시간입니다. 3시간을 이렇게 나눠서 씁니다.\n처음 10분은 쪽지 시험으로 지난 내용을 떠올립니다. 다음 100분은 개념 강의, 그리고 40분 동안 실전 모의고사를 실제 시험처럼 풀고, 마지막 30분은 바로 풀이합니다.\n노란색으로 표시한 쪽지 시험과 실전 모의고사, 매주 50분은 직접 떠올리는 시간입니다. 이게 왜 중요한지는 다음 장에서 말씀드리겠습니다.');
  const parts = [['쪽지 시험', 10, true, 'pencil-question'], ['개념 강의', 100, false, 'chalkboard'], ['실전 모의고사', 40, true, 'clipboard-text'], ['풀이', 30, false, 'bulb']];
  const by = 2.75, bh = 1.15;
  mark(s, 'tick');
  [0, 60, 120, 180].forEach((m) => {
    const x = ML + (CW * m) / 180;
    line(s, x, by - 0.25, x, by - 0.05, { color: C.dim, w: 1.5 });
    tx(s, m === 180 ? '180분' : `${m}`, x - 0.6, by - 0.68, 1.2, 0.4, { font: F.semi, size: 16, color: C.dim, align: 'center' });
  });
  let x = ML;
  parts.forEach(([t, m, hi, ic], i) => {
    const w = (CW * m) / 180;
    mark(s, `b${i}`);
    box(s, x + 0.03, by, w - 0.06, bh, { line: hi ? C.yellow : C.neon, lw: 2, fill: hi ? K.yellow : K.neon, ft: hi ? 70 : 85, glow: hi ? K.yellow : undefined, glowOpt: { opacity: 0.4, blur: 10 } });
    mark(s, `l${i}`);
    // 쪽지 시험 칸이 좁아서 이름이 옆 칸까지 나가므로, 개념 강의 이름은 칸 가운데쯤에서 시작
    const lx = i === 0 ? ML : i === 1 ? x + 2.6 : x + 0.2;
    icon(s, ic, hi ? 'yellow' : 'cyan', lx, by + bh + 0.25, 0.62);
    tx(s, t, lx, by + bh + 0.95, 2.4, 0.5, { font: F.head, size: 22, color: hi ? C.yellow : C.white });
    tx(s, `${m}분`, lx, by + bh + 1.42, 2.0, 0.45, { font: F.semi, size: 20, color: C.sub });
    x += w;
  });
  mark(s, 'hl'); hl(s, ML, 5.9, 8.3, 0.72);
  mark(s, 'end'); tx(s, '노란 칸 = 직접 떠올리는 시간, 매주 50분', ML + 0.2, 5.9, 8.1, 0.72, { font: F.head, size: 26, color: C.yellow, valign: 'middle' });
  const st = [['tick', 'fade', 0]];
  let t = 200;
  parts.forEach(([, m], i) => { const d = Math.max(300, m * 9); st.push([`b${i}`, 'wipe', t, { dir: 'l', dur: d }], [`l${i}`, 'fade', t + 150]); t += d; });
  plan(s, { auto: st, clicks: [{ cue: '‘떠올리는 시간 50분’', steps: [['hl', 'wipe', 0, { dir: 'l', dur: 500 }], ['end', 'fade', 200], ['b0', 'pulse', 700, { by: 1.08 }], ['b2', 'pulse', 700, { by: 1.06 }]] }] });
}
{
  const s = content(5, '⑤ 수업 방식과 관리 원칙', '학기 중엔 숙제로 시간을 뺏지 않습니다', '학기 중에는 숙제로 시간을 뺏지 않습니다. 대신 3시간 안에서 다 끝냅니다.\n1·2월엔 필수 숙제가 없고 원하면 웹앱 퀴즈로 10분 복습, 3~6월 내신 기간에도 숙제 없이 수업 안에서 해결합니다. 내신이 끝나는 7월부터 MINT와 오답 관리로 본격 관리합니다.\n근거가 있습니다. Roediger와 Karpicke의 2006년 연구에서, 네 번 다시 읽은 무리는 1주일 뒤 40%, 한 번 읽고 세 번 시험 본 무리는 61%를 기억했습니다. 떠올리기가 기억에 남습니다. 쪽지 시험과 매주 실모가 바로 이 방법입니다.');
  const rows = [['1~2월', '필수 숙제 없음', '선택: 웹앱 매일 퀴즈 10분', false], ['3~6월', '숙제 없음', '내신 기간 · 수업 안 쪽지 시험·실모로', false], ['7월~', '본격 관리', '내신 끝 · 주간지 MINT · 오답 관리', true]];
  const lw = 6.5;
  rows.forEach(([p, a, b, hi], i) => {
    const y = 2.05 + i * 1.38;
    mark(s, `r${i}`);
    box(s, ML, y, lw, 1.2, { snip: true, line: hi ? C.mint : C.line, lw: hi ? 2.25 : 1.75 });
    tx(s, p, ML + 0.25, y, 1.4, 1.2, { font: F.head, size: 23, color: hi ? C.mint : C.neon, valign: 'middle' });
    tx(s, a, ML + 1.75, y + 0.14, lw - 1.95, 0.5, { font: F.head, size: 23 });
    tx(s, b, ML + 1.75, y + 0.64, lw - 1.95, 0.42, { font: F.med, size: 18, color: C.sub });
  });
  // 오른쪽: 1주일 뒤 기억(막대)
  const cx = 7.75, base = 5.5, hmax = 2.75;
  mark(s, 'ch');
  tx(s, '1주일 뒤 기억', cx, 1.98, 4.8, 0.45, { font: F.head, size: 22, color: C.neon });
  line(s, cx, base, W - ML, base, { color: C.dim, w: 2 });
  tx(s, 'Roediger & Karpicke (2006)', cx, 6.42, 4.8, 0.36, { font: F.med, size: 15, color: C.dim });
  const bars = [['4번 다시 읽기', 40, false], ['1번 읽고 3번 시험', 61, true]];
  bars.forEach(([t, v, hi], i) => {
    const bx = cx + 0.35 + i * 2.45, bw = 1.6, h = (hmax * v) / 61;
    mark(s, `bar${i}`);
    box(s, bx, base - h, bw, h, { line: hi ? C.yellow : C.dim, lw: 2, fill: hi ? K.yellow : K.gray, ft: hi ? 70 : 80, glow: hi ? K.yellow : undefined, glowOpt: { opacity: 0.4, blur: 10 } });
    mark(s, `bl${i}`);
    tx(s, t, bx - 0.45, base + 0.08, bw + 0.9, 0.42, { font: F.semi, size: 18, color: hi ? C.yellow : C.sub, align: 'center' });
    if (!hi) { mark(s, 'v0'); tx(s, '40%', bx - 0.3, base - h - 0.85, bw + 0.6, 0.8, { font: F.black, size: 40, color: C.sub, align: 'center', valign: 'bottom' }); }
  });
  const bx1 = cx + 0.35 + 2.45;
  const cnt = countUp(s, 'v1', [0, 10, 20, 30, 40, 50, 55, 59, 61], (v) => `${v}%`, bx1 - 0.4, base - hmax - 0.9, 2.4, 0.85, { font: F.black, size: 44, color: C.yellow, align: 'center', valign: 'bottom', glow: { size: 8, opacity: 0.35, color: K.yellow } });
  plan(s, { auto: seqs(range('r', 3), 'float', 0, 250), clicks: [
    { cue: '연구: 다시 읽기 40% vs 시험 61%', steps: [['ch', 'fade', 0], ['bar0', 'wipe', 200, { dir: 'b', dur: 600 }], ['bl0', 'fade', 300], ['v0', 'fade', 800], ['bar1', 'wipe', 1100, { dir: 'b', dur: 800 }], ['bl1', 'fade', 1200], ...cnt(1300, 70)] },
  ] });
}

// ── ⑥ 교재와 학습 도구 ──
section('⑥ 교재');
{
  const s = content(6, '⑥ 교재와 학습 도구', '승민T가 직접 만든 교재 4종', '교재는 모두 제가 직접 만들었습니다.\n먼저 MINIMAP은 통합사회1·2 개념서입니다. 개념마다 실제 시험에 얼마나 나왔는지 출제 빈도를 표시해 두었습니다.\nMINIMAX는 기출분석서로 기본편과 심화편이 있습니다. 예시문항과 학력평가를 분석해서 만든 변형 문항이 들어 있습니다.\nMAXIMIN은 실전 모의고사입니다. 파이널 때 쓸 MAXIMIN FINAL 8회도 준비할 예정입니다.\n마지막으로 MINT는 주간지입니다. 7월부터 평일에 하루 30분씩 복습하는 용도입니다.');
  const colW = 2.83, gap = (CW - 4 * colW) / 3, ch = 2.95, cw = (ch * 1590) / 2246, cy = 1.98;
  const items = [
    ['MINIMAP', '통합사회1·2 개념서\n개념마다 출제 빈도', C.neon],
    ['MINIMAX', '기출분석서\n기본편 · 심화편', C.neon],
    ['MAXIMIN', '실전 모의고사\n+ FINAL 8회 예정', C.yellow],
    ['MINT', '주간지\n7월부터 평일 30분', C.mint],
  ];
  items.forEach(([n, d, cc], i) => {
    const x = ML + i * (colW + gap), mx = x + (colW - cw) / 2;
    mark(s, `cv${i}`);
    if (i === 0) {
      img(s, join(ART, 'cover-mmap2.jpg'), mx + 0.32, cy, cw - 0.12, ch - 0.17);
      img(s, join(ART, 'cover-mmap1.jpg'), mx - 0.2, cy + 0.12, cw - 0.12, ch - 0.17);
    } else if (i === 3) {
      box(s, mx, cy, cw, ch, { snip: true, line: C.mint, lw: 2, fill: K.bg, glow: K.mint, glowOpt: { opacity: 0.35, blur: 12 } });
      tx(s, '주간지', mx, cy + 0.45, cw, 0.45, { font: F.semi, size: 18, color: C.sub, align: 'center' });
      mark(s, 'mint');
      const lp = join(ART, 'logo-mint.png'), z = sizeOf(lp), lw = cw - 0.35;
      img(s, lp, mx + 0.17, cy + ch / 2 - (lw * z.h) / z.w / 2, lw, (lw * z.h) / z.w);
      mark(s, `cv${i}`);
      tx(s, '평일 하루 30분', mx, cy + ch - 0.85, cw, 0.42, { font: F.semi, size: 17, color: C.mint, align: 'center' });
    } else img(s, join(ART, i === 1 ? 'cover-mmx.jpg' : 'cover-maxi.jpg'), mx, cy, cw, ch);
    mark(s, `cp${i}`);
    tx(s, n, x, cy + ch + 0.15, colW, 0.5, { font: F.head, size: 25, color: cc, align: 'center' });
    tx(s, d, x - 0.05, cy + ch + 0.65, colW + 0.1, 0.85, { font: F.med, size: 19, color: C.sub, align: 'center', lsm: 1.15 });
  });
  const st = [];
  for (let i = 0; i < 4; i++) st.push([`cv${i}`, 'float', i * 350], [`cp${i}`, 'fade', 150 + i * 350]);
  st.push(['mint', 'flicker', 1250]);
  plan(s, { auto: st });
}
{
  const s = content(6, '⑥ 교재와 학습 도구', '분석해서, 직접 만들었습니다', '이 교재들에 들어간 문항은 1,300여 개입니다.\n평가원 예시문항과 2025년, 2026년 학력평가 200문항을 하나하나 분석해서, 그 출제 방식에 맞춰 제가 직접 만든 문항입니다.\n그리고 모든 문항은 정답을 가리고 처음부터 다시 풀어 보는 방식으로 두 번 검수했습니다.\n이 밖에 2028 예시문항 분석 특강 교재로 7가지 유형별 풀이 전략을 정리했고, 학생용 웹앱으로 매일 퀴즈와 오답 노트를 쓸 수 있습니다.');
  const cnt = countUp(s, 'cnt', [0, 150, 300, 450, 600, 750, 900, 1050, 1200, 1300], (v) => v.toLocaleString('en-US'), ML - 0.1, 1.95, 4.6, 1.6, { font: F.black, size: 100, color: C.yellow, align: 'right', valign: 'middle', glow: { size: 10, opacity: 0.35, color: K.yellow } });
  mark(s, 'unit'); tx(s, '여 문항', ML + 4.6, 2.55, 2.4, 0.8, { font: F.head, size: 38, valign: 'middle' });
  const lines = [
    ['report-analytics', 'cyan', '평가원 예시문항 + 2025~2026 학력평가 200문항 분석', C.white, F.semi],
    ['circle-check', 'mint', '정답 가리고 다시 풀기로 두 차례 검수', C.mint, F.head],
    ['presentation', 'cyan', '2028 예시문항 분석 특강 교재 · 7가지 유형 풀이 전략', C.white, F.semi],
    ['device-mobile', 'cyan', '학생용 웹앱 · 매일 퀴즈 · 오답 노트', C.white, F.semi],
  ];
  lines.forEach(([ic, col, t, cc, f], i) => {
    const y = 3.8 + i * 0.7 + (i >= 2 ? 0.2 : 0);
    mark(s, `t${i}`);
    icon(s, ic, col, ML, y, 0.58);
    tx(s, t, ML + 0.8, y, 7.6, 0.58, { font: f, size: 21, color: cc, valign: 'middle' });
  });
  mark(s, 'ph'); phone(s, 'quiz', 9.75, 1.95, 4.7);
  mark(s, 'ph2'); tx(s, '학생용 웹앱 · 매일 퀴즈', 9.0, 6.68, 3.6, 0.36, { font: F.med, size: 15, color: C.dim, align: 'center' });
  plan(s, { auto: [['unit', 'fade', 0], ['ph', 'float', 200], ['ph2', 'fade', 400]], clicks: [
    { cue: '숫자 1,300 올라가기', steps: [...cnt(0, 65), ['t0', 'fade', 750], ['t1', 'zoom', 1050, { from: 0.9 }]] },
    { cue: '특강 교재 · 웹앱', steps: seqs(['t2', 't3'], 'float', 0, 250) },
  ] });
}

// ── ⑦ 강사 소개 ──
section('⑦ 강사 소개');
{
  const s = content(7, '⑦ 강사 소개', '통합사회 하나에 집중해 온 강사', '제 소개를 짧게 드리겠습니다. 저는 통합사회 하나에 집중해 온 강사입니다.\n지금 인천 계양 리브 아카데미에서 고1 통합사회 정규반을 맡고 있는데, 3개월 만에 7명에서 11명으로 늘었습니다.\n김포 너를 위한 메이트 학원에서는 고1 통합사회와 한국사 내신반, 그리고 고2 사탐 내신 연합반과 예비 고3 통합사회 수능반을 가르치고 있습니다.\n족보닷컴에서 2022 개정 한국지리 187문항을 출제했고, 오늘 보여 드린 교재들도 모두 제가 직접 기획하고 만들었습니다.');
  mark(s, 'h'); tx(s, '지금 하는 수업', ML, 1.98, 6, 0.45, { font: F.semi, size: 21, color: C.neon });
  const rows = [
    ['인천 계양 리브 아카데미', [r('고1 통합사회 정규반 · '), r('3개월 만에 7명 → 11명', { color: C.yellow, font: F.head })]],
    ['김포 너를 위한 메이트 학원', '고1 통합사회 · 한국사 내신반'],
    ['고2 사탐 내신 연합반', ''],
    ['예비 고3 통합사회 수능반', ''],
  ];
  let y = 2.55;
  rows.forEach(([a, b], i) => {
    mark(s, `r${i}`);
    ping(s, i === 0 ? 'yellow' : 'cyan', ML + 0.25, y + 0.25, 0.55);
    tx(s, a, ML + 0.7, y, 7.0, 0.5, { font: F.head, size: 24, valign: 'middle' });
    if (b) tx(s, b, ML + 0.7, y + 0.5, 7.0, 0.45, { font: F.semi, size: 20, color: C.sub });
    y += b ? 1.15 : 0.78;
  });
  const bx = 8.75, bw = W - ML - bx;
  mark(s, 'card');
  box(s, bx, 2.0, bw, 3.45, { snip: true, line: C.yellow, lw: 2.25, fill: K.bg, glow: K.yellow, glowOpt: { opacity: 0.35, blur: 14 } });
  tx(s, '콘텐츠', bx + 0.3, 2.15, bw - 0.5, 0.5, { font: F.head, size: 24, color: C.yellow });
  icon(s, 'certificate', 'yellow', bx + 0.3, 2.8, 0.65);
  tx(s, '족보닷컴\n2022 개정 한국지리\n187문항 출제', bx + 1.1, 2.75, bw - 1.25, 1.3, { font: F.semi, size: 20, lsm: 1.15 });
  icon(s, 'books', 'yellow', bx + 0.3, 4.35, 0.65);
  tx(s, '자체 교재 4종\n직접 기획·제작', bx + 1.1, 4.3, bw - 1.25, 0.9, { font: F.semi, size: 20, lsm: 1.15 });
  plan(s, { auto: [['h', 'fade', 0], ...seqs(range('r', 4), 'float', 150, 200)], clicks: [{ cue: '오른쪽 ‘콘텐츠’ 상자', steps: [['card', 'zoom', 0, { from: 0.9 }]] }] });
}
{
  const s = content(7, '⑦ 강사 소개', '숫자로 보여 드리는 결과', '결과는 숫자로 보여 드리겠습니다.\n고1 통합사회 내신에서, 중간고사 72점이던 학생이 기말고사 95.6점, 중간 86.2점이던 학생이 기말 95.7점을 받았습니다.\n수능 한국지리에서는 6월 모의평가 6등급이던 학생이 수능에서 원점수 48점, 1등급을 받았습니다.\n재수생과 고3 학생들의 한국지리 모의평가 점수도 47점에서 48점이 나왔습니다.\n이 경험을 그대로 통합사회 수능반에 쏟겠습니다.');
  const cards = [
    ['고1 통합사회 내신', '중간 → 기말 (점)', '72', '95.6'],
    ['고1 통합사회 내신', '중간 → 기말 (점)', '86.2', '95.7'],
    ['수능 한국지리', '6월 모평 → 수능', '6등급', '1등급', '수능 원점수 48점'],
  ];
  const cw = 3.8, gap = (CW - 3 * cw) / 2;
  cards.forEach(([a, b, f, t, n], i) => {
    const x = ML + i * (cw + gap);
    mark(s, `c${i}`);
    box(s, x, 2.0, cw, 3.4, { snip: true, line: C.line, lw: 1.75 });
    tx(s, a, x + 0.3, 2.15, cw - 0.5, 0.45, { font: F.head, size: 21, color: C.neon });
    tx(s, b, x + 0.3, 2.6, cw - 0.5, 0.42, { font: F.med, size: 18, color: C.sub });
    tx(s, f, x + 0.3, 3.2, cw - 0.6, 0.65, { font: F.head, size: 34, color: C.sub, valign: 'middle' });
    if (n) tx(s, n, x + 0.3, 4.9, cw - 0.5, 0.4, { font: F.semi, size: 18, color: C.yellow });
    mark(s, `a${i}`);
    line(s, x + 0.45, 3.86, x + 0.45, 4.1, { color: C.yellow, w: 3, arrow: true });
    mark(s, `t${i}`);
    tx(s, t, x + 0.3, 4.14, cw - 0.5, 0.72, { font: F.black, size: 46, color: C.yellow, valign: 'middle', glow: { size: 8, opacity: 0.35, color: K.yellow } });
  });
  mark(s, 'more');
  icon(s, 'medal', 'mint', ML, 5.7, 0.68);
  tx(s, '재수생·고3 한국지리 모의평가 47~48점', ML + 0.9, 5.7, 10, 0.68, { font: F.head, size: 24, color: C.mint, valign: 'middle' });
  plan(s, { auto: seqs(range('c', 3), 'fade', 0, 200), clicks: [
    { cue: '결과 숫자 세 개', steps: [0, 1, 2].flatMap((i) => [[`a${i}`, 'wipe', i * 450, { dir: 't', dur: 250 }], [`t${i}`, 'zoom', 200 + i * 450, { from: 0.6 }], [`t${i}`, 'pulse', 550 + i * 450]]) },
    { cue: '한국지리 모의평가', steps: [['more', 'float', 0]] },
  ] });
}

// ── ⑧ 등록 안내와 마무리 ──
section('⑧ 등록 안내');
{
  const s = content(8, '⑧ 등록 안내', '2028 수능 통합사회 정규반', '등록 안내입니다.\n개강은 2027년 1월 2일 토요일이고, 매주 한 번 3시간 수업입니다. 수업 시간, 수강료, 교재비는 화면과 함께 안내해 드리겠습니다.\n장소는 김포 사우역에서 걸어서 5분, 너를 위한 메이트 학원 김포관입니다.\n상담은 학원 전화나 문자, 카카오톡 채널로 남겨 주시면 됩니다.');
  const rows = [
    ['calendar', '개강', '2027. 1. 2.(토)', '매주 1회 3시간'],
    ['clock', '수업 시간', '[ ]', ''],
    ['coin', '수강료', '[ ]', ''],
    ['books', '교재비', '[ ]', ''],
    ['map-pin', '장소', '너를위한메이트학원 김포관', '김포시 사우중로 92, 3층 · 사우역 도보 5분'],
  ];
  let y = 1.98;
  rows.forEach(([ic, k, v, d], i) => {
    mark(s, `r${i}`);
    icon(s, ic, 'cyan', ML, y + 0.02, 0.66);
    tx(s, k, ML + 0.85, y + 0.04, 1.6, 0.5, { font: F.semi, size: 20, color: C.neon });
    tx(s, v, ML + 2.5, y, 5.6, 0.55, { font: F.head, size: 23 });
    if (d) tx(s, d, ML + 2.5, y + 0.52, 5.7, 0.4, { font: F.med, size: 17, color: C.sub });
    y += d ? 1.02 : 0.74;
  });
  const bx = 9.05, bw = W - ML - bx;
  mark(s, 'contact');
  box(s, bx, 2.0, bw, 3.95, { snip: true, line: C.yellow, lw: 2.25, fill: K.bg, glow: K.yellow, glowOpt: { opacity: 0.35, blur: 14 } });
  icon(s, 'phone', 'yellow', bx + 0.3, 2.2, 0.75);
  tx(s, '상담 · 문의', bx + 1.15, 2.2, bw - 1.3, 0.75, { font: F.head, size: 22, color: C.yellow, valign: 'middle' });
  tx(s, '031-8049-0716', bx + 0.32, 3.15, bw - 0.5, 0.55, { font: F.head, size: 26 });
  tx(s, '평일 오후 4~10시', bx + 0.32, 3.68, bw - 0.5, 0.4, { font: F.med, size: 16, color: C.sub });
  tx(s, '010-5528-9505', bx + 0.32, 4.25, bw - 0.5, 0.55, { font: F.head, size: 26 });
  tx(s, '문자 전용', bx + 0.32, 4.78, bw - 0.5, 0.4, { font: F.med, size: 16, color: C.sub });
  tx(s, '카카오톡 채널\n‘너를위한메이트 김포’', bx + 0.32, 5.2, bw - 0.45, 0.65, { font: F.semi, size: 16, color: C.sub, lsm: 1.1 });
  mark(s, 'glowc');
  box(s, bx, 2.0, bw, 3.95, { snip: true, line: C.yellow, lw: 3, glow: K.yellow, glowOpt: { opacity: 0.85, blur: 22 } });
  plan(s, { auto: [...seqs(range('r', 5), 'float', 0, 150), ['contact', 'fade', 800], ['glowc', 'breathe', 1300, { dur: 1300 }]] });
}
{
  const s = newSlide('BLANK_DARK');
  const arcs = globe(s, -1.35, -0.35, 8.2, true);
  mark(s, 'l1'); tx(s, '고3 1학기가 시작되기 전,', 6.9, 1.35, 6.0, 0.6, { font: F.semi, size: 26, color: C.sub });
  mark(s, 'l2'); tx(s, '통합사회 개념은\n겨울에 끝내 둡니다', 6.9, 1.95, 6.0, 1.8, { font: F.black, size: 44, lsm: 1.1 });
  mark(s, 'hl'); hl(s, 6.8, 4.0, 5.85, 1.25);
  mark(s, 'l3'); tx(s, '나머지는 매주 3시간 안에서\n제가 책임지겠습니다', 6.95, 4.02, 5.7, 1.2, { font: F.head, size: 27, color: C.yellow, lsm: 1.15, valign: 'middle' });
  mark(s, 'name'); tx(s, [r('통합사회 '), r('이승민T', { font: F.head, color: C.white })], 6.9, 5.65, 3.6, 0.6, { font: F.semi, size: 24, color: C.sub, valign: 'middle' });
  const lg = asset('academy-logo-white.png'), zz = sizeOf(lg), hh = 0.48;
  mark(s, 'aclogo'); img(s, lg, W - ML - (hh * zz.w) / zz.h, 5.71, (hh * zz.w) / zz.h, hh);
  plan(s, { auto: [...arcSteps(arcs, 0), ['l1', 'fade', 300], ['l2', 'float', 600], ['hl', 'wipe', 1500, { dir: 'l', dur: 600 }], ['l3', 'fade', 1700], ['name', 'fade', 2400], ['aclogo', 'fade', 2400]] });
  s.notes = '마지막으로 한 말씀 드리겠습니다.\n고3 1학기가 시작되면 내신과 수행평가 때문에 통합사회를 처음부터 공부할 시간이 없습니다. 그래서 통합사회 개념은 이번 겨울에 끝내 둡니다.\n그다음부터는 매주 3시간 안에서, 쪽지 시험과 실전 모의고사, 파이널까지 제가 책임지고 수능 날까지 함께 가겠습니다.\n2027년 1월 2일, 첫 수업에서 뵙겠습니다. 감사합니다.';
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
