// 문항 형식·분포 검사
//   node tools/check.mjs 1            1차 전체 (단원별 + 모의고사)
//   node tools/check.mjs 1 t2-04      한 단원만
//   node tools/check.mjs 2 mock       2차 모의고사만
// 오류(빠진 항목, 선지 수, 정답 범위, 개념 번호 등)가 있으면 끝 코드 1.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { UNITS } from '../lib/units.js';
import { FIGURE_TYPES } from '../../textbook/lib/figures.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const ed = args.find((a) => a === '1' || a === '2') || '1';
const only = args.filter((a) => /^t[12]-\d\d$/.test(a));
const mockOnly = args.includes('mock');
const quota = JSON.parse(readFileSync(join(ROOT, '참고/배분.json'), 'utf8'));
const TYPES = ['개념 이해', '사례 적용', '자료 해석', '그래프 해석', '지도 해석', '사상가 입장', '사상가 비교', '입장 비교', '글 해석', '질문 분류표', '계산'];
const LEVELS = ['상', '중상', '중', '하'];
const BLOCKS = new Set(['p', 'ul', 'ol', 'kv', 'table', 'chart', 'venn', 'map', 'diagram', 'photo', 'figrow', 'hub', 'compare', 'dialog', 'source', 'chain', 'flow', ...FIGURE_TYPES]);
const TARGET = ed === '1' ? { 하: 10, 중: 35, 중상: 35, 상: 20 } : { 하: 3, 중: 15, 중상: 45, 상: 37 };

let errors = 0;
const err = (where, msg) => { errors++; console.log(`  ✗ ${where}: ${msg}`); };
const ids = new Set();

function checkQ(q, where, { unit, mock }) {
  for (const k of ['id', 'level', 'type', 'src', 'stem', 'choices', 'answer', 'explain']) if (q[k] === undefined || q[k] === '') err(where, `${k} 없음`);
  if (ids.has(q.id)) err(where, `id 중복 ${q.id}`);
  ids.add(q.id);
  if (!LEVELS.includes(q.level)) err(where, `난이도 '${q.level}'`);
  if (!TYPES.includes(q.type)) err(where, `유형 '${q.type}'`);
  if (!Array.isArray(q.choices) || q.choices.length !== 5) err(where, '선지가 5개가 아님');
  if (!(q.answer >= 1 && q.answer <= 5)) err(where, `정답 ${q.answer}`);
  const u = mock ? UNITS[q.unit] : unit;
  if (mock && !u) err(where, `모의고사 문항에 unit(예: 't2-04') 없음`);
  const cs = Array.isArray(q.concept) ? q.concept : [q.concept];
  if (u) for (const c of cs) if (!u.concepts.some((x) => +x.no === +c)) err(where, `개념 ${c}이(가) ${u.key}에 없음(1~${u.concepts.length})`);
  for (const d of q.data || []) if (!BLOCKS.has(d.t)) err(where, `자료 블록 t='${d.t}'`);
  if (q.bogi) {
    if (q.bogi.length < 3 || q.bogi.length > 4) err(where, `보기 ${q.bogi.length}개`);
    if (!q.choices.every((c) => /^[ㄱ-ㄹ](, [ㄱ-ㄹ])*$/.test(c))) err(where, '보기 문항인데 선지가 "ㄱ, ㄴ" 꼴이 아님');
  }
  if (q.explain && q.explain.length < 40) err(where, '해설이 너무 짧음');
  const dup = new Set(q.choices.map(String));
  if (dup.size < 5) err(where, '같은 선지가 있음');
  if (mock && ![1.5, 2, 2.5].includes(q.points)) err(where, `배점 ${q.points}`);
}

function dist(qs, label, quotaN) {
  const ans = [1, 2, 3, 4, 5].map((a) => qs.filter((q) => q.answer === a).length);
  const lv = LEVELS.map((l) => `${l} ${qs.filter((q) => q.level === l).length}`).join(' · ');
  const n = qs.length;
  const spread = Math.max(...ans) - Math.min(...ans);
  const bad = spread > Math.max(2, Math.ceil(n / 10));
  const q = quotaN ? ` / 목표 ${quotaN}` : '';
  console.log(`${label}: ${n}문항${q} | 정답 ①~⑤ ${ans.join(' ')}${bad ? ' ← 치우침' : ''} | ${lv}`);
  if (bad) errors++;
  if (quotaN && Math.abs(n - quotaN) > 1) { console.log(`  ✗ 문항 수가 목표(${quotaN})와 다름`); errors++; }
  return { ans, n };
}

const all = [];
if (!mockOnly) {
  const dir = join(ROOT, 'content', ed);
  for (const k of Object.keys(UNITS)) {
    if (only.length && !only.includes(k)) continue;
    const f = join(dir, `${k}.js`);
    if (!existsSync(f)) continue;
    const qs = (await import(pathToFileURL(f).href)).default;
    qs.forEach((q, i) => checkQ(q, `${k} ${i + 1}번`, { unit: UNITS[k] }));
    dist(qs, k, quota[k]);
    all.push(...qs);
  }
}
const mdir = join(ROOT, 'content', ed, 'mock');
if (!only.length && existsSync(mdir)) {
  for (const f of readdirSync(mdir).filter((x) => /^m\d+\.js$/.test(x)).sort((a, b) => parseInt(a.slice(1)) - parseInt(b.slice(1)))) {
    const m = (await import(pathToFileURL(join(mdir, f)).href)).default;
    m.questions.forEach((q, i) => checkQ(q, `모의 ${m.no}회 ${i + 1}번`, { mock: true }));
    const pts = m.questions.reduce((a, q) => a + (q.points || 0), 0);
    dist(m.questions, `모의고사 ${m.no}회 (${m.range}, ${pts}점)`);
    if (m.questions.length !== 25) err(`모의 ${m.no}회`, `${m.questions.length}문항`);
    if (pts !== 50) err(`모의 ${m.no}회`, `배점 합 ${pts}`);
  }
}
if (all.length > 40) {
  const lv = Object.fromEntries(LEVELS.map((l) => [l, Math.round((100 * all.filter((q) => q.level === l).length) / all.length)]));
  console.log(`\n단원별 합계 ${all.length}문항 | 난이도 % ${LEVELS.map((l) => `${l} ${lv[l]}(목표 ${TARGET[l]})`).join(' · ')}`);
  const ty = {};
  all.forEach((q) => (ty[q.type] = (ty[q.type] || 0) + 1));
  console.log('유형: ' + Object.entries(ty).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(' · '));
}
console.log(errors ? `\n오류 ${errors}개` : '\n오류 없음');
process.exit(errors ? 1 : 0);
