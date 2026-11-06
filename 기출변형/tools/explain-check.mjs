// 해설 검사: 오답 선지(①~⑤)·<보기>(ㄱ~ㄹ)마다 해설에 이유가 있는지
//   node tools/explain-check.mjs              1·2차 전부
//   node tools/explain-check.mjs 2 --ids a,b  2차 중 이 문항만(바뀐 문항 검수용: tools/changed.mjs 결과)
// '①~④는 옳다'처럼 범위로 쓴 것은 있는 것으로 본다. 짝 짓기·순서 문항(선지가 짧은 것)은 번호 대신 구성 요소 설명으로 충분해 뺀다.
import { loadAll } from './load.mjs';
const args = process.argv.slice(2);
const eds = args.filter((a) => a === '1' || a === '2');
const ids = args.includes('--ids') ? new Set(args[args.indexOf('--ids') + 1].split(',')) : null;
const C = ['①', '②', '③', '④', '⑤'], G = ['ㄱ', 'ㄴ', 'ㄷ', 'ㄹ', 'ㅁ'];
const all = await loadAll(eds.length ? eds : ['1', '2']);
const bad = [];
for (const q of Object.values(all)) {
  if (ids && !ids.has(q.id)) continue;
  const e = q.explain
    .replace(/([①-⑤])\s*~\s*([①-⑤])/g, (_, a, b) => { let o = ''; for (let k = a.charCodeAt(0); k <= b.charCodeAt(0); k++) o += String.fromCharCode(k); return o; })
    .replace(/([ㄱ-ㄹ])\s*~\s*([ㄱ-ㄹ])/g, (_, a, b) => G.slice(G.indexOf(a), G.indexOf(b) + 1).join(''));
  const combo = q.choices.every((c) => String(c).length <= 12) || q.choices.every((c) => /^[(㉠-㉤A-E]/.test(String(c)) && /,| - /.test(String(c))); // 짝 짓기·순서
  const miss = q.bogi ? q.bogi.map((_, i) => G[i]).filter((g) => !e.includes(g)) : combo ? [] : C.filter((c, i) => i + 1 !== q.answer && !e.includes(c));
  if (miss.length) bad.push(`${q.id}\t빠진 것: ${miss.join(' ')}`);
}
console.log(bad.length ? bad.join('\n') : '모든 해설에 오답 선지·<보기> 이유가 있음');
console.log(`(검사 ${ids ? ids.size : Object.keys(all).length}문항, 걸림 ${bad.length})`);
