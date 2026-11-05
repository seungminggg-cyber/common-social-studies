// 개념 계획을 짤 때 보는 단원 개요: node tools/cc-outline.mjs <책> [중단원 번호]
//   - 원래 내용 블록(순서 번호, 종류, 제목)  → 개념 시작 위치(at)를 고를 때
//   - 계획을 붙인 뒤의 개념 나누기, 문제 태그, 한 장 정리 유무
//   - 그 대단원의 기출 분류(참고/기출분류.json)
import { readFileSync } from 'node:fs';
const [book, only] = process.argv.slice(2);
const T = new URL('../content/', import.meta.url).pathname;
const src = await import(`${T}${book}.js`); // withCC가 적용된 책
const specs = (await import(`${T}_cc/${book}.js`)).default;
// 원래 내용(계획 적용 전)은 단원 파일을 다시 읽어 얻는다: 책 파일의 import를 그대로 따라감
const raw = readFileSync(`${T}${book}.js`, 'utf8');
const unitFiles = [...raw.matchAll(/import (\w+) from '\.\/(_[^']+)'/g)].map((m) => [m[1], m[2]]);
const rawUnits = {};
for (const [, f] of unitFiles) { const u = (await import(`${T}${f}`)).default; if (u?.no) rawUnits[u.no] = u; }
const show = (b) => String(b.title ?? b.name ?? '').replace(/\*\*|\[\[|\]\]/g, '').slice(0, 40);
const chap = src.default.chapter.no;
const subj = src.default.subject.includes('2') ? '2' : '1';
const cls = JSON.parse(readFileSync(new URL('../참고/기출분류.json', import.meta.url), 'utf8'));
for (const u of src.default.units) {
  if (only && u.no !== only) continue;
  const r = rawUnits[u.no] || { concept: u._raw || u.concept }; // 인라인 단원(t1-1·t1-2)은 _raw
  console.log(`\n■ ${u.no} ${u.title}  (계획 ${specs[u.no] ? '있음' : '없음'})`);
  console.log('  [원래 블록]');
  r.concept.forEach((b, i) => console.log(`   #${i} ${b.t}${b.mark ? ':' + b.mark : ''} ${show(b)}`));
  const cs = u.concept.filter((b) => b.t === 'concept');
  if (cs.length) {
    console.log('  [개념 나누기]');
    let cur = null;
    for (const b of u.concept) {
      if (b.t === 'concept') { cur = b; console.log(`   개념 ${b.no} ${b.title} (빈도 ${b.stars})`); }
      else if (b.t === 'sec') { cur = null; console.log(`   ── ${b.title}`); }
      else console.log(`      ${cur ? '·' : ' '} ${b.t} ${show(b)}`);
    }
  }
  console.log('  [수능형 문제]');
  (u.exam || []).forEach((q, i) => console.log(`   ${i + 1}. (${q.level}) ${q.concept ? `[개념 ${q.concept} · ${q.type}] ` : ''}${q.stem.replace(/\*\*/g, '').slice(0, 50)}`));
  if (u.summary) console.log(`  [한 장 정리] 개념 ${u.summary.concepts?.length || 0}개, 함정 ${u.summary.traps?.length || 0}, 체크 ${u.summary.checks?.length || 0}`);
}
console.log(`\n[기출 분류: ${subj}-${chap}]`);
for (const [ex, qs] of Object.entries(cls['시험'])) qs.forEach((q, i) => { if (q.startsWith(`${subj}-${chap}`)) console.log(`   ${ex} ${i + 1}번: ${q}`); });
