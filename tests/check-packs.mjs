// 문제 팩 형식 검사: node tests/check-packs.mjs
import { readdirSync } from 'node:fs';
const dir = new URL('../src/content/', import.meta.url);
// index.js, build.js 는 팩이 아니라서 제외
let bad = 0;
for (const f of readdirSync(dir).filter((x) => /^t\d/.test(x))) {
  const p = (await import(new URL(f, dir))).default;
  const c = (a, t) => a.filter((x) => x.type === t).length;
  const keys = new Set();
  [...p.quizzes, ...p.cards].forEach((x) => { if (keys.has(x.key)) { bad++; console.log('  중복 키', x.key); } keys.add(x.key); });
  p.quizzes.filter((q) => q.type === 'ox' && !['O', 'X'].includes(q.answer)).forEach((q) => { bad++; console.log('  O/X 정답 오류', q.key); });
  p.quizzes.filter((q) => q.type === 'blank' && !q.question.includes('[    ]')).forEach((q) => { bad++; console.log('  빈칸 표시 없음', q.key); });
  p.quizzes.filter((q) => !q.unit).forEach((q) => { bad++; console.log('  단원 없음', q.key); });
  const ox = p.quizzes.filter((q) => q.type === 'ox');
  const xs = ox.filter((q) => q.answer === 'X').length;
  console.log(`${p.id} v${p.version}: O/X ${c(p.quizzes, 'ox')} (X ${xs}개) · 빈칸 ${c(p.quizzes, 'blank')} · 개념 ${c(p.cards, 'concept')} · 암기 ${c(p.cards, 'flash')}`);
}
if (bad) { console.log(`문제 ${bad}개`); process.exit(1); }
console.log('형식 검사 통과');
