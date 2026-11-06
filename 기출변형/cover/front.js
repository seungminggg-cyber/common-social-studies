// 앞표지 — 다듬은 안 3가지 (A 가운데 정돈 · B 비대칭 격자 · C 색면 과녁)
import { GROUND, RINGS, TYPE, lift, C } from './tokens.js';
import { SERIES_TOTAL, BRAND } from './series.js';
import { target } from './target.js';
import { esc, wordBox } from './sheet.js';

// 바탕에 맞춘 과녁 색: 어두운 바탕이면 단원 색을 밝게 들고 선을 조금 굵게
export function rings(g, mode) {
  if (!g.dark) return { colors: RINGS, center: C.ink, stroke: 4.6 };
  return mode === 'fill'
    ? { colors: RINGS.map((c) => lift(c, 0.12)), center: C.onDark, stroke: 0 }
    : { colors: RINGS.map((c) => lift(c, 0.4)), center: C.onDark, stroke: 5.6 };
}

const meta = (v, g) => `<div class="abs row sans" style="left:16mm;right:16mm;top:13mm;font-size:${TYPE.meta + 0.6}pt;color:${g.fg}">
  <b style="font-weight:700;letter-spacing:.02em">${esc(BRAND.name)}</b><span style="color:${g.sub};font-weight:500">2028 수능 대비</span></div>`;

const foot = (v, g) => `<div class="abs sans" style="left:16mm;right:16mm;top:272mm;border-top:.4pt solid ${g.rule};padding-top:2.6mm;font-size:${TYPE.meta}pt;color:${g.sub}">
  <div class="row"><span>2022 개정 교육과정</span><span>정조준 시리즈 <b style="color:${g.fg};font-weight:700">${v.no}</b> / ${String(SERIES_TOTAL).padStart(2, '0')}</span></div></div>`;

const titleCss = (g) => `font-family:'KoPub Batang';font-weight:700;font-size:${TYPE.title}pt;line-height:1;letter-spacing:-.015em;color:${g.fg}`;

// 제목 묶음(가운데): 앞 단어 상자 → 정조준 → 짧은 선 → 부제 → 과목
function centerStack(v, g, y) {
  return `<div class="abs" style="left:0;right:0;top:${y}mm;text-align:center">${wordBox(esc(v.word), { bg: g.boxBg, fg: g.boxFg })}</div>
  <div class="abs" style="left:0;right:0;top:${y + 15.5}mm;text-align:center;${titleCss(g)}">정조준</div>
  <div class="abs" style="left:98mm;width:14mm;top:${y + 60}mm;border-top:.8pt solid ${g.fg}"></div>
  <div class="abs sans" style="left:0;right:0;top:${y + 65}mm;text-align:center;font-size:${TYPE.sub}pt;font-weight:500;color:${g.fg}">${esc(v.sub)}</div>
  <div class="abs sans" style="left:0;right:0;top:${y + 73.5}mm;text-align:center;font-size:${TYPE.subject}pt;font-weight:300;color:${g.sub}">${esc(v.subject)}</div>`;
}

// A: 가운데 정렬을 다듬은 안 — 과녁을 조금 줄이고(폭 108mm) 제목 묶음을 아래 1/3에 단단히 모음
function A(v, g) {
  return `${meta(v, g)}
  <div class="abs" style="left:51mm;top:37mm;width:108mm;height:108mm">${target(rings(g, 'line'))}</div>
  ${centerStack(v, g, 166)}
  ${foot(v, g)}`;
}

// B: 비대칭 격자 — 큰 과녁을 오른쪽 위에, 글자 묶음을 왼쪽 아래에. 대각선으로 시선이 흐른다
function B(v, g) {
  const r = rings(g, 'line');
  return `${meta(v, g)}
  <div class="abs" style="left:50mm;top:27mm;width:144mm;height:144mm">${target({ ...r, stroke: r.stroke - 0.8 })}</div>
  <div class="abs" style="left:16mm;top:184mm">${wordBox(esc(v.word), { bg: g.boxBg, fg: g.boxFg })}</div>
  <div class="abs" style="left:14.2mm;top:199.5mm;${titleCss(g)}">정조준</div>
  <div class="abs sans" style="left:16mm;top:243mm;font-size:${TYPE.sub}pt;font-weight:500;color:${g.fg}">${esc(v.sub)}</div>
  <div class="abs sans" style="left:16mm;top:251.5mm;font-size:${TYPE.subject}pt;font-weight:300;color:${g.sub}">${esc(v.subject)}</div>
  <div class="abs serif" style="right:16mm;top:229mm;text-align:right;font-weight:300;font-size:46pt;line-height:1;color:${g.fg}">${esc(v.no)}</div>
  <div class="abs sans" style="right:16mm;top:251.5mm;text-align:right;font-size:${TYPE.meta}pt;color:${g.sub}">정조준 시리즈 / ${String(SERIES_TOTAL).padStart(2, '0')}</div>
  <div class="abs sans" style="left:16mm;right:16mm;top:272mm;border-top:.4pt solid ${g.rule};padding-top:2.6mm;font-size:${TYPE.meta}pt;color:${g.sub}">
    <div class="row"><span>2022 개정 교육과정</span><span>${esc(BRAND.name)}</span></div></div>`;
}

// C: 색면 과녁 — 다섯 단원 색을 면으로 칠한 과녁(사이는 바탕색 가는 틈). 단순하지만 가장 화려함
function Cv(v, g) {
  return `${meta(v, g)}
  <div class="abs" style="left:48mm;top:31mm;width:114mm;height:114mm">${target({ ...rings(g, 'fill'), mode: 'fill', gap: 7, bg: g.bg })}</div>
  ${centerStack(v, g, 163)}
  ${foot(v, g)}`;
}

export const FRONTS = { A, B, C: Cv };
export function front(v, variant = 'A') {
  const g = GROUND[v.ground];
  return `<section class="sheet" style="background:${g.bg}"><div class="t">${FRONTS[variant](v, g)}</div></section>`;
}
