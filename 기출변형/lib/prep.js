// 문항을 책에 싣기 전 손질(문제집 build.mjs와 주간지 build.mjs가 함께 씀)
import { FIGURE_TYPES } from '../../textbook/lib/figures.js';

// 지도 범례·화살표 이름표 글씨를 문제집에서만 키운다(한 단 너비에 줄어들면 4pt 안팎이라 인쇄하면 안 읽힘).
// 지도 폭(w, 기본 600)에 맞춰 약 6~7pt가 되도록. 문항에 legendSize·size를 적으면 그 값을 쓴다.
export function bigMapText(root) {
  const walk = (x) => {
    if (Array.isArray(x)) return x.forEach(walk);
    if (!x || typeof x !== 'object') return;
    // 기후 그래프를 나란히 둔 줄: 한 줄에 셋이면 글씨가 3pt 안팎 → 두 개씩 놓고(cols 2), 그래프 폭을 줄여 글씨를 키운다
    if (x.t === 'figrow' && x.items.every((i) => i.kind === 'climate' || i.kind === 'climdev')) {
      if (x.items.length >= 3 && !x.cols) x.cols = 2;
      for (const i of x.items) if (i.compact && !i.w) i.w = 240;
    }
    // 기후 그래프·인구 피라미드 글씨 1.2배, 지도 경위도 숫자·방위표 키우기(쪽 검사 작은 글씨, 2026-11-08)
    if (x.t === 'chart' && ['climate', 'climdev', 'pyramid'].includes(x.kind) && !x.fs) x.fs = 1.2;
    if (x.t === 'map' && (x.view === 'world' || !x.view) && !x.seaScale) x.seaScale = 1.15;
    if (x.t === 'map' && !x.degSize) x.degSize = Math.max(8.5, Math.round((x.w || 600) * 0.026 * 10) / 10);
    // 인구 피라미드를 한 줄에 셋 이상 놓으면 글씨가 3pt대 → 두 개씩
    if (x.t === 'figrow' && x.items.length >= 3 && x.items.every((i) => i.kind === 'pyramid') && !x.cols) x.cols = 2;
    // 예/아니요 순서도 글씨 1.2배(검토 의견 2026-11-08)
    if (x.t === 'diagram' && x.kind === 'yesno' && !x.fs) x.fs = 1.2;
    if (x.t === 'map') {
      const s = Math.max(11, Math.round((x.w || 600) * 0.036 * 10) / 10);
      if (x.legend && !x.legendSize) x.legendSize = s;
      for (const a of x.arrows || []) if (a.label && !a.size) a.size = s;
    }
    Object.values(x).forEach(walk);
  };
  walk(root);
}

// 강사 요청(2026-11-07, MAXIMIN 7회 검수):
//  · 문제 쪽에는 출처, '가상 자료', '(실제 … 단순화)', '개념도' 같은 표시를 싣지 않는다.
//    실제 통계·지도 자료의 출처는 정답과 해설의 해설 끝에 '자료 출처'로 옮긴다(Natural Earth는 공공 영역이라 뺌).
//  · '옳지 않은 것' 발문의 '않은'에 검정 밑줄(__않은__ → PDF·한글 파일 모두 밑줄).
const LABEL_NOTE = (s) => String(s)
  .replace(/\s*\((?:가상 자료|가상 사례)\)/g, '')
  .replace(/,\s*가상 자료/g, '')
  .replace(/\.?\s*가상 자료\.?/g, (m) => (m.startsWith('.') ? '.' : ''))
  .replace(/[^.]*실제[^.]*단순화[^.]*\.\s*/g, '')
  .replace(/\(\s*\)/g, '')
  .trim();
function realSources(src) {
  const out = [];
  for (let part of String(src).split(/\s+\/\s+/)) {
    const inner = part.match(/\((지도 자료:[^)]*)\)/);
    if (/^(가상|개념도)/.test(part)) { if (inner) part = inner[1]; else continue; }
    part = part.replace(/\s*\((?:[^()]*(?:단순화|대략|개념도|가상)[^()]*)\)/g, '').trim();
    const map = /^지도 자료:/.test(part);
    let body = part.replace(/^(지도 )?자료:\s*/, '');
    body = body.split(/,\s*/).filter((x) => !/^Natural Earth$/.test(x)).join(', ');
    if (body) out.push(map ? `지도: ${body}` : body);
  }
  return out;
}
export function cleanLabels(root) {
  const fix = (q) => {
    if (q._labelsDone) return;
    q._labelsDone = true;
    const found = [];
    const walk = (x) => {
      if (Array.isArray(x)) return x.forEach(walk);
      if (!x || typeof x !== 'object') return;
      if (typeof x.source === 'string') {
        // '가상 자료(단위: %)'처럼 출처 칸에 적어 둔 단위는 그림 설명으로 옮긴다
        const unit = x.source.match(/\((단위:[^)]*)\)/);
        if (unit && !String(x.note || '').includes(unit[1])) x.note = `(${unit[1]})${x.note ? ' ' + x.note : ''}`;
        found.push(...realSources(x.source));
        delete x.source;
      }
      if (typeof x.note === 'string') { x.note = LABEL_NOTE(x.note); if (!x.note) delete x.note; }
      if (typeof x.unit === 'string') x.unit = LABEL_NOTE(x.unit);
      if (typeof x.title === 'string') x.title = x.title.replace(/\s*\((?:개념도|가상 자료)\)/g, '');
      if (x.t === 'p' && typeof x.text === 'string') x.text = x.text.replace(/\s*\((?:가상 자료|새로 씀|새로 옮김)\)/g, '').replace(/(을|를) 새로 옮김\)/g, ')');
      Object.values(x).forEach(walk);
    };
    walk(q.data || []);
    q.data = (q.data || []).filter((d) => !(d.t === 'p' && !String(d.text || '').trim()));
    const uniq = [...new Set(found)];
    if (uniq.length) q.explain = `${q.explain} (자료 출처: ${uniq.join(' / ')})`;
    if (typeof q.stem === 'string') q.stem = q.stem.replace(/(지\s)않은(?=\s*것)/, '$1__않은__').replace(/다음 가상 (사례|신문 기사|기사)/g, '다음 $1');
  };
  const walk = (x) => {
    if (Array.isArray(x)) return x.forEach(walk);
    if (!x || typeof x !== 'object') return;
    if (Array.isArray(x.choices) && 'explain' in x) return fix(x);
    Object.values(x).forEach(walk);
  };
  walk(root);
}

// 그림 블록마다 번호 → PDF와 한글 파일이 같은 그림을 가리키게
export function numberFigures(root) {
  let n = 0;
  const walk = (x) => {
    if (Array.isArray(x)) return x.forEach(walk);
    if (!x || typeof x !== 'object') return;
    if (FIGURE_TYPES.has(x.t)) x._fig = `f${String(++n).padStart(3, '0')}`;
    if (x.t === 'figrow') x._fig = `r${String(++n).padStart(3, '0')}`;
    Object.values(x).forEach(walk);
  };
  walk(root);
  return n;
}
