// 중복·표절 검사
//   node tools/dup-check.mjs 1                  1차 안에서 비슷한 문항 쌍
//   node tools/dup-check.mjs 2 --vs 1           2차 문항이 1차와 겹치는지 (같은 자료·같은 선지·같은 사례)
//   node tools/dup-check.mjs 1 --src <txt폴더>   기출·문제집 글자 추출본과 긴 문장이 같은 곳(저작권)
//
// 방법: 띄어쓰기·문장 부호를 뺀 글자에서 글자 n개 조각(shingle)을 만들어 겹치는 비율을 잰다.
//   자료(data) 유사도 0.45 이상, 선지 하나가 0.8 이상 같으면 '비슷함'으로 적는다.
//   --src: 글자 14개 이상 연속으로 같은 조각이 원문에 있으면 적는다(고유 명사·용어만 겹치는 짧은 조각은 무시).
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { UNITS } from '../lib/units.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const ed = args[0] || '1';
const vs = args.includes('--vs') ? args[args.indexOf('--vs') + 1] : null;
const srcDir = args.includes('--src') ? args[args.indexOf('--src') + 1] : null;

const norm = (s) => String(s ?? '').replace(/\*\*|__|==/g, '').replace(/[^\p{L}\p{N}]/gu, '');
const text = (x) => (typeof x === 'string' ? x : Array.isArray(x) ? x.map(text).join(' ') : x && typeof x === 'object' ? Object.entries(x).filter(([k]) => !['t', '_fig', 'kind', 'style', 'source'].includes(k)).map(([, v]) => text(v)).join(' ') : '');
const shingles = (s, n = 4) => { const t = norm(s); const out = new Set(); for (let i = 0; i + n <= t.length; i++) out.add(t.slice(i, i + n)); return out; };
const jac = (a, b) => { if (!a.size || !b.size) return 0; let k = 0; for (const x of a) if (b.has(x)) k++; return k / Math.min(a.size, b.size); };

async function load(e) {
  const qs = [];
  const dir = join(ROOT, 'content', e);
  for (const k of Object.keys(UNITS)) {
    const f = join(dir, `${k}.js`);
    if (existsSync(f)) (await import(pathToFileURL(f).href)).default.forEach((q) => qs.push({ ...q, unit: k }));
  }
  const md = join(dir, 'mock');
  if (existsSync(md)) for (const f of readdirSync(md).filter((x) => /^m\d+\.js$/.test(x))) (await import(pathToFileURL(join(md, f)).href)).default.questions.forEach((q) => qs.push(q));
  // 숫자(연도 축 등)는 빼고 비교한다
  const nd = (s) => s.replace(/[0-9]/g, '');
  return qs.map((q) => ({ q, data: shingles(nd(text(q.data) + text(q.bogi))), ch: q.choices.map((c) => shingles(nd(c))), dataLen: norm(nd(text(q.data))).length }));
}

const A = await load(ed);
const B = vs ? await load(vs) : A;
let n = 0;
for (let i = 0; i < A.length; i++) {
  for (let j = vs ? 0 : i + 1; j < B.length; j++) {
    const a = A[i], b = B[j];
    const d = a.dataLen > 60 && b.dataLen > 60 ? jac(a.data, b.data) : 0;
    let same = 0;
    for (const x of a.ch) for (const y of b.ch) if (x.size > 14 && y.size > 14 && jac(x, y) >= 0.8) same++;
    if (d >= 0.45 || same >= 2) {
      n++;
      console.log(`${a.q.id} ↔ ${b.q.id}  자료 ${(d * 100).toFixed(0)}% · 같은 선지 ${same}개`);
    }
  }
}
console.log(`비슷한 쌍 ${n}개 (${A.length}문항${vs ? ` vs ${B.length}문항` : ''})`);

if (srcDir) {
  const L = 14;
  const pool = new Set();
  for (const f of readdirSync(srcDir).filter((x) => x.endsWith('.txt'))) {
    const t = norm(readFileSync(join(srcDir, f), 'utf8'));
    for (let i = 0; i + L <= t.length; i++) pool.add(t.slice(i, i + L));
  }
  let hits = 0;
  for (const { q } of A) {
    const parts = [text(q.data), ...(q.bogi || []), ...q.choices];
    const found = [];
    for (const p of parts) {
      const t = norm(p);
      let run = 0, best = '';
      for (let i = 0; i + L <= t.length; i++) {
        if (pool.has(t.slice(i, i + L))) { run++; if (run === 1) best = t.slice(i, i + L); else best += t[i + L - 1]; }
        else { if (run >= 6) found.push(best); run = 0; }
      }
      if (run >= 6) found.push(best);
    }
    // 숫자만 이어진 조각(연도 축), 헌법·법 조문 인용(공문서라 저작권 대상 아님)은 뺀다
    const real = found.filter((x) => (x.match(/[0-9]/g) || []).length < x.length * 0.4 && !/^제\d+조|헌법제\d+조|^\d*조/.test(x));
    found.length = 0; found.push(...real);
    if (found.length) { hits++; console.log(`[원문과 같음] ${q.id}: ${found.map((x) => x.slice(0, 40)).join(' / ')}`); }
  }
  console.log(`원문과 긴 조각이 같은 문항 ${hits}개`);
}
